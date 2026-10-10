import { z } from 'zod';
import * as api from '@/features/resume/api';
import type { ResumeItem, ResumeType } from '@/features/resume/api';
import { resumeKeys } from '@/features/resume/queries';
import * as f from '../fields';
import { defineResource, type ResourceConfig } from '../resource';
import type { FieldConfig } from '../fields';

const schema = z.object({
  title: f.requiredText(200),
  institution: f.requiredText(200),
  period: f.optionalText(100),
  gpa: f.optionalText(20),
  description: f.markdownText(10_000),
  tags: f.tagsText,
});
type Values = z.infer<typeof schema>;
type Payload = Omit<api.ResumeInsert, 'user_id'>;

const experienceSchema = schema.extend({ period: f.requiredText(100) });

const text = (name: keyof Values, label: string): FieldConfig<Values> => ({
  name,
  label,
  kind: 'text',
});

function resumeResource(type: ResumeType): ResourceConfig<ResumeItem, Values, Payload> {
  const isEdu = type === 'education';
  return defineResource({
    label: isEdu ? 'Education' : 'Experience',
    listKey: resumeKeys.list(type),
    fetchList: () => api.getResume(type),
    api: { create: api.addResumeItem, update: api.updateResumeItem, remove: api.deleteResumeItem },
    schema: isEdu ? schema : experienceSchema,
    sections: [
      {
        columns: 2,
        fields: isEdu
          ? [
              text('title', 'Degree'),
              text('institution', 'School / University'),
              { ...text('period', 'Period'), placeholder: 'Period (e.g. 2015 - 2019)' },
              { ...text('gpa', 'GPA'), placeholder: 'GPA (Optional)' },
            ]
          : [
              text('title', 'Role / Position'),
              text('institution', 'Company Name'),
              {
                ...text('period', 'Period'),
                placeholder: 'Period (e.g. 2020 - Present)',
                wide: true,
              },
            ],
      },
      {
        fields: [
          {
            name: 'description',
            label: 'Description (Markdown)',
            kind: 'markdown',
            rows: isEdu ? 2 : 3,
          },
          { name: 'tags', label: 'Tags (comma-separated)', kind: 'tags' },
        ],
      },
    ],
    empty: (): Values => ({
      title: '',
      institution: '',
      period: '',
      gpa: '',
      description: '',
      tags: '',
    }),
    toValues: (r: ResumeItem): Values => ({
      title: r.title,
      institution: r.institution ?? '',
      period: r.period ?? '',
      gpa: r.gpa ?? '',
      description: r.description ?? '',
      tags: f.joinTags(r.tags),
    }),
    toPayload: (v: Values): Payload => ({
      type,
      title: v.title.trim(),
      institution: v.institution,
      period: v.period,
      description: v.description,
      tags: f.splitTags(v.tags),
      ...(isEdu ? { gpa: v.gpa } : {}),
    }),
  });
}

export const experienceResource = resumeResource('experience');
export const educationResource = resumeResource('education');
