import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IsAdminState } from '@/lib/useIsAdmin';

const logout = vi.fn(() => Promise.resolve());
const toastError = vi.fn<(msg: string) => void>();
let auth: { user: object | null; isLoading: boolean };
let admin: IsAdminState;

vi.mock('./auth', () => ({ useAuth: () => ({ ...auth, logout }) }));
vi.mock('@/lib/useIsAdmin', () => ({ useIsAdmin: () => admin }));
vi.mock('sonner', () => ({ toast: { error: (msg: string) => toastError(msg) } }));

const { AdminRoute, NOT_ADMIN_MESSAGE } = await import('./AdminRoute');

function renderAt(path = '/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/login" element={<p>login</p>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <p>dashboard</p>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

const state = (overrides: Partial<IsAdminState>): IsAdminState => ({
  isAdmin: false,
  isDenied: false,
  isLoading: false,
  isError: false,
  retry: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  logout.mockClear();
  toastError.mockClear();
  auth = { user: { id: 'u1' }, isLoading: false };
  admin = state({});
});

describe('<AdminRoute />', () => {
  it('shows a loading state while auth or the admin check is pending', () => {
    admin = state({ isLoading: true });
    renderAt();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects anonymous visitors to /login', () => {
    auth = { user: null, isLoading: false };
    renderAt();
    expect(screen.getByText('login')).toBeInTheDocument();
  });

  it('renders the dashboard for an admin', () => {
    admin = state({ isAdmin: true });
    renderAt();
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('signs a non-admin out once, toasts and redirects home', () => {
    admin = state({ isDenied: true });
    renderAt();
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
    expect(toastError).toHaveBeenCalledExactlyOnceWith(NOT_ADMIN_MESSAGE);
    expect(logout).toHaveBeenCalledOnce();
  });

  it('offers a retry when the check fails', async () => {
    const retry = vi.fn();
    admin = state({ isError: true, retry });
    renderAt();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't verify admin access");
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
