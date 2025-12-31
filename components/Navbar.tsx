import React, { useState } from 'react';
import { Menu, X, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from '../lib/router';
import { useStore } from '../lib/store';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Projects', path: '/projects' },
  { name: 'Blog', path: '/blog' },
  { name: 'Contact', path: '/contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { navigate, path } = useRouter();
  const { isAuthenticated } = useStore();

  const handleNav = (targetPath: string) => {
    if (targetPath === '/contact') {
        // Force navigation to /contact which App.tsx handles by scrolling
        navigate('/contact');
    } else {
        navigate(targetPath);
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 cursor-pointer" onClick={() => handleNav('/')}>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl">
              <Code2 className="h-6 w-6" />
              <span>DevFolio</span>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNav(link.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    path === link.path ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </button>
              ))}
              
              <button 
                onClick={() => handleNav(isAuthenticated ? '/admin' : '/login')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ml-4"
              >
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </button>
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
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
            className="md:hidden border-b border-white/5 bg-slate-950"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNav(link.path)}
                  className="text-left text-slate-300 hover:text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium"
                >
                  {link.name}
                </button>
              ))}
              <button
                 onClick={() => handleNav(isAuthenticated ? '/admin' : '/login')}
                 className="text-left text-indigo-400 hover:text-indigo-300 block px-3 py-2 rounded-md text-base font-medium"
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
