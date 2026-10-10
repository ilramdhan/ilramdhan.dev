import { queryOptions } from '@tanstack/react-query';
import { getTechStack } from './api';

export const techStackKeys = {
  all: ['tech-stack'] as const,
  list: () => [...techStackKeys.all, 'list'] as const,
};

export const techStackQueries = {
  list: () => queryOptions({ queryKey: techStackKeys.list(), queryFn: getTechStack }),
};
