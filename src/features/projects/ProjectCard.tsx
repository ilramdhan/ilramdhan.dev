import React from 'react';
import { ExternalLink, FolderGit2, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/motion';
import type { Tables } from '@/types';
import { cn, ensureFullUrl } from '@/lib/utils';
import { ImageCarousel } from './ImageCarousel';

type Project = Tables<'projects'>;

const MAX_TECH = 3;

interface ProjectCardProps {
  project: Partial<Project>;
  index: number;
  /** Heading level for the title: h3 inside a titled section (default), h2 on list pages. */
  headingLevel?: 'h2' | 'h3';
  /** `sizes` for the screenshots; defaults to a 3-column grid. */
  sizes?: string;
  className?: string;
}

const ACTION_CLASS =
  'flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';

/**
 * Project card (home, /projects, related projects): screenshot carousel or placeholder, demo/repo
 * actions, up to three tech chips (+N), clamped title and description. The title link is stretched
 * over the card; carousel controls and actions sit above it.
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  headingLevel: Heading = 'h3',
  sizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  className,
}) => {
  const tech = project.tech_stack ?? [];
  const images = project.images ?? [];
  const demo = ensureFullUrl(project.demo_url);
  const repo = ensureFullUrl(project.repo_url);
  const title = project.title ?? 'project';

  return (
    <Reveal
      index={index}
      className={cn(
        'group relative flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-white/10 overflow-hidden hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-[transform,box-shadow,border-color] motion-safe:hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500',
        className,
      )}
    >
      <div className="aspect-video w-full shrink-0 bg-slate-100 dark:bg-slate-800 relative">
        {images.length > 0 ? (
          <ImageCarousel
            images={images}
            alt={project.title ? `Screenshot of ${project.title}` : 'Project screenshot'}
            sizes={sizes}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/15 via-slate-100 to-sky-500/15 text-indigo-400 dark:via-slate-900"
          >
            <FolderGit2 className="h-10 w-10" />
          </div>
        )}

        {(demo || repo) && (
          // Above the stretched title link; visible on hover, keyboard focus and touch.
          <div className="absolute right-2 top-2 z-20 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
            {demo && (
              <a
                href={demo}
                target="_blank"
                rel="noreferrer"
                aria-label={`Live demo of ${title}`}
                title="Live demo"
                className={cn(ACTION_CLASS, 'bg-white text-slate-900 hover:bg-indigo-400')}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {repo && (
              <a
                href={repo}
                target="_blank"
                rel="noreferrer"
                aria-label={`Source code of ${title}`}
                title="Source code"
                className={cn(
                  ACTION_CLASS,
                  'bg-slate-900 border border-white/20 text-white hover:bg-indigo-600',
                )}
              >
                <Github className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {tech.length > 0 && (
          <ul className="flex flex-wrap gap-2 mb-4" aria-label="Tech stack">
            {tech.slice(0, MAX_TECH).map((t) => (
              <li
                key={t}
                className="px-2 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20"
              >
                {t}
              </li>
            ))}
            {tech.length > MAX_TECH && (
              <li className="px-2 py-1 text-xs rounded-md bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10">
                +{tech.length - MAX_TECH}
              </li>
            )}
          </ul>
        )}
        <Heading className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 break-words group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {project.slug ? (
            <Link
              to={`/projects/${project.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {project.title}
            </Link>
          ) : (
            project.title
          )}
        </Heading>
        {project.short_description && (
          <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3">
            {project.short_description}
          </p>
        )}
      </div>
    </Reveal>
  );
};

/** Placeholder with the card's final box (image ratio, tag row, title, 2 lines), so the grid doesn't shift (T-26). */
export function ProjectCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-white/10 overflow-hidden"
    >
      <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 motion-safe:animate-pulse" />
      <div className="p-6">
        <div className="flex gap-2 mb-4">
          <span className="h-[26px] w-14 rounded-md bg-slate-100 dark:bg-slate-800" />
          <span className="h-[26px] w-16 rounded-md bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-7 w-2/3 mb-2 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
      </div>
    </div>
  );
}
