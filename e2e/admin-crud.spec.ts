import type { Page } from '@playwright/test';
import type { SupabaseMock } from './fixtures/supabase-mock';
import { signIn } from './fixtures/session';
import { expect, test } from './fixtures/test';

// T-17 (#32): every admin resource goes through the generic CRUD (create, edit, delete).

async function openTab(page: Page, label: string) {
  const sidebar = page.locator('aside').first();
  if (!(await sidebar.isVisible())) await page.getByRole('button', { name: 'Open menu' }).click();
  await page.locator('aside:visible').getByRole('button', { name: label, exact: true }).click();
}

const writes = (mock: SupabaseMock, method: string, table: string) =>
  mock.requests.filter((r) => r.method === method && r.path.startsWith(`/rest/v1/${table}`));
const lastBody = (mock: SupabaseMock, method: string, table: string) =>
  JSON.parse(writes(mock, method, table).at(-1)?.body ?? 'null') as Record<string, unknown>;

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'General Settings' })).toBeVisible();
});

test('projects: create, edit (only changed fields) and delete', async ({ page, supabase }) => {
  await openTab(page, 'Projects');
  await page.getByRole('button', { name: 'Add Project' }).click();
  await page.getByLabel('Title').fill('My New Project');
  await page.getByLabel('Tech Stack (comma-separated)').fill('React, Go');
  await page.getByLabel('Demo URL').fill('demo.example.com');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Project added!')).toBeVisible();
  expect(lastBody(supabase, 'POST', 'projects')).toMatchObject({
    title: 'My New Project',
    slug: 'my-new-project',
    tech_stack: ['React', 'Go'],
    demo_url: 'https://demo.example.com',
    user_id: expect.any(String),
  });
  await expect(page.getByRole('heading', { name: 'Create Project' })).toBeHidden();

  await page.getByRole('button', { name: 'Edit Project 1', exact: true }).click();
  await expect(page.getByLabel('Title')).toHaveValue('Project 1');
  await page.getByLabel('Title').fill('Project One');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Project updated!')).toBeVisible();
  // Only changed fields: title + slug, plus repo_url because the stored value lacked a
  // scheme and the form normalises URLs on save (as before).
  expect(lastBody(supabase, 'PATCH', 'projects')).toEqual({
    title: 'Project One',
    slug: 'project-one',
    repo_url: 'https://github.com/x/y',
  });
  expect(writes(supabase, 'PATCH', 'projects').at(-1)?.path).toContain('id=eq.1');

  await page.getByRole('button', { name: 'Delete Project 2', exact: true }).click();
  await expect(page.getByText('Project removed.')).toBeVisible();
  expect(writes(supabase, 'DELETE', 'projects').at(-1)?.path).toContain('id=eq.2');
});

test('invalid input is shown inline and nothing is sent', async ({ page, supabase }) => {
  await openTab(page, 'Projects');
  await page.getByRole('button', { name: 'Add Project' }).click();
  await page.getByLabel('Repo URL').fill('not a url');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByLabel('Title')).toHaveAccessibleDescription('Required');
  await expect(page.getByLabel('Repo URL')).toHaveAccessibleDescription('Enter a valid URL');
  expect(writes(supabase, 'POST', 'projects')).toHaveLength(0);
});

test('blog: create, edit and delete', async ({ page, supabase }) => {
  await openTab(page, 'Blog');
  await page.getByRole('button', { name: 'Write Article' }).click();
  await page.getByLabel('Title').fill('Hello World');
  await page.getByLabel('Tags (comma-separated)').fill('go, react');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Article added!')).toBeVisible();
  expect(lastBody(supabase, 'POST', 'blogs')).toMatchObject({
    title: 'Hello World',
    slug: 'hello-world',
    tags: ['go', 'react'],
    published_at: expect.any(String),
  });

  await page.getByRole('button', { name: 'Edit Blog Post 1', exact: true }).click();
  await page.getByLabel('Excerpt').fill('New excerpt');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Article updated!')).toBeVisible();
  expect(lastBody(supabase, 'PATCH', 'blogs')).toEqual({ excerpt: 'New excerpt' });

  await page.getByRole('button', { name: 'Delete Blog Post 3', exact: true }).click();
  await expect(page.getByText('Article removed.')).toBeVisible();
  expect(writes(supabase, 'DELETE', 'blogs').at(-1)?.path).toContain('id=eq.3');
});

