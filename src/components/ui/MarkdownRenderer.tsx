import { lazy, Suspense } from 'react';
import ReactMarkdown, { type Components, type Options } from 'react-markdown';
import { dimensionsFromUrl } from '@/lib/image-dimensions';
import { needsGfm, toEmbeddableImageUrl } from '@/lib/markdown-url';

const MarkdownGfm = lazy(() => import('@/components/ui/MarkdownGfm'));

const COMPONENTS: Components = {
  /**
   * Images: GitHub blob URLs made embeddable (after react-markdown's URL sanitization),
   * lazy and async-decoded, with their box reserved when the URL encodes a size.
   */
  img: ({ node, ...props }) => {
    void node; // hast node: not a DOM attribute
    return (
      <img
        {...props}
        {...dimensionsFromUrl(props.src)}
        alt={props.alt ?? ''}
        src={toEmbeddableImageUrl(props.src)}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  },
  /** External http(s) links open in a new tab; internal and anchor links are untouched. */
  a: ({ node, children, ...props }) => {
    void node;
    return (
      <a
        {...props}
        {...(/^https?:\/\//i.test(props.href ?? '') && {
          target: '_blank',
          rel: 'noopener noreferrer',
        })}
      >
        {children}
      </a>
    );
  },
};

export interface MarkdownRendererProps {
  children: string | null | undefined;
  /** Element overrides merged over the defaults (e.g. `{ h1: 'h2' }` on detail pages). */
  components?: Components;
}

/**
 * The Markdown renderer behind `Markdown`, in the lazily loaded `markdown` chunk (T-58):
 * no raw HTML, sanitized URLs, GitHub blob image URLs rewritten to raw files. Content
 * using GitHub-flavoured syntax (tables, task lists, strikethrough, footnotes, bare URLs)
 * loads the GFM renderer on demand, with the CommonMark render as its fallback.
 */
export default function MarkdownRenderer({ children, components }: MarkdownRendererProps) {
  const options: Options = {
    children,
    components: components ? { ...COMPONENTS, ...components } : COMPONENTS,
  };
  const plain = <ReactMarkdown {...options} />;
  if (!needsGfm(children)) return plain;
  return (
    <Suspense fallback={plain}>
      <MarkdownGfm {...options} />
    </Suspense>
  );
}
