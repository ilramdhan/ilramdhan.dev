import { ResourceManager } from '@/features/admin';
import { blogResource } from '@/features/admin/resources/blog';

export function BlogTab() {
  return (
    <ResourceManager
      resource={blogResource}
      heading="Manage Articles"
      addLabel="Write Article"
      formTitle={(editing) => (editing ? 'Edit Article' : 'Create Article')}
      row={(blog) => ({ title: blog.title, meta: blog.excerpt, image: blog.images?.[0] ?? null })}
    />
  );
}
