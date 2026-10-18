import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('shows the plain text while the renderer chunk loads, then the rendered Markdown', async () => {
    const { container } = render(<Markdown>{'**bold** first\n\nsecond'}</Markdown>);
    // Lazy renderer (T-58): plain-text stand-in first, formatted once the chunk is in.
    expect(container.querySelector('[aria-busy]')).toHaveTextContent('**bold** first');
    expect((await screen.findByText('bold')).tagName).toBe('STRONG');
    expect(container.querySelector('[aria-busy]')).toBeNull();
  });

  it('renders GFM tables, strikethrough and task lists (lazy GFM path)', async () => {
    const { container } = render(
      <Markdown>{'| a | b |\n| - | - |\n| 1 | 2 |\n\n~~old~~\n\n- [x] done\n- [ ] todo'}</Markdown>,
    );
    // GFM path: the CommonMark fallback renders first, the lazy GFM renderer replaces it.
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(container.querySelector('del')).toHaveTextContent('old');
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('rewrites GitHub blob images to raw files and lazy-loads them', async () => {
    render(
      <Markdown>
        {
          '![demo](https://github.com/storytold/photocraft/blob/main/docs/images/photocraft-demo.jpg)'
        }
      </Markdown>,
    );
    const img = await screen.findByRole('img', { name: 'demo' });
    expect(img).toHaveAttribute(
      'src',
      'https://raw.githubusercontent.com/storytold/photocraft/main/docs/images/photocraft-demo.jpg',
    );
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('reserves image size from upload URLs', async () => {
    render(<Markdown>{'![x](https://a.supabase.co/p/img_800x600.webp)'}</Markdown>);
    const img = await screen.findByRole('img', { name: 'x' });
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '600');
  });

  it('opens external links in a new tab but keeps blob links and internal links as-is', async () => {
    render(
      <Markdown>
        {
          '[ext](https://github.com/a/b/blob/main/c.png) [int](/blog/x) [anchor](#top) https://example.com'
        }
      </Markdown>,
    );
    const ext = await screen.findByRole('link', { name: 'ext' });
    expect(ext).toHaveAttribute('href', 'https://github.com/a/b/blob/main/c.png');
    expect(ext).toHaveAttribute('target', '_blank');
    expect(ext).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'int' })).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'anchor' })).not.toHaveAttribute('target');
    // Bare URL: autolinked once the GFM renderer has loaded.
    expect(await screen.findByRole('link', { name: 'https://example.com' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
  });

  it('does not render raw HTML or javascript: URLs', async () => {
    const { container } = render(
      <Markdown>{'<script>alert(1)</script>\n\n[x](javascript:alert(1))'}</Markdown>,
    );
    expect((await screen.findByText('x')).closest('a')).toHaveAttribute('href', '');
    expect(container.querySelector('script')).toBeNull();
  });

  it('merges caller overrides with defaults', async () => {
    render(<Markdown components={{ h1: 'h2' }}>{'# Title'}</Markdown>);
    expect(await screen.findByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
  });

  it('renders plain CommonMark without the GFM renderer', async () => {
    render(<Markdown>{'**bold** and ~single~ tilde'}</Markdown>);
    expect((await screen.findByText('bold')).tagName).toBe('STRONG');
    expect(screen.getByText(/~single~ tilde/)).toBeInTheDocument();
  });

  it('renders nothing for empty content', () => {
    const { container } = render(<Markdown>{null}</Markdown>);
    expect(container).toBeEmptyDOMElement();
  });
});
