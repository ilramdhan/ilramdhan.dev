import React, { useState, useRef, useEffect, useCallback, useId, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/Link';
import { Markdown } from '@/components/ui/Markdown';
import NotFoundPage from '@/pages/not-found';
import { addComment as addCommentAPI } from '@/features/blog/api';
import { blogKeys, blogQueries } from '@/features/blog/queries';
import { isNotFoundError } from '@/lib/errors';
import { Seo } from '@/components/seo/Seo';
import { MediaFrame } from '@/components/tile/MediaFrame';
import { Tile } from '@/components/tile/Tile';
import { Chevron } from '@/components/tile/LinkChevron';
import { pillClass } from '@/components/tile/pill';
import { morphName } from '@/components/motion/Morph';
import { absoluteUrl } from '@/config/site';
import { articleHeadingComponents } from '@/features/blog/article-headings';
import { PostNavigation, RelatedPosts, TagLinks } from '@/features/blog/ArticleFooter';
import { ReadingProgress } from '@/features/blog/ReadingProgress';
import { readingTime } from '@/features/blog/reading';
import { ShareBar } from '@/features/blog/ShareBar';
import { TocDisclosure, TocSidebar } from '@/features/blog/TableOfContents';
import { extractHeadings } from '@/features/blog/toc';
import { formatDate } from '@/lib/date';
import { useLocale, useT } from '@/i18n';
import { NotTranslated } from '@/i18n/NotTranslated';
import { ArticleSkeleton } from '@/features/article/ArticleSkeleton';
import { ARTICLE_COLUMN, ARTICLE_GRID, TOC_MIN_HEADINGS } from '@/features/article/layout';

const COMMENT_COOLDOWN = 30;

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useT();
  const locale = useLocale();
  const queryClient = useQueryClient();

  const {
    data: blog,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(blogQueries.detail(slug ?? '', locale));

  const { data: comments, isLoading: isLoadingComments } = useQuery(blogQueries.comments(blog?.id));
  const { data: adjacent } = useQuery(blogQueries.adjacent(blog?.id, blog?.published_at, locale));
  const { data: related } = useQuery(blogQueries.related(blog?.id, blog?.tags ?? [], locale));

  const content = blog?.content ?? '';
  const headings = useMemo(() => extractHeadings(content), [content]);
  const components = useMemo(() => articleHeadingComponents(headings), [headings]);
  const minutes = useMemo(() => readingTime(content), [content]);
  const articleRef = useRef<HTMLElement>(null);
  const nameId = useId();
  const commentId = useId();

  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: addCommentAPI,
    onSuccess: () => {
      toast.success(t.post.added);
      void queryClient.invalidateQueries({ queryKey: blogKeys.comments(blog?.id) });
      setCommentName('');
      setCommentText('');
      startCooldown();
    },
    onError: (error) => {
      toast.error(t.post.addFailed(error.message));
    },
  });

  // Comment State + Rate Limiting
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentHoneypot, setCommentHoneypot] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(COMMENT_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  if (isLoading) return <ArticleSkeleton label={t.post.loading} />;

  if (isError && !blog && !isNotFoundError(error)) {
    return (
      <Tile labelledBy="post-error-h" size="screen">
        <h1 id="post-error-h" className="text-section text-tile-ink">
          {t.post.loadError}
        </h1>
        <p className="mt-3 text-body text-tile-muted">{t.post.loadErrorHint}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <button type="button" onClick={() => void refetch()} className={pillClass()}>
            {t.common.tryAgain}
          </button>
          <Link
            to="/blog"
            className="inline-flex min-h-11 items-center text-body text-tile-action underline-offset-4 hover:underline"
          >
            {t.post.backToBlog}
          </Link>
        </div>
      </Tile>
    );
  }

  if (!blog) return <NotFoundPage />;

  const cover = blog.images?.[0];
  const gallery = blog.images?.slice(1) ?? [];
  const showToc = headings.length >= TOC_MIN_HEADINGS;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Honeypot
    if (commentHoneypot) return;
    if (cooldown > 0) {
      toast.error(t.post.waitToast(cooldown));
      return;
    }
    if (!commentName.trim() || !commentText.trim() || !blog.id) return;

    addComment({ postId: blog.id, name: commentName, text: commentText });
  };

  const input =
    'min-h-11 w-full rounded-lg bg-white px-4 text-body text-ink outline-none placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-action';

  return (
    <article ref={articleRef}>
      <Seo
        title={blog.title}
        description={blog.excerpt || undefined}
        image={blog.images?.[0] || undefined}
        type="article"
      />
      <ReadingProgress target={articleRef} />

      <Tile
        labelledBy="article-title"
        enter
        className="pb-0 pt-6 sm:pb-0 sm:pt-6"
        innerClassName="items-start text-left"
      >
        <header className="w-full">
          <nav aria-label={t.article.breadcrumb}>
            <ol className="flex min-w-0 flex-wrap items-center gap-x-1 text-fine text-tile-muted">
              <li className="flex items-center gap-1">
                <Link
                  to="/"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center px-1 underline-offset-4 hover:text-tile-ink hover:underline"
                >
                  {t.article.home}
                </Link>
                <Chevron className="h-2.5 w-[5px]" />
              </li>
              <li className="flex items-center gap-1">
                <Link
                  to="/blog"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center px-1 underline-offset-4 hover:text-tile-ink hover:underline"
                >
                  {t.nav.blog}
                </Link>
                <Chevron className="h-2.5 w-[5px]" />
              </li>
              <li className="min-w-0">
                <span aria-current="page" className="block truncate px-1 text-tile-ink">
                  {blog.title}
                </span>
              </li>
            </ol>
          </nav>
          <div className="animate-rise mx-auto mt-6 flex max-w-208 flex-col items-center gap-4 text-center">
            <NotTranslated item={blog} />
            <h1 id="article-title" className="text-tile wrap-break-word text-tile-ink">
              {blog.title}
            </h1>
            {blog.excerpt && <p className="text-lead text-pretty text-tile-ink">{blog.excerpt}</p>}
            <p className="text-caption text-tile-muted">
              {blog.published_at && (
                <>
                  <time dateTime={blog.published_at}>{formatDate(blog.published_at, locale)}</time>
                  {', '}
                </>
              )}
              <span>{t.common.minRead(minutes)}</span>
            </p>
          </div>
          {cover ? (
            <MediaFrame
              src={cover}
              alt={blog.title ? t.post.coverAlt(blog.title) : t.post.coverFallback}
              width={1600}
              height={900}
              aspect="wide"
              priority
              parallax={6}
              morph={blog.slug ? morphName('blog', blog.slug) : undefined}
              className="animate-rise-still mt-stack [animation-delay:150ms]"
            />
          ) : null}
        </header>
      </Tile>

      {/* overflow-visible: the TOC rail is position:sticky. */}
      <Tile
        labelledBy="article-title"
        className="overflow-visible pt-[clamp(2.5rem,5vw,4rem)]"
        innerClassName="items-start text-left"
      >
        <div className={showToc ? ARTICLE_GRID : 'mx-auto w-full max-w-170'}>
          {showToc && (
            <div className="lg:order-1">
              <TocDisclosure headings={headings} />
              <aside className="sticky top-[calc(var(--nav-h)+1.5rem)] hidden max-h-[calc(100vh-var(--nav-h)-3rem)] overflow-y-auto lg:block">
                <TocSidebar headings={headings} />
              </aside>
            </div>
          )}
          <div className={showToc ? ARTICLE_COLUMN : 'min-w-0'}>
            <div className="prose max-w-none">
              <Markdown components={components}>{content}</Markdown>
            </div>
            {gallery.length > 0 && (
              <ul className="mt-10 grid grid-cols-2 gap-4" aria-label={t.post.moreImages}>
                {gallery.map((src, i) => (
                  <li key={src}>
                    <MediaFrame
                      src={src}
                      alt={t.post.imageAlt(i + 2, blog.title)}
                      width={1600}
                      height={900}
                      aspect="video"
                      className="max-sm:aspect-video"
                    />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-10 flex flex-col gap-2 border-t border-rule pt-4">
              <TagLinks tags={blog.tags ?? []} />
              <ShareBar title={blog.title} url={absoluteUrl(`/blog/${blog.slug ?? slug}`)} />
            </div>
          </div>
        </div>
      </Tile>

      {(adjacent?.older?.slug || adjacent?.newer?.slug || related?.length) && (
        <Tile labelledBy="article-title" tone="parchment" innerClassName="items-stretch text-left">
          <div className="space-y-stack">
            <PostNavigation adjacent={adjacent} />
            <RelatedPosts posts={related} />
          </div>
        </Tile>
      )}

      <Tile labelledBy="comments-heading" innerClassName="items-stretch text-left">
        <h2 id="comments-heading" className="text-section text-tile-ink">
          {t.post.comments} ({comments?.length || 0})
        </h2>

        {/* lg: form | list side by side; stacked full width below. */}
        <div className="mt-stack grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <form
            onSubmit={handleCommentSubmit}
            className="relative space-y-4 rounded-lg bg-parchment p-6"
          >
            {/* Honeypot */}
            <div
              className="pointer-events-none absolute opacity-0"
              aria-hidden="true"
              tabIndex={-1}
            >
              <input
                type="text"
                value={commentHoneypot}
                onChange={(e) => setCommentHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor={nameId} className="mb-1 block text-caption font-semibold text-ink">
                {t.post.name}
              </label>
              <input
                id={nameId}
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className={input}
                placeholder={t.post.namePlaceholder}
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label htmlFor={commentId} className="mb-1 block text-caption font-semibold text-ink">
                {t.post.comment}
              </label>
              <textarea
                id={commentId}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className={`${input} py-3`}
                placeholder={t.post.commentPlaceholder}
                rows={4}
                maxLength={2000}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAddingComment || cooldown > 0}
              className={`${pillClass()} gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isAddingComment ? (
                t.post.posting
              ) : cooldown > 0 ? (
                t.post.wait(cooldown)
              ) : (
                <>
                  <Send className="size-4" aria-hidden="true" /> {t.post.post}
                </>
              )}
            </button>
          </form>

          <div>
            {isLoadingComments ? (
              <p className="text-body text-tile-muted">{t.post.loadingComments}</p>
            ) : (
              <ul>
                {comments?.map((comment) => (
                  <li
                    key={comment.id}
                    className="border-t border-rule py-5 first:border-t-0 first:pt-0"
                  >
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-body font-semibold text-tile-ink">{comment.name}</h3>
                      <time dateTime={comment.created_at} className="text-caption text-tile-muted">
                        {formatDate(comment.created_at, locale)}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap wrap-break-word text-body text-tile-ink">
                      {comment.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {comments?.length === 0 && (
              <p className="text-body text-tile-muted">{t.post.noComments}</p>
            )}
          </div>
        </div>
      </Tile>
    </article>
  );
}
