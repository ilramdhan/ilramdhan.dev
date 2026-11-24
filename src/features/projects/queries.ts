import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n/locale';
import type { ProjectListParams } from './api';

// ponytail: the data layer (localize, translations retry, ...) is loaded on first fetch so
// it stays out of the initial JS of the routes that only need the query keys (bundle budget).
const api = () => import('./api');

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectListParams, locale: Locale = 'en') =>
    [
      ...projectKeys.lists(),
      {
        locale,
        page: params.page,
        limit: params.limit,
        tag: params.tag ?? null,
        query: params.query ?? '',
        sort: params.sort ?? 'newest',
      },
    ] as const,
  featured: (locale: Locale = 'en') => [...projectKeys.all, 'featured', locale] as const,
  tags: () => [...projectKeys.all, 'tags'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (slug: string, locale: Locale = 'en') =>
    [...projectKeys.details(), slug, locale] as const,
  admin: () => [...projectKeys.all, 'admin'] as const,
  adjacent: (id: number | undefined, createdAt: string | null | undefined, locale: Locale = 'en') =>
    [...projectKeys.all, 'adjacent', id, createdAt ?? null, locale] as const,
  related: (id: number | undefined, tags: readonly string[] = [], locale: Locale = 'en') =>
    [...projectKeys.all, 'related', id, [...tags].sort(), locale] as const,
};

export const projectQueries = {
  list: (params: ProjectListParams, locale: Locale = 'en') =>
    queryOptions({
      queryKey: projectKeys.list(params, locale),
      queryFn: async () => (await api()).getProjects(params, locale),
      placeholderData: keepPreviousData,
    }),
  featured: (locale: Locale = 'en') =>
    queryOptions({
      queryKey: projectKeys.featured(locale),
      queryFn: async () => (await api()).getFeaturedProjects(locale),
    }),
  tags: () =>
    queryOptions({
      queryKey: projectKeys.tags(),
      queryFn: async () => (await api()).getProjectTags(),
    }),
  detail: (slug: string, locale: Locale = 'en') =>
    queryOptions({
      queryKey: projectKeys.detail(slug, locale),
      queryFn: async () => (await api()).getProjectBySlug(slug, locale),
      enabled: !!slug,
    }),
  admin: () =>
    queryOptions({
      queryKey: projectKeys.admin(),
      queryFn: async () => (await api()).getAdminProjects(),
    }),
  /** Older/newer neighbours of a project (needs its id and creation date). */
  adjacent: (id: number | undefined, createdAt: string | null | undefined, locale: Locale = 'en') =>
    queryOptions({
      queryKey: projectKeys.adjacent(id, createdAt, locale),
      queryFn: async () => (await api()).getAdjacentProjects(id!, createdAt!, locale),
      enabled: id !== undefined && !!createdAt,
    }),
  related: (id: number | undefined, tags: readonly string[] = [], locale: Locale = 'en') =>
    queryOptions({
      queryKey: projectKeys.related(id, tags, locale),
      queryFn: async () => (await api()).getRelatedProjects(id!, [...tags], locale),
      enabled: id !== undefined,
    }),
};
