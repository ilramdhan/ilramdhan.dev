import { useQuery } from '@tanstack/react-query';
// Direct module imports, not the barrels (see STATE.md Gotchas).
import { SegmentedControl } from '@/components/tile/SegmentedControl';
import { colVar } from '@/components/tile/stagger';
import { Tile } from '@/components/tile/Tile';
import { TileHeading } from '@/components/tile/TileHeading';
import { FlipGroup } from '@/components/motion/FlipGroup';
import { CertificateCard } from '@/components/ui/CertificateCard';
import { Pagination } from '@/components/ui/Pagination';
import { certificateQueries } from '@/features/certificates/queries';
import { useListParams } from '@/lib/useListParams';
import { Seo } from '@/components/seo/Seo';
import { useLocale, useT } from '@/i18n';

const ITEMS_PER_PAGE = 9;
const ALL = '__all__';
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
      { page: currentPage, limit: ITEMS_PER_PAGE, query: searchQuery, issuer: selectedIssuer },
      locale,
    ),
  );

  const certificates = certData?.data ?? [];
  const totalPages = Math.ceil((certData?.count ?? 0) / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const issuerOptions = [
    { value: ALL, label: t.certificates.allIssuers },
    ...(allIssuers ?? []).map((i) => ({ value: i, label: i })),
  ];

  return (
    <div>
      <Seo title={t.seo.certificates} description={t.seo.certificatesDescription} />

      <Tile labelledBy="certs-h">
        <TileHeading
          id="certs-h"
          as="h1"
          title={t.certificates.heading}
          lead={t.certificates.lead}
          className="animate-rise-still"
        />
        <div className="mt-stack flex w-full flex-col items-center gap-6">
          <label
            htmlFor="cert-search"
            className="-mb-3 block w-full max-w-xl text-left text-caption text-tile-muted"
          >
            {t.certificates.searchLabel}
          </label>
          <input
            id="cert-search"
            type="text"
            placeholder={t.certificates.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-h-12 w-full max-w-xl rounded-full bg-parchment px-6 text-body text-ink outline-hidden placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-0 focus-visible:outline-tile-action"
          />
          {issuerOptions.length > 2 ? (
            <div className="max-w-full overflow-x-auto">
              <SegmentedControl
                label={t.certificates.heading}
                options={issuerOptions}
                value={selectedIssuer ?? ALL}
                onChange={(v) => handleIssuerFilter(v === ALL ? null : v)}
              />
            </div>
          ) : null}
        </div>
      </Tile>

      {/* F-9: white (one surface with the hero, as /projects and /blog), not the footer's parchment. */}
      <Tile labelledBy="certs-list-h" className="min-h-[60svh] pt-0!">
        <h2 id="certs-list-h" className="sr-only">
          {t.certificates.heading}
        </h2>
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
            flipKey={`${selectedIssuer ?? ''}|${searchQuery}|${currentPage}`}
            className={`${GRID} stagger-row`}
          >
            {certificates.map((cert, i) => (
              <li key={cert.id} data-flip-id={cert.id} style={colVar(i, 3)}>
                <CertificateCard cert={cert} />
              </li>
            ))}
          </FlipGroup>
        )}
        <div className="mt-stack">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </Tile>
    </div>
  );
}
