import { ARTICLE_COLUMN, ARTICLE_GRID } from './layout';

interface ArticleSkeletonProps {
  /** Screen-reader status text, e.g. "Loading article...". */
  label: string;
}

const bar = 'rounded-sm bg-tile-frame';

/** Placeholder with the Newsroom article's boxes (breadcrumb, centred header, wide cover, 680px column). */
export function ArticleSkeleton({ label }: ArticleSkeletonProps) {
  return (
    <div className="bg-white pb-section pt-6 text-ink" aria-busy="true">
      <div className="wrap">
        <span className="sr-only" role="status">
          {label}
        </span>
        {/* Same boxes and spacing as the loaded header / cover / body (no layout shift). */}
        <div aria-hidden="true" className="motion-safe:animate-pulse">
          <div className={`${bar} h-4 w-48`} />
          <div className="mx-auto mt-6 flex max-w-208 flex-col items-center gap-4">
            <div className={`${bar} h-4 w-32`} />
            <div className={`${bar} h-10 w-4/5 md:h-16`} />
            <div className={`${bar} h-7 w-3/5`} />
            <div className={`${bar} h-4 w-48`} />
          </div>
          <div className="mt-stack aspect-[4/5] rounded-lg bg-tile-frame sm:aspect-[16/7]" />
          <div className={`${ARTICLE_GRID} mt-stack`}>
            <div className={`${ARTICLE_COLUMN} space-y-3`}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`${bar} h-4`} />
              ))}
              <div className={`${bar} h-4 w-2/3`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
