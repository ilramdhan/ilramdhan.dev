import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';

const login = vi.fn<() => Promise<void>>();
vi.mock('@/app/auth', () => ({ useAuth: () => ({ login, user: null, isLoading: false }) }));
const toastError = vi.hoisted(() => vi.fn());
vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }));

const { default: LoginPage } = await import('./login');

// F12 inventory: a failed GitHub sign-in is reported, not swallowed.
it('toasts when the GitHub sign-in fails', async () => {
  login.mockRejectedValue(new Error('popup blocked'));
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Sign In with GitHub' }));
  await waitFor(() =>
    expect(toastError).toHaveBeenCalledWith('Failed to log in. Please try again.'),
  );
  expect(login).toHaveBeenCalledTimes(1);
});
