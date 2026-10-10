import { Zap } from 'lucide-react';
import { ResourceManager, RowButtons } from '@/features/admin';
import { servicesResource } from '@/features/admin/resources/services';

export function ServicesTab() {
  return (
    <ResourceManager
      className="max-w-4xl"
      resource={servicesResource}
      heading="Services Management"
      addLabel="Add Service"
      listClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
      renderRow={(srv, actions) => (
        <div key={srv.id} className="item-card group">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400">
              <Zap className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-bold text-sm">{srv.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                {srv.description}
              </p>
            </div>
          </div>
          <RowButtons
            actions={actions}
            label={srv.title}
            className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
          />
        </div>
      )}
    />
  );
}
