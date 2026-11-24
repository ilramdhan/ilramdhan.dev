import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/Link';
import { Markdown } from '@/components/ui/Markdown';
import { profileQueries } from '@/features/profile/queries';
import { formatDate } from '@/lib/date';
import { Seo } from '@/components/seo/Seo';
import { useLocale, useT } from '@/i18n';

export default function PrivacyPage() {
  const t = useT();
  const locale = useLocale();
  const { data: profile, isLoading } = useQuery(profileQueries.detail());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p>{t.legal.loadingPrivacy}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-on-dark transition-colors duration-300">
      <Seo title={t.seo.privacy} description={t.seo.privacyDescription} />
      <div className="pt-20 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-on-dark mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {t.common.backToHome}
        </Link>
        <h1 className="text-4xl font-bold mb-8">{t.seo.privacy}</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-slate-500 mb-8">
            {t.legal.lastUpdated(formatDate(new Date(), locale))}
          </p>
          <Markdown components={{ h1: 'h2' }}>
            {profile?.privacy_content || t.legal.noPrivacy}
          </Markdown>
        </div>
      </div>
    </div>
  );
}
