import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Markdown } from '@/components/ui/Markdown';
import { profileQueries } from '@/features/profile/queries';
import { Navbar } from '@/app/layouts/Navbar';
import { formatDate } from '@/lib/date';
import { Seo } from '@/components/seo/Seo';

export default function PrivacyPage() {
  const { data: profile, isLoading } = useQuery(profileQueries.detail());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p>Loading privacy policy...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Seo title="Privacy Policy" description="Privacy Policy for ilramdhan.dev." />
      <Navbar />
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-slate-500 mb-8">Last updated: {formatDate(new Date())}</p>
          <Markdown components={{ h1: 'h2' }}>
            {profile?.privacy_content || 'No privacy policy content available.'}
          </Markdown>
        </div>
      </div>
    </div>
  );
}
