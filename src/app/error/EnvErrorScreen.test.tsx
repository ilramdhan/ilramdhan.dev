import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EnvErrorScreen } from './EnvErrorScreen';

describe('<EnvErrorScreen />', () => {
  it('renders a heading and every configuration error', () => {
    render(
      <EnvErrorScreen
        errors={['VITE_SUPABASE_URL is missing', 'VITE_SUPABASE_ANON_KEY is missing']}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Site configuration error');
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['VITE_SUPABASE_URL is missing', 'VITE_SUPABASE_ANON_KEY is missing']);
  });
});
