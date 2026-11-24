import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, it } from 'vitest';
import { Seo } from './Seo';

it('removes every JSON-LD script on unmount, not just the first', () => {
  for (const id of ['a', 'b']) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = id;
    document.head.append(s);
  }
  const { unmount } = render(
    <MemoryRouter>
      <Seo title="x" />
    </MemoryRouter>,
  );
  unmount();
  expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
});
