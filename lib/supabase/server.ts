import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { Database } from '../../types';

// This file is intended for Next.js Server Components.
// Since we are using Vite (SPA), this file is likely not needed or needs adaptation if you plan to use SSR with Vite.
// For now, I'll comment out the Next.js specific parts to avoid build errors.

/*
// import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
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
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};
*/
export const createClient = () => {
    throw new Error("This function is not supported in the current Vite setup.");
}