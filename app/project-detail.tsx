import React from 'react';
import { useStore } from '../lib/store';
import { useRouter } from '../lib/router';
import { Navbar } from '../components/Navbar';
import { Github, ExternalLink, Calendar, ArrowLeft } from 'lucide-react';

export default function ProjectDetailPage({ id }: { id: string }) {
  const { projects } = useStore();
  const { navigate } = useRouter();
  const project = projects.find(p => p.id === id);

  if (!project) {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <button onClick={() => navigate('/projects')} className="text-indigo-400 hover:underline">Back to Projects</button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="pt-24 pb-20 max-w-4xl mx-auto px-4">
        <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>

        <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 aspect-video">
            <img src={project.thumbnail_url || ''} alt={project.title} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(project.published_at || '').toLocaleDateString()}</span>
                    {project.is_featured && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">Featured</span>}
                </div>
                <p className="text-lg text-slate-300 leading-relaxed">{project.description}</p>
            </div>
            <div className="w-full md:w-64 space-y-6">
                <div className="p-6 bg-slate-900 rounded-xl border border-white/10">
                    <h3 className="font-semibold mb-4 text-slate-200">Tech Stack</h3>
                    <div className="flex flex-wrap gap-2">
                        {project.tech_stack?.map(tech => (
                            <span key={tech} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-white/5">{tech}</span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    {project.demo_url && (
                        <a href={project.demo_url} target="_blank" className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">
                            <ExternalLink className="h-4 w-4" /> Live Demo
                        </a>
                    )}
                    {project.repo_url && (
                        <a href={project.repo_url} target="_blank" className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg font-medium transition-colors">
                            <Github className="h-4 w-4" /> View Source
                        </a>
                    )}
                </div>
            </div>
        </div>

        <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4">About this project</h2>
            <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 text-slate-300">
                {project.content || 'No detailed content available for this project.'}
            </div>
        </div>
      </div>
    </div>
  );
}