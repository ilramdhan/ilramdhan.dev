import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { ProjectCard } from '../components/ProjectCard';
import { CollapsibleTagFilter } from '../components/CollapsibleTagFilter';
import { getProjects, getProjectTags } from '../lib/api';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function ProjectsPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useDocumentMeta({
    title: 'Projects',
    description: 'A collection of applications, tools, and experiments by Ilham Ramadhan.',
  });

  const { data: allTags, isLoading: isLoadingTags } = useQuery({
    queryKey: ['projectTags'],
    queryFn: getProjectTags,
  });

  const { data: projectData, isLoading: isLoadingProjects, isError: isErrorProjects } = useQuery({
    queryKey: ['projects', currentPage, selectedTag],
    queryFn: () => getProjects({ page: currentPage, limit: ITEMS_PER_PAGE, tag: selectedTag }),
    placeholderData: (previousData) => previousData,
  });

  const currentProjects = projectData?.data ?? [];
  const totalProjects = projectData?.count ?? 0;
  const totalPages = Math.ceil(totalProjects / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string | null) => {
      setSelectedTag(tag);
      setCurrentPage(1);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">All Projects</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl">A collection of applications, tools, and experiments.</p>
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
            {isLoadingProjects && Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <div key={i} className="rounded-xl bg-slate-200 dark:bg-slate-800/50 aspect-[4/3] animate-pulse" />
            ))}
            {isErrorProjects && <div className="col-span-full py-20 text-center text-red-500">Error loading projects.</div>}
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
        {totalPages > 1 && (
            <div className="flex justify-center gap-2">
                <button 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === i + 1
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}
                <button 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
