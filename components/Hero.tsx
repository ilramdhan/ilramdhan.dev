import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Linkedin, Twitter } from 'lucide-react';
import { useStore } from '../lib/store';
import { useRouter } from '../lib/router';

export function Hero() {
  const { profile } = useStore();
  const { navigate } = useRouter();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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

          <div className="mt-10 flex items-center justify-center lg:justify-start gap-6">
            {profile.socials.github && (
                <a href={profile.socials.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                    <Github className="h-6 w-6" />
                </a>
            )}
            {profile.socials.linkedin && (
                <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                    <Linkedin className="h-6 w-6" />
                </a>
            )}
            {profile.socials.twitter && (
                <a href={profile.socials.twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                    <Twitter className="h-6 w-6" />
                </a>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}