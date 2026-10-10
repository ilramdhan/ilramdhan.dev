import { z } from 'zod';
import * as api from '@/features/tech-stack/api';
import type { TechStack } from '@/features/tech-stack/api';
import { techStackKeys } from '@/features/tech-stack/queries';
import { simpleIconUrl } from '@/lib/slugify';
import * as f from '../fields';
import { defineResource } from '../resource';

const schema = z.object({ name: f.requiredText(100), category: f.optionalText(100) });
type Values = z.infer<typeof schema>;

export const techStackResource = defineResource({
  label: 'Tech',
  listKey: techStackKeys.list(),
  fetchList: api.getTechStack,
  invalidate: techStackKeys.all,
  api: { create: api.addTechStack, update: api.updateTechStack, remove: api.deleteTechStack },
  schema,
  sections: [
    {
      columns: 2,
      fields: [
        {
          name: 'name',
          label: 'Name',
          kind: 'text',
          placeholder: 'Name (e.g. Next.js, Oracle)',
          description:
            'Try different variations if icon doesn\'t appear (e.g. "Oracle" instead of "Oracle DB").',
        },
        {
          name: 'category',
          label: 'Category',
          kind: 'text',
          placeholder: 'Category (e.g. Frontend)',
        },
      ],
    },
  ],
  empty: (): Values => ({ name: '', category: '' }),
  toValues: (t: TechStack): Values => ({ name: t.name, category: t.category ?? '' }),
  // The icon always follows the name (Simple Icons CDN), as before.
  toPayload: (v: Values) => ({
    name: v.name.trim(),
    category: v.category,
    icon_url: simpleIconUrl(v.name),
  }),
});
