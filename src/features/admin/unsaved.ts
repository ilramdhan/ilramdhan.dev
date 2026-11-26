import { useEffect } from 'react';

// Admin forms with unsaved edits. BrowserRouter has no navigation blocker (that needs a data router), so the guard is
// the browser's own prompt on unload plus `confirmDiscard()` before the admin's own in-app moves (tab links, logout,
// opening another row). ponytail: browser back/forward inside the SPA is not guarded; add it with a data router.
const dirty = new Set<symbol>();
const DISCARD = 'You have unsaved changes. Leave without saving?';

const onBeforeUnload = (e: BeforeUnloadEvent) => {
  e.preventDefault();
};

/** Marks the calling form as having unsaved changes while `isDirty` is true. */
export function useUnsavedGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const id = Symbol('form');
    dirty.add(id);
    if (dirty.size === 1) window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      dirty.delete(id);
      if (dirty.size === 0) window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [isDirty]);
}

/** True when nothing is unsaved or the admin agrees to drop it. */
export function confirmDiscard(): boolean {
  return dirty.size === 0 || window.confirm(DISCARD);
}
