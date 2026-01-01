import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './lib/ThemeContext';
import { ScrollToTop } from './components/ScrollToTop';
import { useQuery } from '@tanstack/react-query';
import * as api from './lib/api';

// Global Background Animation
function BackgroundBeams() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-white dark:bg-slate-950 pointer-events-none transition-colors duration-300">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-900/10 blur-[120px] animate-pulse" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-purple-500/10 dark:bg-purple-900/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-900/10 blur-[150px] animate-pulse" style={{ animationDelay: '4s' }} />
    </div>
  );
}

function Footer() {
    const navigate = useNavigate();
    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: api.getProfile,
    });

    return (
        <footer className="bg-white border-t border-slate-200 dark:bg-slate-950/90 dark:border-white/5 py-12 backdrop-blur-md transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <span className="text-slate-500 text-sm">
                        {profile?.footer_text}
                    </span>
                    <div className="flex gap-6">
                        <button onClick={() => navigate('/privacy')} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm">Privacy Policy</button>
                        <button onClick={() => navigate('/terms')} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm">Terms of Service</button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default function App() {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50 antialiased selection:bg-indigo-500/30 flex flex-col">
      <ThemeProvider>
          <BackgroundBeams />
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
          <ScrollToTop />
      </ThemeProvider>
      <Toaster position="bottom-right" theme="system" />
    </div>
  );
}