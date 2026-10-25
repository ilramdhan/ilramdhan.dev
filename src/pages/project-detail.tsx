import React, { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Github, ExternalLink, Calendar, Clock } from 'lucide-react';
import { Markdown } from '@/components/ui/Markdown';
import NotFoundPage from '@/pages/not-found';
import { Navbar } from '@/app/layouts/Navbar';
import { projectQueries } from '@/features/projects/queries';
import { isNotFoundError } from '@/lib/errors';
import { Seo } from '@/components/seo/Seo';
import { absoluteUrl } from '@/config/site';
import { ImageCarousel } from '@/features/projects/ImageCarousel';
import { ProjectGallery } from '@/features/projects/ProjectGallery';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { articleHeadingComponents } from '@/features/article/article-headings';
import { PostNavigation, TagLinks } from '@/features/article/ArticleFooter';
import { ArticleSkeleton } from '@/features/article/ArticleSkeleton';
import {
  BALANCE,
  BODY_COLUMN,
  BODY_GRID,
  CONTAINER,
  TOC_MIN_HEADINGS,
} from '@/features/article/layout';
import { ReadingProgress } from '@/features/article/ReadingProgress';
import { readingTime } from '@/features/article/reading';
import { ShareBar } from '@/features/article/ShareBar';
import { TOC_ASIDE_CLASS, TocDisclosure, TocSidebar } from '@/features/article/TableOfContents';
import { extractHeadings } from '@/features/article/toc';
import { formatDate } from '@/lib/date';
import { ensureFullUrl } from '@/lib/utils';
import type { ProjectCard as ProjectCardData } from '@/features/projects/api';

const NO_CONTENT = 'No detailed content available for this project.';

/** "Related projects": up to three cards sharing a tag, topped up with the latest. */
function RelatedProjects({ projects }: { projects: ProjectCardData[] | undefined }) {
  if (!projects?.length) return null;
  return (
    <section aria-labelledby="related-projects-heading" className="mt-16">
      <h2
        id="related-projects-heading"
        className="mb-6 text-2xl font-bold text-slate-900 dark:text-white"
      >
        Related projects
      </h2>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <li key={p.id}>
            <ProjectCard project={p} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(projectQueries.detail(slug ?? ''));
  const { data: adjacent } = useQuery(projectQueries.adjacent(project?.id, project?.created_at));
  const { data: related } = useQuery(projectQueries.related(project?.id, project?.tags ?? []));

  const content = project?.content || NO_CONTENT;
  const headings = useMemo(() => extractHeadings(content), [content]);
  const components = useMemo(() => articleHeadingComponents(headings), [headings]);
  const minutes = useMemo(() => readingTime(project?.content), [project?.content]);
  const articleRef = useRef<HTMLElement>(null);

  if (isLoading) {
    return (
      <ArticleSkeleton
        label="Loading project..."
        header={
          <div className="mt-6 h-11 w-72 max-w-full rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        }
        media={<div className="mt-3 h-12 rounded-lg bg-slate-100 dark:bg-slate-800/60 sm:h-14" />}
      />
    );
  }

  if (isError && !project && !isNotFoundError(error)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Couldn&apos;t load this project</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Check your connection and try again.
        </p>
        <div className="flex items-center gap-6">
          <button
            onClick={() => void refetch()}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
          <Link to="/projects" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project) return <NotFoundPage />;

  const images = project.images ?? [];
  const alt = project.title ? `Screenshot of ${project.title}` : 'Project screenshot';
  const tags = project.tags ?? [];
  const techStack = project.tech_stack ?? [];
  const showToc = headings.length >= TOC_MIN_HEADINGS;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <Seo
        title={project.title}
        description={project.short_description || undefined}
        image={project.images?.[0] || undefined}
        type="article"
      />
      <Navbar />
      {showToc && <ReadingProgress target={articleRef} />}

      <main className={`${CONTAINER} pt-24 pb-20`}>
        <article ref={articleRef}>
          <header>
            <nav
              aria-label="Breadcrumb"
              className="mb-6 text-sm text-slate-600 dark:text-slate-400"
            >
              <ol className="flex min-w-0 items-center gap-1">
                <li className="shrink-0">
                  <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                    Home
                  </Link>
                </li>
                <li className="flex shrink-0 items-center gap-1">
                  <span aria-hidden="true">/</span>
                  <Link to="/projects" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                    Projects
                  </Link>
                </li>
                <li className="flex min-w-0 items-center gap-1">
                  <span aria-hidden="true">/</span>
                  <span aria-current="page" className="truncate">
                    {project.title}
                  </span>
                </li>
              </ol>
            </nav>
            <TagLinks tags={tags} basePath="/projects" className="mb-4" />
            <h1
              className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white break-words hyphens-auto md:text-5xl"
              style={BALANCE}
            >
              {project.title}
            </h1>
            {project.short_description && (
              <p className="mb-6 max-w-prose text-xl text-slate-600 dark:text-slate-300">
                {project.short_description}
              </p>
            )}
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <time dateTime={project.created_at}>{formatDate(project.created_at)}</time>
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {minutes} min read
              </span>
              {project.is_featured && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                  Featured
                </span>
              )}
            </p>
            {(techStack.length > 0 || project.demo_url || project.repo_url) && (
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
                {techStack.length > 0 && (
                  <ul aria-label="Tech stack" className="flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                      <li
                        key={tech}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                )}
                {(project.demo_url || project.repo_url) && (
                  <div className="flex flex-wrap gap-3">
                    {project.demo_url && (
                      <a
                        href={ensureFullUrl(project.demo_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" /> Live Demo
                      </a>
                    )}
                    {project.repo_url && (
                      <a
                        href={ensureFullUrl(project.repo_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-white/10 rounded-lg font-medium transition-colors"
                      >
                        <Github className="h-4 w-4" aria-hidden="true" /> View Source
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </header>

          <div className="mt-8 space-y-3">
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
              <ImageCarousel
                images={images}
                alt={alt}
                aspectRatio="aspect-video"
                priority
                sizes="(min-width: 1024px) 64rem, 100vw"
              />
            </div>
            <ProjectGallery images={images} alt={alt} />
          </div>

          <div className={showToc ? BODY_GRID : 'mt-10'}>
            <div className={BODY_COLUMN}>
              {showToc && <TocDisclosure headings={headings} />}
              <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                <h2>About this project</h2>
                <Markdown components={components}>{content}</Markdown>
              </div>
            </div>
            {showToc && (
              <aside className={TOC_ASIDE_CLASS}>
                <TocSidebar headings={headings} />
              </aside>
            )}
          </div>

          {/* Full frame width, below the body grid: same right edge as the header. */}
          <div className="mt-10 space-y-6 border-t border-slate-200 py-6 dark:border-white/10">
            <TagLinks tags={tags} basePath="/projects" />
            <ShareBar
              title={project.title}
              url={absoluteUrl(`/projects/${project.slug ?? slug}`)}
            />
          </div>
        </article>

        <div className="mt-16">
          <PostNavigation
            adjacent={adjacent}
            basePath="/projects"
            label="More projects"
            olderText="Older project"
            newerText="Newer project"
          />
        </div>

        <RelatedProjects projects={related} />
      </main>
    </div>
  );
}
