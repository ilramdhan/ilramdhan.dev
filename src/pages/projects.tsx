import React from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, X } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Navbar } from '@/app/layouts/Navbar';
import { ProjectCard, ProjectCardSkeleton } from '@/features/projects/ProjectCard';
import { CollapsibleTagFilter } from '@/components/ui/CollapsibleTagFilter';
import { projectQueries } from '@/features/projects/queries';
import { useListParams } from '@/lib/useListParams';
import { Seo } from '@/components/seo/Seo';
import { MotionScope } from '@/components/motion';
import motionFeatures from '@/components/motion/features';

/** Keep below the fixture count (9) so e2e has a second page (`url-state.spec.ts`). */
const ITEMS_PER_PAGE = 6;

type Sort = 'newest' | 'oldest';

function ProjectsContent() {
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

  const { data: allTags, isLoading: isLoadingTags } = useQuery(projectQueries.tags());

  const {
    data: projectData,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
  } = useQuery(
    projectQueries.list({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      query: searchQuery,
      tag: selectedTag,
      sort,
    }),
  );

  const currentProjects = projectData?.data ?? [];
  const totalProjects = projectData?.count ?? 0;
  const totalPages = Math.ceil(totalProjects / ITEMS_PER_PAGE);
  const filtersActive = Boolean(searchQuery || selectedTag || sort !== 'newest');

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

  const resultLine = `${totalProjects} ${totalProjects === 1 ? 'project' : 'projects'}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Seo
        title="Projects"
        description="A collection of applications, tools, and experiments by Ilham Ramadhan."
      />
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">All Projects</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
            A collection of applications, tools, and experiments.
          </p>
        </div>

        <div ref={listTop} className="scroll-mt-24 mb-8 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="project-search" className="sr-only">
                Search projects
              </label>
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="project-search"
                type="text"
                placeholder="Search projects..."
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
              <label htmlFor="project-sort" className="sr-only">
                Sort projects
              </label>
              <select
                id="project-sort"
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
              tags={allTags ?? []}
              selectedTag={selectedTag}
              onTagClick={setFilter}
              maxVisible={6}
              isLoading={isLoadingTags}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <p aria-live="polite">
              {!isLoadingProjects && (
                <>
                  {resultLine}
                  {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
                  {selectedTag && <> tagged {selectedTag}</>}
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
          {isLoadingProjects && (
            <>
              <span role="status" className="sr-only">
                Loading projects…
              </span>
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </>
          )}
          {isErrorProjects && !projectData && (
            <div className="col-span-full py-10 text-center text-red-500">
              Error loading projects.
            </div>
          )}
          {currentProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              headingLevel="h2"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
          {currentProjects.length === 0 && !isLoadingProjects && !isErrorProjects && (
            <div className="col-span-full text-center text-slate-500 py-10 space-y-4">
              <p>
                {filtersActive
                  ? 'No projects match your filters. Try a different search or tag.'
                  : 'No projects yet.'}
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

/**
 * The cards use `Reveal` (`m.*`), which needs a `LazyMotion` ancestor. This wrapper has no
 * state, so it never re-renders: LazyMotion hands out a new context value on every render,
 * and React would push that change into Markdown boundaries that are still hydrating
 * (React #421). The features load synchronously for the same reason.
 */
export default function ProjectsPage() {
  return (
    <MotionScope features={motionFeatures}>
      <ProjectsContent />
    </MotionScope>
  );
}
