import type { ReactNode } from 'react';
import { Navbar } from '@/app/layouts/Navbar';
import { BODY_COLUMN, BODY_GRID, CONTAINER } from './layout';

interface ArticleSkeletonProps {
  /** Screen-reader status text, e.g. "Loading article...". */
  label: string;
  /** Extra header boxes below the meta line (e.g. project actions). */
  header?: ReactNode;
  /** Extra boxes right below the cover (e.g. a thumbnail strip). */
  media?: ReactNode;
}

/** Placeholder with the article's header / cover / body boxes while the page loads. */
export function ArticleSkeleton({ label, header, media }: ArticleSkeletonProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />
      <main className={`${CONTAINER} pt-24 pb-20`} aria-busy="true">
        <span className="sr-only" role="status">
          {label}
        </span>
        {/* Same boxes and spacing as the loaded header / cover / body (no layout shift). */}
        <div aria-hidden="true" className="motion-safe:animate-pulse">
          <div className="mb-6 h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mb-4 h-7 w-20 rounded-full bg-slate-100 dark:bg-slate-800/60" />
          <div className="mb-4 h-10 w-4/5 rounded bg-slate-200 dark:bg-slate-800 md:h-12" />
          <div className="mb-6 h-7 max-w-prose text-xl rounded bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-5 w-40 rounded bg-slate-100 dark:bg-slate-800/60" />
          {header}
          <div className="mt-8 aspect-video rounded-2xl bg-slate-200 dark:bg-slate-800" />
          {media}
          <div className={BODY_GRID}>
            <div className={`${BODY_COLUMN} space-y-3`}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-4 rounded bg-slate-100 dark:bg-slate-800/60" />
              ))}
              <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
            <div className="hidden h-40 rounded-xl bg-slate-100 dark:bg-slate-800/60 lg:block" />
          </div>
        </div>
      </main>
    </div>
  );
}
