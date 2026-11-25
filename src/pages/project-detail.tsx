import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { morphName } from '@/components/motion/Morph';
import { ActionLink } from '@/components/tile/ActionLink';
import { LinkChevron } from '@/components/tile/LinkChevron';
import { pillClass } from '@/components/tile/pill';
import { PillButton } from '@/components/tile/PillButton';
import { Tile } from '@/components/tile/Tile';
import { TileHeading } from '@/components/tile/TileHeading';
import { Markdown } from '@/components/ui/Markdown';
import NotFoundPage from '@/pages/not-found';
import { projectQueries } from '@/features/projects/queries';
import { isNotFoundError } from '@/lib/errors';
import { Seo } from '@/components/seo/Seo';
import { absoluteUrl } from '@/config/site';
import { ProjectGallery } from '@/features/projects/ProjectGallery';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { articleHeadingComponents } from '@/features/article/article-headings';
import { ReadingProgress } from '@/features/article/ReadingProgress';
import { ArticleBody } from '@/features/article/ArticleBody';
import { ArticleSkeleton } from '@/features/article/ArticleSkeleton';
import { DetailHeader } from '@/features/article/DetailHeader';
import { MoreSection } from '@/features/article/MoreSection';
import { MediaFrame } from '@/components/tile/MediaFrame';
import { readingTime } from '@/features/article/reading';
import { extractHeadings } from '@/features/article/toc';
import { projectJsonLd } from '@/components/seo/json-ld';
import { ensureFullUrl } from '@/lib/utils';
import { useLocale, useLocalePath, useT } from '@/i18n';

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

  if (isLoading) return <ArticleSkeleton label={t.project.loading} />;

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
  const demo = ensureFullUrl(project.demo_url);
  const repo = ensureFullUrl(project.repo_url);
  return (
    <article ref={articleRef}>
      <Seo
        title={project.title}
        description={project.short_description || undefined}
        image={project.images?.[0] || undefined}
        type="article"
        // Prerender only: crawlers read the static HTML, so the builders stay out of the client bundle.
        jsonLd={
          import.meta.env.SSR
            ? projectJsonLd({
                locale,
                path: lp(`/projects/${slug}`),
                title: project.title,
                description: project.short_description,
                images: project.images,
                tags: project.tags,
                created: project.created_at,
                repo,
                crumbs: [
                  { name: t.article.home, path: lp('/') },
                  { name: t.nav.projects, path: lp('/projects') },
                  { name: project.title, path: lp(`/projects/${slug}`) },
                ],
              })
            : undefined
        }
      />
      <ReadingProgress target={articleRef} />

      <DetailHeader
        listPath="/projects"
        listLabel={t.nav.projects}
        item={project}
        title={project.title}
        subtitle={project.short_description}
        date={project.created_at}
        minutes={minutes}
        extra={project.tech_stack?.length ? project.tech_stack.slice(0, 4).join(', ') : undefined}
        tags={tags}
        actions={
          <>
            {demo && (
              <ActionLink
                variant="primary"
                link={{ kind: 'external', href: demo, label: t.project.liveDemo }}
              />
            )}
            {repo && (
              <ActionLink link={{ kind: 'external', href: repo, label: t.project.viewSource }} />
            )}
          </>
        }
      >
        {images[0] ? (
          <MediaFrame
            src={images[0]}
            alt={alt}
            width={1600}
            height={900}
            aspect="wide"
            priority
            parallax={6}
            morph={project.slug ? morphName('project', project.slug) : undefined}
            className="animate-rise-still mt-stack [animation-delay:150ms]"
          />
        ) : null}
      </DetailHeader>

      <ArticleBody
        headings={headings}
        title={project.title}
        url={absoluteUrl(`/projects/${project.slug ?? slug}`)}
      >
        <div className="prose max-w-none">
          <Markdown components={components}>{content}</Markdown>
        </div>
        <ProjectGallery images={images} alt={alt} />
      </ArticleBody>

      <MoreSection
        adjacent={adjacent}
        related={related}
        basePath="/projects"
        labels={{
          more: t.project.more,
          pager: t.project.more,
          older: t.project.older,
          newer: t.project.newer,
          related: t.project.related,
        }}
        renderCard={(p) => <ProjectCard project={p} />}
      />

      <Tile
        labelledBy="project-cta-h"
        tone="dark"
        size="roomy"
        backdrop={{ shape: 'waves', side: 'left' }}
      >
        <TileHeading
          id="project-cta-h"
          title={t.project.ctaTitle}
          lead={t.project.ctaLead}
          links={
            <>
              <PillButton href={lp('/contact')} onDark>
                {t.project.ctaContact}
              </PillButton>
              <LinkChevron href={lp('/projects')}>{t.project.ctaAll}</LinkChevron>
            </>
          }
        />
      </Tile>
    </article>
  );
}
