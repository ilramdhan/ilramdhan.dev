import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { BRAND_NAME } from './nav-items';

/** The site mark (same paths as /favicon.svg), in ink. Decorative: the surrounding link carries the name. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="76 76 349 349"
      fill="currentColor"
      data-brand-mark=""
      className={cn('size-[22px] shrink-0 text-ink', className)}
    >
      <path d="M96 96H303A102 102 0 0 1 405 198A102 102 0 0 1 303 300V198H96Z" />
      <path d="M96 403V300A102 102 0 0 1 198 198V403Z" />
      <path d="M198 300H405V403H300A102 102 0 0 1 198 300Z" />
    </svg>
  );
}

/**
 * Mark + name, one span per letter (`--i` / `--r` drive the collapse stagger, global.css `.brand-name`). The name's
 * clip box starts at the mark's right edge, so collapsing letters slide into the mark and vanish there.
 */
export function BrandLogo({ className }: { className?: string }) {
  const letters = [...BRAND_NAME];
  return (
    <span aria-hidden="true" className={cn('inline-flex items-center', className)}>
      <BrandMark />
      <span translate="no" data-brand-name="" className="brand-name">
        <span className="brand-name-track">
          {letters.map((ch, i) => (
            <span
              key={i}
              className="brand-letter"
              style={{ '--i': i, '--r': letters.length - 1 - i } as CSSProperties}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
