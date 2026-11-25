import { z } from 'zod';

/** Field error messages, supplied by the caller from the active locale's dictionary. */
export interface ContactMessages {
  name: string;
  email: string;
  message: string;
}

const contactSchema = (m: ContactMessages) =>
  z.object({
    // Upper bounds = the DB checks and the RLS insert policy (also enforced server-side by api/contact.ts).
    name: z.string().trim().min(2, { error: m.name }).max(100, { error: m.name }),
    email: z.email({ error: m.email }).max(320, { error: m.email }),
    message: z.string().trim().min(10, { error: m.message }).max(5000, { error: m.message }),
  });

export type ContactState = {
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
  message?: string;
  success?: boolean;
};

export type ContactFields = z.infer<ReturnType<typeof contactSchema>>;

export type ContactValidation =
  | { success: true; data: ContactFields }
  | { success: false; error: NonNullable<ContactState['errors']> };

// Validation of the contact form (client, and api/contact.ts on the server).
export function validateContactForm(
  formData: FormData,
  messages: ContactMessages,
): ContactValidation {
  const validatedFields = contactSchema(messages).safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  return { success: true, data: validatedFields.data };
}
