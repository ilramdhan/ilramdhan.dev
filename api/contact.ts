// Contact form → messages, behind Turnstile (D10). See src/lib/verified-insert.ts.
// Relative imports on purpose: Vercel bundles this file without tsconfig paths.
import { validateContactForm } from '../src/features/messages/contact-validation';
import { en } from '../src/i18n/messages/en';
import { handleVerifiedInsert, type VerifyEnv } from '../src/lib/verified-insert';

export const handleContact = (request: Request, env: VerifyEnv, fetchImpl?: typeof fetch) =>
  handleVerifiedInsert(
    {
      action: 'contact',
      table: 'messages',
      validate: (form) => validateContactForm(form, en.contact.validation),
    },
    request,
    env,
    fetchImpl,
  );

export function POST(request: Request): Promise<Response> {
  return handleContact(request, process.env);
}
