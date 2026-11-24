import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { Link } from '@/i18n/Link';
import { morphName } from '@/components/motion/Morph';
import { ActionLink } from '@/components/tile/ActionLink';
import { LinkChevron } from '@/components/tile/LinkChevron';
import { pillClass } from '@/components/tile/pill';
import { PillButton } from '@/components/tile/PillButton';
import { SpecRow, type SpecItem } from '@/components/tile/SpecRow';
import { colVar } from '@/components/tile/stagger';
import { Tile } from '@/components/tile/Tile';
import { TileHeading } from '@/components/tile/TileHeading';
import { Markdown } from '@/components/ui/Markdown';
import NotFoundPage from '@/pages/not-found';
import { projectQueries } from '@/features/projects/queries';
import { isNotFoundError } from '@/lib/errors';
import { Seo } from '@/components/seo/Seo';
import { absoluteUrl } from '@/config/site';
import { ImageCarousel } from '@/features/projects/ImageCarousel';
import { ProjectDetailSkeleton } from '@/features/projects/ProjectDetailSkeleton';
import { ProjectGallery } from '@/features/projects/ProjectGallery';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { articleHeadingComponents } from '@/features/article/article-headings';
import { PostNavigation } from '@/features/article/ArticleFooter';
import { TOC_MIN_HEADINGS } from '@/features/article/layout';
import { ReadingProgress } from '@/features/article/ReadingProgress';
import { readingTime } from '@/features/article/reading';
import { ShareBar } from '@/features/article/ShareBar';
import { TOC_ASIDE_CLASS, TocDisclosure, TocSidebar } from '@/features/article/TableOfContents';
import { extractHeadings } from '@/features/article/toc';
import { ensureFullUrl } from '@/lib/utils';
import { useLocale, useLocalePath, useT } from '@/i18n';
import { NotTranslated } from '@/i18n/NotTranslated';
import type { ProjectCard as ProjectCardData } from '@/features/projects/api';

const LINK = 'hover:text-tile-ink hover:underline underline-offset-4';

