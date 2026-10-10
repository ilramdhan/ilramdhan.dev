import { Image } from 'lucide-react';
import { ResourceManager, RowButtons } from '@/features/admin';
import { blogResource } from '@/features/admin/resources/blog';

export function BlogTab() {
  return (
    <ResourceManager
      resource={blogResource}
      heading="Manage Articles"
      addLabel="Write Article"
      addButtonClassName="btn-primary"
      formClassName="mb-8 p-6 bg-white dark:bg-slate-900 border rounded-xl space-y-4"
      formTitle={(editing) => (editing ? 'Edit Article' : 'Create Article')}
      listClassName="grid gap-4"
      renderRow={(blog, actions) => (
        <div
          key={blog.id}
          className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-lg group"
        >
          <div className="flex items-center gap-4">
            {blog.images?.[0] ? (
              <img src={blog.images[0]} alt="" className="h-10 w-16 object-cover rounded" />
            ) : (
              <div className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400">
                <Image aria-hidden />
              </div>
            )}
            <div>
              <h4 className="font-medium">{blog.title}</h4>
              <p className="text-sm text-slate-500">{blog.excerpt}</p>
            </div>
          </div>
          <RowButtons actions={actions} label={blog.title} className="flex items-center gap-3" />
        </div>
      )}
    />
  );
}
