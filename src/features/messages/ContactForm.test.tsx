import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  it('names each invalid field and ties its error to it', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ContactForm />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    const email = screen.getByLabelText('Email');
    expect(await screen.findByText('Please enter a valid email.')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Please enter a valid email.');
    expect(screen.getByRole('status')).toHaveTextContent('Missing Fields');
    // D10 flag off (no VITE_TURNSTILE_SITE_KEY): no widget, the anon insert path as before.
    expect(document.querySelector('[data-turnstile]')).toBeNull();
    // Focus ring: the field draws a 2px focus-visible outline and never hides the outline on plain focus.
    // (The banned class is matched by pattern: a literal here would make Tailwind emit it.)
    expect(email.className).toContain('focus-visible:outline-2');
    expect(email.className).not.toMatch(/(^|\s)focus:outline-(none|hidden)/);
  });
});
