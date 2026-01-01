import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Zap, Save, Loader2 } from 'lucide-react';
import { Database } from '../../types';

type Service = Database['public']['Tables']['services']['Row'];
type ServiceInsert = Database['public']['Tables']['services']['Insert'];

const initialServiceForm: Omit<ServiceInsert, 'id' | 'user_id'> = {
    title: '',
    description: '',
    icon_name: 'code',
};

const ICON_OPTIONS = [
    'code', 'smartphone', 'cloud', 'terminal', 'layout', 'database'
];

export function ServicesTab() {
    const queryClient = useQueryClient();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formState, setFormState] = useState<Partial<ServiceInsert>>(initialServiceForm);

    const { data: services, isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: api.getServices,
    });

    const mutationOptions = {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            setIsFormOpen(false);
        },
    };

    const addMutation = useMutation({ ...mutationOptions, mutationFn: api.addService, onSuccess: () => { mutationOptions.onSuccess(); toast.success('Service added!'); } });
    const updateMutation = useMutation({ ...mutationOptions, mutationFn: api.updateService, onSuccess: () => { mutationOptions.onSuccess(); toast.success('Service updated!'); } });
    const deleteMutation = useMutation({ ...mutationOptions, mutationFn: api.deleteService, onSuccess: () => { mutationOptions.onSuccess(); toast.info('Service removed.'); } });

    useEffect(() => {
        if (isFormOpen && editingService) {
            setFormState(editingService);
        } else {
            setFormState(initialServiceForm);
        }
    }, [editingService, isFormOpen]);

    const handleOpenForm = (service: Service | null) => {
        setEditingService(service);
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingService) {
            updateMutation.mutate({ ...formState, id: editingService.id } as Service);
        } else {
            addMutation.mutate(formState as Omit<ServiceInsert, 'user_id'>);
        }
    };
    
    const isPending = addMutation.isPending || updateMutation.isPending;

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Services Management</h1>
                <button onClick={() => handleOpenForm(null)} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add Service</button>
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="form-container mb-6">
                    <h3 className="font-medium mb-4">{editingService ? 'Edit Service' : 'New Service'}</h3>
                    <input placeholder="Service Title" required value={formState.title || ''} onChange={e => setFormState(p => ({...p, title: e.target.value}))} className="input" />
                    <textarea placeholder="Description (Markdown)" required value={formState.description || ''} onChange={e => setFormState(p => ({...p, description: e.target.value}))} className="input" rows={3} />
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Icon</label>
                        <select 
                            value={formState.icon_name || 'code'} 
                            onChange={e => setFormState(p => ({...p, icon_name: e.target.value}))}
                            className="input"
                        >
                            {ICON_OPTIONS.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={isPending} className="btn-primary">
                             {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                             {editingService ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services?.map(srv => (
                    <div key={srv.id} className="item-card group">
                        <div className="flex items-start gap-3">
                             <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400">
                                <Zap className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{srv.title}</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{srv.description}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenForm(srv)} className="btn-icon-blue"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => deleteMutation.mutate(srv.id)} className="btn-icon-red"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}