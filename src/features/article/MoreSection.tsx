import type { ReactNode } from 'react';
import { Tile } from '@/components/tile/Tile';
import { colVar } from '@/components/tile/stagger';
import { PostNavigation, type Adjacent } from './ArticleFooter';

/**
 * One "More" section: older/newer row, then related items without those two, max 3. Renders nothing when empty.
 * Related items come from the query that already excludes the current one; the adjacent ids are dropped here.
 */
export function MoreSection<T extends { id: number; slug: string | null; title: string }>({
  adjacent,
  related,
  basePath,
  labels,
  renderCard,
}: {
  adjacent: Adjacent<T> | undefined;
  related: T[] | undefined;
  basePath: string;
  labels: { more: string; pager: string; older: string; newer: string; related: string };
  renderCard: (item: T) => ReactNode;
}) {
  const skip = new Set([adjacent?.older?.id, adjacent?.newer?.id]);
  const rest = (related ?? []).filter((p) => !skip.has(p.id)).slice(0, 3);
  if (!adjacent?.older?.slug && !adjacent?.newer?.slug && !rest.length) return null;
  return (
    <Tile labelledBy="more-heading" tone="parchment" innerClassName="items-stretch text-left">
      <h2 id="more-heading" className="text-section text-tile-ink">
        {labels.more}
      </h2>
      <div className="mt-stack">
        <PostNavigation
          adjacent={adjacent}
          basePath={basePath}
          label={labels.pager}
          olderText={labels.older}
          newerText={labels.newer}
        />
      </div>
      {rest.length > 0 && (
        <ul
          aria-label={labels.related}
          className="stagger-row mt-stack grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
        >
          {rest.map((p, i) => (
            <li key={p.id} style={colVar(i, 3)} className="min-w-0">
              {renderCard(p)}
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}
