import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TileHeadingProps = {
  id: string;
  title: ReactNode;
  as?: 'h1' | 'h2';
  /** hero = 40→80px, tile = 32→56px, section = 28→40px. Defaults: h1 → hero, h2 → tile. */
  size?: 'hero' | 'tile' | 'section';
  /** One-line tagline / lead under the heading. */
  lead?: ReactNode;
  /** Row of PillButton / LinkChevron. */
  links?: ReactNode;
  align?: 'center' | 'start';
  /**
   * Masked word reveal on scroll (string titles only). Default: on for h2, off for h1 (the hero has its own load
   * entrance). Static phase: only marks the heading with `data-reveal`; the split-text engine arrives in R3.
   */
  reveal?: boolean;
  className?: string;
};

const sizeClass = {
  hero: 'text-hero max-w-[14ch]',
  tile: 'text-tile max-w-[20ch]',
  section: 'text-section max-w-[22ch]',
};

/** Heading + optional lead + optional links. Eyebrow-free: the heading carries its own weight. */
export function TileHeading({
  id,
  title,
  as: Tag = 'h2',
  size,
  lead,
  links,
  align = 'center',
  reveal: revealProp,
  className,
}: TileHeadingProps) {
  const reveal = (revealProp ?? Tag !== 'h1') && typeof title === 'string';
  const s = size ?? (Tag === 'h1' ? 'hero' : 'tile');
  const center = align === 'center';
  return (
    <div
      className={cn(
        'flex flex-col',
        center ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      <Tag
        id={id}
        data-reveal={reveal ? '' : undefined}
        className={cn(sizeClass[s], 'text-tile-ink')}
      >
        {title}
      </Tag>
      {lead ? <p className="mt-5 max-w-[34ch] text-lead text-tile-ink">{lead}</p> : null}
      {links ? (
        <div
          className={cn(
            'flex flex-wrap items-center gap-x-8 gap-y-4',
            center && 'justify-center',
            s === 'hero' ? 'mt-8' : 'mt-3',
          )}
        >
          {links}
        </div>
      ) : null}
    </div>
  );
}
