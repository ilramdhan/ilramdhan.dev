'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../types';
import { ImageCarousel } from './ImageCarousel';
import { ensureFullUrl } from '../lib/utils';

type Project = Database['public']['Tables']['projects']['Row'] & { images?: string[] };

interface ProjectCardProps {
  project: Partial<Project>;
  index: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onClick={() => project.slug && navigate(`/projects/${project.slug}`)}
      className="group relative rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-white/10 overflow-hidden hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-colors cursor-pointer"
    >
      <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative group/image">
         <ImageCarousel images={project.images || []} alt={project.title || 'Project'} />
         
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
           {/* Actions overlay - separate from carousel interaction */}
           <div className="flex gap-4 pointer-events-auto">
                {project.demo_url && (
                    <a 
                        href={ensureFullUrl(project.demo_url) || '#'} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-white text-slate-900 rounded-full hover:bg-indigo-400 transition-colors"
                        title="Live Demo"
                    >
                        <ExternalLink className="h-5 w-5" />
                    </a>
                )}
                {project.repo_url && (
                    <a 
                        href={ensureFullUrl(project.repo_url) || '#'} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-slate-900 border border-white/20 text-white rounded-full hover:bg-indigo-600 transition-colors"
                        title="GitHub Repo"
                    >
                        <Github className="h-5 w-5" />
                    </a>
                )}
           </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech_stack?.slice(0, 3).map((tech) => (
            <span key={tech} className="px-2 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20">
              {tech}
            </span>
          ))}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
          {project.short_description}
        </p>
      </div>
    </motion.div>
  );
};