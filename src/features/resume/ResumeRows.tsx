import { Disclosure, DisclosureGroup } from '@/components/tile/Disclosure';
import { Markdown } from '@/components/ui/Markdown';
import type { ResumeItem } from './api';

/** Markdown on a tile: the typography plugin's colours re-pointed at the tile tokens (light, dark and night tiles). */
export const PROSE =
  'prose max-w-none [--tw-prose-body:var(--tile-ink)] [--tw-prose-headings:var(--tile-ink)] [--tw-prose-bold:var(--tile-ink)] [--tw-prose-links:var(--tile-action)] [--tw-prose-bullets:var(--tile-muted)] [--tw-prose-counters:var(--tile-muted)] [--tw-prose-code:var(--tile-ink)] [--tw-prose-quotes:var(--tile-ink)] [--tw-prose-hr:var(--hairline)]';

/**
 * Experience or education as one single-open Disclosure list (hairline rows, the first one open). Title, then institution
 * and period in muted text; the description is Markdown. The content is always in the prerendered HTML.
 */
export function ResumeRows({ items, prefix }: { items: ResumeItem[]; prefix: string }) {
  if (items.length === 0) return null;
  return (
    <DisclosureGroup defaultOpenId={`${prefix}-${items[0]?.id}`} className="w-full text-left">
      {items.map((item) => (
        <Disclosure
          key={item.id}
          id={`${prefix}-${item.id}`}
          summary={
            <>
              <span className="block text-title text-tile-ink">{item.title}</span>
              <span className="mt-1 block text-body text-tile-muted">
                {[item.institution, item.period].filter(Boolean).join(' · ')}
              </span>
            </>
          }
          contentClassName="pb-6"
        >
          <div className={PROSE}>
            <Markdown components={{ h1: 'h2' }}>{item.description || ''}</Markdown>
          </div>
        </Disclosure>
      ))}
    </DisclosureGroup>
  );
}
