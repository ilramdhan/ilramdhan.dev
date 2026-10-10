import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast }));
const uploadAll = vi.hoisted(() => vi.fn<(jobs: unknown[]) => Promise<string[]>>());
vi.mock('@/lib/upload', async (orig) => ({
  ...(await orig<typeof import('@/lib/upload')>()),
  uploadAll,
}));
// Supabase is never reached: every resource below talks to mocked api functions.
vi.mock('@/lib/supabase/client', () => ({ supabase: {} }));

const { changedFields } = await import('./diff');
const { defineResource } = await import('./resource');
const { useCrudResource } = await import('./useCrudResource');
const { ResourceForm } = await import('./ResourceForm');
const { ResourceManager, RowButtons } = await import('./ResourceManager');
const f = await import('./fields');
const { resolveUploads } = await import('./uploads');

interface Row {
  id: number;
  title: string;
  site_url: string | null;
  tags: string[] | null;
  images: string[] | null;
  user_id: string;
  created_at: string;
}
const ROWS: Row[] = [
  {
    id: 1,
    title: 'First',
    site_url: 'https://a.example',
    tags: ['x'],
    images: ['https://cdn/a.png'],
    user_id: 'u1',
    created_at: '2026-01-01',
  },
  { id: 2, title: 'Second', site_url: null, tags: [], images: [], user_id: 'u1', created_at: '' },
];

const schema = z.object({
  title: f.requiredText(20),
  site_url: f.optionalUrl,
  tags: f.tagsText,
  images: f.mediaList,
});
type Values = z.infer<typeof schema>;

function makeResource() {
  const api = {
    create: vi.fn<(payload: unknown) => Promise<void>>(() => Promise.resolve()),
    update: vi.fn<(patch: unknown) => Promise<void>>(() => Promise.resolve()),
    remove: vi.fn<(id: number) => Promise<void>>(() => Promise.resolve()),
  };
  const fetchList = vi.fn(() => Promise.resolve(ROWS.map((r) => ({ ...r }))));
  const resource = defineResource({
    label: 'Thing',
    listKey: ['things', 'admin'],
    invalidate: ['things'],
    fetchList,
    api,
    schema,
    sections: [
      {
        fields: [
          { name: 'title', label: 'Title', kind: 'text' },
          { name: 'site_url', label: 'Site URL', kind: 'url' },
          { name: 'tags', label: 'Tags', kind: 'tags' },
          { name: 'images', label: 'Images', kind: 'images', folder: 'projects' },
        ],
      },
    ],
    empty: (): Values => ({ title: '', site_url: '', tags: '', images: f.toMediaList([]) }),
    toValues: (r: Row): Values => ({
      title: r.title,
      site_url: r.site_url ?? '',
      tags: f.joinTags(r.tags),
      images: f.toMediaList(r.images),
    }),
    toPayload: (v: Values) => ({
      title: v.title.trim(),
      site_url: f.urlOrNull(v.site_url),
      tags: f.splitTags(v.tags),
      images: v.images.urls,
    }),
  });
  return { resource, api, fetchList };
}

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('changedFields', () => {
  it('keeps only changed entries and treats null/""/[] as the same empty value', () => {
    expect(
      changedFields<Record<string, unknown>>(
        { a: 'x', b: 'same', c: [], d: '', e: ['n'], f: { k: 1 } },
        { a: 'y', b: 'same', c: null, d: null, e: ['m'], f: { k: 1 } },
      ),
    ).toEqual({ a: 'x', e: ['n'] });
  });
});

describe('field helpers', () => {
  it('validates optional URLs (scheme optional, host required)', () => {
    expect(f.isUrlLike('')).toBe(true);
    expect(f.isUrlLike('github.com/me')).toBe(true);
    expect(f.isUrlLike('https://x.dev/a?b=1')).toBe(true);
    expect(f.isUrlLike('not a url')).toBe(false);
    expect(f.isUrlLike('javascript:alert(1)')).toBe(false);
    expect(f.isUrlLike('localhost')).toBe(false);
  });

  it('splits/joins comma-separated tags', () => {
    expect(f.splitTags(' a, b ,, c ')).toEqual(['a', 'b', 'c']);
    expect(f.joinTags(['a', 'b'])).toBe('a, b');
    expect(f.joinTags(null)).toBe('');
  });
});

