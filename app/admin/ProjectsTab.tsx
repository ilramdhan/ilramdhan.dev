import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Save, Loader2, Image, Trash } from 'lucide-react';
import { Database } from '../../types';
import { supabase } from '../../lib/supabase/client';
import { ensureFullUrl } from '../../lib/utils';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

const initialProjectForm: Omit<ProjectInsert, 'user_id' | 'id' | 'created_at' | 'slug'> = {
    title: '',
    short_description: '',
    content: '',
    images: [],
    tech_stack: [],
    tags: [],
    demo_url: '',
    repo_url: '',
    is_featured: false,
};

// Helper to generate a slug
const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function ProjectsTab() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    
    // Form state for various input types
    const [formState, setFormState] = useState<Partial<ProjectInsert>>(initialProjectForm);
    const [tagsStr, setTagsStr] = useState('');
    const [techStackStr, setTechStackStr] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    const { data: projectsData, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.getProjects({ page: 1, limit: 100 }),
    });
    const projects = projectsData?.data || [];

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setIsFormOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    };

    const addMutation = useMutation({
        ...mutationOptions,
        mutationFn: api.addProject,
        onSuccess: () => {
            mutationOptions.onSuccess();
            toast.success("Project added!");
        }
    });

    const updateMutation = useMutation({
        ...mutationOptions,
        mutationFn: api.updateProject,
        onSuccess: () => {
            mutationOptions.onSuccess();
            toast.success("Project updated!");
        }
    });

    const deleteMutation = useMutation({
        ...mutationOptions,
        mutationFn: api.deleteProject,
        onSuccess: () => {
            mutationOptions.onSuccess();
            toast.info("Project removed.");
        }
    });

    useEffect(() => {
        if (isFormOpen) {
            if (editingProject) {
                setFormState(editingProject);
                setTagsStr(editingProject.tags?.join(', ') || '');
                setTechStackStr(editingProject.tech_stack?.join(', ') || '');
            } else {
                setFormState(initialProjectForm);
                setTagsStr('');
                setTechStackStr('');
            }
            setFiles([]);
        }
    }, [editingProject, isFormOpen]);

    const handleOpenForm = (project: Project | null) => {
        setEditingProject(project);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let newImageUrls: string[] = [];
        if (files.length > 0) {
            const uploadPromises = files.map(async file => {
                const fileName = `${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage
                    .from('ilramdhan.dev')
                    .upload(`projects/${fileName}`, file);
                
                if (error) throw new Error(`Image Upload Error: ${error.message}`);
                
                const { data: { publicUrl } } = supabase.storage.from('ilramdhan.dev').getPublicUrl(data.path);
                return publicUrl;
            });
            
            try {
                newImageUrls = await Promise.all(uploadPromises);
            } catch (error: any) {
                toast.error(error.message);
                return;
            }
        }

        const finalPayload: Partial<ProjectInsert> = {
            ...formState,
            slug: generateSlug(formState.title || ''),
            tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
            tech_stack: techStackStr.split(',').map(t => t.trim()).filter(Boolean),
            images: [...(formState.images || []), ...newImageUrls],
            demo_url: ensureFullUrl(formState.demo_url),
            repo_url: ensureFullUrl(formState.repo_url),
        };

        if (editingProject) {
            updateMutation.mutate({ ...finalPayload, id: editingProject.id } as Project);
        } else {
            addMutation.mutate(finalPayload as Omit<ProjectInsert, 'user_id'>);
        }
    };
    
    const isPending = addMutation.isPending || updateMutation.isPending;

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Projects</h1>
                <button onClick={() => handleOpenForm(null)} className="btn-primary">
                    <Plus className="h-4 w-4" /> Add Project
                </button>
            </div>

            {isFormOpen && (
                <div className="mb-8 p-6 bg-white dark:bg-slate-900 border rounded-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-lg font-bold">{editingProject ? 'Edit Project' : 'Create Project'}</h3>
                        <input required placeholder="Title" value={formState.title || ''} onChange={e => setFormState(prev => ({...prev, title: e.target.value}))} className="input" />
                        <textarea placeholder="Short Description" value={formState.short_description || ''} onChange={e => setFormState(prev => ({...prev, short_description: e.target.value}))} className="input" rows={2}/>
                        <textarea placeholder="Content (Markdown)" value={formState.content || ''} onChange={e => setFormState(prev => ({...prev, content: e.target.value}))} className="input" rows={6}/>
                        <input placeholder="Tech Stack (comma-separated)" value={techStackStr} onChange={e => setTechStackStr(e.target.value)} className="input" />
                        <input placeholder="Tags (comma-separated)" value={tagsStr} onChange={e => setTagsStr(e.target.value)} className="input" />
                        <input placeholder="Demo URL" value={formState.demo_url || ''} onChange={e => setFormState(prev => ({...prev, demo_url: e.target.value}))} className="input" />
                        <input placeholder="Repo URL" value={formState.repo_url || ''} onChange={e => setFormState(prev => ({...prev, repo_url: e.target.value}))} className="input" />
                        <div className="flex items-center gap-2"><input type="checkbox" checked={!!formState.is_featured} onChange={e => setFormState(prev => ({...prev, is_featured: e.target.checked}))} /> Featured</div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Images</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formState.images?.map((imgUrl, i) => (
                                    <div key={i} className="relative">
                                        <img src={imgUrl} className="h-16 w-16 object-cover rounded"/>
                                        <button type="button" onClick={() => setFormState(p => ({...p, images: p.images?.filter(url => url !== imgUrl)}))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><Trash className="h-3 w-3"/></button>
                                    </div>
                                ))}
                            </div>
                            <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} className="input-file"/>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={isPending} className="btn-primary">
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {projects?.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-lg group">
                         <div className="flex items-center gap-4">
                            {project.images && project.images.length > 0 ? (
                                <img src={project.images[0]} className="h-10 w-16 object-cover rounded" />
                            ) : (
                                <div className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400"><Image/></div>
                            )}
                            <div>
                                <h4 className="font-medium">{project.title}</h4>
                                <p className="text-sm text-slate-500">{project.short_description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleOpenForm(project)} className="p-2 text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => deleteMutation.mutate(project.id)} className="p-2 text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
