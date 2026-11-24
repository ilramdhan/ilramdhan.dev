import { ViewTransition, type ReactNode } from 'react';

/**
 * Shared element (mutugading `morph.tsx`): wrap the SAME photo on two routes with the same `name` (a projects-row
 * thumbnail and the project hero) and it morphs between the slots during navigation (320ms, cover-cropped, `.vt-morph`
 * in global.css). `default="none"` keeps it still on unrelated transitions. One element per name on screen.
 */
export function Morph({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ViewTransition name={name} share="vt-morph" default="none">
      {children}
    </ViewTransition>
  );
}

/** A valid, stable view-transition-name: `morphName("project", slug)` → "vt-project-my-slug". */
// eslint-disable-next-line react-refresh/only-export-components -- tiny helper that belongs to Morph
export function morphName(kind: string, id: string): string {
  return `vt-${kind}-${id}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}
