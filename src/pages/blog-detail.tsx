import React, { useState, useRef, useEffect, useCallback, useId, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Markdown } from '@/components/ui/Markdown';
import NotFoundPage from '@/pages/not-found';
import { Navbar } from '@/app/layouts/Navbar';
import { addComment as addCommentAPI } from '@/features/blog/api';
import { blogKeys, blogQueries } from '@/features/blog/queries';
import { isNotFoundError } from '@/lib/errors';
import { Seo } from '@/components/seo/Seo';
import { Img } from '@/components/ui/Img';
import { absoluteUrl } from '@/config/site';
import { articleHeadingComponents } from '@/features/blog/article-headings';
import { PostNavigation, RelatedPosts, TagLinks } from '@/features/blog/ArticleFooter';
import { ReadingProgress } from '@/features/blog/ReadingProgress';
import { readingTime } from '@/features/blog/reading';
import { ShareBar } from '@/features/blog/ShareBar';
import { TocDisclosure, TocSidebar } from '@/features/blog/TableOfContents';
import { extractHeadings } from '@/features/blog/toc';
import { formatDate } from '@/lib/date';

const COMMENT_COOLDOWN = 30;
/** The TOC is shown from this many headings on. */
const TOC_MIN_HEADINGS = 3;
/** Balanced title lines; inline because the shared CSS bundle is at its budget. */
const BALANCE = { textWrap: 'balance' } as const;
const CONTAINER = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8';

