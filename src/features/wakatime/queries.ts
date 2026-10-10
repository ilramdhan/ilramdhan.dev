import { queryOptions } from '@tanstack/react-query';
import { getWakatimeCodingActivity, getWakatimeStats } from './api';

export const wakatimeKeys = {
  all: ['wakatime'] as const,
  languages: () => [...wakatimeKeys.all, 'languages'] as const,
  activity: () => [...wakatimeKeys.all, 'activity'] as const,
};

// Third-party share links: no retry, the About page hides the section on failure.
export const wakatimeQueries = {
  languages: () =>
    queryOptions({ queryKey: wakatimeKeys.languages(), queryFn: getWakatimeStats, retry: false }),
  activity: () =>
    queryOptions({
      queryKey: wakatimeKeys.activity(),
      queryFn: getWakatimeCodingActivity,
      retry: false,
    }),
};
