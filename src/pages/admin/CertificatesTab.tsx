import { FileText } from 'lucide-react';
import { ResourceManager, RowButtons } from '@/features/admin';
import { certificatesResource } from '@/features/admin/resources/certificates';

export function CertificatesTab() {
  return (
    <ResourceManager
      className="max-w-4xl"
      resource={certificatesResource}
      heading="Certificates"
      addLabel="Add Certificate"
      listClassName="grid gap-4"
      renderRow={(cert, actions) => (
        <div key={cert.id} className="item-card group">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-yellow-600 dark:text-yellow-400">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-bold">{cert.title}</h3>
              <p className="text-sm text-slate-500">
                {cert.issued_by} • {cert.issued_date}
              </p>
            </div>
          </div>
          <RowButtons actions={actions} label={cert.title} />
        </div>
      )}
    />
  );
}