describe('resolveUploads', () => {
  it('uploads picked images/files in one batch and swaps them for URLs', async () => {
    uploadAll.mockResolvedValue([
      'https://cdn/new1.png',
      'https://cdn/new2.png',
      'https://cdn/c.pdf',
    ]);
    const a = new File(['a'], 'a.png', { type: 'image/png' });
    const b = new File(['b'], 'b.png', { type: 'image/png' });
    const c = new File(['c'], 'c.pdf', { type: 'application/pdf' });
    const out = await resolveUploads(
      [
        {
          fields: [
            { name: 'images', label: 'Images', kind: 'images', folder: 'projects' },
            { name: 'cv', label: 'CV', kind: 'file', folder: 'cv', preview: 'link' },
          ],
        },
      ],
      { images: { urls: ['https://cdn/old.png'], files: [a, b] }, cv: { url: '', file: c } },
    );
    expect(uploadAll).toHaveBeenCalledTimes(1);
    expect(uploadAll.mock.calls[0]![0]).toHaveLength(3);
    expect(out).toEqual({
      images: {
        urls: ['https://cdn/old.png', 'https://cdn/new1.png', 'https://cdn/new2.png'],
        files: [],
      },
      cv: { url: 'https://cdn/c.pdf', file: null },
    });
  });

  it('does not touch Storage when nothing was picked', async () => {
    const values = { images: { urls: [], files: [] } };
    await expect(
      resolveUploads(
        [{ fields: [{ name: 'images', label: 'I', kind: 'images', folder: 'blogs' }] }],
        values,
      ),
    ).resolves.toBe(values);
    expect(uploadAll).not.toHaveBeenCalled();
  });
});

describe('useCrudResource', () => {
  it('loads the list', async () => {
    const { resource } = makeResource();
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(resource), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.list.data).toHaveLength(2));
  });

  it('creates with the mapped payload, toasts and refetches', async () => {
    const { resource, api, fetchList } = makeResource();
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(resource), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    await act(() =>
      result.current.create({
        title: ' New ',
        site_url: 'new.example',
        tags: 'a, b',
        images: f.toMediaList([]),
      }),
    );
    expect(api.create).toHaveBeenCalledWith({
      title: 'New',
      site_url: 'https://new.example',
      tags: ['a', 'b'],
      images: [],
    });
    expect(toast.success).toHaveBeenCalledWith('Thing added!');
    await waitFor(() => expect(fetchList).toHaveBeenCalledTimes(2));
  });

  it('sends only the changed fields (never id/user_id/created_at) on update', async () => {
    const { resource, api } = makeResource();
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(resource), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    const row = ROWS[0]!;
    await act(() => result.current.update(row, { ...resource.toValues(row), title: 'Renamed' }));
    expect(api.update).toHaveBeenCalledWith({ id: 1, title: 'Renamed' });
    expect(toast.success).toHaveBeenCalledWith('Thing updated!');
  });

  it('skips the request when an edit changed nothing', async () => {
    const { resource, api } = makeResource();
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(resource), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    const row = ROWS[1]!;
    await act(() => result.current.update(row, resource.toValues(row)));
    expect(api.update).not.toHaveBeenCalled();
  });

  it('removes a row from the cached list optimistically', async () => {
    const { resource, api } = makeResource();
    let finish!: () => void;
    api.remove.mockImplementation(() => new Promise<void>((r) => (finish = r)));
    const { client, Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(resource), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    act(() => result.current.remove.mutate(1));
    await waitFor(() =>
      expect(client.getQueryData<Row[]>(['things', 'admin'])?.map((r) => r.id)).toEqual([2]),
    );
    finish();
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Thing removed.'));
  });

  it('restores the list and shows the error when a delete fails', async () => {
    const { resource, api, fetchList } = makeResource();
    api.remove.mockRejectedValue(new Error('permission denied'));
    fetchList.mockImplementation(() => new Promise(() => {})); // keep the restored cache visible
    const { client, Wrapper } = wrapper();
    client.setQueryData(['things', 'admin'], ROWS);
    const { result } = renderHook(() => useCrudResource(resource), { wrapper: Wrapper });

    act(() => result.current.remove.mutate(1));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('permission denied'));
    expect(client.getQueryData<Row[]>(['things', 'admin'])).toHaveLength(2);
  });

  it('surfaces create errors as a toast', async () => {
    const { resource, api } = makeResource();
    api.create.mockRejectedValue(new Error('duplicate key'));
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCrudResource(resource), { wrapper: Wrapper });
    await act(() =>
      result.current
        .create({ title: 'x', site_url: '', tags: '', images: f.toMediaList([]) })
        .catch(() => {}),
    );
    expect(toast.error).toHaveBeenCalledWith('duplicate key');
  });
});

