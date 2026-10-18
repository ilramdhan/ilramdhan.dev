import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('renders GFM tables, strikethrough and task lists (lazy GFM path)', async () => {
    const { container } = render(
      <Markdown>{'| a | b |\n| - | - |\n| 1 | 2 |\n\n~~old~~\n\n- [x] done\n- [ ] todo'}</Markdown>,
    );
    // GFM path: the CommonMark fallback renders first, the lazy GFM renderer replaces it.
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(container.querySelector('del')).toHaveTextContent('old');
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('rewrites GitHub blob images to raw files and lazy-loads them', () => {
    render(
      <Markdown>
        {
          '![demo](https://github.com/storytold/photocraft/blob/main/docs/images/photocraft-demo.jpg)'
        }
      </Markdown>,
    );
    const img = screen.getByRole('img', { name: 'demo' });
    expect(img).toHaveAttribute(
      'src',
      'https://raw.githubusercontent.com/storytold/photocraft/main/docs/images/photocraft-demo.jpg',
    );
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('reserves image size from upload URLs', () => {
    render(<Markdown>{'![x](https://a.supabase.co/p/img_800x600.webp)'}</Markdown>);
    const img = screen.getByRole('img', { name: 'x' });
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
    const ext = screen.getByRole('link', { name: 'ext' });
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

  it('does not render raw HTML or javascript: URLs', () => {
    const { container } = render(
      <Markdown>{'<script>alert(1)</script>\n\n[x](javascript:alert(1))'}</Markdown>,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('x').closest('a')).toHaveAttribute('href', '');
  });

  it('merges caller overrides with defaults', () => {
    render(<Markdown components={{ h1: 'h2' }}>{'# Title'}</Markdown>);
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
  });

  it('renders plain CommonMark synchronously, without the GFM renderer', () => {
    render(<Markdown>{'**bold** and ~single~ tilde'}</Markdown>);
    // Synchronous: present on the first render, no Suspense fallback involved.
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText(/~single~ tilde/)).toBeInTheDocument();
  });

  it('renders nothing for empty content', () => {
    const { container } = render(<Markdown>{null}</Markdown>);
    expect(container).toBeEmptyDOMElement();
  });
});
