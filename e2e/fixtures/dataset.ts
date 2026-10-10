/**
 * Dummy dataset served by the Supabase mock (`supabase-mock.ts`).
 * Ported from the audit harness (`docs/audit/harness/e2e.mjs`). Keys are table names.
 * Add rows/tables here when a spec needs more data; keep it deterministic.
 */
export type Row = Record<string, unknown>;

const now = '2026-01-15T10:00:00.000Z';
/** Content that stresses narrow layouts (long unbroken title, wide code block, table) — see #37. */
const LONG_TITLE = 'Internationalization with React and Supabase';
const LONG_CONTENT = [
  '## Wide content',
  '',
  '```bash',
  `kubectl apply -f https://example.com/${'very-long-path-segment/'.repeat(8)}manifest.yaml --namespace observability`,
  '```',
  '',
  '| Column A | Column B | Column C | Column D | Column E | Column F |',
  '| --- | --- | --- | --- | --- | --- |',
  '| value-aaaaaaaa | value-bbbbbbbb | value-cccccccc | value-dddddddd | value-eeeeeeee | value-ffffffff |',
].join('\n');

// Images live in Supabase Storage like in production (allowed by the CSP); the mock serves an SVG.
const img = (text: string) =>
  `https://mock.supabase.co/storage/v1/object/public/portfolio/${encodeURIComponent(text)}.png`;

export function createDataset(): Record<string, Row[]> {
  return {
    profile: [
      {
        id: 'u1',
        display_name: 'Dummy Dev',
        badge_text: 'Open to work',
        hero_title: 'Web Developer, Backend Engineer, Open Source',
        short_description: 'I build fast web apps.',
        detailed_bio: '## Hi\nThis is **dummy** bio.',
        avatar_url: img('avatar'),
        resume_url: 'example.com/cv.pdf',
        address: 'Jakarta, Indonesia',
        footer_text: '© 2026 Dummy Dev',
        logo_text: 'DummyDev',
        logo_url: null,
        privacy_content: '# Privacy\nDummy.',
        terms_content: '# Terms\nDummy.',
        social_links: {
          github: 'https://github.com/dummy',
          linkedin: 'linkedin.com/in/dummy',
          mail: 'dummy@example.com',
        },
      },
    ],
    projects: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      user_id: 'u1',
      created_at: now,
      title: `Project ${i + 1}`,
      slug: `project-${i + 1}`,
      short_description:
        'A dummy project description that is reasonably long to test clamping behaviour.',
      content: '## Overview\nDummy content\n\n- a\n- b',
      images: [img(`p${i + 1}a`), img(`p${i + 1}b`)],
      tech_stack: ['React', 'Supabase', 'Go'],
      tags: [i % 2 ? 'web' : 'backend', 'oss'],
      demo_url: 'https://example.com',
      repo_url: 'github.com/x/y',
      is_featured: i < 3,
    })).concat({
      id: 99,
      user_id: 'u1',
      created_at: now,
      title: LONG_TITLE,
      slug: 'long-content',
      short_description: 'Project with long, unbroken content.',
      content: LONG_CONTENT,
      images: [img('long')],
      tech_stack: ['Kubernetes'],
      tags: ['oss'],
      demo_url: 'https://example.com',
      repo_url: 'github.com/x/y',
      is_featured: false,
    }),
    blogs: Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      user_id: 'u1',
      created_at: now,
      published_at: now,
      title: `Blog Post ${i + 1}`,
      slug: `blog-post-${i + 1}`,
      excerpt: 'Dummy excerpt.',
      content: '## Heading\nParagraph with `code`.\n\n```js\nconsole.log(1)\n```',
      images: [img(`b${i + 1}`)],
      tags: [i % 2 ? 'react' : 'go'],
      is_featured: i < 2,
    })).concat({
      id: 99,
      user_id: 'u1',
      created_at: now,
      published_at: now,
      title: LONG_TITLE,
      slug: 'long-content',
      excerpt: 'Post with long, unbroken content.',
      content: LONG_CONTENT,
      images: [img('long')],
      tags: ['go'],
      is_featured: false,
    }),
    services: [1, 2, 3].map((i) => ({
      id: i,
      user_id: 'u1',
      title: `Service ${i}`,
      description: 'Dummy **service**',
      icon_name: ['code', 'cloud', 'database'][i - 1],
    })),
    tech_stack: ['React', 'TypeScript', 'Go', 'PostgreSQL', 'Docker'].map((name, i) => ({
      id: i + 1,
      user_id: 'u1',
      name,
      icon_url: null,
      category: 'x',
      created_at: now,
    })),
    resume: [
      {
        id: 1,
        user_id: 'u1',
        type: 'experience',
        title: 'Engineer',
        institution: 'ACME',
        period: '2022 - Now',
        description: 'Did things',
        gpa: null,
        tags: [],
      },
      {
        id: 2,
        user_id: 'u1',
        type: 'education',
        title: 'BSc CS',
        institution: 'Uni',
        period: '2018 - 2022',
        description: '',
        gpa: '3.8',
        tags: [],
      },
    ],
    certificates: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      user_id: 'u1',
      title: `Cert ${i + 1}`,
      description: 'Dummy',
      issued_by: i % 2 ? 'Google' : 'AWS',
      issued_date: '2025-01-01',
      expiry_date: null,
      credential_url: 'https://example.com',
      file_url: img(`c${i + 1}`),
      created_at: now,
    })),
    messages: [
      {
        id: 1,
        created_at: now,
        name: 'Visitor',
        email: 'v@example.com',
        message: 'Hello there',
        is_read: false,
      },
    ],
    blog_comments: [{ id: 1, blog_id: 1, name: 'Reader', content: 'Nice post', created_at: now }],
  };
}
