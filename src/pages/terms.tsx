import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Markdown } from '@/components/ui/Markdown';
import { profileQueries } from '@/features/profile/queries';
import { formatDate } from '@/lib/date';
import { Seo } from '@/components/seo/Seo';
import { Link } from '@/i18n/Link';
import { useLocale, useT } from '@/i18n';

// Same classes as privacy.tsx (inlined to keep tile partials out of the entry chunk).
const section = 'w-full scroll-mt-(--nav-h) bg-white text-ink min-h-svh py-section';
const wrap = 'wrap flex flex-col items-center text-center';

export default function TermsPage() {
  const t = useT();
  const locale = useLocale();
  const { data: profile, isLoading } = useQuery(profileQueries.detail(locale));

  if (isLoading) {
    return (
      <section className={section}>
        <div className={wrap}>
          <p>{t.legal.loadingTerms}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <Seo title={t.seo.terms} description={t.seo.termsDescription} />
      <section aria-labelledby="legal-h" className={section}>
        <div className={wrap}>
          <h1 id="legal-h" className="text-tile max-w-[20ch] text-tile-ink">
            {t.seo.terms}
          </h1>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-body text-action underline-offset-4 hover:underline"
          >
            {t.common.backToHome}
          </Link>
          <article className="mx-auto mt-10 w-full max-w-[680px] text-left">
            <p className="mb-8 text-caption text-ink-muted">
              {t.legal.lastUpdated(formatDate(new Date(), locale))}
            </p>
            <Markdown components={{ h1: 'h2' }}>
              {profile?.terms_content || t.legal.noTerms}
            </Markdown>
          </article>
        </div>
      </section>
    </>
  );
}
