import { z } from 'zod';
import * as api from '@/features/services/api';
import type { Service } from '@/features/services/api';
import { serviceKeys } from '@/features/services/queries';
import * as f from '../fields';
import { defineResource } from '../resource';

export const SERVICE_ICONS = ['code', 'smartphone', 'cloud', 'terminal', 'layout', 'database'];

const schema = z.object({
  title: f.requiredText(200),
  description: f.requiredText(5000),
  icon_name: z.string(),
});
type Values = z.infer<typeof schema>;

export const servicesResource = defineResource({
  label: 'Service',
  listKey: serviceKeys.list(),
  fetchList: api.getServices,
  invalidate: serviceKeys.all,
  api: { create: api.addService, update: api.updateService, remove: api.deleteService },
  schema,
  sections: [
    {
      fields: [
        { name: 'title', label: 'Service Title', kind: 'text' },
        { name: 'description', label: 'Description (Markdown)', kind: 'markdown' },
        { name: 'icon_name', label: 'Icon', kind: 'select', options: SERVICE_ICONS },
      ],
    },
  ],
  empty: (): Values => ({ title: '', description: '', icon_name: 'code' }),
  toValues: (s: Service): Values => ({
    title: s.title,
    description: s.description ?? '',
    icon_name: s.icon_name ?? 'code',
  }),
  toPayload: (v: Values) => ({
    title: v.title.trim(),
    description: v.description,
    icon_name: v.icon_name,
  }),
});
