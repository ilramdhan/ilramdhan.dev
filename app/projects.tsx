import React, { useState } from 'react';
import { useRouter } from '../lib/router';
import { useStore } from '../lib/store';
import { Navbar } from '../components/Navbar';
import { ProjectCard } from '../components/ProjectCard';
import { Filter, X } from 'lucide-react';

export default function ProjectsPage() {
  const { projects } = useStore();
  const { navigate } = useRouter();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags || [])));

  // Filter projects
  const filteredProjects = selectedTag 
    ? projects.filter(p => p.tags?.includes(selectedTag))
    : projects;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
            <button onClick={() => navigate('/')} className="text-indigo-400 text-sm mb-4 hover:underline">&larr; Back to Home</button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-4">All Projects</h1>
                    <p className="text-slate-400 max-w-2xl">A collection of applications, tools, and experiments.</p>
                </div>
                
                {/* Tag Filter */}
                <div className="flex flex-wrap gap-2">
                    {selectedTag && (
                        <button 
                            onClick={() => setSelectedTag(null)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <X className="h-3 w-3" /> Clear
                        </button>
                    )}
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                tag === selectedTag 
                                ? 'bg-white text-slate-900 border-white' 
                                : 'bg-slate-900/50 text-slate-400 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
            ))}
            {filteredProjects.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-500">
                    No projects found for this tag.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
