import { queryOptions } from '@tanstack/react-query';
import { getServices } from './api';

export const serviceKeys = {
  all: ['services'] as const,
  list: () => [...serviceKeys.all, 'list'] as const,
};

export const serviceQueries = {
  list: () => queryOptions({ queryKey: serviceKeys.list(), queryFn: getServices }),
};
