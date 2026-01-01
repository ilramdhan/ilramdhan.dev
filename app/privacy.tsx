'use client';

import React from 'react';
import { Navbar } from '../components/Navbar';
import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api';

export default function PrivacyPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p>Loading privacy policy...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          <div className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-300">
            {profile?.privacy_content || 'No privacy policy content available.'}
          </div>
        </div>
      </div>
    </div>
  );
}