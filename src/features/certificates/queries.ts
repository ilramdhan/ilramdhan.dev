import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n/locale';
import {
  getAdminCertificates,
  getCertificateIssuers,
  getCertificates,
  getCertificatesPaginated,
  type CertificateListParams,
} from './api';

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
      queryFn: () => getCertificates(locale),
    }),
  admin: () => queryOptions({ queryKey: certificateKeys.admin(), queryFn: getAdminCertificates }),
  list: (params: CertificateListParams, locale: Locale = 'en') =>
    queryOptions({
      queryKey: certificateKeys.list(params, locale),
      queryFn: () => getCertificatesPaginated(params, locale),
      placeholderData: keepPreviousData,
    }),
  issuers: () =>
    queryOptions({ queryKey: certificateKeys.issuers(), queryFn: getCertificateIssuers }),
};
