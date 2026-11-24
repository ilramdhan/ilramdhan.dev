import { morphName } from '@/components/motion/Morph';
import { cn } from '@/lib/utils';
import { LinkedGroup, type LinkedItem } from '@/components/tile/LinkedGroup';
import { useLocalePath, useT } from '@/i18n';
import type { Tables } from '@/types';

type Project = Tables<'projects'>;

/** Intrinsic ratio only; the frame's aspect class crops the screenshot. */
const PHOTO = { width: 1600, height: 900 };

/**
 * Project card (/projects, related projects): a LinkedGroup, i.e. a clickable MediaFrame (the photo zooms on the link
 * only), the title, one muted line and a chevron. Demo and repo links live on the project page (a link inside a link
 * is invalid). The photo carries the view-transition name that the detail gallery shares, so it morphs on navigation.
 */
export function ProjectCard({
  project,
  className,
}: {
  project: Partial<Project>;
  className?: string;
}) {
  const t = useT();
  const lp = useLocalePath();
  const title = project.title ?? t.projects.fallbackTitle;
  const first = project.images?.[0];
  const item: LinkedItem = {
    id: String(project.id ?? project.slug),
    title,
    line: project.short_description ?? undefined,
    href: lp(`/projects/${encodeURIComponent(project.slug ?? '')}`),
    image: first
      ? {
          src: first,
          alt: project.title ? t.projects.screenshotOf(project.title) : t.projects.screenshot,
          ...PHOTO,
        }
      : null,
    morph: project.slug ? morphName('project', project.slug) : undefined,
  };
  return (
    <LinkedGroup
      item={item}
      moreLabel={t.projects.viewProject}
      aspect="landscape"
      className={cn('sm:items-start sm:text-left', className)}
    />
  );
}

/** The card's final boxes (4:3 frame, title, two lines, chevron row), so the grid doesn't shift (T-26). */
export function ProjectCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col items-start">
      <div className="aspect-[4/3] w-full rounded-lg bg-tile-frame motion-safe:animate-pulse" />
      <div className="mt-4 h-[1.2em] w-2/3 rounded-sm bg-tile-frame text-title sm:mt-6" />
      <div className="mt-2 h-[2.8em] w-full rounded-sm bg-tile-frame text-[0.9375rem]" />
      <div className="mt-2 h-11 w-1/3" />
    </div>
  );
}
