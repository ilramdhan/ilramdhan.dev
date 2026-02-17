import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { CollapsibleTagFilter } from '../components/CollapsibleTagFilter';
import { getCertificatesPaginated, getCertificateIssuers } from '../lib/api';
import { useDebounce } from '../lib/hooks';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { Award, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

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

  const { data: allIssuers, isLoading: isLoadingIssuers } = useQuery({
    queryKey: ['certificateIssuers'],
    queryFn: getCertificateIssuers,
  });

  const { data: certData, isLoading: isLoadingCerts, isError } = useQuery({
    queryKey: ['certificatesPaginated', currentPage, selectedIssuer, debouncedSearchQuery],
    queryFn: () => getCertificatesPaginated({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      query: debouncedSearchQuery,
      issuer: selectedIssuer,
    }),
    placeholderData: (previousData) => previousData,
  });

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
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
          {isLoadingCerts && Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="rounded-xl bg-slate-200 dark:bg-slate-800/50 aspect-[4/3] animate-pulse" />
          ))}
          {isError && <div className="col-span-full py-20 text-center text-red-500">Error loading certificates.</div>}
          {certificates.map((cert, idx) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-slate-200 dark:bg-slate-900/50 dark:border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all shadow-sm dark:shadow-none group flex flex-col"
            >
              {cert.file_url ? (
                <div className="h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  <img src={cert.file_url} alt={cert.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Award className="h-12 w-12" />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{cert.title}</h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">{cert.issued_by}</p>
                <p className="text-xs text-slate-500 mb-4">{cert.issued_date} {cert.expiry_date ? ` - ${cert.expiry_date}` : ''}</p>
                <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-1 prose prose-sm dark:prose-invert line-clamp-3">
                  <ReactMarkdown>{cert.description || ''}</ReactMarkdown>
                </div>
                {cert.credential_url && (
                  <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-auto">
                    View Credential &rarr;
                  </a>
                )}
              </div>
            </motion.div>
          ))}
          {certificates.length === 0 && !isLoadingCerts && (
            <div className="col-span-full py-20 text-center text-slate-500">
              No certificates found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
