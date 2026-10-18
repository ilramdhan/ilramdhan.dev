import { lazy, memo, Suspense } from 'react';
import type { Components } from 'react-markdown';
import type { MarkdownRendererProps } from '@/components/ui/MarkdownRenderer';

const load = () => import('@/components/ui/MarkdownRenderer');
// In the browser the chunk is requested as soon as a page using Markdown is loaded (in
// parallel with hydration), not when React first reaches a boundary: the boundaries then
// usually hydrate before any other update arrives. Still not in the initial JS graph.
const early = typeof window !== 'undefined' ? load() : undefined;
const LazyRenderer = lazy(() => early ?? load());

/**
 * Stand-in while the renderer chunk loads on a client-side navigation: the text's
 * paragraphs as plain text, so the page doesn't jump when the formatted version arrives.
 * Never seen on prerendered pages (the server waits for the renderer, and hydration
 * keeps the server HTML while the chunk loads).
 */
function PlainText({ children }: { children: string }) {
  return (
    <div aria-busy="true">
      {children
        .split(/\n{2,}/)
        .filter((block) => block.trim())
        .map((block, i) => (
          <p key={i} className="whitespace-pre-line">
            {block.trim()}
          </p>
        ))}
    </div>
  );
}

const sameComponents = (a?: Components, b?: Components) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a) as (keyof Components)[];
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
};

/**
 * Shared Markdown block. The parser (react-markdown, ~35 KiB gzip) lives in its own lazily
 * loaded chunk (T-58), so pages whose Markdown is already in their prerendered HTML don't
 * ship it up front: hydration keeps the server markup in this Suspense boundary while the
 * chunk loads. The boundary is always rendered (even once the chunk is cached) so server
 * and client trees match. Memoized (inline `components` compared shallowly) so a parent re-render
 * doesn't update the boundary before it has hydrated, which would make React discard the
 * server HTML.
 */
export const Markdown = memo(
  function Markdown(props: MarkdownRendererProps) {
    if (!props.children) return null;
    return (
      <Suspense fallback={<PlainText>{props.children}</PlainText>}>
        <LazyRenderer {...props} />
      </Suspense>
    );
  },
  (prev, next) =>
    prev.children === next.children && sameComponents(prev.components, next.components),
);
