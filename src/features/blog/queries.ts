import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { Locale } from '@/i18n/locale';
import type { BlogListParams } from './api';

// ponytail: the data layer (localize, translations retry, ...) is loaded on first fetch so
// it stays out of the initial JS of the routes that only need the query keys (bundle budget).
const api = () => import('./api');

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (params: BlogListParams, locale: Locale = 'en') =>
    [
      ...blogKeys.lists(),
      {
        locale,
        page: params.page,
        limit: params.limit,
        tag: params.tag ?? null,
        query: params.query ?? '',
        sort: params.sort ?? 'newest',
      },
    ] as const,
  featured: (locale: Locale = 'en') => [...blogKeys.all, 'featured', locale] as const,
  tags: () => [...blogKeys.all, 'tags'] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slug: string, locale: Locale = 'en') => [...blogKeys.details(), slug, locale] as const,
  admin: () => [...blogKeys.all, 'admin'] as const,
  comments: (blogId: number | undefined) => [...blogKeys.all, 'comments', blogId] as const,
  adjacent: (
    id: number | undefined,
    publishedAt: string | null | undefined,
    locale: Locale = 'en',
  ) => [...blogKeys.all, 'adjacent', id, publishedAt ?? null, locale] as const,
  related: (id: number | undefined, tags: readonly string[] = [], locale: Locale = 'en') =>
    [...blogKeys.all, 'related', id, [...tags].sort(), locale] as const,
};

export const blogQueries = {
  list: (params: BlogListParams, locale: Locale = 'en') =>
    queryOptions({
      queryKey: blogKeys.list(params, locale),
      queryFn: async () => (await api()).getBlogs(params, locale),
      placeholderData: keepPreviousData,
    }),
  featured: (locale: Locale = 'en') =>
    queryOptions({
      queryKey: blogKeys.featured(locale),
      queryFn: async () => (await api()).getFeaturedBlogs(locale),
    }),
  tags: () =>
    queryOptions({ queryKey: blogKeys.tags(), queryFn: async () => (await api()).getBlogTags() }),
  detail: (slug: string, locale: Locale = 'en') =>
    queryOptions({
      queryKey: blogKeys.detail(slug, locale),
      queryFn: async () => (await api()).getBlogBySlug(slug, locale),
      enabled: !!slug,
    }),
  admin: () =>
    queryOptions({
      queryKey: blogKeys.admin(),
      queryFn: async () => (await api()).getAdminBlogs(),
    }),
  comments: (blogId: number | undefined) =>
    queryOptions({
      queryKey: blogKeys.comments(blogId),
      queryFn: async () => (await api()).getComments(blogId!),
      enabled: blogId !== undefined,
    }),
  /** Older/newer neighbours of a post (needs its id and publish date). */
  adjacent: (
    id: number | undefined,
    publishedAt: string | null | undefined,
    locale: Locale = 'en',
  ) =>
    queryOptions({
      queryKey: blogKeys.adjacent(id, publishedAt, locale),
      queryFn: async () => (await api()).getAdjacentBlogs(id!, publishedAt!, locale),
      enabled: id !== undefined && !!publishedAt,
    }),
  related: (id: number | undefined, tags: readonly string[] = [], locale: Locale = 'en') =>
    queryOptions({
      queryKey: blogKeys.related(id, tags, locale),
      queryFn: async () => (await api()).getRelatedBlogs(id!, [...tags], locale),
      enabled: id !== undefined,
    }),
};
