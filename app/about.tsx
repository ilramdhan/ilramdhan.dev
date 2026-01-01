import React from 'react';
import { useTheme } from '../lib/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api';
import { Navbar } from '../components/Navbar';
import { Download, MapPin, Briefcase, GraduationCap, Mail, Github, Linkedin, Twitter, Instagram, Youtube, Code, Smartphone, Cloud, Terminal, Layout, Database, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const IconMap: { [key: string]: React.ElementType } = {
    code: Code,
    smartphone: Smartphone,
    cloud: Cloud,
    terminal: Terminal,
    layout: Layout,
    database: Database
};

export default function AboutPage() {
  const { theme } = useTheme();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const { data: experience, isLoading: isLoadingExp } = useQuery({ queryKey: ['resume', 'experience'], queryFn: () => api.getResume('experience') });
  const { data: education, isLoading: isLoadingEdu } = useQuery({ queryKey: ['resume', 'education'], queryFn: () => api.getResume('education') });
  const { data: services, isLoading: isLoadingServices } = useQuery({ queryKey: ['services'], queryFn: api.getServices });

  const isLoading = isLoadingProfile || isLoadingExp || isLoadingEdu || isLoadingServices;
  const statsTheme = theme === 'dark' ? 'dark' : 'default';

  // const getGithubUsername = (url: string | undefined) => {
  //   if (!url) return '';
  //   const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
  //   return cleanUrl.split('/').pop();
  // };
  // const username = getGithubUsername(profile?.socials.github);

  if (isLoading) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
              <p>Loading...</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header / Bio */}
        <div className="flex flex-col md:flex-row gap-12 items-start mb-20">
            <div className="w-full md:w-1/3 shrink-0">
                <div className="aspect-square rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative mb-6">
                     <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay" />
                     <img src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} className="w-full h-full object-cover bg-white dark:bg-slate-900" />
                </div>
                
                <div className="flex flex-col gap-4">
                    {/* Placeholder for Address & Socials */}
                </div>

                <a 
                    href="#" // Placeholder for resume_url
                    target="_blank"
                    className="mt-8 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Download className="h-5 w-5" /> Download CV
                </a>
            </div>

            <div className="flex-1">
                <h1 className="text-4xl font-bold mb-6">About Me</h1>
                <div className="prose prose-lg prose-slate dark:prose-invert">
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300">
                        {/* Placeholder for detailed_bio */}
                    </p>
                </div>
            </div>
        </div>

        {/* Services Section */}
        {services && services.length > 0 && (
            <div className="mb-20">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                        <Zap className="h-6 w-6" />
                    </div>
                    What I Do
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map((service, idx) => {
                        const Icon = service.icon_name ? IconMap[service.icon_name] || Code : Code;
                        return (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white border border-slate-200 dark:bg-slate-900/50 dark:border-white/5 p-6 rounded-xl hover:border-indigo-500/30 transition-all shadow-sm dark:shadow-none group"
                            >
                                <div className="h-12 w-12 bg-indigo-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{service.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{service.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="grid md:grid-cols-2 gap-12 mb-20">
            {/* Experience */}
            <div>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Briefcase className="h-6 w-6" />
                    </div>
                    Experience
                </h2>
                <div className="space-y-8 border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-8 relative">
                    {experience?.map((exp, idx) => (
                        <motion.div 
                            key={exp.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative"
                        >
                            <span className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 bg-indigo-500" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{exp.title}</h3>
                            <div className="text-indigo-600 dark:text-indigo-400 font-medium mb-2">{exp.institution}</div>
                            <div className="text-sm text-slate-500 mb-3">{exp.start_date} - {exp.end_date || 'Present'}</div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">
                                {exp.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                     <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    Education
                </h2>
                <div className="space-y-8 border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-8 relative">
                    {education?.map((edu, idx) => (
                        <motion.div 
                            key={edu.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative"
                        >
                             <span className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 bg-purple-500" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{edu.title}</h3>
                            <div className="text-purple-600 dark:text-purple-400 font-medium mb-1">{edu.institution}</div>
                            <div className="text-sm text-slate-500 mb-2">{edu.start_date} - {edu.end_date || 'Present'}</div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                {edu.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}