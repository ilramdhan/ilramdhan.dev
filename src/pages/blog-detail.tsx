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
import { pillClass } from '@/components/tile/pill';
import { morphName } from '@/components/motion/Morph';
import { absoluteUrl } from '@/config/site';
import { articleHeadingComponents } from '@/features/article/article-headings';
import { blogPostingJsonLd } from '@/components/seo/json-ld';
import { BlogCard } from '@/features/blog/BlogCard';
import { ReadingProgress } from '@/features/article/ReadingProgress';
import { readingTime } from '@/features/article/reading';
import { extractHeadings } from '@/features/article/toc';
import { formatDate } from '@/lib/date';
import { useLocale, useLocalePath, useT } from '@/i18n';
import { ArticleSkeleton } from '@/features/article/ArticleSkeleton';
import { ArticleBody } from '@/features/article/ArticleBody';
import { DetailHeader } from '@/features/article/DetailHeader';
import { MoreSection } from '@/features/article/MoreSection';

const COMMENT_COOLDOWN = 30;

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useT();
  const locale = useLocale();
  const lp = useLocalePath();
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
    'min-h-11 w-full rounded-lg bg-white px-4 text-body text-ink outline-hidden placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-action';

  return (
    <article ref={articleRef}>
      <Seo
        title={blog.title}
        description={blog.excerpt || undefined}
        image={blog.images?.[0] || undefined}
        type="article"
        // Prerender only: crawlers read the static HTML, so the builders stay out of the client bundle.
        jsonLd={
          import.meta.env.SSR
            ? blogPostingJsonLd({
                locale,
                path: lp(`/blog/${slug}`),
                title: blog.title,
                description: blog.excerpt,
                images: blog.images,
                tags: blog.tags,
                published: blog.published_at,
                crumbs: [
                  { name: t.article.home, path: lp('/') },
                  { name: t.nav.blog, path: lp('/blog') },
                  { name: blog.title, path: lp(`/blog/${slug}`) },
                ],
              })
            : undefined
        }
      />
      <ReadingProgress target={articleRef} />

      <DetailHeader
        listPath="/blog"
        listLabel={t.nav.blog}
        item={blog}
        title={blog.title}
        subtitle={blog.excerpt}
        date={blog.published_at}
        minutes={minutes}
        tags={blog.tags ?? []}
      >
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
      </DetailHeader>

      <ArticleBody
        headings={headings}
        title={blog.title}
        url={absoluteUrl(`/blog/${blog.slug ?? slug}`)}
      >
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
      </ArticleBody>

      <MoreSection
        adjacent={adjacent}
        related={related}
        basePath="/blog"
        labels={{
          more: t.post.more,
          pager: t.post.more,
          older: t.post.older,
          newer: t.post.newer,
          related: t.post.related,
        }}
        renderCard={(post) => <BlogCard post={post} headingLevel="h3" />}
      />

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
