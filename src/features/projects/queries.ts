import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getAdminProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getProjects,
  getProjectTags,
  type ProjectListParams,
} from './api';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectListParams) =>
    [
      ...projectKeys.lists(),
      { page: params.page, limit: params.limit, tag: params.tag ?? null },
    ] as const,
  featured: () => [...projectKeys.all, 'featured'] as const,
  tags: () => [...projectKeys.all, 'tags'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (slug: string) => [...projectKeys.details(), slug] as const,
  admin: () => [...projectKeys.all, 'admin'] as const,
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
};
