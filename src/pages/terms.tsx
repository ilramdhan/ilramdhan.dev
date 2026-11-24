import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Markdown } from '@/components/ui/Markdown';
import { profileQueries } from '@/features/profile/queries';
import { formatDate } from '@/lib/date';
import { Seo } from '@/components/seo/Seo';
import { useLocale, useT } from '@/i18n';
import { Tile } from '@/components/tile/Tile';
import { TileHeading } from '@/components/tile/TileHeading';
import { LinkChevron } from '@/components/tile/LinkChevron';

export default function TermsPage() {
  const t = useT();
  const locale = useLocale();
  const { data: profile, isLoading } = useQuery(profileQueries.detail(locale));

  if (isLoading) {
    return (
      <Tile labelledBy="legal-h" size="screen">
        <p>{t.legal.loadingTerms}</p>
      </Tile>
    );
  }

  return (
    <>
      <Seo title={t.seo.terms} description={t.seo.termsDescription} />
      <Tile labelledBy="legal-h" size="screen">
        <TileHeading
          id="legal-h"
          as="h1"
          title={t.seo.terms}
          align="center"
          links={<LinkChevron href="/">{t.common.backToHome}</LinkChevron>}
        />
        <article className="mx-auto mt-10 max-w-[68ch]">
          <p className="mb-8 text-caption text-ink-muted">
            {t.legal.lastUpdated(formatDate(new Date(), locale))}
          </p>
          <Markdown components={{ h1: 'h2' }}>{profile?.terms_content || t.legal.noTerms}</Markdown>
        </article>
      </Tile>
    </>
  );
}
