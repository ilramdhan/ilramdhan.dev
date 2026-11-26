import { ResourceManager } from '@/features/admin';
import { certificatesResource } from '@/features/admin/resources/certificates';

export function CertificatesTab() {
  return (
    <ResourceManager
      resource={certificatesResource}
      heading="Certificates"
      addLabel="Add Certificate"
      row={(cert) => ({
        title: cert.title,
        meta: [cert.issued_by, cert.issued_date].filter(Boolean).join(', '),
      })}
    />
  );
}