/** Placeholder with the article's header / cover / body boxes while the post loads. */
function ArticleSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />
      <main className={`${CONTAINER} pt-24 pb-20`} aria-busy="true">
        <span className="sr-only" role="status">
          Loading article...
        </span>
        <div aria-hidden="true" className="max-w-3xl space-y-4 motion-safe:animate-pulse">
          <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-12 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-4 w-40 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div
          aria-hidden="true"
          className="mt-8 aspect-video rounded-2xl bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse"
        />
        <div aria-hidden="true" className="mt-10 max-w-3xl space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
          ))}
          <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
      </main>
    </div>
  );
}

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const {
    data: blog,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(blogQueries.detail(slug ?? ''));

  const { data: comments, isLoading: isLoadingComments } = useQuery(blogQueries.comments(blog?.id));
  const { data: adjacent } = useQuery(blogQueries.adjacent(blog?.id, blog?.published_at));
  const { data: related } = useQuery(blogQueries.related(blog?.id, blog?.tags ?? []));

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
      toast.success('Comment added!');
      void queryClient.invalidateQueries({ queryKey: blogKeys.comments(blog?.id) });
      setCommentName('');
      setCommentText('');
      startCooldown();
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
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

  if (isLoading) return <ArticleSkeleton />;

  if (isError && !blog && !isNotFoundError(error)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Couldn&apos;t load this article</h1>
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
          <Link to="/blog" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to Blog
          </Link>
        </div>
      </div>
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
      toast.error(`Please wait ${cooldown}s before posting again.`);
      return;
    }
    if (!commentName.trim() || !commentText.trim() || !blog.id) return;

    addComment({ postId: blog.id, name: commentName, text: commentText });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <Seo
        title={blog.title}
        description={blog.excerpt || undefined}
        image={blog.images?.[0] || undefined}
        type="article"
      />
      <Navbar />
      <ReadingProgress target={articleRef} />

      <main className={`${CONTAINER} pt-24 pb-20`}>
        <article ref={articleRef}>
          <header className="max-w-3xl">
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
                  <Link to="/blog" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                    Blog
                  </Link>
                </li>
                <li className="flex min-w-0 items-center gap-1">
                  <span aria-hidden="true">/</span>
                  <span aria-current="page" className="truncate">
                    {blog.title}
                  </span>
                </li>
              </ol>
            </nav>
            <TagLinks tags={blog.tags ?? []} className="mb-4" />
            <h1
              className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white break-words md:text-5xl"
              style={BALANCE}
            >
              {blog.title}
            </h1>
            {blog.excerpt && (
              <p className="mb-6 text-xl text-slate-600 dark:text-slate-300">{blog.excerpt}</p>
            )}
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
              {blog.published_at && (
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <time dateTime={blog.published_at}>{formatDate(blog.published_at)}</time>
                </span>
              )}
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {minutes} min read
              </span>
            </p>
          </header>

          {cover && (
            <figure className="mt-8 aspect-video overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
              <Img
                src={cover}
                alt={blog.title ? `Cover image for “${blog.title}”` : 'Blog post cover'}
                width={1600}
                height={900}
                priority
                sizes="(min-width: 1024px) 960px, 100vw"
                className="h-full w-full object-cover"
              />
            </figure>
          )}

          <div className="mt-10 gap-12 lg:flex">
            <div className="min-w-0 max-w-3xl flex-1">
              {showToc && <TocDisclosure headings={headings} />}
              <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                <Markdown components={components}>{content}</Markdown>
              </div>
              {gallery.length > 0 && (
                <ul className="mt-10 grid grid-cols-2 gap-4" aria-label="More images">
                  {gallery.map((src, i) => (
                    <li
                      key={src}
                      className="aspect-video overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900"
                    >
                      <Img
                        src={src}
                        alt={`Image ${i + 2} for “${blog.title}”`}
                        width={1600}
                        height={900}
                        sizes="(min-width: 768px) 384px, 50vw"
                        className="h-full w-full object-cover"
                      />
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-10 space-y-6 border-t border-slate-200 py-6 dark:border-white/10">
                <TagLinks tags={blog.tags ?? []} />
                <ShareBar title={blog.title} url={absoluteUrl(`/blog/${blog.slug ?? slug}`)} />
              </div>
            </div>
            {showToc && (
              <aside className="hidden w-64 shrink-0 lg:flex">
                <TocSidebar headings={headings} />
              </aside>
            )}
          </div>
        </article>

        <div className="my-16 space-y-8">
          <PostNavigation adjacent={adjacent} />
          <RelatedPosts posts={related} />
        </div>

        <section aria-labelledby="comments-heading" className="max-w-3xl">
          <h2
            id="comments-heading"
            className="mb-6 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white"
          >
            <MessageSquare className="h-6 w-6" aria-hidden="true" /> Comments (
            {comments?.length || 0})
          </h2>

          <form
            onSubmit={handleCommentSubmit}
            className="relative mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
          >
            {/* Honeypot */}
            <div
              className="absolute opacity-0 pointer-events-none"
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
              <label htmlFor={nameId} className="mb-1 block text-sm font-medium">
                Name
              </label>
              <input
                id={nameId}
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className="input focus:ring-2"
                placeholder="Your Name"
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label htmlFor={commentId} className="mb-1 block text-sm font-medium">
                Comment
              </label>
              <textarea
                id={commentId}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="input focus:ring-2"
                placeholder="Share your thoughts..."
                rows={4}
                maxLength={2000}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAddingComment || cooldown > 0}
              className="btn-primary px-6"
            >
              {isAddingComment ? (
                'Posting...'
              ) : cooldown > 0 ? (
                `Wait ${cooldown}s`
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" /> Post Comment
                </>
              )}
            </button>
          </form>

          <div className="space-y-4">
            {isLoadingComments ? (
              <p className="text-slate-600 dark:text-slate-400">Loading comments...</p>
            ) : (
              <ul className="space-y-4">
                {comments?.map((comment) => (
                  <li
                    key={comment.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50"
                  >
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {comment.name}
                      </h3>
                      <time
                        dateTime={comment.created_at}
                        className="text-xs text-slate-600 dark:text-slate-400"
                      >
                        {formatDate(comment.created_at)}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">
                      {comment.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {comments?.length === 0 && (
              <p className="text-slate-600 dark:text-slate-400">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