describe('ResourceForm', () => {
  it('shows zod errors inline and does not submit invalid values', async () => {
    const onSubmit = vi.fn();
    const { resource } = makeResource();
    render(
      <ResourceForm
        sections={resource.sections}
        schema={schema}
        defaultValues={resource.empty()}
        onSubmit={onSubmit}
        isPending={false}
        submitLabel="Save"
      />,
    );
    await userEvent.type(screen.getByLabelText('Site URL'), 'not a url');
    await userEvent.type(screen.getByLabelText('Title'), 'x'.repeat(21));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription('At most 20 characters');
    expect(screen.getByLabelText('Site URL')).toHaveAccessibleDescription('Enter a valid URL');
    expect(screen.getByLabelText('Site URL')).toHaveAttribute('aria-invalid', 'true');

    // Fixing a field clears its error right away.
    await userEvent.clear(screen.getByLabelText('Site URL'));
    expect(screen.getByLabelText('Site URL')).not.toHaveAttribute('aria-invalid');
  });

  it('flags a missing required field', async () => {
    const onSubmit = vi.fn();
    const { resource } = makeResource();
    render(
      <ResourceForm
        sections={resource.sections}
        schema={schema}
        defaultValues={resource.empty()}
        onSubmit={onSubmit}
        isPending={false}
        submitLabel="Save"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription('Required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits parsed values and lets existing images be removed', async () => {
    const onSubmit = vi.fn();
    const { resource } = makeResource();
    render(
      <ResourceForm
        sections={resource.sections}
        schema={schema}
        defaultValues={resource.toValues(ROWS[0]!)}
        onSubmit={onSubmit}
        isPending={false}
        submitLabel="Update"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove image' }));
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'First',
      site_url: 'https://a.example',
      tags: 'x',
      images: { urls: [], files: [] },
    });
  });
});

describe('ResourceManager', () => {
  it('opens the form for create/edit and closes it after saving', async () => {
    const { resource, api } = makeResource();
    const { Wrapper } = wrapper();
    render(
      <Wrapper>
        <ResourceManager
          resource={resource}
          heading="Things"
          addLabel="Add Thing"
          listClassName="list"
          renderRow={(row, actions) => (
            <div key={row.id}>
              {row.title}
              <RowButtons actions={actions} label={row.title} />
            </div>
          )}
        />
      </Wrapper>,
    );
    await screen.findByText('First');

    await userEvent.click(screen.getByRole('button', { name: 'Edit First' }));
    expect(screen.getByRole('heading', { name: 'Edit Thing' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('First');
    await userEvent.type(screen.getByLabelText('Title'), '!');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith({ id: 1, title: 'First!' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Edit Thing' })).toBeNull());

    await userEvent.click(screen.getByRole('button', { name: /Add Thing/ }));
    expect(screen.getByLabelText('Title')).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Title')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Second' }));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(2));
  });
});
