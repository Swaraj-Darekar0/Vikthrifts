import React, { useState } from 'react';
import { Page } from '../types';
import { ArrowLeft, Mail, Lock, User, ArrowRight, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface AuthProps {
  type: 'buyer' | 'seller';
  setPage: (page: Page) => void;
  setIsSeller: (val: boolean) => void;
  overlay?: boolean;
}

export const Auth: React.FC<AuthProps> = ({ type, setPage, setIsSeller, overlay = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('[Auth] handleSubmit started', { isLogin, type });

    try {
      if (isLogin) {
        console.log('[Auth] Attempting login...');
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        console.log('[Auth] Login successful:', data);

        // Determine role: Check metadata first, then fallback to DB
        let role = data.user.user_metadata?.role;

        if (!role) {
          console.log('[Auth] No role in metadata, checking profile table...');
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle(); // maybeSingle avoids error if no profile exists

          if (profileError) throw profileError;
          role = profile?.role;
        }

        console.log('[Auth] Resolved role:', role);
        if (role === 'seller') {
          setIsSeller(true);
          setPage('seller-dashboard');
        } else {
          setIsSeller(false);
          setPage('home');
        }
      } else {
        console.log('[Auth] Attempting sign up...');
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: type,
            },
          },
        });
        
        console.log('[Auth] Sign up response:', { data, error: signUpError });

        if (signUpError) throw signUpError;

        if (data.user) {
          console.log('[Auth] User created, attempting profile upsert...');
          // Create or update profile (handles race condition with DB trigger)
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(
              { 
                id: data.user.id, 
                full_name: fullName, 
                role: type 
              },
              { onConflict: 'id' }
            );

          if (profileError) {
             console.error('[Auth] Profile upsert failed:', profileError);
             throw profileError;
          }
          console.log('[Auth] Profile upsert successful');

          if (type === 'seller') {
            setIsSeller(true);
            setPage('seller-dashboard');
          } else {
            setIsSeller(false);
            setPage('home');
          }
        } else {
            console.warn('[Auth] Sign up succeeded but no user returned (Check email confirmation settings)');
        }
      }
    } catch (err: any) {
      console.error('[Auth] Error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${overlay ? 'w-full max-w-6xl bg-surface border-4 border-ink neo-shadow-lg overflow-hidden' : 'min-h-[calc(100vh-80px)]'} flex flex-col lg:flex-row`}>
      {/* Left side - Form */}
      <div className={`w-full lg:w-1/2 p-5 sm:p-8 md:p-16 flex flex-col justify-center items-center bg-surface ${overlay ? 'min-h-[24rem]' : ''}`}>
        <div className="w-full max-w-md">
          {!overlay && (
            <button 
              onClick={() => setPage('home')}
              className="flex items-center gap-2 font-label font-bold text-sm mb-12 hover:text-tertiary transition-colors"
            >
              <ArrowLeft size={16} /> BACK TO HOME
            </button>
          )}

          <div className="mb-8 md:mb-10">
            <h1 className="font-headline font-black text-4xl md:text-5xl tracking-tighter uppercase mb-2">
              {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
            </h1>
            <p className="font-body text-ink/60">
              {type === 'seller' 
                ? 'Join the elite network of archival collectors and creators.' 
                : 'Access exclusive drops and archival pieces from global stores.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-100 border-4 border-red-500 text-red-700 font-bold text-sm uppercase tracking-tight">
                {error}
              </div>
            )}
            {!isLogin && (
              <div className="space-y-2">
                <label className="font-label font-bold text-xs uppercase tracking-widest">FULL NAME</label>
                <div className="relative flex items-center bg-white border-4 border-ink p-3 neo-shadow-sm focus-within:neo-shadow transition-all">
                  <User size={20} className="text-ink/30 ml-2" />
                  <input 
                    type="text" 
                    placeholder="Hideo Kojima" 
                    className="w-full bg-transparent border-none outline-none px-4 font-body font-bold"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label font-bold text-xs uppercase tracking-widest">EMAIL ADDRESS</label>
              <div className="relative flex items-center bg-white border-4 border-ink p-3 neo-shadow-sm focus-within:neo-shadow transition-all">
                <Mail size={20} className="text-ink/30 ml-2" />
                <input 
                  type="email" 
                  placeholder="name@archive.com" 
                  className="w-full bg-transparent border-none outline-none px-4 font-body font-bold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label font-bold text-xs uppercase tracking-widest">PASSWORD</label>
              <div className="relative flex items-center bg-white border-4 border-ink p-3 neo-shadow-sm focus-within:neo-shadow transition-all">
                <Lock size={20} className="text-ink/30 ml-2" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-transparent border-none outline-none px-4 font-body font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 md:py-5 border-4 border-ink font-headline font-black text-base md:text-xl neo-shadow hover:neo-shadow-lg active-press transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${type === 'seller' ? 'bg-secondary-container' : 'bg-primary-container'}`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'} <ArrowRight size={24} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="block w-full font-label font-bold text-sm border-b-2 border-ink hover:text-tertiary transition-colors pb-1"
            >
              {isLogin ? "DON'T HAVE AN ACCOUNT? SIGN UP" : "ALREADY HAVE AN ACCOUNT? LOG IN"}
            </button>
            <button 
              onClick={() => setPage('auth-choice')}
              className="block w-full font-label font-bold text-xs text-ink/40 hover:text-ink transition-colors"
            >
              SWITCH TO {type === 'seller' ? 'BUYER' : 'SELLER'} MODE
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Visual/Info */}
      <div className={`hidden lg:flex w-1/2 p-16 flex-col justify-between border-l-4 border-ink ${type === 'seller' ? 'bg-ink text-white' : 'bg-secondary-container text-ink'}`}>
        <div>
          <div className={`w-16 h-16 border-4 border-current flex items-center justify-center mb-8 neo-shadow-sm ${type === 'seller' ? 'bg-secondary-container text-ink' : 'bg-ink text-white'}`}>
            {type === 'seller' ? <Zap size={32} /> : <ShieldCheck size={32} />}
          </div>
          <h2 className="font-headline font-black text-6xl tracking-tighter uppercase leading-none mb-8">
            {type === 'seller' ? 'SELL YOUR \nARCHIVE' : 'JOIN THE \nCOLLECTIVE'}
          </h2>
          <ul className="space-y-6 font-body text-xl opacity-80">
            <li className="flex items-start gap-4">
              <span className="font-label font-bold text-primary-container">01</span>
              {type === 'seller' ? 'Reach a global audience of dedicated archival collectors.' : 'Access exclusive drops before they hit the mainstream.'}
            </li>
            <li className="flex items-start gap-4">
              <span className="font-label font-bold text-primary-container">02</span>
              {type === 'seller' ? 'Low commission rates and instant payouts.' : 'Verified authenticity for every single piece.'}
            </li>
            <li className="flex items-start gap-4">
              <span className="font-label font-bold text-primary-container">03</span>
              {type === 'seller' ? 'Advanced inventory and analytics tools.' : 'Connect directly with independent creators.'}
            </li>
          </ul>
        </div>

        <div className="font-label text-sm opacity-50">
          VIKTHRIFTS MARKETPLACE PROTOCOL V2.0 // EST. 2026
        </div>
      </div>
    </div>
  );
};
