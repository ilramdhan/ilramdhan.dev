import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Linkedin, Twitter, Instagram, Youtube, Mail, Gamepad2, Phone } from 'lucide-react';
import { useStore } from '../lib/store';
import { useRouter } from '../lib/router';

export function Hero() {
  const { profile } = useStore();
  const { navigate } = useRouter();

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
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 text-sm font-medium mb-6">
                    {profile.badge}
                </span>
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
                    {profile.title}
                </h1>
                <p className="mt-4 max-w-2xl mx-auto lg:mx-0 text-xl text-slate-400 mb-8">
                    {profile.description}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <button 
                    onClick={() => navigate('/projects')}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
                    >
                    View Projects <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                    onClick={() => navigate('/contact')}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all"
                    >
                    Contact Me
                    </button>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6">
                    {profile.socials.github && (
                        <a href={profile.socials.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Github className="h-6 w-6" /></a>
                    )}
                    {profile.socials.linkedin && (
                        <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Linkedin className="h-6 w-6" /></a>
                    )}
                    {profile.socials.twitter && (
                        <a href={profile.socials.twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Twitter className="h-6 w-6" /></a>
                    )}
                    {profile.socials.instagram && (
                        <a href={profile.socials.instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Instagram className="h-6 w-6" /></a>
                    )}
                    {profile.socials.youtube && (
                        <a href={profile.socials.youtube} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Youtube className="h-6 w-6" /></a>
                    )}
                    {profile.socials.whatsapp && (
                        <a href={profile.socials.whatsapp} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Phone className="h-6 w-6" /></a>
                    )}
                     {profile.socials.mail && (
                        <a href={`mailto:${profile.socials.mail}`} className="text-slate-400 hover:text-white transition-colors"><Mail className="h-6 w-6" /></a>
                    )}
                    {profile.socials.steam && (
                        <a href={profile.socials.steam} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Gamepad2 className="h-6 w-6" /></a>
                    )}
                </div>
            </motion.div>

            {/* Profile Image - PNG No Background */}
            <motion.div 
                className="flex-1 flex justify-center lg:justify-end"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full" />
                    <img 
                        src={profile.avatar_url} 
                        alt={profile.name} 
                        className="relative z-10 w-full h-full object-contain drop-shadow-2xl" 
                    />
                </div>
            </motion.div>
        </div>
      </div>
    </section>
  );
}
