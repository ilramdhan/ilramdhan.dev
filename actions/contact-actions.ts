import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
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

// We will inject the Store context method in the component for this demo
// This is a helper validation function now
export async function validateContactForm(formData: FormData): Promise<{success: boolean, data?: any, error?: any}> {
  const validatedFields = ContactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.flatten().fieldErrors
    };
  }

  return { success: true, data: validatedFields.data };
}

// Keep the original function signature for compatibility but it's largely unused in the new flow
export async function submitContactForm(prevState: ContactState, formData: FormData): Promise<ContactState> {
    return { success: false, message: "Use validateContactForm instead" };
}
