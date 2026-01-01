'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Mail, LogOut, FileText, User, ExternalLink, Briefcase, Zap, Award, Layers, Menu, X } from 'lucide-react';
import { ProjectsTab } from './admin/ProjectsTab';
import { ResumeTab } from './admin/ResumeTab';
import { ServicesTab } from './admin/ServicesTab';
import { BlogTab } from './admin/BlogTab';
import { ProfileTab } from './admin/ProfileTab';
import { MessagesTab } from './admin/MessagesTab';
import { CertificatesTab } from './admin/CertificatesTab';
import { TechStackTab } from './admin/TechStackTab';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'services' | 'projects' | 'blog' | 'messages' | 'certificates' | 'techstack'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.info("Logged out successfully");
  };

  const tabs = {
    overview: <ProfileTab />,
    resume: <ResumeTab />,
    services: <ServicesTab />,
    projects: <ProjectsTab />,
    blog: <BlogTab />,
    messages: <MessagesTab />,
    certificates: <CertificatesTab />,
    techstack: <TechStackTab />,
  }

  const menuItems = [
    {id: 'overview', icon: User, label: 'Overview'},
    {id: 'resume', icon: Briefcase, label: 'Resume'},
    {id: 'services', icon: Zap, label: 'Services'},
    {id: 'projects', icon: FolderKanban, label: 'Projects'},
    {id: 'blog', icon: FileText, label: 'Blog'},
    {id: 'messages', icon: Mail, label: 'Messages'},
    {id: 'certificates', icon: Award, label: 'Certificates'},
    {id: 'techstack', icon: Layers, label: 'Tech Stack'},
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors relative">
      
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
          >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 hidden md:block fixed h-full overflow-y-auto pb-20 transition-colors z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">A</div>
            <span className="font-bold text-slate-900 dark:text-white">Admin Panel</span>
          </div>
          
          <div className="space-y-1">
            <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mb-4 border border-slate-200 dark:border-white/5 bg-white dark:bg-transparent">
                <ExternalLink className="h-4 w-4" /> Back to Website
            </button>

            {menuItems.map(t => (
                <button 
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
                </button>
            ))}
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 mt-8"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                />
                <motion.aside 
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="md:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 z-50 overflow-y-auto pb-20"
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">A</div>
                                <span className="font-bold text-slate-900 dark:text-white">Admin</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500"><X className="h-6 w-6" /></button>
                        </div>
                        
                        <div className="space-y-1">
                            <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mb-4 border border-slate-200 dark:border-white/5 bg-white dark:bg-transparent">
                                <ExternalLink className="h-4 w-4" /> Back to Website
                            </button>

                            {menuItems.map(t => (
                                <button 
                                key={t.id}
                                onClick={() => { setActiveTab(t.id as any); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                >
                                <t.icon className="h-4 w-4" />
                                <span>{t.label}</span>
                                </button>
                            ))}
                            
                            <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 mt-8"
                            >
                            <LogOut className="h-4 w-4" /> Logout
                            </button>
                        </div>
                    </div>
                </motion.aside>
            </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto min-h-screen pt-16 md:pt-8">
        {tabs[activeTab]}
      </main>
    </div>
  );
}