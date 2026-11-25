import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlipGroup } from '@/components/motion/FlipGroup';
import { Pagination } from '@/components/ui/Pagination';
import { ListingHero, ListingSection, ListingToolbar } from '@/components/listing/Listing';
import { BlogCardSkeleton, BlogFeatureSkeleton } from '@/features/blog/BlogSkeleton';
import BlogRows, { BlogFeatureSlot } from '@/features/blog/BlogList';
import { blogQueries } from '@/features/blog/queries';
import { useListParams } from '@/lib/useListParams';
import { Seo } from '@/components/seo/Seo';
import { useLocale, useT } from '@/i18n';

const ITEMS_PER_PAGE = 9;

const textLink =
  'inline-flex min-h-11 items-center text-caption text-tile-action underline-offset-4 hover:text-tile-action-hover hover:underline focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-tile-action';

export default function BlogPage() {
  const {
    input: searchInput,
    setInput: setSearchInput,
    query: searchQuery,
    filter: selectedTag,
    page: currentPage,
    sort,
    setSort,
    filtersActive,
    clearFilters,
    setFilter,
    setPage,
  } = useListParams('tag');
  const t = useT();
  const locale = useLocale();
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
  const showFeature = currentPage === 1 && !searchQuery && !selectedTag;
  const [feature, ...rest] = currentBlogs;
  const rows = showFeature ? rest : currentBlogs;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    listTop.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const sortOptions = [
    { value: 'newest', label: t.list.sortNewest },
    { value: 'oldest', label: t.list.sortOldest },
  ];
  const tagOptions = [
    { value: '', label: t.blog.all },
    ...(allBlogTags ?? []).map((tag) => ({ value: tag, label: tag })),
  ];

  return (
    <>
      <Seo title={t.seo.blog} description={t.seo.blogDescription} />
      <ListingHero id="blog-h" title={t.blog.heading} lead={t.blog.lead} />

      <ListingSection id="blog-list-h" title={t.nav.blog}>
        <div className="flex flex-col items-center text-center">
          <div ref={listTop} className="mb-10 w-full scroll-mt-(--nav-h) text-left">
            <ListingToolbar
              id="blog"
              search={{
                label: t.blog.searchLabel,
                placeholder: t.blog.searchPlaceholder,
                value: searchInput,
                onChange: setSearchInput,
                clearLabel: t.list.clearSearch,
              }}
              sort={{
                label: t.blog.sortLabel,
                value: sort,
                onChange: setSort,
                options: sortOptions,
              }}
              filter={
                tagOptions.length > 1
                  ? {
                      label: t.blog.tagFilter,
                      options: tagOptions,
                      value: selectedTag ?? '',
                      onChange: (v) => setFilter(v || null),
                    }
                  : null
              }
              resultLine={
                !isLoadingBlogs && (
                  <>
                    {t.blog.count(totalBlogs)}
                    {searchQuery && t.list.forQuery(searchQuery)}
                    {selectedTag && t.list.tagged(`#${selectedTag}`)}
                  </>
                )
              }
              clear={filtersActive ? { label: t.list.clearFilters, onClick: clearFilters } : null}
            />
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
      </ListingSection>
    </>
  );
}
