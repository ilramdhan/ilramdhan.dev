import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Linkedin, Twitter, Instagram, Youtube, Mail, Gamepad2, Phone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api';
import { ensureFullUrl } from '../lib/utils';

const SocialIconMap: { [key: string]: React.ElementType } = {
    github: Github, linkedin: Linkedin, twitter: Twitter, instagram: Instagram, youtube: Youtube, mail: Mail, whatsapp: Phone, steam: Gamepad2
};

export function Hero() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
  });

  const handleContactClick = () => {
      if (location.pathname === '/') {
          const element = document.querySelector('#contact');
          element?.scrollIntoView({ behavior: 'smooth' });
      } else {
          navigate('/');
          setTimeout(() => {
              const element = document.querySelector('#contact');
              element?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  };

  if (isLoading) {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 mb-8">
                <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-full mb-6 animate-pulse mx-auto lg:mx-0"></div>
                <div className="h-16 sm:h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-lg mb-6 animate-pulse"></div>
                <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8 animate-pulse mx-auto lg:mx-0"></div>
            </div>
        </section>
    )
  }

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Text Content */}
            <motion.div 
                className="flex-1 text-center lg:text-left"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                {profile?.badge_text && (
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-sm font-medium mb-6">
                        {profile.badge_text}
                    </span>
                )}
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
                    {profile?.hero_title}
                </h1>
                <p className="mt-4 max-w-2xl mx-auto lg:mx-0 text-xl text-slate-600 dark:text-slate-400 mb-8">
                    {profile?.short_description}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <button 
                    onClick={() => navigate('/projects')}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
                    >
                    View Projects <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                    onClick={handleContactClick}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white font-semibold transition-all"
                    >
                    Contact Me
                    </button>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6">
                    {profile?.social_links && typeof profile.social_links === 'object' && Object.entries(profile.social_links).map(([key, value]) => {
                        if (!value) return null;
                        const Icon = SocialIconMap[key];
                        if (!Icon) return null;
                        const href = key === 'mail' ? `mailto:${value}` : ensureFullUrl(value as string) || '#';
                        return (
                            <a key={key} href={href} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors">
                                <Icon className="h-6 w-6" />
                            </a>
                        );
                    })}
                </div>
            </motion.div>

            {/* Profile Image - PNG No Background */}
            <motion.div 
                className="flex-1 flex justify-center lg:justify-end"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className="relative w-100 h-100 md:w-100 md:h-100 lg:w-100 lg:h-100">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full" />
                    <img 
                        src={profile?.avatar_url || ''} 
                        alt={profile?.display_name || 'User'} 
                        className="relative z-10 w-full h-full object-contain drop-shadow-2xl" 
                    />
                </div>
            </motion.div>
        </div>
      </div>
    </section>
  );
}