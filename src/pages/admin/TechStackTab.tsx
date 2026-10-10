import { Layers } from 'lucide-react';
import { ResourceManager, RowButtons } from '@/features/admin';
import { techStackResource } from '@/features/admin/resources/tech-stack';
import { simpleIconUrl } from '@/lib/slugify';

export function TechStackTab() {
  return (
    <ResourceManager
      className="max-w-4xl"
      resource={techStackResource}
      heading="Tech Stack"
      addLabel="Add Tech"
      listClassName="grid grid-cols-2 md:grid-cols-4 gap-4"
      extra={(form) => <IconPreview url={simpleIconUrl(form.values.name)} />}
      renderRow={(tech, actions) => (
        <div key={tech.id} className="item-card group flex-col items-center text-center p-4">
          {tech.icon_url ? (
            <img
              src={tech.icon_url}
              alt={tech.name}
              className="h-10 w-10 object-contain mb-2 dark:invert"
            />
          ) : (
            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center mb-2">
              <Layers className="h-5 w-5 text-slate-400" aria-hidden />
            </div>
          )}
          <h3 className="font-bold text-sm">{tech.name}</h3>
          <p className="text-xs text-slate-500">{tech.category}</p>
          <RowButtons
            actions={actions}
            label={tech.name}
            iconClassName="h-3 w-3"
            className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
          />
        </div>
      )}
    />
  );
}

function IconPreview({ url }: { url: string | null }) {
  return (
    <div className="flex items-center gap-4 mt-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/10">
      <span className="text-sm font-medium">Icon Preview:</span>
      {url ? (
        <div className="flex items-center gap-2">
          <img
            key={url}
            src={url}
            alt="Preview"
            className="h-8 w-8 object-contain dark:invert"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="text-xs text-slate-400 break-all">{url}</span>
        </div>
      ) : (
        <span className="text-sm text-slate-400">Type a name to see preview</span>
      )}
    </div>
  );
}
