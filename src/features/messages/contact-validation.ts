import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
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

export type ContactFields = z.infer<typeof ContactSchema>;

export type ContactValidation =
  | { success: true; data: ContactFields }
  | { success: false; error: NonNullable<ContactState['errors']> };

// Client-side validation of the contact form.
export function validateContactForm(formData: FormData): ContactValidation {
  const validatedFields = ContactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  return { success: true, data: validatedFields.data };
}
