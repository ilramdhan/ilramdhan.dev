import { queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n/locale';
import { getAdminProfile, getProfile } from './api';

export const profileKeys = {
  all: ['profile'] as const,
  detail: (locale: Locale = 'en') => [...profileKeys.all, 'detail', locale] as const,
  admin: () => [...profileKeys.all, 'admin'] as const,
};

export const profileQueries = {
  /** The single site profile, shared by Navbar, Hero, Footer and the pages. */
  detail: (locale: Locale = 'en') =>
    queryOptions({ queryKey: profileKeys.detail(locale), queryFn: () => getProfile(locale) }),
  /** Untranslated row + `translations` for the admin form. */
  admin: () => queryOptions({ queryKey: profileKeys.admin(), queryFn: getAdminProfile }),
};
