import { z } from 'zod';
import * as api from '@/features/projects/api';
import type { Project } from '@/features/projects/api';
import { projectKeys } from '@/features/projects/queries';
import { slugify } from '@/lib/slugify';
import * as f from '../fields';
import { defineResource } from '../resource';

const schema = z.object({
  title: f.requiredText(200),
  short_description: f.optionalText(500),
  content: f.markdownText(),
  tech_stack: f.tagsText,
  tags: f.tagsText,
  demo_url: f.optionalUrl,
  repo_url: f.optionalUrl,
  is_featured: z.boolean(),
  images: f.mediaList,
});
type Values = z.infer<typeof schema>;

export const projectsResource = defineResource({
  label: 'Project',
  listKey: projectKeys.admin(),
  fetchList: api.getAdminProjects,
  invalidate: projectKeys.all,
  api: { create: api.addProject, update: api.updateProject, remove: api.deleteProject },
  schema,
  sections: [
    {
      fields: [
        { name: 'title', label: 'Title', kind: 'text' },
        { name: 'short_description', label: 'Short Description', kind: 'textarea', rows: 2 },
        { name: 'content', label: 'Content (Markdown)', kind: 'markdown', rows: 6 },
        { name: 'tech_stack', label: 'Tech Stack (comma-separated)', kind: 'tags' },
        { name: 'tags', label: 'Tags (comma-separated)', kind: 'tags' },
        { name: 'demo_url', label: 'Demo URL', kind: 'url' },
        { name: 'repo_url', label: 'Repo URL', kind: 'url' },
        { name: 'is_featured', label: 'Featured', kind: 'boolean' },
        { name: 'images', label: 'Images', kind: 'images', folder: 'projects' },
      ],
    },
  ],
  empty: (): Values => ({
    title: '',
    short_description: '',
    content: '',
    tech_stack: '',
    tags: '',
    demo_url: '',
    repo_url: '',
    is_featured: false,
    images: f.toMediaList([]),
  }),
  toValues: (p: Project): Values => ({
    title: p.title,
    short_description: p.short_description ?? '',
    content: p.content ?? '',
    tech_stack: f.joinTags(p.tech_stack),
    tags: f.joinTags(p.tags),
    demo_url: p.demo_url ?? '',
    repo_url: p.repo_url ?? '',
    is_featured: p.is_featured,
    images: f.toMediaList(p.images),
  }),
  toPayload: (v: Values) => ({
    title: v.title.trim(),
    slug: slugify(v.title),
    short_description: v.short_description,
    content: v.content,
    tech_stack: f.splitTags(v.tech_stack),
    tags: f.splitTags(v.tags),
    demo_url: f.urlOrNull(v.demo_url),
    repo_url: f.urlOrNull(v.repo_url),
    is_featured: v.is_featured,
    images: v.images.urls,
  }),
});
