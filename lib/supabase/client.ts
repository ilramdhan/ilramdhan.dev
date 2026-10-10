import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types.ts';

// IMPORTANT: Create a .env.local file in the root of your project
// and add your Supabase URL and Anon Key there.
//
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO(#18)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO(#18)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // throw new Error('Missing Supabase URL or Anon Key. Make sure to set them in your .env.local file.');
  console.warn('Missing Supabase URL or Anon Key. Make sure to set them in your .env.local file.');
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- TODO(#18)
export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '');
