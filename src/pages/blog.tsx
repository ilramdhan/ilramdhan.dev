import React from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, X } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Navbar } from '@/app/layouts/Navbar';
import { CollapsibleTagFilter } from '@/components/ui/CollapsibleTagFilter';
import { BlogCard, BlogCardSkeleton } from '@/features/blog/BlogCard';
import { blogQueries } from '@/features/blog/queries';
import { useListParams } from '@/lib/useListParams';
import { Seo } from '@/components/seo/Seo';

const ITEMS_PER_PAGE = 9;

type Sort = 'newest' | 'oldest';

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
  const [params, setParams] = useSearchParams();
  const sort: Sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const listTop = React.useRef<HTMLDivElement>(null);

  const { data: allBlogTags, isLoading: isLoadingTags } = useQuery(blogQueries.tags());

  const {
    data: blogData,
    isLoading: isLoadingBlogs,
    isError: isErrorBlogs,
  } = useQuery(
    blogQueries.list({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      tag: selectedTag,
      sort,
    }),
  );

  const currentBlogs = blogData?.data ?? [];
  const totalBlogs = blogData?.count ?? 0;
  const totalPages = Math.ceil(totalBlogs / ITEMS_PER_PAGE);
  const filtersActive = Boolean(searchQuery || selectedTag || sort !== 'newest');
  const showFeature = currentPage === 1 && !searchQuery && !selectedTag;
  const [feature, ...rest] = currentBlogs;

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

  const resultLine = `${totalBlogs} ${totalBlogs === 1 ? 'article' : 'articles'}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Seo
        title="Blog"
        description="Insights, thoughts, and tutorials on web development, design, and technology."
      />
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Writings</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Insights, thoughts, and tutorials on web development, design, and technology.
          </p>
        </div>

        <div ref={listTop} className="scroll-mt-24 mb-8 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="blog-search" className="sr-only">
                Search articles
              </label>
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="blog-search"
                type="text"
                placeholder="Search articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-full py-3 pl-12 pr-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm shadow-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="relative flex items-center gap-2">
              <label htmlFor="blog-sort" className="sr-only">
                Sort articles
              </label>
              <select
                id="blog-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value === 'oldest' ? 'oldest' : 'newest')}
                className="w-full sm:w-auto bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 appearance-none rounded-full py-3 pl-5 pr-11 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
              />
            </div>
          </div>

          <div className="min-w-0">
            <CollapsibleTagFilter
              tags={allBlogTags ?? []}
              selectedTag={selectedTag}
              onTagClick={setFilter}
              maxVisible={6}
              isLoading={isLoadingTags}
              prefix="#"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <p aria-live="polite">
              {!isLoadingBlogs && (
                <>
                  {resultLine}
                  {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
                  {selectedTag && <> tagged #{selectedTag}</>}
                </>
              )}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full px-3 py-1 font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {isLoadingBlogs && (
            <>
              <span role="status" className="sr-only">
                Loading articles…
              </span>
              {showFeature && <BlogCardSkeleton variant="feature" />}
              {Array.from({ length: showFeature ? ITEMS_PER_PAGE - 1 : ITEMS_PER_PAGE }).map(
                (_, i) => (
                  <BlogCardSkeleton key={i} />
                ),
              )}
            </>
          )}
          {isErrorBlogs && !blogData && (
            <div className="col-span-full text-center text-red-500 py-10">
              Error loading articles.
            </div>
          )}
          {showFeature && feature && (
            <BlogCard post={feature} variant="feature" className="sm:col-span-2 lg:col-span-3" />
          )}
          {(showFeature ? rest : currentBlogs).map((blog) => (
            <BlogCard key={blog.id} post={blog} />
          ))}
          {currentBlogs.length === 0 && !isLoadingBlogs && !isErrorBlogs && (
            <div className="col-span-full text-center text-slate-500 py-10 space-y-4">
              <p>
                {filtersActive
                  ? 'No articles match your filters. Try a different search or tag.'
                  : 'No articles yet.'}
              </p>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
