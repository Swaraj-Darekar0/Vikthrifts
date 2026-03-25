/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const SUPABASE_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'thredz';

export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://becqbmoeliuzlipspsvz.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is missing. Please add it to your Secrets in AI Studio.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

// For backward compatibility, use a Proxy to provide helpful error messages
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    try {
      const client = getSupabase();
      return (client as any)[prop];
    } catch (e: any) {
      console.error(e.message);
      // Return a dummy function for common calls to prevent immediate crash in some cases
      return () => {
        throw new Error(e.message);
      };
    }
  }
});
