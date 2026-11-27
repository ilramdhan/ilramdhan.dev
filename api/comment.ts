// Blog comment → blog_comments (held for moderation: `approved` defaults to false), behind Turnstile.
// See src/lib/verified-insert.ts. Relative imports on purpose: Vercel bundles this file without tsconfig paths.
import { validateComment } from '../src/features/blog/comment-validation';
import { handleVerifiedInsert, type VerifyEnv } from '../src/lib/verified-insert';

export const handleComment = (request: Request, env: VerifyEnv, fetchImpl?: typeof fetch) =>
  handleVerifiedInsert(
    { action: 'comment', table: 'blog_comments', validate: validateComment },
    request,
    env,
    fetchImpl,
  );

export function POST(request: Request): Promise<Response> {
  return handleComment(request, process.env);
}
