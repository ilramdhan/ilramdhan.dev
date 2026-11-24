import { queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n/locale';
import { getAdminServices, getServices } from './api';

export const serviceKeys = {
  all: ['services'] as const,
  list: (locale: Locale = 'en') => [...serviceKeys.all, 'list', locale] as const,
  admin: () => [...serviceKeys.all, 'admin'] as const,
};

export const serviceQueries = {
  list: (locale: Locale = 'en') =>
    queryOptions({ queryKey: serviceKeys.list(locale), queryFn: () => getServices(locale) }),
  admin: () => queryOptions({ queryKey: serviceKeys.admin(), queryFn: getAdminServices }),
};
