'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Mail, LogOut, FileText, User, ExternalLink, Briefcase, Zap } from 'lucide-react';
import { ProjectsTab } from './admin/ProjectsTab';
import { ResumeTab } from './admin/ResumeTab';
import { ServicesTab } from './admin/ServicesTab';
import { BlogTab } from './admin/BlogTab';
import { ProfileTab } from './admin/ProfileTab';
import { MessagesTab } from './admin/MessagesTab';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'services' | 'projects' | 'blog' | 'messages'>('overview');
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
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex pt-16 transition-colors">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 hidden md:block fixed h-full overflow-y-auto pb-20 transition-colors">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">A</div>
            <span className="font-bold text-slate-900 dark:text-white">Admin Panel</span>
          </div>
          
          <div className="space-y-1">
            <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mb-4 border border-slate-200 dark:border-white/5 bg-white dark:bg-transparent">
                <ExternalLink className="h-4 w-4" /> Back to Website
            </button>

            {[
                {id: 'overview', icon: User, label: 'Overview'},
                {id: 'resume', icon: Briefcase, label: 'Resume'},
                {id: 'services', icon: Zap, label: 'Services'},
                {id: 'projects', icon: FolderKanban, label: 'Projects'},
                {id: 'blog', icon: FileText, label: 'Blog'},
                {id: 'messages', icon: Mail, label: 'Messages'},
            ].map(t => (
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

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto h-[calc(100vh-4rem)]">
        <div className="md:hidden flex justify-between items-center mb-8">
             <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Panel</h2>
             <div className="flex gap-4">
                 <button onClick={() => navigate('/')} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><ExternalLink className="h-5 w-5"/></button>
                 <button onClick={handleLogout} className="text-red-500 dark:text-red-400"><LogOut className="h-5 w-5"/></button>
             </div>
        </div>

        {tabs[activeTab]}

      </main>
    </div>
  );
}