/** "Related projects": up to three linked groups sharing a tag, topped up with the latest. */
function RelatedProjects({ projects }: { projects: ProjectCardData[] | undefined }) {
  const t = useT();
  if (!projects?.length) return null;
  return (
    <Tile labelledBy="related-projects-heading" tone="parchment">
      <TileHeading id="related-projects-heading" size="section" title={t.project.related} />
      <div className="mt-stack w-full" role="region" aria-labelledby="related-projects-heading">
        <ul className="stagger-row grid gap-x-4 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3">
          {projects.map((p, i) => (
            <li key={p.id} style={colVar(i, 3)} className="min-w-0">
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      </div>
    </Tile>
  );
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useT();
  const locale = useLocale();
  const lp = useLocalePath();

  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(projectQueries.detail(slug ?? '', locale));
  const { data: adjacent } = useQuery(
    projectQueries.adjacent(project?.id, project?.created_at, locale),
  );
  const { data: related } = useQuery(
    projectQueries.related(project?.id, project?.tags ?? [], locale),
  );

  const content = project?.content || t.project.noContent;
  const headings = useMemo(() => extractHeadings(content), [content]);
  const components = useMemo(() => articleHeadingComponents(headings), [headings]);
  const minutes = useMemo(() => readingTime(project?.content), [project?.content]);
  const articleRef = useRef<HTMLElement>(null);

  if (isLoading) return <ProjectDetailSkeleton />;

  if (isError && !project && !isNotFoundError(error)) {
    return (
      <Tile labelledBy="project-error-h" size="screen">
        <TileHeading
          id="project-error-h"
          as="h1"
          size="tile"
          title={t.project.loadError}
          lead={t.post.loadErrorHint}
          links={
            <>
              <button type="button" onClick={() => void refetch()} className={pillClass('md')}>
                {t.common.tryAgain}
              </button>
              <LinkChevron href={lp('/projects')}>{t.project.backToProjects}</LinkChevron>
            </>
          }
        />
      </Tile>
    );
  }

  if (!project) return <NotFoundPage />;

  const images = project.images ?? [];
  const alt = project.title ? t.projects.screenshotOf(project.title) : t.projects.screenshot;
  const tags = project.tags ?? [];
  const showToc = headings.length >= TOC_MIN_HEADINGS;
  const demo = ensureFullUrl(project.demo_url);
  const repo = ensureFullUrl(project.repo_url);
  const year = project.created_at ? new Date(project.created_at).getUTCFullYear() : null;
  // Only real fields: no role column exists, and an empty stack hides.
  const specs: SpecItem[] = [
    { value: year, label: t.project.specYear, node: <>{year}</> },
    {
      value: project.tech_stack?.length ? project.tech_stack.slice(0, 4).join(', ') : null,
      label: t.project.specStack,
    },
    { value: t.common.minRead(minutes), label: t.project.specRead },
  ];
  const hasLinks = Boolean(demo || repo);

  return (
    <div>
      <Seo
        title={project.title}
        description={project.short_description || undefined}
        image={project.images?.[0] || undefined}
        type="article"
      />
      {showToc && <ReadingProgress target={articleRef} />}

      <article ref={articleRef}>
        <Tile labelledBy="project-h" enter className="pb-0!">
          <nav aria-label={t.article.breadcrumb} className="mb-6 text-caption text-tile-muted">
            <ol className="flex min-w-0 flex-wrap items-center justify-center gap-x-1">
              <li>
                <Link to="/" className={LINK}>
                  {t.article.home}
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <span aria-hidden="true">/</span>
                <Link to="/projects" className={LINK}>
                  {t.nav.projects}
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
          <NotTranslated item={project} />
          <TileHeading
            id="project-h"
            as="h1"
            size="tile"
            title={project.title}
            lead={project.short_description || undefined}
            className="animate-rise-still"
            links={
              hasLinks ? (
                <>
                  {demo && (
                    <ActionLink
                      variant="primary"
                      link={{ kind: 'external', href: demo, label: t.project.liveDemo }}
                    />
                  )}
                  {repo && (
                    <ActionLink
                      link={{ kind: 'external', href: repo, label: t.project.viewSource }}
                    />
                  )}
                </>
              ) : undefined
            }
          />
          <div className="mt-stack w-full">
            <ImageCarousel
              images={images}
              alt={alt}
              priority
              sizes="(min-width: 1180px) 1180px, 100vw"
              morph={project.slug ? morphName('project', project.slug) : undefined}
            />
            <ProjectGallery images={images} alt={alt} />
          </div>
        </Tile>

        <Tile labelledBy="project-specs-h" className="pt-stack!">
          <h2 id="project-specs-h" className="sr-only">
            {t.project.about}
          </h2>
          <SpecRow items={specs} countUp={false} wrap />
        </Tile>

        <section aria-labelledby="project-about-h" className="bg-white pb-section">
          <div
            className={
              showToc
                ? 'wrap lg:grid lg:grid-cols-[minmax(0,680px)_16rem] lg:justify-center lg:gap-16'
                : 'wrap'
            }
          >
            <div className="mx-auto w-full min-w-0 max-w-[680px]">
              {showToc && <TocDisclosure headings={headings} />}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 id="project-about-h">{t.project.about}</h2>
                <Markdown components={components}>{content}</Markdown>
              </div>
              {tags.length > 0 && (
                <ul aria-label={t.common.tags} className="mt-10 flex flex-wrap gap-x-5">
                  {tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        to={`/projects?tag=${encodeURIComponent(tag)}`}
                        className="inline-flex min-h-11 items-center text-body text-tile-action underline-offset-4 hover:text-tile-action-hover hover:underline"
                      >
                        #{tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <ShareBar
                  title={project.title}
                  url={absoluteUrl(`/projects/${project.slug ?? slug}`)}
                />
              </div>
            </div>
            {showToc && (
              <aside className={TOC_ASIDE_CLASS}>
                <TocSidebar headings={headings} />
              </aside>
            )}
          </div>
        </section>
      </article>

      <div className="wrap pb-section">
        <PostNavigation
          adjacent={adjacent}
          basePath="/projects"
          label={t.project.more}
          olderText={t.project.older}
          newerText={t.project.newer}
        />
      </div>

      <RelatedProjects projects={related} />

      <Tile labelledBy="project-cta-h" tone="dark" size="roomy">
        <TileHeading
          id="project-cta-h"
          title={t.project.ctaTitle}
          lead={t.project.ctaLead}
          links={
            <>
              <PillButton href={lp('/#contact')} onDark>
                {t.project.ctaContact}
              </PillButton>
              <LinkChevron href={lp('/projects')}>{t.project.ctaAll}</LinkChevron>
            </>
          }
        />
      </Tile>
    </div>
  );
}
