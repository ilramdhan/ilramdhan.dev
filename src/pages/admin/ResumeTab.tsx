import type { ResumeItem } from '@/features/resume/api';
import { ResourceManager } from '@/features/admin';
import { educationResource, experienceResource } from '@/features/admin/resources/resume';

const row = (item: ResumeItem) => ({
  title: item.title,
  meta: [item.institution, item.period].filter(Boolean).join(', '),
});

export function ResumeTab() {
  return (
    <>
      <h1 tabIndex={-1} className="text-section font-semibold text-ink outline-none">
        Resume / CV Management
      </h1>
      <div className="mt-10">
        <ResourceManager
          variant="section"
          resource={experienceResource}
          heading="Work Experience"
          addLabel="Add"
          row={row}
        />
        <ResourceManager
          variant="section"
          resource={educationResource}
          heading="Education"
          addLabel="Add"
          row={row}
        />
      </div>
    </>
  );
}
