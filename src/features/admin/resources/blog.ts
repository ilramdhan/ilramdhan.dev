import { z } from 'zod';
import * as api from '@/features/blog/api';
import type { Blog } from '@/features/blog/api';
import { blogKeys } from '@/features/blog/queries';
import { slugify } from '@/lib/slugify';
import * as f from '../fields';
import { defineResource } from '../resource';

const schema = z.object({
  title: f.requiredText(200),
  excerpt: f.optionalText(500),
  content: f.markdownText(),
  tags: f.tagsText,
  is_featured: z.boolean(),
  images: f.mediaList,
});
type Values = z.infer<typeof schema>;

export const blogResource = defineResource({
  label: 'Article',
  listKey: blogKeys.admin(),
  fetchList: api.getAdminBlogs,
  invalidate: blogKeys.all,
  api: { create: api.addBlog, update: api.updateBlog, remove: api.deleteBlog },
  schema,
  sections: [
    {
      fields: [
        { name: 'title', label: 'Title', kind: 'text' },
        { name: 'excerpt', label: 'Excerpt', kind: 'textarea', rows: 2 },
        {
          name: 'content',
          label: 'Content (Markdown)',
          kind: 'markdown',
          rows: 10,
          folder: 'blogs',
        },
        { name: 'tags', label: 'Tags (comma-separated)', kind: 'tags' },
        { name: 'is_featured', label: 'Featured', kind: 'boolean' },
        { name: 'images', label: 'Images', kind: 'images', folder: 'blogs' },
      ],
    },
  ],
  empty: (): Values => ({
    title: '',
    excerpt: '',
    content: '',
    tags: '',
    is_featured: false,
    images: f.toMediaList([]),
  }),
  toValues: (b: Blog): Values => ({
    title: b.title,
    excerpt: b.excerpt ?? '',
    content: b.content ?? '',
    tags: f.joinTags(b.tags),
    is_featured: b.is_featured,
    images: f.toMediaList(b.images),
  }),
  toPayload: (v: Values, row: Blog | null) => ({
    title: v.title.trim(),
    slug: slugify(v.title),
    excerpt: v.excerpt,
    content: v.content,
    tags: f.splitTags(v.tags),
    is_featured: v.is_featured,
    images: v.images.urls,
    published_at: row?.published_at || new Date().toISOString(),
  }),
});
