import type { ResumeItem } from '@/features/resume/api';
import { ResourceManager, RowButtons, type RowActions } from '@/features/admin';
import { educationResource, experienceResource } from '@/features/admin/resources/resume';

const row = (accent: string) =>
  function ResumeRow(item: ResumeItem, actions: RowActions) {
    return (
      <div key={item.id} className="item-card group">
        <div>
          <h3 className="font-bold">{item.title}</h3>
          <p className={`text-sm ${accent}`}>
            {item.institution} • {item.period}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>
        <RowButtons actions={actions} label={item.title} />
      </div>
    );
  };

export function ResumeTab() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Resume / CV Management</h1>
      <ResourceManager
        className="mb-12"
        variant="section"
        resource={experienceResource}
        heading="Work Experience"
        addLabel="Add"
        listClassName="space-y-4"
        renderRow={row('text-indigo-500')}
      />
      <ResourceManager
        variant="section"
        resource={educationResource}
        heading="Education"
        addLabel="Add"
        listClassName="space-y-4"
        renderRow={row('text-purple-500')}
      />
    </div>
  );
}
