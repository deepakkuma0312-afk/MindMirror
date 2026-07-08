import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Simple browser-safe client
export function getBrowserClient() {
  if (!isSupabaseConfigured) return null;
  // Dynamic import or direct call
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key);
}

// Server client creator for Route Handlers and Server Actions
export async function getServerSupabase() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Can be ignored if called from Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Can be ignored if called from Server Components
          }
        },
      },
    }
  );
}

// Helper to get currently logged in user (works with both Supabase and local mock)
export async function getSessionUser() {
  const cookieStore = await cookies();
  
  if (isSupabaseConfigured) {
    const supabase = await getServerSupabase();
    if (!supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user ? { id: user.id, email: user.email! } : null;
    } catch (e) {
      return null;
    }
  } else {
    // Local cookie-based mock login
    const sessionVal = cookieStore.get('mindmirror-session')?.value;
    if (!sessionVal) return null;
    try {
      const sessionData = JSON.parse(sessionVal);
      return sessionData ? { id: sessionData.id, email: sessionData.email } : null;
    } catch (e) {
      return null;
    }
  }
}
