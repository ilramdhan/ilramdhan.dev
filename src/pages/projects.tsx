import React from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, X } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { ProjectCard, ProjectCardSkeleton } from '@/features/projects/ProjectCard';
import { FlipGroup } from '@/components/motion/FlipGroup';
import { pillClass } from '@/components/tile/pill';
import { SegmentedControl, type SegmentedOption } from '@/components/tile/SegmentedControl';
import { colVar } from '@/components/tile/stagger';
import { Tile } from '@/components/tile/Tile';
import { TileHeading } from '@/components/tile/TileHeading';
import { cn } from '@/lib/utils';
import { projectQueries } from '@/features/projects/queries';
import { useListParams } from '@/lib/useListParams';
import { Seo } from '@/components/seo/Seo';
import { useLocale, useT } from '@/i18n';

/** Keep below the fixture count (9) so e2e has a second page (`url-state.spec.ts`). */
const ITEMS_PER_PAGE = 6;

const GRID = 'gap-x-4 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3';
const FIELD =
  'min-h-12 w-full rounded-md bg-parchment px-4 text-body text-ink outline-hidden placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-0 focus-visible:outline-tile-action';

type Sort = 'newest' | 'oldest';

export default function ProjectsPage() {
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

  const { data: allTags, isLoading: isLoadingTags } = useQuery(projectQueries.tags());

  const {
    data: projectData,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
  } = useQuery(
    projectQueries.list(
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

  const resultLine = t.projects.count(totalProjects);
  const tagOptions: SegmentedOption<string>[] = [
    { value: '', label: t.projects.allTags },
    ...(allTags ?? []).map((tag) => ({ value: tag, label: tag })),
  ];
  // A tag in the URL that no project has still shows (as no active segment), so the list and the control agree.
  const tagValue =
    selectedTag && tagOptions.some((o) => o.value === selectedTag) ? selectedTag : '';
  const flipKey = `${searchQuery}|${selectedTag ?? ''}|${sort}|${currentPage}`;
  const columns = 3;

  return (
    <div>
      <Seo title={t.seo.projects} description={t.seo.projectsDescription} />
      <Tile labelledBy="projects-h" enter size="default" className="pb-0!">
        <TileHeading
          id="projects-h"
          as="h1"
          title={t.projects.heading}
          lead={t.projects.lead}
          className="animate-rise-still"
        />
      </Tile>

      <Tile labelledBy="projects-list-h" className="pt-stack!">
        <h2 id="projects-list-h" className="sr-only">
          {t.nav.projects}
        </h2>
        <div ref={listTop} className="w-full scroll-mt-(--nav-h) space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="project-search" className="sr-only">
                {t.projects.searchLabel}
              </label>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                id="project-search"
                type="text"
                placeholder={t.projects.searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={cn(FIELD, 'pl-12 pr-12')}
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label={t.list.clearSearch}
                  onClick={() => setSearchInput('')}
                  className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="relative">
              <label htmlFor="project-sort" className="sr-only">
                {t.projects.sortLabel}
              </label>
              <select
                id="project-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value === 'oldest' ? 'oldest' : 'newest')}
                className={cn(FIELD, 'appearance-none pr-11 sm:w-auto')}
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

          {(isLoadingTags || tagOptions.length > 1) && (
            <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
              {isLoadingTags ? (
                <div aria-hidden="true" className="h-[52px] w-72 rounded-full bg-parchment" />
              ) : (
                <SegmentedControl
                  label={t.projects.filterLabel}
                  options={tagOptions}
                  value={tagValue}
                  onChange={(v) => setFilter(v || null)}
                />
              )}
            </div>
          )}

          <div className="flex min-h-11 flex-wrap items-center gap-x-4 text-caption text-tile-muted">
            <p aria-live="polite">
              {!isLoadingProjects && (
                <>
                  {resultLine}
                  {searchQuery && t.list.forQuery(searchQuery)}
                  {selectedTag && t.list.tagged(selectedTag)}
                </>
              )}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-11 text-tile-action hover:text-tile-action-hover hover:underline underline-offset-4"
              >
                {t.list.clearFilters}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 w-full">
          {isLoadingProjects && (
            <>
              <span role="status" className="sr-only">
                {t.projects.loading}
              </span>
              <ul className={cn(GRID, 'grid')} aria-hidden="true">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <li key={i}>
                    <ProjectCardSkeleton />
                  </li>
                ))}
              </ul>
            </>
          )}
          {isErrorProjects && !projectData && (
            <p className="py-10 text-center text-body text-danger">{t.projects.error}</p>
          )}
          {currentProjects.length > 0 && (
            <FlipGroup flipKey={flipKey} className={cn(GRID, 'grid stagger-row')}>
              {currentProjects.map((project, i) => (
                <li
                  key={project.id}
                  data-flip-id={project.id}
                  style={colVar(i, columns)}
                  className="min-w-0"
                >
                  <ProjectCard project={project} />
                </li>
              ))}
            </FlipGroup>
          )}
          {currentProjects.length === 0 && !isLoadingProjects && !isErrorProjects && (
            <div className="space-y-4 py-10 text-center text-body text-tile-muted">
              <p>{filtersActive ? t.projects.noMatch : t.projects.none}</p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className={pillClass('md')}>
                  {t.list.clearFilters}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-stack w-full">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </Tile>
    </div>
  );
}
