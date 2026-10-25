import { keepPreviousData, queryOptions } from '@tanstack/react-query';
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
  list: (params: ProjectListParams) =>
    [
      ...projectKeys.lists(),
      {
        page: params.page,
        limit: params.limit,
        tag: params.tag ?? null,
        query: params.query ?? '',
        sort: params.sort ?? 'newest',
      },
    ] as const,
  featured: () => [...projectKeys.all, 'featured'] as const,
  tags: () => [...projectKeys.all, 'tags'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (slug: string) => [...projectKeys.details(), slug] as const,
  admin: () => [...projectKeys.all, 'admin'] as const,
  adjacent: (id: number | undefined, createdAt: string | null | undefined) =>
    [...projectKeys.all, 'adjacent', id, createdAt ?? null] as const,
  related: (id: number | undefined, tags: readonly string[] = []) =>
    [...projectKeys.all, 'related', id, [...tags].sort()] as const,
};

export const projectQueries = {
  list: (params: ProjectListParams) =>
    queryOptions({
      queryKey: projectKeys.list(params),
      queryFn: () => getProjects(params),
      placeholderData: keepPreviousData,
    }),
  featured: () => queryOptions({ queryKey: projectKeys.featured(), queryFn: getFeaturedProjects }),
  tags: () => queryOptions({ queryKey: projectKeys.tags(), queryFn: getProjectTags }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: projectKeys.detail(slug),
      queryFn: () => getProjectBySlug(slug),
      enabled: !!slug,
    }),
  admin: () => queryOptions({ queryKey: projectKeys.admin(), queryFn: getAdminProjects }),
  /** Older/newer neighbours of a project (needs its id and creation date). */
  adjacent: (id: number | undefined, createdAt: string | null | undefined) =>
    queryOptions({
      queryKey: projectKeys.adjacent(id, createdAt),
      queryFn: () => getAdjacentProjects(id!, createdAt!),
      enabled: id !== undefined && !!createdAt,
    }),
  related: (id: number | undefined, tags: readonly string[] = []) =>
    queryOptions({
      queryKey: projectKeys.related(id, tags),
      queryFn: () => getRelatedProjects(id!, [...tags]),
      enabled: id !== undefined,
    }),
};
