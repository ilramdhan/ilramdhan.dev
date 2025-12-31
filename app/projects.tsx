import React from 'react';
import { useRouter } from '../lib/router';
import { useStore } from '../lib/store';
import { Navbar } from '../components/Navbar';
import { ProjectCard } from '../components/ProjectCard';

export default function ProjectsPage() {
  const { projects } = useStore();
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
            <button onClick={() => navigate('/')} className="text-indigo-400 text-sm mb-4 hover:underline">&larr; Back to Home</button>
            <h1 className="text-4xl font-bold text-white mb-4">All Projects</h1>
            <p className="text-slate-400 max-w-2xl">A collection of applications, tools, and experiments I've built using various technologies.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
            ))}
        </div>
      </div>
    </div>
  );
}
