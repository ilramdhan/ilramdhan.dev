import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { CertificateCard } from '@/components/ui/CertificateCard';
import { Pagination } from '@/components/ui/Pagination';
import { Navbar } from '@/app/layouts/Navbar';
import { CollapsibleTagFilter } from '@/components/ui/CollapsibleTagFilter';
import { certificateQueries } from '@/features/certificates/queries';
import { useDebounce } from '@/lib/hooks';
import { useDocumentMeta } from '@/lib/useDocumentMeta';

const ITEMS_PER_PAGE = 9;

export default function CertificatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssuer, setSelectedIssuer] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useDocumentMeta({
    title: 'Certificates',
    description: 'Browse all professional certifications and achievements.',
  });

  const { data: allIssuers, isLoading: isLoadingIssuers } = useQuery(certificateQueries.issuers());

  const {
    data: certData,
    isLoading: isLoadingCerts,
    isError,
  } = useQuery(
    certificateQueries.list({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      query: debouncedSearchQuery,
      issuer: selectedIssuer,
    }),
  );

  const certificates = certData?.data ?? [];
  const totalCerts = certData?.count ?? 0;
  const totalPages = Math.ceil(totalCerts / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIssuerFilter = (issuer: string | null) => {
    setSelectedIssuer(issuer);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Certificates</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Professional certifications, achievements, and credentials.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="max-w-4xl mx-auto mb-12 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-full py-3 pl-12 pr-6 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm shadow-sm"
            />
          </div>

          <div className="flex justify-center">
            <CollapsibleTagFilter
              tags={allIssuers ?? []}
              selectedTag={selectedIssuer}
              onTagClick={handleIssuerFilter}
              maxVisible={6}
              isLoading={isLoadingIssuers}
            />
          </div>
        </div>

        {/* Certificate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {isLoadingCerts &&
            Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-slate-200 dark:bg-slate-800/50 aspect-[4/3] animate-pulse"
              />
            ))}
          {isError && (
            <div className="col-span-full py-20 text-center text-red-500">
              Error loading certificates.
            </div>
          )}
          {certificates.map((cert, idx) => (
            <CertificateCard key={cert.id} cert={cert} delay={idx * 0.05} />
          ))}
          {certificates.length === 0 && !isLoadingCerts && (
            <div className="col-span-full py-20 text-center text-slate-500">
              No certificates found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
