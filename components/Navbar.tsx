'use client';

import React, { useState } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
  });

  const isAuthenticated = !!user;

  const handleNav = (targetPath: string) => {
    if (targetPath.startsWith('/#')) {
        const selector = targetPath.substring(1);
        if (location.pathname === '/') {
             const element = document.querySelector(selector);
             element?.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate('/');
            setTimeout(() => {
                const element = document.querySelector(selector);
                element?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    } else {
        navigate(targetPath);
    }
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Projects', path: '/projects' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/#contact' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 cursor-pointer" onClick={() => handleNav('/')}>
            {isLoadingProfile ? <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> : (
              profile?.logo_url ? (
                  <img 
                    src={profile.logo_url} 
                    alt="Logo" 
                    className="h-8 w-auto object-contain dark:invert transition-all duration-300" 
                  />
              ) : (
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                      <span>{profile?.logo_text || 'DevFolio'}</span>
                  </div>
              )
            )}
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNav(link.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    path === link.path 
                        ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-white/10' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-white/10 pl-6">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                <button 
                    onClick={() => navigate(isAuthenticated ? '/admin' : '/login')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    {isAuthenticated ? 'Dashboard' : 'Sign In'}
                </button>
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden items-center gap-4">
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNav(link.path)}
                  className="text-left text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium"
                >
                  {link.name}
                </button>
              ))}
              <button
                 onClick={() => handleNav(isAuthenticated ? '/admin' : '/login')}
                 className="text-left text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 block px-3 py-2 rounded-md text-base font-medium"
              >
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}