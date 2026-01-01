import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, Loader2, Layers } from 'lucide-react';
import { Database } from '../../types';

type TechStack = Database['public']['Tables']['tech_stack']['Row'];
type TechStackInsert = Database['public']['Tables']['tech_stack']['Insert'];

const initialTechForm: Omit<TechStackInsert, 'id' | 'user_id' | 'created_at'> = {
    name: '',
    icon_url: '',
    category: '',
};

export function TechStackTab() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTech, setEditingTech] = useState<TechStack | null>(null);
    const [formState, setFormState] = useState<Partial<TechStackInsert>>(initialTechForm);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data: techStack, isLoading } = useQuery({
        queryKey: ['techStack'],
        queryFn: api.getTechStack,
    });

    const mutationOptions = {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['techStack'] });
            setIsFormOpen(false);
        },
    };

    const addMutation = useMutation({ ...mutationOptions, mutationFn: api.addTechStack, onSuccess: () => { mutationOptions.onSuccess(); toast.success('Tech added!'); } });
    const updateMutation = useMutation({ ...mutationOptions, mutationFn: api.updateTechStack, onSuccess: () => { mutationOptions.onSuccess(); toast.success('Tech updated!'); } });
    const deleteMutation = useMutation({ ...mutationOptions, mutationFn: api.deleteTechStack, onSuccess: () => { mutationOptions.onSuccess(); toast.info('Tech removed.'); } });

    useEffect(() => {
        if (isFormOpen && editingTech) {
            setFormState(editingTech);
            setPreviewUrl(editingTech.icon_url || null);
        } else {
            setFormState(initialTechForm);
            setPreviewUrl(null);
        }
    }, [editingTech, isFormOpen]);

    // Update preview URL when name changes
    useEffect(() => {
        if (formState.name) {
            // Simple slugify: lowercase, remove special chars, remove spaces
            const slug = formState.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Special cases mapping if needed, though most follow the rule above
            // e.g. 'c++' -> 'cplusplus', 'c#' -> 'csharp' - Simple Icons handles some, but basic slug is usually enough
            // For Oracle, it seems 'oracle' is the slug. 'Oracle DB' -> 'oracledb' might not exist.
            // Let's try to be smart or allow manual override if needed (but user asked for auto)
            
            // Better slugify for Simple Icons:
            // 1. Lowercase
            // 2. Replace '+' with 'plus'
            // 3. Replace '.' with 'dot'
            // 4. Remove other special chars
            let processedSlug = formState.name.toLowerCase();
            processedSlug = processedSlug.replace(/\+/g, 'plus');
            processedSlug = processedSlug.replace(/\./g, 'dot');
            processedSlug = processedSlug.replace(/[^a-z0-9]/g, '');

            setPreviewUrl(`https://cdn.simpleicons.org/${processedSlug}`);
        } else {
            setPreviewUrl(null);
        }
    }, [formState.name]);

    const handleOpenForm = (tech: TechStack | null) => {
        setEditingTech(tech);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = { ...formState, icon_url: previewUrl };

        if (editingTech) {
            updateMutation.mutate({ ...payload, id: editingTech.id } as TechStack);
        } else {
            addMutation.mutate(payload as Omit<TechStackInsert, 'user_id'>);
        }
    };

    const isPending = addMutation.isPending || updateMutation.isPending;

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Tech Stack</h1>
                <button onClick={() => handleOpenForm(null)} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add Tech</button>
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="form-container mb-6">
                    <h3 className="font-medium mb-4">{editingTech ? 'Edit Tech' : 'New Tech'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input 
                                placeholder="Name (e.g. Next.js, Oracle)" 
                                required 
                                value={formState.name || ''} 
                                onChange={e => setFormState(p => ({...p, name: e.target.value}))} 
                                className="input" 
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Try different variations if icon doesn't appear (e.g. "Oracle" instead of "Oracle DB").
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <input 
                                placeholder="Category (e.g. Frontend)" 
                                value={formState.category || ''} 
                                onChange={e => setFormState(p => ({...p, category: e.target.value}))} 
                                className="input" 
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/10">
                        <span className="text-sm font-medium">Icon Preview:</span>
                        {previewUrl ? (
                            <div className="flex items-center gap-2">
                                <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className="h-8 w-8 object-contain dark:invert" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        // Optionally show a fallback or error message here
                                    }}
                                    onLoad={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'block';
                                    }}
                                />
                                <span className="text-xs text-slate-400 break-all">{previewUrl}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400">Type a name to see preview</span>
                        )}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={isPending} className="btn-primary">
                             {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                             {editingTech ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {techStack?.map(tech => (
                    <div key={tech.id} className="item-card group flex-col items-center text-center p-4">
                        {tech.icon_url ? (
                            <img src={tech.icon_url} alt={tech.name} className="h-10 w-10 object-contain mb-2 dark:invert" />
                        ) : (
                            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center mb-2"><Layers className="h-5 w-5 text-slate-400"/></div>
                        )}
                        <h3 className="font-bold text-sm">{tech.name}</h3>
                        <p className="text-xs text-slate-500">{tech.category}</p>
                        
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenForm(tech)} className="btn-icon-blue"><Edit className="h-3 w-3" /></button>
                            <button onClick={() => deleteMutation.mutate(tech.id)} className="btn-icon-red"><Trash2 className="h-3 w-3" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}