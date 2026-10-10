import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RouteErrorBoundary } from './RouteError';

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error('boom');
  return <p>recovered</p>;
}

describe('RouteErrorBoundary', () => {
  it('shows a friendly message instead of a white screen and recovers on retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrow = true;
    render(
      <RouteErrorBoundary>
        <Bomb />
      </RouteErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });
});
