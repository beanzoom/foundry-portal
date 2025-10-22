
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

// Initialize Supabase client with explicit session persistence and better retry options
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase_auth_token',
    // Enable cookie storage for cross-subdomain authentication
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    cookieOptions: {
      domain: process.env.NODE_ENV === 'development' ? '.localhost' : '.fleetdrms.com',
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development'
    }
  },
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) => {
      return fetch(url, options).catch(error => {
        console.error('Supabase fetch error:', error);
        throw error;
      });
    },
  },
  db: {
    schema: 'public',
  },
});

// Helper function to check if the Supabase instance is healthy
export const checkSupabaseHealth = async () => {
  try {
    // Simple health check - get session data
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return false;
  }
};
