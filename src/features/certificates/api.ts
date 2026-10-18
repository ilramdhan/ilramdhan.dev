import type { Tables, TablesInsert, TablesUpdate } from '@/types';
import { getSupabase } from '@/lib/supabase/lazy';
import { columns } from '@/lib/supabase/columns';
import { distinctSorted, fetchDistinct } from '@/lib/supabase/distinct';
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

export type Certificate = Pick<
  Tables<'certificates'>,
  | 'id'
  | 'title'
  | 'issued_by'
  | 'issued_date'
  | 'expiry_date'
  | 'description'
  | 'credential_url'
  | 'file_url'
>;
export type CertificateInsert = TablesInsert<'certificates'>;

export interface CertificateListParams {
  page: number;
  limit: number;
  query?: string;
  issuer?: string | null;
}

export async function getCertificates(): Promise<Certificate[]> {
  const supabase = await getSupabase();
  return unwrap(
    await supabase
      .from('certificates')
      .select(CERTIFICATE_COLUMNS)
      .order('issued_date', { ascending: false }),
  );
}

export async function getCertificatesPaginated({
  page,
  limit,
  query: search,
  issuer,
}: CertificateListParams) {
  const supabase = await getSupabase();
  let query = supabase
    .from('certificates')
    .select(CERTIFICATE_COLUMNS, { count: 'exact' })
    .order('issued_date', { ascending: false });
  const searchFilter = orIlikeFilter(['title', 'issued_by'], search);
  if (searchFilter) query = query.or(searchFilter);
  if (issuer) query = query.eq('issued_by', issuer);
  return unwrapPage<Certificate>(await query.range(...pageRange(page, limit)));
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
