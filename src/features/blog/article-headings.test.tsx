import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from '@/components/ui/Markdown';
import { articleHeadingComponents } from './article-headings';
import { extractHeadings } from './toc';

describe('articleHeadingComponents', () => {
  it('renders # as h2 and gives headings the ids the TOC links to', () => {
    const md = '# Intro\n\n## Setup\n\n```\n## code\n```\n\n## Setup\n\n### Deep dive';
    const headings = extractHeadings(md);
    render(<Markdown components={articleHeadingComponents(headings)}>{md}</Markdown>);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    const rendered = screen.getAllByRole('heading').map((h) => [h.tagName, h.id]);
    expect(rendered).toEqual([
      ['H2', 'intro'],
      ['H2', 'setup'],
      ['H2', 'setup-2'],
      ['H3', 'deep-dive'],
    ]);
    expect(rendered.map(([, id]) => id)).toEqual(headings.map((h) => h.id));
  });
});
