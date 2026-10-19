import { useRef } from 'react';
import type React from 'react';

/** A mostly-horizontal drag past this many px counts as a swipe. */
const SWIPE_MIN_PX = 40;

/**
 * Pointer-event swipe (touch, pen and mouse; no library): `onSwipe(1)` for a swipe to the
 * left (next), `onSwipe(-1)` for a swipe to the right (previous). Spread the returned
 * handlers on the swipe area and give it `touch-action: pan-y` so vertical scrolling works.
 */
export function useSwipe(onSwipe: (direction: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const dx = e.clientX - from.x;
      const dy = e.clientY - from.y;
      if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
        onSwipe(dx < 0 ? 1 : -1);
      }
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}