test('certificates: create, edit and delete', async ({ page, supabase }) => {
  await openTab(page, 'Certificates');
  await page.getByRole('button', { name: 'Add Certificate' }).click();
  await page.getByLabel('Title').fill('CKA');
  await page.getByLabel('Issued By').fill('CNCF');
  await page.getByLabel('Issued Date').fill('2026-02-03');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Certificate added!')).toBeVisible();
  expect(lastBody(supabase, 'POST', 'certificates')).toMatchObject({
    title: 'CKA',
    issued_by: 'CNCF',
    issued_date: '2026-02-03',
    expiry_date: null,
  });

  await page.getByRole('button', { name: 'Edit Cert 1', exact: true }).click();
  await page.getByLabel('Credential URL').fill('creds.example.com/1');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Certificate updated!')).toBeVisible();
  expect(lastBody(supabase, 'PATCH', 'certificates')).toEqual({
    credential_url: 'https://creds.example.com/1',
  });

  await page.getByRole('button', { name: 'Delete Cert 2', exact: true }).click();
  await expect(page.getByText('Certificate removed.')).toBeVisible();
});

test('services: create, edit and delete', async ({ page, supabase }) => {
  await openTab(page, 'Services');
  await page.getByRole('button', { name: 'Add Service' }).click();
  await page.getByLabel('Service Title').fill('Consulting');
  await page.getByLabel('Description (Markdown)').fill('I **consult**.');
  await page.getByLabel('Icon').selectOption('cloud');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Service added!')).toBeVisible();
  expect(lastBody(supabase, 'POST', 'services')).toMatchObject({
    title: 'Consulting',
    description: 'I **consult**.',
    icon_name: 'cloud',
  });

  await page.getByRole('button', { name: 'Edit Service 1', exact: true }).click();
  await page.getByLabel('Icon').selectOption('terminal');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Service updated!')).toBeVisible();
  expect(lastBody(supabase, 'PATCH', 'services')).toEqual({ icon_name: 'terminal' });

  await page.getByRole('button', { name: 'Delete Service 3', exact: true }).click();
  await expect(page.getByText('Service removed.')).toBeVisible();
});

test('tech stack: icon follows the name; create, edit and delete', async ({ page, supabase }) => {
  await openTab(page, 'Tech Stack');
  await page.getByRole('button', { name: 'Add Tech' }).click();
  await page.getByLabel('Name').fill('Next.js');
  await expect(page.getByText('https://cdn.simpleicons.org/nextdotjs')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Tech added!')).toBeVisible();
  expect(lastBody(supabase, 'POST', 'tech_stack')).toMatchObject({
    name: 'Next.js',
    icon_url: 'https://cdn.simpleicons.org/nextdotjs',
  });

  await page.getByRole('button', { name: 'Edit Go', exact: true }).click();
  await page.getByLabel('Category').fill('Backend');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Tech updated!')).toBeVisible();
  // icon_url was null in the dataset, so it is (re)generated from the name as before.
  expect(lastBody(supabase, 'PATCH', 'tech_stack')).toEqual({
    category: 'Backend',
    icon_url: 'https://cdn.simpleicons.org/go',
  });

  await page.getByRole('button', { name: 'Delete Docker', exact: true }).click();
  await expect(page.getByText('Tech removed.')).toBeVisible();
});

test('resume: experience and education CRUD', async ({ page, supabase }) => {
  await openTab(page, 'Resume');
  await page.getByRole('button', { name: 'Add' }).first().click();
  await page.getByLabel('Role / Position').fill('CTO');
  await page.getByLabel('Company Name').fill('Startup');
  await page.getByLabel('Period').fill('2025 - Now');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Experience added!')).toBeVisible();
  expect(lastBody(supabase, 'POST', 'resume')).toMatchObject({
    type: 'experience',
    title: 'CTO',
    institution: 'Startup',
    period: '2025 - Now',
  });

  await page.getByRole('button', { name: 'Edit BSc CS', exact: true }).click();
  await page.getByLabel('GPA').fill('3.9');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByText('Education updated!')).toBeVisible();
  expect(lastBody(supabase, 'PATCH', 'resume')).toEqual({ gpa: '3.9' });

  await page.getByRole('button', { name: 'Delete Engineer', exact: true }).click();
  await expect(page.getByText('Experience removed.')).toBeVisible();
  expect(writes(supabase, 'DELETE', 'resume').at(-1)?.path).toContain('id=eq.1');
});

test('profile: saves only changed fields and normalises social links', async ({
  page,
  supabase,
}) => {
  await page.getByLabel('Badge Text').fill('Hiring');
  await page.getByLabel('Twitter URL').fill('x.com/dummy');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Profile updated!')).toBeVisible();
  const body = lastBody(supabase, 'PATCH', 'profile');
  expect(Object.keys(body).sort()).toEqual(['badge_text', 'social_links']);
  expect(body.social_links).toMatchObject({
    github: 'https://github.com/dummy',
    linkedin: 'https://linkedin.com/in/dummy',
    twitter: 'https://x.com/dummy',
    mail: 'dummy@example.com',
  });

  await page.getByLabel('Email Address').fill('nope');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByLabel('Email Address')).toHaveAccessibleDescription(
    'Enter a valid email address',
  );
});
