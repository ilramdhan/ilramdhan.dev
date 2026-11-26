import { ResourceManager } from '@/features/admin';
import { servicesResource } from '@/features/admin/resources/services';

export function ServicesTab() {
  return (
    <ResourceManager
      resource={servicesResource}
      heading="Services Management"
      addLabel="Add Service"
      row={(srv) => ({ title: srv.title, meta: srv.description })}
    />
  );
}
