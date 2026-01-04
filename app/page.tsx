'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Hero } from '../components/Hero';
import { ProjectCard } from '../components/ProjectCard';
import { ContactForm } from '../components/ContactForm';
import { Navbar } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { getProfile, getFeaturedProjects, getFeaturedBlogs, getTechStack, getServices } from '../lib/api';
import { Calendar, Zap, Code, Smartphone, Cloud, Terminal, Layout, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const IconMap: { [key: string]: React.ElementType } = {
    code: Code,
    smartphone: Smartphone,
    cloud: Cloud,
    terminal: Terminal,
    layout: Layout,
    database: Database,
};

export default function Page() {
  const navigate = useNavigate();

  const { data: profile, isLoading: isLoadingProfile, isError: isErrorProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const { data: featuredProjects, isLoading: isLoadingProjects, isError: isErrorProjects } = useQuery({
    queryKey: ['featuredProjects'],
    queryFn: getFeaturedProjects,
  });

  const { data: featuredBlogs, isLoading: isLoadingBlogs, isError: isErrorBlogs } = useQuery({
    queryKey: ['featuredBlogs'],
    queryFn: getFeaturedBlogs,
  });

  const { data: techStack, isLoading: isLoadingTech } = useQuery({
    queryKey: ['techStack'],
    queryFn: getTechStack,
  });

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Hero />
        
        {/* Services Section */}
        {services && services.length > 0 && (
            <section className="py-20 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">What I Do</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">I offer a range of services to help you build your next digital product.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {services.map((service, idx) => {
                            const Icon = service.icon_name ? IconMap[service.icon_name] || Code : Code;
                            return (
                                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white border border-slate-200 dark:bg-slate-900/50 dark:border-white/5 p-8 rounded-2xl flex flex-col items-center text-center hover:border-indigo-500/30 transition-all shadow-sm dark:shadow-none group">
                                    <div className="h-14 w-14 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Icon className="h-7 w-7" /></div>
                                    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{service.title}</h3>
                                    <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed prose prose-sm dark:prose-invert">
                                        <ReactMarkdown>{service.description || ''}</ReactMarkdown>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>
        )}

        {/* Tech Stack Marquee */}
        <section className="py-12 bg-white border-y border-slate-200 dark:bg-slate-900/50 dark:border-white/5 overflow-hidden backdrop-blur-sm transition-colors">
            <div className="max-w-7xl mx-auto px-4 mb-8">
                <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-wider">
                Technologies I work with
                </p>
            </div>
            <div className="relative flex overflow-x-hidden group">
                <div className="animate-scroll flex gap-24 whitespace-nowrap py-4 px-6 group-hover:[animation-play-state:paused]">
                    {techStack && [...techStack, ...techStack].map((tech, i) => (
                        <div key={i} className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                             {tech.icon_url ? (
                                 <img src={tech.icon_url} alt={tech.name} className="h-8 w-8 object-contain dark:invert" />
                             ) : (
                                 <img src={`https://cdn.simpleicons.org/${tech.name.toLowerCase().replace(/\s+/g, '')}/default`} alt={tech.name} className="h-8 w-8 dark:invert" onError={(e) => e.currentTarget.style.display = 'none'} />
                             )}
                             <span className="text-lg font-bold text-slate-600 dark:text-slate-300">{tech.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Featured Projects Section */}
        <section id="projects" className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Featured Projects</h2>
                <p className="text-slate-600 dark:text-slate-400">Some of my recent work</p>
              </div>
              <button 
                onClick={() => navigate('/projects')} 
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm flex items-center gap-1"
              >
                View All Projects &rarr;
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {isLoadingProjects && <p className="text-slate-500 col-span-full text-center py-10">Loading projects...</p>}
              {isErrorProjects && <p className="text-red-500 col-span-full text-center py-10">Error loading projects.</p>}
              {featuredProjects?.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
              {featuredProjects?.length === 0 && !isLoadingProjects && (
                <p className="text-slate-500 col-span-full text-center py-10">No featured projects yet.</p>
              )}
            </div>
          </div>
        </section>

        {/* Latest Blog Section */}
        <section id="blog" className="py-20 bg-slate-50 border-y border-slate-200 dark:bg-slate-900/30 dark:border-white/5 backdrop-blur-sm transition-colors">
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Featured Articles</h2>
                        <p className="text-slate-600 dark:text-slate-400">Thoughts on development and tech</p>
                    </div>
                    <button 
                        onClick={() => navigate('/blog')} 
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm flex items-center gap-1"
                    >
                        Read Blog &rarr;
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {isLoadingBlogs && <p className="text-slate-500 col-span-full text-center py-10">Loading posts...</p>}
                    {isErrorBlogs && <p className="text-red-500 col-span-full text-center py-10">Error loading posts.</p>}
                    {featuredBlogs?.map((post) => (
                        <div 
                            key={post.id} 
                            onClick={() => post.slug && navigate(`/blog/${post.slug}`)}
                            className="bg-white border border-slate-200 dark:bg-slate-950/80 dark:border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all cursor-pointer group shadow-sm"
                        >
                            <div className="aspect-[2/1] overflow-hidden bg-slate-100 dark:bg-slate-900">
                                {post.images && post.images.length > 0 ? (
                                    <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                                )}
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                    <Calendar className="h-3 w-3" />
                                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
                                    {post.tags && post.tags.length > 0 && (
                                        <>
                                         <span>•</span>
                                         <span className="text-indigo-600 dark:text-indigo-400">{post.tags[0]}</span>
                                        </>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{post.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3">{post.excerpt}</p>
                            </div>
                        </div>
                    ))}
                    {featuredBlogs?.length === 0 && !isLoadingBlogs && (
                         <p className="text-slate-500 col-span-full text-center py-10">No featured blog posts.</p>
                    )}
                </div>
             </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Get In Touch</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Have a project in mind or just want to chat? Feel free to send me a message.
                I'm currently open for new opportunities.
              </p>
            </div>
            
            <div className="bg-white/80 border border-slate-200 dark:bg-slate-900/80 dark:border-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-xl mx-auto shadow-lg dark:shadow-none">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}