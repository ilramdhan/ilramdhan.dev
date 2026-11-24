import { queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n/locale';
// ponytail: loaded on first fetch to keep api/localize code out of every route's initial JS.
const api = () => import('./api');

export const serviceKeys = {
  all: ['services'] as const,
  list: (locale: Locale = 'en') => [...serviceKeys.all, 'list', locale] as const,
  admin: () => [...serviceKeys.all, 'admin'] as const,
};

export const serviceQueries = {
  list: (locale: Locale = 'en') =>
    queryOptions({ queryKey: serviceKeys.list(locale), queryFn: async () => (await api()).getServices(locale) }),
  admin: () => queryOptions({ queryKey: serviceKeys.admin(), queryFn: async () => (await api()).getAdminServices() }),
};
