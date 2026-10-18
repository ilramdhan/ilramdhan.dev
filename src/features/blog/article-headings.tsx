import type { Components, ExtraProps } from 'react-markdown';
import type { ComponentPropsWithoutRef } from 'react';
import type { TocHeading } from './toc';

type HeadingProps = ComponentPropsWithoutRef<'h2'> & ExtraProps;

/**
 * `Markdown` overrides for the article body: `#` renders as h2 (the page title is the only
 * h1), and every h1–h3 gets the id `extractHeadings` computed for it, matched by source
 * line, so TOC links and the rendered ids can never disagree.
 */
export function articleHeadingComponents(headings: TocHeading[]): Components {
  const idByLine = new Map(headings.map((h) => [h.line, h.id]));
  const heading =
    (Tag: 'h2' | 'h3') =>
    ({ node, children, ...props }: HeadingProps) => {
      const line = node?.position?.start.line;
      return (
        <Tag {...props} id={line === undefined ? undefined : idByLine.get(line)}>
          {children}
        </Tag>
      );
    };
  return { h1: heading('h2'), h2: heading('h2'), h3: heading('h3') };
}
