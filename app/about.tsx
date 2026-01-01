import React from 'react';
import { useStore } from '../lib/store';
import { Navbar } from '../components/Navbar';
import { Download, MapPin, Briefcase, GraduationCap, Mail, Github, Linkedin, Twitter, Instagram, Youtube, Code, Smartphone, Cloud, Terminal, Layout, Database, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const IconMap = {
    code: Code,
    smartphone: Smartphone,
    cloud: Cloud,
    terminal: Terminal,
    layout: Layout,
    database: Database
};

export default function AboutPage() {
  const { profile, experience, education, services, theme } = useStore();

  const getGithubUsername = (url: string) => {
    if (!url) return '';
    const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
    return cleanUrl.split('/').pop();
  };

  const username = getGithubUsername(profile.socials.github);
  const statsTheme = theme === 'dark' ? 'dark' : 'default';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header / Bio */}
        <div className="flex flex-col md:flex-row gap-12 items-start mb-20">
            <div className="w-full md:w-1/3 shrink-0">
                <div className="aspect-square rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative mb-6">
                     <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay" />
                     <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover bg-white dark:bg-slate-900" />
                </div>
                
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <MapPin className="h-5 w-5 text-indigo-500" />
                        <span>{profile.address}</span>
                    </div>
                    {profile.socials.mail && (
                         <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                            <Mail className="h-5 w-5 text-indigo-500" />
                            <a href={`mailto:${profile.socials.mail}`} className="hover:text-indigo-500">{profile.socials.mail}</a>
                        </div>
                    )}
                    
                    {/* Social Icons */}
                    <div className="flex flex-wrap gap-4 mt-2">
                         {profile.socials.github && (
                            <a href={profile.socials.github} target="_blank" rel="noreferrer" className="p-2 bg-slate-200 dark:bg-slate-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Github className="h-5 w-5" /></a>
                        )}
                        {profile.socials.linkedin && (
                            <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-slate-200 dark:bg-slate-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Linkedin className="h-5 w-5" /></a>
                        )}
                        {profile.socials.twitter && (
                            <a href={profile.socials.twitter} target="_blank" rel="noreferrer" className="p-2 bg-slate-200 dark:bg-slate-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Twitter className="h-5 w-5" /></a>
                        )}
                        {profile.socials.instagram && (
                            <a href={profile.socials.instagram} target="_blank" rel="noreferrer" className="p-2 bg-slate-200 dark:bg-slate-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Instagram className="h-5 w-5" /></a>
                        )}
                         {profile.socials.youtube && (
                            <a href={profile.socials.youtube} target="_blank" rel="noreferrer" className="p-2 bg-slate-200 dark:bg-slate-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Youtube className="h-5 w-5" /></a>
                        )}
                    </div>
                </div>

                <a 
                    href={profile.resume_url} 
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
                        {profile.detailed_bio}
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
                        const Icon = IconMap[service.icon] || Code;
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
                    {experience.map((exp, idx) => (
                        <motion.div 
                            key={exp.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative"
                        >
                            <span className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 bg-indigo-500" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{exp.role}</h3>
                            <div className="text-indigo-600 dark:text-indigo-400 font-medium mb-2">{exp.company}</div>
                            <div className="text-sm text-slate-500 mb-3">{exp.period}</div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">
                                {exp.description}
                            </p>
                            {exp.tags && exp.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {exp.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-md border border-slate-200 dark:border-slate-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
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
                    {education.map((edu, idx) => (
                        <motion.div 
                            key={edu.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative"
                        >
                             <span className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 bg-purple-500" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{edu.degree}</h3>
                            <div className="text-purple-600 dark:text-purple-400 font-medium mb-1">{edu.school}</div>
                            <div className="text-sm text-slate-500 mb-2">{edu.period}</div>
                            {edu.gpa && (
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    GPA: {edu.gpa}
                                </div>
                            )}
                            {edu.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    {edu.description}
                                </p>
                            )}
                            {edu.tags && edu.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {edu.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-md border border-slate-200 dark:border-slate-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
        
        {/* GitHub Stats Section */}
        {username && (
            <div className="border-t border-slate-200 dark:border-white/10 pt-16">
                 <h2 className="text-2xl font-bold mb-8 text-center text-slate-900 dark:text-white">Coding Activity</h2>
                 <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                     <img 
                        src={`https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=${statsTheme}&bg_color=${statsTheme === 'dark' ? '0f172a' : 'ffffff'}&title_color=${statsTheme === 'dark' ? 'ffffff' : '0f172a'}&text_color=${statsTheme === 'dark' ? '94a3b8' : '475569'}&icon_color=6366f1&border_color=${statsTheme === 'dark' ? '1e293b' : 'e2e8f0'}`} 
                        alt="GitHub Stats"
                        className="rounded-xl border border-slate-200 dark:border-white/10 shadow-lg max-w-full" 
                     />
                     <img 
                        src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=${statsTheme}&bg_color=${statsTheme === 'dark' ? '0f172a' : 'ffffff'}&title_color=${statsTheme === 'dark' ? 'ffffff' : '0f172a'}&text_color=${statsTheme === 'dark' ? '94a3b8' : '475569'}&border_color=${statsTheme === 'dark' ? '1e293b' : 'e2e8f0'}`} 
                        alt="Top Languages"
                        className="rounded-xl border border-slate-200 dark:border-white/10 shadow-lg max-w-full" 
                     />
                 </div>
            </div>
        )}

      </div>
    </div>
  );
}