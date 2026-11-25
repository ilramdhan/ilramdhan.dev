import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { distinctSorted, fetchDistinct } from '@/lib/supabase/distinct';
import { selectWithTranslations } from '@/lib/supabase/translations';
import { localizeAll, type Localized } from '@/i18n/localize';
import type { Locale } from '@/i18n/locale';
import { assertOk, pageRange, unwrap, withoutId, unwrapPage } from '@/lib/supabase/result';
import { orIlikeFilter } from '@/lib/search';

/** Everything the public cards and the admin form read (all but bookkeeping columns). */
export const CERTIFICATE_COLUMNS = columns(
  'certificates',
  'id',
  'title',
  'issued_by',
  'issued_date',
  'expiry_date',
  'description',
  'credential_url',
  'file_url',
);

export const CERTIFICATE_TRANSLATED_FIELDS = ['title', 'description'] as const;

export type Certificate = Localized<
  Pick<
    Tables<'certificates'>,
    | 'id'
    | 'title'
    | 'issued_by'
    | 'issued_date'
    | 'expiry_date'
    | 'description'
    | 'credential_url'
    | 'file_url'
  >
> & { translations?: Tables<'certificates'>['translations'] };
export type CertificateInsert = TablesInsert<'certificates'>;

export interface CertificateListParams {
  page: number;
  limit: number;
  query?: string;
  issuer?: string | null;
  sort?: 'newest' | 'oldest';
}

const localized = (rows: readonly object[], locale: Locale) =>
  localizeAll(rows, locale, CERTIFICATE_TRANSLATED_FIELDS) as Certificate[];

async function fetchCertificates(withTranslations: boolean) {
  const supabase = await getSupabase();
  return unwrap(
    await selectWithTranslations(withTranslations, CERTIFICATE_COLUMNS, (cols) =>
      supabase
        .from('certificates')
        .select(cols as typeof CERTIFICATE_COLUMNS)
        .order('issued_date', { ascending: false }),
    ),
  );
}

export async function getCertificates(locale: Locale = 'en'): Promise<Certificate[]> {
  return localized(await fetchCertificates(locale !== 'en'), locale);
}

/** Admin list: English rows with their raw `translations` (when the column exists). */
export async function getAdminCertificates(): Promise<Certificate[]> {
  return await fetchCertificates(true);
}

// Search and the issuer filter match the English columns whatever the locale.
export async function getCertificatesPaginated(
  { page, limit, query: search, issuer, sort }: CertificateListParams,
  locale: Locale = 'en',
) {
  const supabase = await getSupabase();
  const searchFilter = orIlikeFilter(['title', 'issued_by'], search);
  const result = await selectWithTranslations(locale !== 'en', CERTIFICATE_COLUMNS, (cols) => {
    let query = supabase
      .from('certificates')
      .select(cols as typeof CERTIFICATE_COLUMNS, { count: 'exact' })
      .order('issued_date', { ascending: sort === 'oldest' });
    if (searchFilter) query = query.or(searchFilter);
    if (issuer) query = query.eq('issued_by', issuer);
    return query.range(...pageRange(page, limit));
  });
  const { data, count } = unwrapPage<object>(result);
  return { data: localized(data, locale), count };
}

export function getCertificateIssuers(): Promise<string[]> {
  return fetchDistinct('certificate_issuers', async () => {
    const supabase = await getSupabase();
    const rows = unwrap(await supabase.from('certificates').select('issued_by'));
    return distinctSorted(rows.map((c) => c.issued_by));
  });
}

export async function addCertificate(cert: CertificateInsert): Promise<Certificate> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase.from('certificates').insert(cert).select(CERTIFICATE_COLUMNS).single(),
  );
}

export async function updateCertificate(
  updates: TablesUpdate<'certificates'> & { id: number },
): Promise<Certificate> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase
      .from('certificates')
      .update(withoutId(updates))
      .eq('id', updates.id)
      .select(CERTIFICATE_COLUMNS)
      .single(),
  );
}

export async function deleteCertificate(id: number): Promise<void> {
  const supabase = await getSupabase();
  assertOk(await supabase.from('certificates').delete().eq('id', id));
}
