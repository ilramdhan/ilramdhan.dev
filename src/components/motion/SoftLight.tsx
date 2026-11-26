import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const SIZE = 520;

/**
 * Soft light (mutugading `soft-light.tsx`): a very quiet radial light that follows a fine pointer over its positioned
 * parent. The site's one radial gradient. Leaf component: never takes pointer events, moves with transform and fades
 * with opacity only. Off for touch and reduced motion. `photo` = white on photographs (clickable frames only);
 * `tile` = the tile-aware `--tile-light` (Tile `glow`).
 */
export function SoftLight({
  tone = 'photo',
  className,
}: {
  tone?: 'photo' | 'tile';
  className?: string;
}) {
  const layer = useRef<HTMLSpanElement>(null);
  const blob = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = layer.current;
    const host = el?.parentElement;
    const b = blob.current;
    if (!el || !host || !b || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      b.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;
    };
    const move = (e: PointerEvent) => {
      if (!mq.matches || e.pointerType !== 'mouse') return;
      const r = host.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      el.dataset.on = 'true';
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const leave = () => {
      delete el.dataset.on;
    };
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <span
      ref={layer}
      aria-hidden="true"
      data-soft-light={tone}
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-500 ease-out data-[on=true]:opacity-100 motion-reduce:hidden',
        className,
      )}
    >
      <span
        ref={blob}
        className="absolute top-0 left-0 rounded-full will-change-transform"
        style={{
          width: SIZE,
          height: SIZE,
          background: `radial-gradient(closest-side, ${tone === 'photo' ? 'rgb(255 255 255 / 0.16)' : 'var(--tile-light)'}, transparent)`,
        }}
      />
    </span>
  );
}
