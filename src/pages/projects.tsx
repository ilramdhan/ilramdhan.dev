import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pagination } from '@/components/ui/Pagination';
import { Navbar } from '@/app/layouts/Navbar';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { CollapsibleTagFilter } from '@/components/ui/CollapsibleTagFilter';
import { projectQueries } from '@/features/projects/queries';
import { useListParams } from '@/lib/useListParams';
import { useDocumentMeta } from '@/lib/useDocumentMeta';

const ITEMS_PER_PAGE = 6;

export default function ProjectsPage() {
  const { filter: selectedTag, page: currentPage, setFilter, setPage } = useListParams('tag');

  useDocumentMeta({
    title: 'Projects',
    description: 'A collection of applications, tools, and experiments by Ilham Ramadhan.',
  });

  const { data: allTags, isLoading: isLoadingTags } = useQuery(projectQueries.tags());

  const {
    data: projectData,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
  } = useQuery(projectQueries.list({ page: currentPage, limit: ITEMS_PER_PAGE, tag: selectedTag }));

  const currentProjects = projectData?.data ?? [];
  const totalProjects = projectData?.count ?? 0;
  const totalPages = Math.ceil(totalProjects / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string | null) => {
    setFilter(tag);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">All Projects</h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              A collection of applications, tools, and experiments.
            </p>
          </div>

          {/* Tag Filter — separate row, collapsible */}
          <CollapsibleTagFilter
            tags={allTags ?? []}
            selectedTag={selectedTag}
            onTagClick={handleTagClick}
            maxVisible={6}
            isLoading={isLoadingTags}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {isLoadingProjects &&
            Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-slate-200 dark:bg-slate-800/50 aspect-[4/3] animate-pulse"
              />
            ))}
          {isErrorProjects && (
            <div className="col-span-full py-20 text-center text-red-500">
              Error loading projects.
            </div>
          )}
          {currentProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
          {currentProjects.length === 0 && !isLoadingProjects && (
            <div className="col-span-full py-20 text-center text-slate-500">
              No projects found for this tag.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
