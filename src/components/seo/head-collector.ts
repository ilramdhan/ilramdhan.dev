import { createContext } from 'react';
import type { HeadDescriptor } from './seo-head';

/**
 * Set only while prerendering (T-35): `<Seo>` reports the page's head through it during render,
 * because effects (which update `document.head` in the browser) never run on the server.
 */
export const HeadCollectorContext = createContext<((head: HeadDescriptor) => void) | null>(null);
