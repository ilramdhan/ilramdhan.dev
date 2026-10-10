import { Image } from 'lucide-react';
import { ResourceManager, RowButtons } from '@/features/admin';
import { projectsResource } from '@/features/admin/resources/projects';

export function ProjectsTab() {
  return (
    <ResourceManager
      resource={projectsResource}
      heading="Manage Projects"
      addLabel="Add Project"
      addButtonClassName="btn-primary"
      formClassName="mb-8 p-6 bg-white dark:bg-slate-900 border rounded-xl space-y-4"
      formTitle={(editing) => (editing ? 'Edit Project' : 'Create Project')}
      listClassName="grid gap-4"
      renderRow={(project, actions) => (
        <div
          key={project.id}
          className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-lg group"
        >
          <div className="flex items-center gap-4">
            {project.images?.[0] ? (
              <img src={project.images[0]} alt="" className="h-10 w-16 object-cover rounded" />
            ) : (
              <div className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400">
                <Image aria-hidden />
              </div>
            )}
            <div>
              <h4 className="font-medium">{project.title}</h4>
              <p className="text-sm text-slate-500">{project.short_description}</p>
            </div>
          </div>
          <RowButtons actions={actions} label={project.title} className="flex items-center gap-3" />
        </div>
      )}
    />
  );
}
