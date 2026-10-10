import { z } from 'zod';

/**
 * Runtime validation of the public (VITE_*) environment variables.
 *
 * Vite inlines these at build time. A missing/invalid value does NOT fail
 * `vite build` (Vercel injects them during its own build); instead the app
 * renders a readable configuration error screen (see `index.tsx`) rather than
 * crashing into a blank page.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string({ required_error: 'is missing' })
    .trim()
    .min(1, 'is missing')
    .url('must be a valid URL (e.g. https://your-project-ref.supabase.co)'),
  VITE_SUPABASE_ANON_KEY: z.string({ required_error: 'is missing' }).trim().min(1, 'is missing'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as unknown,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as unknown,
});

/** Human-readable problems, one per invalid variable; empty when the env is valid. */
export const envErrors: string[] = parsed.success
  ? []
  : parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`);

/** Validated env, or `null` when invalid (the app shows the error screen instead). */
export const env: Env | null = parsed.success ? parsed.data : null;
