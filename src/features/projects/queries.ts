import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n/locale';
import {
  getAdjacentProjects,
  getAdminProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getProjects,
  getProjectTags,
  getRelatedProjects,
  type ProjectListParams,
} from './api';

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
      queryFn: () => getProjects(params, locale),
      placeholderData: keepPreviousData,
    }),
  featured: (locale: Locale = 'en') =>
    queryOptions({
      queryKey: projectKeys.featured(locale),
      queryFn: () => getFeaturedProjects(locale),
    }),
  tags: () => queryOptions({ queryKey: projectKeys.tags(), queryFn: getProjectTags }),
  detail: (slug: string, locale: Locale = 'en') =>
    queryOptions({
      queryKey: projectKeys.detail(slug, locale),
      queryFn: () => getProjectBySlug(slug, locale),
      enabled: !!slug,
    }),
  admin: () => queryOptions({ queryKey: projectKeys.admin(), queryFn: getAdminProjects }),
  /** Older/newer neighbours of a project (needs its id and creation date). */
  adjacent: (id: number | undefined, createdAt: string | null | undefined, locale: Locale = 'en') =>
    queryOptions({
      queryKey: projectKeys.adjacent(id, createdAt, locale),
      queryFn: () => getAdjacentProjects(id!, createdAt!, locale),
      enabled: id !== undefined && !!createdAt,
    }),
  related: (id: number | undefined, tags: readonly string[] = [], locale: Locale = 'en') =>
    queryOptions({
      queryKey: projectKeys.related(id, tags, locale),
      queryFn: () => getRelatedProjects(id!, [...tags], locale),
      enabled: id !== undefined,
    }),
};
