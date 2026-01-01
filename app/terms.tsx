'use client';

import React from 'react';
import { Navbar } from '../components/Navbar';
import { useStore } from '../lib/store';

export default function TermsPage() {
  const { profile } = useStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          <div className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-300">
            {profile.terms_content}
          </div>
        </div>
      </div>
    </div>
  );
}