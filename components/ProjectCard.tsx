import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import { cn } from '../lib/utils';
import { useRouter } from '../lib/router';
import type { Database } from '../types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectCardProps {
  project: Partial<Project>;
  index: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const { navigate } = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onClick={() => project.id && navigate(`/projects/${project.id}`)}
      className="group relative rounded-xl bg-slate-900 border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-colors cursor-pointer"
    >
      <div className="aspect-video w-full overflow-hidden bg-slate-800 relative">
        {project.thumbnail_url ? (
          <img 
            src={project.thumbnail_url} 
            alt={project.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
             No Image
          </div>
        )}
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
           {/* Stop propagation to allow clicking these buttons without navigating to detail */}
            {project.demo_url && (
                <a 
                    href={project.demo_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-white text-slate-900 rounded-full hover:bg-indigo-400 transition-colors"
                >
                    <ExternalLink className="h-5 w-5" />
                </a>
            )}
            {project.repo_url && (
                <a 
                    href={project.repo_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-slate-900 border border-white/20 text-white rounded-full hover:bg-indigo-600 transition-colors"
                >
                    <Github className="h-5 w-5" />
                </a>
            )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech_stack?.slice(0, 3).map((tech) => (
            <span key={tech} className="px-2 py-1 text-xs font-medium rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {tech}
            </span>
          ))}
        </div>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-slate-400 text-sm line-clamp-2">
          {project.description}
        </p>
      </div>
    </motion.div>
  );
};