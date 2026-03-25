import React, { useState } from 'react';
import { Page } from '../types';
import { Lock, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface AdminAuthProps {
  setPage: (page: Page) => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ setPage, setIsAdmin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('[AdminAuth] Step 1: Checking local admin_settings table...');
      
      const { data: adminCreds, error: dbError } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (dbError || !adminCreds) {
        console.warn('[AdminAuth] Local credentials invalid or table missing');
        setError('Invalid admin credentials. Check that this admin exists in admin_settings.');
        setLoading(false);
        return;
      }

      console.log('[AdminAuth] Step 2: Local check passed. Linking to Auth account:', adminCreds.email);

      // Clear any existing session to prevent conflicts
      await supabase.auth.signOut();
      
      console.log('[AdminAuth] Step 3: Attempting Supabase Auth sign-in...');
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: adminCreds.email,
        password: adminCreds.password,
      });

      if (authError) {
        console.error('[AdminAuth] Supabase Auth Error (POST /token):', authError);
        throw authError;
      }
      
      console.log('[AdminAuth] Step 4: Login Successful');

      // Persist admin role for future refreshes (App.tsx reads this from profiles/user_metadata).
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await supabase.auth.updateUser({ data: { ...(user.user_metadata || {}), role: 'admin' } });
        } catch (metaError) {
          console.warn('[AdminAuth] Failed to update user metadata role:', metaError);
        }

        // Try update first (common case), then upsert as a fallback if the row is missing.
        const { data: updatedRows, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id)
          .select('id');

        if (updateError || !updatedRows || updatedRows.length === 0) {
          if (updateError) {
            console.warn('[AdminAuth] Failed to update profiles role:', updateError);
          }

          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, role: 'admin' }, { onConflict: 'id' });

          if (upsertError) {
            console.warn('[AdminAuth] Failed to upsert admin role into profiles:', upsertError);
          }
        }
      }

      setIsAdmin(true);
      setPage('admin-dashboard');
    } catch (err: any) {
      console.error('[AdminAuth] Final Error:', err);
      // Explicit guidance for common 400 errors
      if (err.status === 400 || err.message?.includes('Invalid login credentials')) {
        setError('Backend Auth Failed: create the matching admin email/password in Supabase Auth Dashboard for this admin_settings row.');
      } else {
        setError('System link failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface p-8 border-4 border-white neo-shadow-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldAlert size={120} />
        </div>
        
        <h1 className="font-headline font-black text-4xl uppercase mb-2 relative z-10">ADMIN ACCESS</h1>
        <p className="font-body text-ink/60 mb-8 relative z-10">Restricted area. Authorized personnel only.</p>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          {error && (
            <div className="bg-red-100 border-4 border-red-500 text-red-700 p-3 font-bold text-xs uppercase animate-pulse">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="font-label font-bold text-xs uppercase tracking-widest">USERNAME</label>
            <input 
              type="text" 
              disabled={loading}
              className="w-full bg-white border-4 border-ink p-3 font-bold outline-none focus:border-primary-container transition-colors disabled:opacity-50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="font-label font-bold text-xs uppercase tracking-widest">PASSWORD</label>
            <input 
              type="password" 
              disabled={loading}
              className="w-full bg-white border-4 border-ink p-3 font-bold outline-none focus:border-primary-container transition-colors disabled:opacity-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container border-4 border-ink py-4 font-headline font-black text-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>ENTER SYSTEM <ArrowRight size={20} /></>}
          </button>
        </form>

        <button 
          onClick={() => setPage('home')}
          className="mt-6 w-full text-center font-label font-bold text-xs text-ink/40 hover:text-ink transition-colors"
        >
          RETURN TO PUBLIC SITE
        </button>
      </div>
    </div>
  );
};
