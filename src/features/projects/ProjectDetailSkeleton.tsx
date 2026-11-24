import { useT } from '@/i18n';

/** The detail page's first screen in its final boxes (breadcrumb, title, lead, pill, gallery frame): no layout shift. */
export function ProjectDetailSkeleton() {
  const t = useT();
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        {t.project.loading}
      </span>
      <div
        aria-hidden="true"
        className="wrap flex flex-col items-center py-section motion-safe:animate-pulse"
      >
        <div className="h-5 w-48 max-w-full rounded-sm bg-tile-frame" />
        <div className="mt-6 h-[1.1em] w-3/4 max-w-[20ch] rounded-sm bg-tile-frame text-tile" />
        <div className="mt-5 h-[2.66em] w-full max-w-[34ch] rounded-sm bg-tile-frame text-lead" />
        <div className="mt-6 h-11 w-40 rounded-full bg-tile-frame" />
        <div className="mt-stack aspect-[4/3] w-full rounded-lg bg-tile-frame sm:aspect-video" />
      </div>
    </div>
  );
}
