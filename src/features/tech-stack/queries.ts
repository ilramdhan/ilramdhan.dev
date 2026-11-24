import { queryOptions } from '@tanstack/react-query';
// ponytail: loaded on first fetch to keep api/localize code out of every route's initial JS.
const api = () => import('./api');

export const techStackKeys = {
  all: ['tech-stack'] as const,
  list: () => [...techStackKeys.all, 'list'] as const,
};

export const techStackQueries = {
  list: () => queryOptions({ queryKey: techStackKeys.list(), queryFn: async () => (await api()).getTechStack() }),
};
