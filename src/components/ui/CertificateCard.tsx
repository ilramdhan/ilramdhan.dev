import { Award } from 'lucide-react';
import { Markdown } from '@/components/ui/Markdown';
import { Reveal } from '@/components/motion';
import type { Certificate } from '@/features/certificates/api';
import { formatDate } from '@/lib/date';
import { Img } from '@/components/ui/Img';

interface CertificateCardProps {
  cert: Certificate;
  /** Position in the grid; drives the capped entrance stagger. */
  index: number;
}

export function CertificateCard({ cert, index }: CertificateCardProps) {
  return (
    <Reveal
      index={index}
      className="bg-white border border-slate-200 dark:bg-slate-900/50 dark:border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-[transform,box-shadow,border-color] motion-safe:hover:-translate-y-0.5 hover:shadow-md shadow-sm dark:shadow-none group flex flex-col"
    >
      {cert.file_url ? (
        <div className="h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
          <Img
            src={cert.file_url}
            alt={`${cert.title} certificate${cert.issued_by ? ` issued by ${cert.issued_by}` : ''}`}
            width={1600}
            height={1200}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <Award className="h-12 w-12" />
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{cert.title}</h3>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">{cert.issued_by}</p>
        <p className="text-xs text-slate-500 mb-4">
          {formatDate(cert.issued_date)}
          {cert.expiry_date ? ` - ${formatDate(cert.expiry_date)}` : ''}
        </p>
        <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-1 prose prose-sm dark:prose-invert line-clamp-3">
          <Markdown>{cert.description || ''}</Markdown>
        </div>
        {cert.credential_url && (
          <a
            href={cert.credential_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-auto"
          >
            View Credential &rarr;
          </a>
        )}
      </div>
    </Reveal>
  );
}
