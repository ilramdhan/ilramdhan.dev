import { queryOptions } from '@tanstack/react-query';
import { getProfile } from './api';

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
};

export const profileQueries = {
  /** The single site profile, shared by Navbar, Hero, Footer and the pages. */
  detail: () => queryOptions({ queryKey: profileKeys.detail(), queryFn: getProfile }),
};
