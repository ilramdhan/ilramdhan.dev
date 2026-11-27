import { z } from 'zod';

// Bounds = the DB checks (blog_comments_*_length_check). Server-side only (api/comment.ts):
// the form's own checks are the required/maxLength attributes.
const commentSchema = z.object({
  blog_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  content: z.string().trim().min(1).max(2000),
});

export function validateComment(form: FormData) {
  const r = commentSchema.safeParse({
    blog_id: form.get('blog_id'),
    name: form.get('name'),
    content: form.get('content'),
  });
  return r.success
    ? { success: true as const, data: r.data }
    : { success: false as const, error: z.flattenError(r.error).fieldErrors };
}
