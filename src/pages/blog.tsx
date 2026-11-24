import React from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, X } from 'lucide-react';
import { FlipGroup } from '@/components/motion/FlipGroup';
import { Pagination } from '@/components/ui/Pagination';
import { SegmentedControl } from '@/components/tile/SegmentedControl';
import { BlogCardSkeleton, BlogFeatureSkeleton } from '@/features/blog/BlogSkeleton';
import BlogRows, { BlogFeatureSlot } from '@/features/blog/BlogList';
import { blogQueries } from '@/features/blog/queries';
import { useListParams } from '@/lib/useListParams';
import { Seo } from '@/components/seo/Seo';
import { useLocale, useT } from '@/i18n';

const ITEMS_PER_PAGE = 9;

type Sort = 'newest' | 'oldest';

const field =
  'min-h-11 rounded-full bg-parchment px-5 text-body text-ink outline-hidden placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-action';
const textLink =
  'inline-flex min-h-11 items-center text-caption text-tile-action underline-offset-4 hover:text-tile-action-hover hover:underline focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-tile-action';

export default function BlogPage() {
  const {
    input: searchInput,
    setInput: setSearchInput,
    query: searchQuery,
    filter: selectedTag,
    page: currentPage,
    setFilter,
    setPage,
  } = useListParams('tag');
  const t = useT();
  const locale = useLocale();
  const [params, setParams] = useSearchParams();
  const sort: Sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const listTop = React.useRef<HTMLDivElement>(null);

  const { data: allBlogTags } = useQuery(blogQueries.tags());

  const {
    data: blogData,
    isLoading: isLoadingBlogs,
    isError: isErrorBlogs,
  } = useQuery(
    blogQueries.list(
      {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        query: searchQuery,
        tag: selectedTag,
        sort,
      },
      locale,
    ),
  );

  const currentBlogs = blogData?.data ?? [];
  const totalBlogs = blogData?.count ?? 0;
  const totalPages = Math.ceil(totalBlogs / ITEMS_PER_PAGE);
  const filtersActive = Boolean(searchQuery || selectedTag || sort !== 'newest');
  const showFeature = currentPage === 1 && !searchQuery && !selectedTag;
  const [feature, ...rest] = currentBlogs;
  const rows = showFeature ? rest : currentBlogs;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    listTop.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const setSort = (value: Sort) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'oldest') next.set('sort', 'oldest');
        else next.delete('sort');
        next.delete('page');
        return next;
      },
      { replace: false },
    );

  const clearFilters = () => {
    setSearchInput('');
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const key of ['q', 'tag', 'sort', 'page']) next.delete(key);
        return next;
      },
      { replace: false },
    );
  };

  const tagOptions = [
    { value: '', label: t.blog.all },
    ...(allBlogTags ?? []).map((tag) => ({ value: tag, label: tag })),
  ];

  return (
    <>
      <Seo title={t.seo.blog} description={t.seo.blogDescription} />
      {/* ponytail: the Tile/TileHeading markup written out (same classes). Importing the partials would pull SoftLight,
          the split-text hooks and the motion registry into /blog's first paint (+3 KiB gzip over the route budget).
          Swap back to <Tile>/<TileHeading> when the partials stop importing motion eagerly. */}
      <section
        aria-labelledby="blog-h"
        data-tone="white"
        data-enter=""
        className="w-full scroll-mt-(--nav-h) bg-white pb-0 pt-section text-ink sm:pb-0"
      >
        <div className="wrap flex flex-col items-center text-center">
          <div className="animate-rise flex flex-col items-center text-center">
            <h1 id="blog-h" className="text-hero max-w-[14ch] text-tile-ink">
              {t.blog.heading}
            </h1>
            <p className="mt-5 max-w-[34ch] text-lead text-tile-ink">{t.blog.lead}</p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="blog-h"
        data-tone="white"
        className="w-full scroll-mt-(--nav-h) bg-white pb-section pt-[clamp(2.5rem,5vw,4rem)] text-ink"
      >
        <div className="wrap flex flex-col items-center text-center">
          <div
            ref={listTop}
            className="mb-10 flex w-full scroll-mt-(--nav-h) flex-col items-center gap-6"
          >
            {tagOptions.length > 1 ? (
              <div className="max-w-full overflow-x-auto">
                <SegmentedControl
                  options={tagOptions}
                  value={selectedTag ?? ''}
                  onChange={(v) => setFilter(v || null)}
                  label={t.blog.tagFilter}
                />
              </div>
            ) : null}
            <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="blog-search" className="sr-only">
                  {t.blog.searchLabel}
                </label>
                <input
                  id="blog-search"
                  type="text"
                  placeholder={t.blog.searchPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`${field} w-full pr-12`}
                />
                {searchInput && (
                  <button
                    type="button"
                    aria-label={t.list.clearSearch}
                    onClick={() => setSearchInput('')}
                    className="absolute right-1 top-0 grid size-11 place-items-center rounded-full text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-action"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="relative">
                <label htmlFor="blog-sort" className="sr-only">
                  {t.blog.sortLabel}
                </label>
                <select
                  id="blog-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value === 'oldest' ? 'oldest' : 'newest')}
                  className={`${field} w-full appearance-none pr-11 sm:w-auto`}
                >
                  <option value="newest">{t.list.sortNewest}</option>
                  <option value="oldest">{t.list.sortOldest}</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 text-caption text-tile-muted">
              <p aria-live="polite">
                {!isLoadingBlogs && (
                  <>
                    {t.blog.count(totalBlogs)}
                    {searchQuery && t.list.forQuery(searchQuery)}
                    {selectedTag && t.list.tagged(`#${selectedTag}`)}
                  </>
                )}
              </p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className={textLink}>
                  {t.list.clearFilters}
                </button>
              )}
            </div>
          </div>

          {isLoadingBlogs && (
            <>
              <span role="status" className="sr-only">
                {t.blog.loading}
              </span>
              {showFeature && (
                <div className="mb-stack-lg w-full">
                  <BlogFeatureSkeleton />
                </div>
              )}
              <div className="grid w-full gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: showFeature ? ITEMS_PER_PAGE - 1 : ITEMS_PER_PAGE }).map(
                  (_, i) => (
                    <BlogCardSkeleton key={i} />
                  ),
                )}
              </div>
            </>
          )}
          {isErrorBlogs && !blogData && <p className="py-10 text-danger">{t.blog.error}</p>}
          {showFeature && feature && <BlogFeatureSlot post={feature} />}
          {rows.length > 0 && (
            <FlipGroup
              flipKey={`${selectedTag}|${searchQuery}|${sort}|${currentPage}`}
              className="stagger-row grid w-full gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
            >
              <BlogRows rows={rows} />
            </FlipGroup>
          )}
          {currentBlogs.length === 0 && !isLoadingBlogs && !isErrorBlogs && (
            <div className="space-y-2 py-10 text-center text-tile-muted">
              <p>{filtersActive ? t.blog.noMatch : t.blog.none}</p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className={textLink}>
                  {t.list.clearFilters}
                </button>
              )}
            </div>
          )}

          <div className="mt-14 w-full">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </section>
    </>
  );
}
