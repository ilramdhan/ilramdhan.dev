import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n/locale';
import type { CertificateListParams } from './api';
// ponytail: loaded on first fetch to keep api/localize code out of every route's initial JS.
const api = () => import('./api');

export const certificateKeys = {
  all: ['certificates'] as const,
  /** Every certificate (About page, admin). */
  full: (locale: Locale = 'en') => [...certificateKeys.all, 'all', locale] as const,
  admin: () => [...certificateKeys.all, 'admin'] as const,
  lists: () => [...certificateKeys.all, 'list'] as const,
  list: (params: CertificateListParams, locale: Locale = 'en') =>
    [
      ...certificateKeys.lists(),
      {
        locale,
        page: params.page,
        limit: params.limit,
        issuer: params.issuer ?? null,
        query: params.query ?? '',
      },
    ] as const,
  issuers: () => [...certificateKeys.all, 'issuers'] as const,
};

export const certificateQueries = {
  all: (locale: Locale = 'en') =>
    queryOptions({
      queryKey: certificateKeys.full(locale),
      queryFn: async () => (await api()).getCertificates(locale),
    }),
  admin: () => queryOptions({ queryKey: certificateKeys.admin(), queryFn: async () => (await api()).getAdminCertificates() }),
  list: (params: CertificateListParams, locale: Locale = 'en') =>
    queryOptions({
      queryKey: certificateKeys.list(params, locale),
      queryFn: async () => (await api()).getCertificatesPaginated(params, locale),
      placeholderData: keepPreviousData,
    }),
  issuers: () =>
    queryOptions({ queryKey: certificateKeys.issuers(), queryFn: async () => (await api()).getCertificateIssuers() }),
};
