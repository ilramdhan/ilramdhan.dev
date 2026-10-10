import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getCertificateIssuers,
  getCertificates,
  getCertificatesPaginated,
  type CertificateListParams,
} from './api';

export const certificateKeys = {
  all: ['certificates'] as const,
  /** Every certificate (About page, admin). */
  full: () => [...certificateKeys.all, 'all'] as const,
  lists: () => [...certificateKeys.all, 'list'] as const,
  list: (params: CertificateListParams) =>
    [
      ...certificateKeys.lists(),
      {
        page: params.page,
        limit: params.limit,
        issuer: params.issuer ?? null,
        query: params.query ?? '',
      },
    ] as const,
  issuers: () => [...certificateKeys.all, 'issuers'] as const,
};

export const certificateQueries = {
  all: () => queryOptions({ queryKey: certificateKeys.full(), queryFn: getCertificates }),
  list: (params: CertificateListParams) =>
    queryOptions({
      queryKey: certificateKeys.list(params),
      queryFn: () => getCertificatesPaginated(params),
      placeholderData: keepPreviousData,
    }),
  issuers: () =>
    queryOptions({ queryKey: certificateKeys.issuers(), queryFn: getCertificateIssuers }),
};
