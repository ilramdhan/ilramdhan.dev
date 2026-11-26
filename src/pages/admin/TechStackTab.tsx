import { ResourceManager } from '@/features/admin';
import { techStackResource } from '@/features/admin/resources/tech-stack';
import { simpleIconUrl } from '@/lib/slugify';

export function TechStackTab() {
  return (
    <ResourceManager
      resource={techStackResource}
      heading="Tech Stack"
      addLabel="Add Tech"
      iconThumbs
      extra={(form) => <IconPreview url={simpleIconUrl(form.values.name)} />}
      row={(tech) => ({ title: tech.name, meta: tech.category, image: tech.icon_url ?? null })}
    />
  );
}

function IconPreview({ url }: { url: string | null }) {
  return (
    <div className="flex items-center gap-4 rounded-md bg-parchment p-4">
      <span className="text-caption font-semibold text-ink">Icon Preview:</span>
      {url ? (
        <div className="flex min-w-0 items-center gap-3">
          <img
            key={url}
            src={url}
            alt="Preview"
            className="size-8 object-contain"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="text-caption break-all text-ink-muted">{url}</span>
        </div>
      ) : (
        <span className="text-caption text-ink-muted">Type a name to see preview</span>
      )}
    </div>
  );
}
