const bar = 'rounded-sm bg-tile-frame';

/** Placeholder with the same box as `BlogCard` while posts load. */
export function BlogCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col motion-safe:animate-pulse">
      <div className="aspect-video w-full rounded-lg bg-tile-frame md:aspect-[4/3]" />
      <div className={`${bar} mt-5 h-4 w-32`} />
      <div className={`${bar} mt-2 h-6 w-4/5`} />
      <div className={`${bar} mt-3 h-[4.4rem] w-full opacity-60`} />
    </div>
  );
}

/** Placeholder with the box of `BlogFeature`. */
export function BlogFeatureSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid w-full items-center gap-8 motion-safe:animate-pulse lg:grid-cols-[7fr_5fr] lg:gap-12"
    >
      <div className="aspect-video w-full rounded-lg bg-tile-frame lg:aspect-[4/3]" />
      <div className="flex flex-col gap-3">
        <div className={`${bar} h-4 w-32`} />
        <div className={`${bar} h-12 w-11/12`} />
        <div className={`${bar} h-24 w-full opacity-60`} />
      </div>
    </div>
  );
}
