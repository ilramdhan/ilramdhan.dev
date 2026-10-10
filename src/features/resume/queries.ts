import { queryOptions } from '@tanstack/react-query';
import { getResume, type ResumeType } from './api';

export const resumeKeys = {
  all: ['resume'] as const,
  /** `type` is a resume type; admin invalidation passes the row's `type` string. */
  list: (type: string) => [...resumeKeys.all, 'list', type] as const,
};

export const resumeQueries = {
  list: (type: ResumeType) =>
    queryOptions({ queryKey: resumeKeys.list(type), queryFn: () => getResume(type) }),
};
