'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { getProjectBySlug } from '../lib/api';
import { Github, ExternalLink, Calendar, ArrowLeft } from 'lucide-react';
import { ImageCarousel } from '../components/ImageCarousel';

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => getProjectBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-t-transparent border-indigo-600 rounded-full animate-spin"></div>
        </div>
    );
  }

  if (isError || !project) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <button onClick={() => navigate('/projects')} className="text-indigo-600 dark:text-indigo-400 hover:underline">Back to Projects</button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <Navbar />
      <div className="pt-24 pb-20 max-w-4xl mx-auto px-4">
        <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>

        <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
            <ImageCarousel images={project.images || []} alt={project.title} aspectRatio="aspect-video" />
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">{project.title}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {project.published_at ? new Date(project.published_at).toLocaleDateString() : ''}</span>
                    {project.is_featured && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-500/30">Featured</span>}
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{project.description}</p>
            </div>
            <div className="w-full md:w-64 space-y-6">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                    <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-200">Tech Stack</h3>
                    <div className="flex flex-wrap gap-2">
                        {project.tech_stack?.map(tech => (
                            <span key={tech} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">{tech}</span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    {project.demo_url && (
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20">
                            <ExternalLink className="h-4 w-4" /> Live Demo
                        </a>
                    )}
                    {project.repo_url && (
                        <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-white/10 rounded-lg font-medium transition-colors">
                            <Github className="h-4 w-4" /> View Source
                        </a>
                    )}
                </div>
            </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">About this project</h2>
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 shadow-sm dark:shadow-none">
                {project.content || 'No detailed content available for this project.'}
            </div>
        </div>
      </div>
    </div>
  );
}