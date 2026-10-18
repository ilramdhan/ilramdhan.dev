import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getAdjacentBlogs,
  getAdminBlogs,
  getBlogBySlug,
  getBlogs,
  getBlogTags,
  getComments,
  getFeaturedBlogs,
  getRelatedBlogs,
  type BlogListParams,
} from './api';

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (params: BlogListParams) =>
    [
      ...blogKeys.lists(),
      {
        page: params.page,
        limit: params.limit,
        tag: params.tag ?? null,
        query: params.query ?? '',
        sort: params.sort ?? 'newest',
      },
    ] as const,
  featured: () => [...blogKeys.all, 'featured'] as const,
  tags: () => [...blogKeys.all, 'tags'] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
  admin: () => [...blogKeys.all, 'admin'] as const,
  comments: (blogId: number | undefined) => [...blogKeys.all, 'comments', blogId] as const,
  adjacent: (publishedAt: string | null | undefined) =>
    [...blogKeys.all, 'adjacent', publishedAt ?? null] as const,
  related: (id: number | undefined, tags: readonly string[] = []) =>
    [...blogKeys.all, 'related', id, [...tags].sort()] as const,
};

export const blogQueries = {
  list: (params: BlogListParams) =>
    queryOptions({
      queryKey: blogKeys.list(params),
      queryFn: () => getBlogs(params),
      placeholderData: keepPreviousData,
    }),
  featured: () => queryOptions({ queryKey: blogKeys.featured(), queryFn: getFeaturedBlogs }),
  tags: () => queryOptions({ queryKey: blogKeys.tags(), queryFn: getBlogTags }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: blogKeys.detail(slug),
      queryFn: () => getBlogBySlug(slug),
      enabled: !!slug,
    }),
  admin: () => queryOptions({ queryKey: blogKeys.admin(), queryFn: getAdminBlogs }),
  comments: (blogId: number | undefined) =>
    queryOptions({
      queryKey: blogKeys.comments(blogId),
      queryFn: () => getComments(blogId!),
      enabled: blogId !== undefined,
    }),
  /** Older/newer neighbours of a post (needs its publish date). */
  adjacent: (publishedAt: string | null | undefined) =>
    queryOptions({
      queryKey: blogKeys.adjacent(publishedAt),
      queryFn: () => getAdjacentBlogs(publishedAt!),
      enabled: !!publishedAt,
    }),
  related: (id: number | undefined, tags: readonly string[] = []) =>
    queryOptions({
      queryKey: blogKeys.related(id, tags),
      queryFn: () => getRelatedBlogs(id!, [...tags]),
      enabled: id !== undefined,
    }),
};
