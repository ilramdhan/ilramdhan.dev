import { queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n/locale';
import { getAdminResume, getResume, type ResumeType } from './api';

export const resumeKeys = {
  all: ['resume'] as const,
  /** `type` is a resume type; admin invalidation passes the row's `type` string. */
  list: (type: string, locale: Locale = 'en') => [...resumeKeys.all, 'list', type, locale] as const,
  admin: (type: string) => [...resumeKeys.all, 'admin', type] as const,
};

export const resumeQueries = {
  list: (type: ResumeType, locale: Locale = 'en') =>
    queryOptions({
      queryKey: resumeKeys.list(type, locale),
      queryFn: () => getResume(type, locale),
    }),
  admin: (type: ResumeType) =>
    queryOptions({ queryKey: resumeKeys.admin(type), queryFn: () => getAdminResume(type) }),
};
