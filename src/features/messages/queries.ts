import { queryOptions } from '@tanstack/react-query';
// ponytail: loaded on first fetch to keep api/localize code out of every route's initial JS.
const api = () => import('./api');

export const messageKeys = {
  all: ['messages'] as const,
  list: () => [...messageKeys.all, 'list'] as const,
};

export const messageQueries = {
  list: () =>
    queryOptions({
      queryKey: messageKeys.list(),
      queryFn: async () => (await api()).getMessages(),
    }),
};
