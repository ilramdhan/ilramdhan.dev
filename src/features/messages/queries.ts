import { queryOptions } from '@tanstack/react-query';
import { getMessages } from './api';

export const messageKeys = {
  all: ['messages'] as const,
  list: () => [...messageKeys.all, 'list'] as const,
};

export const messageQueries = {
  list: () => queryOptions({ queryKey: messageKeys.list(), queryFn: getMessages }),
};
