'use client';

import React from 'react';
import { Hero } from '../components/Hero';
import { ProjectCard } from '../components/ProjectCard';
import { ContactForm } from '../components/ContactForm';
import { Navbar } from '../components/Navbar';
import { useRouter } from '../lib/router';
import { useStore } from '../lib/store';
import { Calendar } from 'lucide-react';

const TECH_STACK = [
  { name: 'Next.js', icon: 'nextdotjs' },
  { name: 'React', icon: 'react' },
  { name: 'TypeScript', icon: 'typescript' },
  { name: 'Tailwind', icon: 'tailwindcss' },
  { name: 'Supabase', icon: 'supabase' },
  { name: 'PostgreSQL', icon: 'postgresql' },
  { name: 'Node.js', icon: 'nodedotjs' },
  { name: 'Docker', icon: 'docker' },
  { name: 'Git', icon: 'git' },
  { name: 'Figma', icon: 'figma' },
];

export default function Page() {
  const { projects, posts } = useStore();
  const { navigate } = useRouter();
  
  // Filter only featured projects for homepage
  const featuredProjects = projects.filter(p => p.is_featured).slice(0, 3);
  // Get featured blogs
  const featuredPosts = posts.filter(p => p.is_featured).slice(0, 3);
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Hero />
        
        {/* Tech Stack Marquee */}
        <section className="py-12 bg-white border-y border-slate-200 dark:bg-slate-900/50 dark:border-white/5 overflow-hidden backdrop-blur-sm transition-colors">
            <div className="max-w-7xl mx-auto px-4 mb-8">
                <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-wider">
                Technologies I work with
                </p>
            </div>
            <div className="relative flex overflow-x-hidden group">
                <div className="animate-scroll flex gap-24 whitespace-nowrap py-4 px-6">
                    {[...TECH_STACK, ...TECH_STACK].map((tech, i) => (
                        <div key={i} className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                             <img src={`https://cdn.simpleicons.org/${tech.icon}/default`} alt={tech.name} className="h-8 w-8 dark:invert" />
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
              {featuredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
              {featuredProjects.length === 0 && (
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
                    {featuredPosts.map((post) => (
                        <div 
                            key={post.id} 
                            onClick={() => navigate(`/blog/${post.id}`)}
                            className="bg-white border border-slate-200 dark:bg-slate-950/80 dark:border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all cursor-pointer group shadow-sm"
                        >
                            <div className="aspect-[2/1] overflow-hidden bg-slate-100 dark:bg-slate-900">
                                <img src={post.images?.[0] || ''} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(post.published_at).toLocaleDateString()}
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
                    {featuredPosts.length === 0 && (
                         <p className="text-slate-500 col-span-full text-center py-10">No featured blog posts.</p>
                    )}
                </div>
             </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Get In Touch</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Have a project in mind or just want to chat? Feel free to send me a message.
                I'm currently open for new opportunities.
              </p>
            </div>
            
            <div className="bg-white/80 border border-slate-200 dark:bg-slate-900/80 dark:border-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto shadow-lg dark:shadow-none">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-white border-t border-slate-200 dark:bg-slate-950/90 dark:border-white/5 py-12 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-slate-500 text-sm">
              © {new Date().getFullYear()} DevFolio. Built with Next.js & Supabase.
            </span>
            <div className="flex gap-6">
               <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm">Privacy Policy</button>
               <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}