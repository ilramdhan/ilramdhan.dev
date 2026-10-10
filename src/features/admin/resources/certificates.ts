import { z } from 'zod';
import * as api from '@/features/certificates/api';
import type { Certificate } from '@/features/certificates/api';
import { certificateKeys } from '@/features/certificates/queries';
import * as f from '../fields';
import { defineResource } from '../resource';

const schema = z.object({
  title: f.requiredText(200),
  issued_by: f.optionalText(200),
  issued_date: f.optionalDate,
  expiry_date: f.optionalDate,
  description: f.markdownText(10_000),
  credential_url: f.optionalUrl,
  file: f.mediaFile,
});
type Values = z.infer<typeof schema>;

export const certificatesResource = defineResource({
  label: 'Certificate',
  listKey: certificateKeys.full(),
  fetchList: api.getCertificates,
  invalidate: certificateKeys.all,
  api: {
    create: api.addCertificate,
    update: api.updateCertificate,
    remove: api.deleteCertificate,
  },
  schema,
  sections: [
    {
      columns: 2,
      fields: [
        { name: 'title', label: 'Title', kind: 'text' },
        { name: 'issued_by', label: 'Issued By', kind: 'text' },
        { name: 'issued_date', label: 'Issued Date', kind: 'date' },
        { name: 'expiry_date', label: 'Expiry Date', kind: 'date' },
      ],
    },
    {
      fields: [
        { name: 'description', label: 'Description (Markdown)', kind: 'markdown' },
        { name: 'credential_url', label: 'Credential URL', kind: 'url' },
        {
          name: 'file',
          label: 'Certificate File (PDF/Image)',
          kind: 'file',
          folder: 'certificates',
          preview: 'link',
        },
      ],
    },
  ],
  empty: (): Values => ({
    title: '',
    issued_by: '',
    issued_date: '',
    expiry_date: '',
    description: '',
    credential_url: '',
    file: f.toMediaFile(null),
  }),
  toValues: (c: Certificate): Values => ({
    title: c.title,
    issued_by: c.issued_by ?? '',
    issued_date: c.issued_date ?? '',
    expiry_date: c.expiry_date ?? '',
    description: c.description ?? '',
    credential_url: c.credential_url ?? '',
    file: f.toMediaFile(c.file_url),
  }),
  toPayload: (v: Values) => ({
    title: v.title.trim(),
    issued_by: v.issued_by,
    issued_date: f.orNull(v.issued_date),
    expiry_date: f.orNull(v.expiry_date),
    description: v.description,
    credential_url: f.urlOrNull(v.credential_url),
    file_url: v.file.url || null,
  }),
});
