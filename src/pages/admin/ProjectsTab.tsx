import { ResourceManager } from '@/features/admin';
import { projectsResource } from '@/features/admin/resources/projects';

export function ProjectsTab() {
  return (
    <ResourceManager
      resource={projectsResource}
      heading="Manage Projects"
      addLabel="Add Project"
      formTitle={(editing) => (editing ? 'Edit Project' : 'Create Project')}
      row={(project) => ({
        title: project.title,
        meta: project.short_description,
        image: project.images?.[0] ?? null,
      })}
    />
  );
}
