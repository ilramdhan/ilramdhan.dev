import React from 'react';
import { useTheme } from '../lib/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api';
import { Navbar } from '../components/Navbar';
import { Download, MapPin, Briefcase, GraduationCap, Mail, Github, Linkedin, Twitter, Instagram, Youtube, Award, Clock, Code2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import WakatimeStats from '../components/WakatimeStats';
import { ensureFullUrl } from '../lib/utils';

const SocialIconMap: { [key: string]: React.ElementType } = {
    github: Github, linkedin: Linkedin, twitter: Twitter, instagram: Instagram, youtube: Youtube, mail: Mail,
};

export default function AboutPage() {
  const { theme } = useTheme();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const { data: experience, isLoading: isLoadingExp } = useQuery({ queryKey: ['resume', 'experience'], queryFn: () => api.getResume('experience') });
  const { data: education, isLoading: isLoadingEdu } = useQuery({ queryKey: ['resume', 'education'], queryFn: () => api.getResume('education') });
  const { data: certificates, isLoading: isLoadingCerts } = useQuery({ queryKey: ['certificates'], queryFn: api.getCertificates });
  const { data: wakatime, isLoading: isLoadingWakatime, isError: isWakatimeError } = useQuery({ 
      queryKey: ['wakatime'], 
      queryFn: api.getWakatimeStats,
      retry: false 
  });
  const { data: wakatimeActivity, isLoading: isLoadingWakatimeActivity, isError: isWakatimeActivityError } = useQuery({
      queryKey: ['wakatimeActivity'],
      queryFn: api.getWakatimeCodingActivity,
      retry: false
  });

  const isLoading = isLoadingProfile || isLoadingExp || isLoadingEdu || isLoadingCerts;
  const statsTheme = theme === 'dark' ? 'dark' : 'default';

  const getGithubUsername = (url: string | undefined) => {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1);
    } catch (e) {
        return '';
    }
  };
  
  const username = getGithubUsername(ensureFullUrl((profile?.social_links as any)?.github));

  if (isLoading) {
      return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><p>Loading...</p></div>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row gap-12 items-start mb-20">
            <div className="w-full md:w-1/3 shrink-0">
                <div className="aspect-square rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative mb-6">
                     <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay" />
                     <img src={profile?.avatar_url || ''} alt={profile?.display_name || 'User'} className="w-full h-full object-cover bg-white dark:bg-slate-900" />
                </div>
                
                <div className="flex flex-col gap-4">
                    {profile?.address && (
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><MapPin className="h-5 w-5 text-indigo-500" /><span>{profile.address}</span></div>
                    )}
                    
                    <div className="flex flex-wrap gap-4 mt-2">
                         {profile?.social_links && typeof profile.social_links === 'object' && Object.entries(profile.social_links).map(([key, value]) => {
                            if (!value) return null;
                            const Icon = SocialIconMap[key];
                            if (!Icon) return null;
                            const href = key === 'mail' ? `mailto:${value}` : ensureFullUrl(value as string) || '#';
                            return (
                                <a key={key} href={href} target="_blank" rel="noreferrer" className="p-2 bg-slate-200 dark:bg-slate-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <Icon className="h-5 w-5" />
                                </a>
                            )
                         })}
                    </div>
                </div>

                <a href={ensureFullUrl(profile?.resume_url) || '#'} target="_blank" rel="noopener noreferrer" className="mt-8 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20">
                    <Download className="h-5 w-5" /> Download CV
                </a>
            </div>

            <div className="flex-1">
                <h1 className="text-4xl font-bold mb-6">{profile?.display_name || 'About Me'}</h1>
                <div className="prose prose-lg prose-slate dark:prose-invert">
                    <ReactMarkdown>{profile?.detailed_bio || ''}</ReactMarkdown>
                </div>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3"><div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400"><Briefcase className="h-6 w-6" /></div>Experience</h2>
                <div className="space-y-8 border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-8 relative">
                    {experience?.map((exp, idx) => (
                        <motion.div key={exp.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="relative">
                            <span className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 bg-indigo-500" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{exp.title}</h3>
                            <div className="text-indigo-600 dark:text-indigo-400 font-medium mb-2">{exp.institution}</div>
                            <div className="text-sm text-slate-500 mb-3">{exp.period}</div>
                            <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3 prose prose-sm dark:prose-invert">
                                <ReactMarkdown>{exp.description || ''}</ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3"><div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><GraduationCap className="h-6 w-6" /></div>Education</h2>
                <div className="space-y-8 border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-8 relative">
                    {education?.map((edu, idx) => (
                        <motion.div key={edu.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="relative">
                             <span className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 bg-purple-500" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{edu.title}</h3>
                            <div className="text-purple-600 dark:text-purple-400 font-medium mb-1">{edu.institution}</div>
                            <div className="text-sm text-slate-500 mb-2">{edu.period}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 prose prose-sm dark:prose-invert">
                                <ReactMarkdown>{edu.description || ''}</ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>

        {certificates && certificates.length > 0 && (
            <div className="mb-20">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3"><div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><Award className="h-6 w-6" /></div>Certificates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert, idx) => (
                        <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white border border-slate-200 dark:bg-slate-900/50 dark:border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all shadow-sm dark:shadow-none group flex flex-col">
                            {cert.file_url ? (
                                <div className="h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                                    <img src={cert.file_url} alt={cert.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            ) : (
                                <div className="h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Award className="h-12 w-12" />
                                </div>
                            )}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{cert.title}</h3>
                                <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">{cert.issued_by}</p>
                                <p className="text-xs text-slate-500 mb-4">{cert.issued_date} {cert.expiry_date ? ` - ${cert.expiry_date}` : ''}</p>
                                <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-1 prose prose-sm dark:prose-invert line-clamp-3">
                                    <ReactMarkdown>{cert.description || ''}</ReactMarkdown>
                                </div>
                                {cert.credential_url && (
                                    <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-auto">
                                        View Credential &rarr;
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        )}
        
        <div className="border-t border-slate-200 dark:border-white/10 pt-16">
             <h2 className="text-2xl font-bold mb-8 text-center text-slate-900 dark:text-white">Coding Activity</h2>
             
             {/* Wakatime Stats - Using Public JSON Data */}
             {!isWakatimeError && !isLoadingWakatime && wakatime?.data && (
                 <div className="space-y-8 max-w-4xl mx-auto mb-12">
                     {/* Custom Top Languages Visualization */}
                     <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-white/5">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Languages (Last 7 Days)</h3>
                        <div className="space-y-4">
                            {wakatime.data.slice(0, 5).map((lang: any) => (
                                <div key={lang.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{lang.name}</span>
                                        <span className="text-slate-500">{lang.text} ({lang.percent}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" 
                                            style={{ width: `${lang.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                    {!isLoadingWakatimeActivity && !isWakatimeActivityError && wakatimeActivity && (
                        <WakatimeStats data={wakatimeActivity} />
                    )}
                 </div>
             )}

             {/* GitHub Stats */}
             {username && (
                 <div className="space-y-6">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <a href="https://github.com/ilramdhan">
                            <img 
                                src={`https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=${theme === 'dark' ? 'high-contrast' : 'merko'}&hide_border=true&area=true`} 
                                alt="GitHub Activity Graph"
                                className="rounded-xl border border-slate-200 dark:border-white/10 shadow-lg w-full h-full"
                            />
                         </a>
                         <a href="https://git.io/streak-stats">
                            <img 
                                src={`https://streak-stats.demolab.com?user=${username}&theme=${theme}&border_radius=5&short_numbers=true&date_format=M%20j%5B%2C%20Y%5D&mode=weekly`} 
                                alt="GitHub Streak" 
                                className="rounded-xl border border-slate-200 dark:border-white/10 shadow-lg w-full h-full"
                            />
                         </a>
                     </div>
                     <div className="flex justify-center">
                        <img 
                            src="https://raw.githubusercontent.com/ilramdhan/Snake-in-Contribution-Grid/output/github-contribution-grid-snake.svg" 
                            alt="GitHub Contribution Grid Snake"
                            className="max-w-full"
                        />
                     </div>
                 </div>
             )}
        </div>

      </div>
    </div>
  );
}