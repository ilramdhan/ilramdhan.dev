import { createContext } from 'react';
import type { HeadDescriptor } from './seo-head';

/**
 * Set only while prerendering (T-35): `<Seo>` writes the page's head here during render,
 * because effects (which update `document.head` in the browser) never run on the server.
 */
export const HeadCollectorContext = createContext<{ current: HeadDescriptor | null } | null>(null);
