import { useQuery } from '@tanstack/react-query';
// Direct module imports, not the barrels (see STATE.md Gotchas).
import { ListingHero, ListingSection, ListingToolbar } from '@/components/listing/Listing';
import type { SegmentedOption } from '@/components/tile/SegmentedControl';
import { colVar } from '@/components/tile/stagger';
import { FlipGroup } from '@/components/motion/FlipGroup';
import { CertificateCard } from '@/components/ui/CertificateCard';
import { Pagination } from '@/components/ui/Pagination';
import { certificateQueries } from '@/features/certificates/queries';
import { useListParams } from '@/lib/useListParams';
import { Seo } from '@/components/seo/Seo';
import { useLocale, useT } from '@/i18n';

const ITEMS_PER_PAGE = 9;
const GRID = 'grid w-full gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3';

export default function CertificatesPage() {
  const t = useT();
  const locale = useLocale();
  const {
    input: searchInput,
    setInput: setSearchInput,
    query: searchQuery,
    filter: selectedIssuer,
    page: currentPage,
    sort,
    setSort,
    filtersActive,
    clearFilters,
    setFilter: handleIssuerFilter,
    setPage,
  } = useListParams('issuer');

  const { data: allIssuers } = useQuery(certificateQueries.issuers());

  const {
    data: certData,
    isLoading: isLoadingCerts,
    isError,
  } = useQuery(
    certificateQueries.list(
      {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        query: searchQuery,
        issuer: selectedIssuer,
        sort,
      },
      locale,
    ),
  );

  const certificates = certData?.data ?? [];
  const totalPages = Math.ceil((certData?.count ?? 0) / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const issuerOptions: SegmentedOption<string>[] = [
    { value: '', label: t.certificates.allIssuers },
    ...(allIssuers ?? []).map((i) => ({ value: i, label: i })),
  ];

  return (
    <div>
      <Seo title={t.seo.certificates} description={t.seo.certificatesDescription} />

      <ListingHero
        shape="dots"
        side="left"
        id="certs-h"
        title={t.certificates.heading}
        lead={t.certificates.lead}
      />

      <ListingSection id="certs-list-h" title={t.certificates.heading}>
        <ListingToolbar
          id="cert"
          search={{
            label: t.certificates.searchLabel,
            placeholder: t.certificates.searchPlaceholder,
            value: searchInput,
            onChange: setSearchInput,
            clearLabel: t.list.clearSearch,
          }}
          sort={{
            label: t.certificates.sortLabel,
            value: sort,
            onChange: setSort,
            options: [
              { value: 'newest', label: t.list.sortNewest },
              { value: 'oldest', label: t.list.sortOldest },
            ],
          }}
          filter={
            issuerOptions.length > 2
              ? {
                  label: t.certificates.filterLabel,
                  options: issuerOptions,
                  value: selectedIssuer ?? '',
                  onChange: (v) => handleIssuerFilter(v || null),
                }
              : null
          }
          resultLine={
            !isLoadingCerts && (
              <>
                {t.certificates.count(certData?.count ?? 0)}
                {searchQuery && t.list.forQuery(searchQuery)}
                {selectedIssuer && t.list.tagged(selectedIssuer)}
              </>
            )
          }
          clear={filtersActive ? { label: t.list.clearFilters, onClick: clearFilters } : null}
        />
        <div className="mt-6 min-h-[40svh]">
          {isLoadingCerts ? (
            <>
              <span className="sr-only" role="status">
                {t.about.loading}
              </span>
              <ul aria-hidden="true" className={GRID}>
                {Array.from({ length: ITEMS_PER_PAGE }, (_, i) => (
                  <li key={i} className="flex flex-col items-start">
                    <div className="aspect-[4/3] w-full rounded-lg bg-tile-frame motion-safe:animate-pulse" />
                    <div className="mt-4 h-[1.2em] w-2/3 rounded-sm bg-tile-frame text-title" />
                    <div className="mt-1 h-[1.4em] w-1/3 rounded-sm bg-tile-frame text-body" />
                    <div className="mt-1 h-[1.3em] w-1/4 rounded-sm bg-tile-frame text-caption" />
                  </li>
                ))}
              </ul>
            </>
          ) : isError && !certData ? (
            <p className="text-body text-danger">{t.certificates.error}</p>
          ) : certificates.length === 0 ? (
            <p className="text-body text-tile-muted">{t.certificates.none}</p>
          ) : (
            <FlipGroup
              flipKey={`${selectedIssuer ?? ''}|${searchQuery}|${sort}|${currentPage}`}
              className={`${GRID} stagger-row`}
            >
              {certificates.map((cert, i) => (
                <li key={cert.id} data-flip-id={cert.id} style={colVar(i, 3)}>
                  <CertificateCard cert={cert} priority={i === 0} />
                </li>
              ))}
            </FlipGroup>
          )}
        </div>
        <div className="mt-stack">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </ListingSection>
    </div>
  );
}
