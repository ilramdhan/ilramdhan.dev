import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { BlogCard } from './api';
import { FeaturedCarousel } from './FeaturedCarousel';

const posts = (n: number): BlogCard[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    slug: `post-${i + 1}`,
    title: `Post ${i + 1}`,
    excerpt: 'Excerpt',
    images: [],
    tags: ['go'],
    published_at: '2026-01-15T10:00:00.000Z',
  }));

const renderCarousel = (n: number) =>
  render(
    <MemoryRouter>
      <FeaturedCarousel posts={posts(n)} />
    </MemoryRouter>,
  );

describe('FeaturedCarousel', () => {
  it('renders three posts or fewer as a plain grid (no carousel semantics or buttons)', () => {
    renderCarousel(3);
    expect(screen.queryByRole('region', { name: 'Featured articles' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('listitem').filter((li) => li.closest('ul[aria-label]') === null),
    ).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  it('renders four or more posts as a labelled carousel of slides', () => {
    renderCarousel(5);
    const region = screen.getByRole('region', { name: 'Featured articles' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    const slides = within(region)
      .getAllByRole('listitem')
      .filter((li) => li.getAttribute('aria-roledescription') === 'slide');
    expect(slides.map((s) => s.getAttribute('aria-label'))).toEqual([
      '1 of 5',
      '2 of 5',
      '3 of 5',
      '4 of 5',
      '5 of 5',
    ]);
    expect(within(slides[0]!).getByRole('link', { name: 'Post 1' })).toHaveAttribute(
      'href',
      '/blog/post-1',
    );
  });

  it('starts with "Previous" disabled and "Next" enabled, before any measurement', () => {
    renderCarousel(4);
    expect(screen.getByRole('button', { name: 'Previous articles' })).toBeDisabled();
    // jsdom has no layout (scrollWidth = clientWidth = 0): the track reads as fully seen.
    expect(screen.getByRole('button', { name: 'Next articles' })).toBeInTheDocument();
  });
});
