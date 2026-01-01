import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';
import { Database } from '../../types';

type Service = Database['public']['Tables']['services']['Row'];
type ServiceInsert = Database['public']['Tables']['services']['Insert'];

const initialServiceForm: Omit<ServiceInsert, 'id' | 'user_id' | 'created_at'> = {
    title: '',
    description: '',
    icon_name: 'code',
};

export function ServicesTab() {
    const queryClient = useQueryClient();

    // --- State ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formState, setFormState] = useState<Partial<ServiceInsert>>(initialServiceForm);

    // --- Query ---
    const { data: services, isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: api.getServices,
    });

    // --- Mutations ---
    const addMutation = useMutation({
        mutationFn: (newItem: Omit<ServiceInsert, 'user_id'>) => api.addService(newItem),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.success('Service added!');
            setIsFormOpen(false);
        },
    });
    const updateMutation = useMutation({
        mutationFn: (updatedItem: Partial<Service> & { id: number }) => api.updateService(updatedItem),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.success('Service updated!');
            setIsFormOpen(false);
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.deleteService(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.info('Service removed.');
        },
    });

    // --- Effect ---
    useEffect(() => {
        if (editingService) {
            setFormState(editingService);
        } else {
            setFormState(initialServiceForm);
        }
    }, [editingService]);

    // --- Handlers ---
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

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Services Management</h1>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Offered Services</h2>
                <button onClick={() => handleOpenForm(null)} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700">
                    <Plus className="h-4 w-4" /> Add
                </button>
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 dark:bg-slate-900 p-6 rounded-xl dark:border-white/10 mb-6 space-y-4 shadow-sm">
                    <h3 className="text-slate-900 dark:text-white font-medium mb-2">{editingService ? 'Edit Service' : 'New Service'}</h3>
                    <input placeholder="Service Title" required value={formState.title || ''} onChange={e => setFormState(prev => ({...prev, title: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-slate-900 dark:text-white" />
                    <textarea placeholder="Description" required value={formState.description || ''} onChange={e => setFormState(prev => ({...prev, description: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-slate-900 dark:text-white" rows={3} />
                    <input placeholder="Icon Name (e.g. 'code')" value={formState.icon_name || ''} onChange={e => setFormState(prev => ({...prev, icon_name: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-slate-900 dark:text-white" />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-500 dark:text-slate-400 text-sm">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">{editingService ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services?.map(srv => (
                    <div key={srv.id} className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-white/10 p-4 rounded-lg flex justify-between items-start group shadow-sm">
                        <div className="flex items-start gap-3">
                             <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400">
                                <Zap className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{srv.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 leading-relaxed">{srv.description}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenForm(srv)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => deleteMutation.mutate(srv.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}