import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './lib/ThemeContext';
import { ScrollToTop } from './components/ScrollToTop';

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

export default function App() {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50 antialiased selection:bg-indigo-500/30">
      <ThemeProvider>
          <BackgroundBeams />
          <Outlet />
          <ScrollToTop />
      </ThemeProvider>
      <Toaster position="bottom-right" theme="system" />
    </div>
  );
}