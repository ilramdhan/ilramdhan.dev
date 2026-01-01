import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types.ts';

// IMPORTANT: Create a .env.local file in the root of your project
// and add your Supabase URL and Anon Key there.
//
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // throw new Error('Missing Supabase URL or Anon Key. Make sure to set them in your .env.local file.');
  console.warn('Missing Supabase URL or Anon Key. Make sure to set them in your .env.local file.');
}

export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '');
