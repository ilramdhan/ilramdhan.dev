import { Link } from '@/i18n/Link';
import { MediaFrame } from '@/components/tile/MediaFrame';
import { LinkChevron } from '@/components/tile/LinkChevron';
import { morphName } from '@/components/motion/Morph';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/i18n';
import type { BlogCard as BlogCardData } from './api';

interface BlogCardProps {
  post: BlogCardData;
  /** Heading level for the title: h2 on list pages, h3 inside a titled section. */
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tile-action';
const hoverTitle = 'group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4';

/** "react, Jan 15, 2026": first tag, then the date (mutugading Meta line). */
function Meta({ post, className }: { post: BlogCardData; className?: string }) {
  const locale = useLocale();
  const tag = post.tags?.[0];
  return (
    <p className={cn('text-caption text-tile-muted', className)}>
      {tag ? `${tag}, ` : null}
      <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at, locale)}</time>
    </p>
  );
}

/**
 * Article as a linked group (mutugading Insights card): landscape cover, meta line, title, clamped excerpt. The whole
 * block is one link; a post without a cover gets a hairline rule instead of an empty frame.
 */
export function BlogCard({ post, headingLevel: Heading = 'h2', className }: BlogCardProps) {
  const cover = post.images?.[0];
  const body = (
    <>
      {cover ? (
        <MediaFrame
          src={cover}
          alt=""
          width={1600}
          height={900}
          aspect="landscape"
          interactive
          className="max-md:aspect-video"
          morph={post.slug ? morphName('blog', post.slug) : undefined}
        />
      ) : null}
      <Meta post={post} className={cover ? 'mt-5' : 'border-t border-rule pt-5'} />
      <Heading
        className={cn('mt-1 text-title text-balance text-tile-ink wrap-break-word', hoverTitle)}
      >
        {post.title}
      </Heading>
      {post.excerpt ? (
        <p className="mt-2 line-clamp-3 text-body text-tile-muted">{post.excerpt}</p>
      ) : null}
    </>
  );
  const base = cn('group flex h-full flex-col text-left', focus, className);
  return post.slug ? (
    <Link to={`/blog/${post.slug}`} className={base}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}

/**
 * The newest post as a large split tile content (mutugading featured slot, split): wide cover on one side, meta, large
 * title, lead and a chevron on the other. One link around the cover and the copy.
 */
export function BlogFeature({ post }: { post: BlogCardData }) {
  const t = useT();
  const cover = post.images?.[0];
  const inner = (
    <>
      {cover ? (
        <MediaFrame
          src={cover}
          alt=""
          width={1600}
          height={900}
          aspect="landscape"
          priority
          interactive
          className="max-lg:aspect-video"
          morph={post.slug ? morphName('blog', post.slug) : undefined}
        />
      ) : null}
      <div
        className={cn(
          'flex min-w-0 flex-col gap-2',
          !cover && 'border-t border-rule pt-6 lg:col-span-2',
        )}
      >
        <Meta post={post} />
        <h2
          className={cn(
            'text-section text-balance text-tile-ink wrap-break-word line-clamp-4',
            hoverTitle,
          )}
        >
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="text-lead text-pretty text-tile-ink line-clamp-4">{post.excerpt}</p>
        ) : null}
        {post.slug ? <LinkChevron className="mt-2 self-start">{t.blog.read}</LinkChevron> : null}
      </div>
    </>
  );
  const base = 'group grid w-full items-center gap-8 text-left lg:grid-cols-[7fr_5fr] lg:gap-12';
  return post.slug ? (
    <Link to={`/blog/${post.slug}`} className={cn(base, focus)}>
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  );
}

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
