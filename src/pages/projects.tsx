import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ContactCta } from '@/components/tile/ContactCta';
import { Pagination } from '@/components/ui/Pagination';
import { ProjectCard, ProjectCardSkeleton } from '@/features/projects/ProjectCard';
import { FlipGroup } from '@/components/motion/FlipGroup';
import { pillClass } from '@/components/tile/pill';
import type { SegmentedOption } from '@/components/tile/SegmentedControl';
import { ListingHero, ListingSection, ListingToolbar } from '@/components/listing/Listing';
import { colVar } from '@/components/tile/stagger';
import { cn } from '@/lib/utils';
import { projectQueries } from '@/features/projects/queries';
import { useListParams } from '@/lib/useListParams';
import { Seo } from '@/components/seo/Seo';
import { useLocale, useT } from '@/i18n';

/** Keep below the fixture count (9) so e2e has a second page (`url-state.spec.ts`). */
const ITEMS_PER_PAGE = 6;

const GRID = 'gap-x-4 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3';
export default function ProjectsPage() {
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

  const { data: allTags } = useQuery(projectQueries.tags());

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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    listTop.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const resultLine = t.projects.count(totalProjects);
  const sortOptions = [
    { value: 'newest', label: t.list.sortNewest },
    { value: 'oldest', label: t.list.sortOldest },
  ];
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
      <ListingHero id="projects-h" title={t.projects.heading} lead={t.projects.lead} />

      <ListingSection id="projects-list-h" title={t.nav.projects}>
        <div ref={listTop} className="w-full scroll-mt-(--nav-h)">
          <ListingToolbar
            id="project"
            search={{
              label: t.projects.searchLabel,
              placeholder: t.projects.searchPlaceholder,
              value: searchInput,
              onChange: setSearchInput,
              clearLabel: t.list.clearSearch,
            }}
            sort={{
              label: t.projects.sortLabel,
              value: sort,
              onChange: setSort,
              options: sortOptions,
            }}
            filter={
              tagOptions.length > 1
                ? {
                    label: t.projects.filterLabel,
                    options: tagOptions,
                    value: tagValue,
                    onChange: (v) => setFilter(v || null),
                  }
                : null
            }
            resultLine={
              !isLoadingProjects && (
                <>
                  {resultLine}
                  {searchQuery && t.list.forQuery(searchQuery)}
                  {selectedTag && t.list.tagged(selectedTag)}
                </>
              )
            }
            clear={filtersActive ? { label: t.list.clearFilters, onClick: clearFilters } : null}
          />
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
      </ListingSection>

      <ContactCta photo="code" />
    </div>
  );
}
