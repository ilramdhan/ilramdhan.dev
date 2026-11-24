import { z } from 'zod';

/** Field error messages, supplied by the caller from the active locale's dictionary. */
export interface ContactMessages {
  name: string;
  email: string;
  message: string;
}

const contactSchema = (m: ContactMessages) =>
  z.object({
    name: z.string().min(2, { error: m.name }),
    email: z.email({ error: m.email }),
    message: z.string().min(10, { error: m.message }),
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

// Client-side validation of the contact form.
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
