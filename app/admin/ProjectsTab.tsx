import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { Database } from '../../types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

const initialProjectForm: Omit<ProjectInsert, 'user_id' | 'id' | 'created_at'> = {
    title: '',
    description: '',
    image_url: '',
    project_url: '',
    tags: [],
    is_featured: false,
};

export function ProjectsTab() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formState, setFormState] = useState<Partial<ProjectInsert>>(initialProjectForm);
    
    const { data: projectsData, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.getProjects({ page: 1, limit: 100 }), // Fetch all for admin panel
    });
    const projects = projectsData?.data || [];

    const addMutation = useMutation({
        mutationFn: (newProject: Omit<ProjectInsert, 'user_id'>) => api.addProject(newProject),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success("Project added!");
            setIsFormOpen(false);
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updatedProject: Partial<Project> & { id: number }) => api.updateProject(updatedProject),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success("Project updated!");
            setIsFormOpen(false);
        }
    });
    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.deleteProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.info("Project removed.");
        }
    });

    useEffect(() => {
        if (editingProject) {
            setFormState(editingProject);
        } else {
            setFormState(initialProjectForm);
        }
    }, [editingProject]);

    const handleOpenForm = (project: Project | null) => {
        setEditingProject(project);
        setIsFormOpen(true);
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProject) {
            updateMutation.mutate({ ...formState, id: editingProject.id } as Project);
        } else {
            addMutation.mutate(formState as Omit<ProjectInsert, 'user_id'>);
        }
    };

    if (isLoading) return <div>Loading...</div>

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Projects</h1>
                <button onClick={() => handleOpenForm(null)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Plus className="h-4 w-4" /> Add Project
                </button>
            </div>

            {isFormOpen && (
                <div className="mb-8 p-6 bg-white border border-slate-200 dark:bg-slate-900 dark:border-white/10 rounded-xl shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editingProject ? 'Edit Project' : 'Create Project'}</h3>
                        <input
                            required
                            placeholder="Title"
                            value={formState.title || ''}
                            onChange={e => setFormState(prev => ({...prev, title: e.target.value}))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white mb-4"
                        />
                         <input
                            placeholder="Description"
                            value={formState.description || ''}
                            onChange={e => setFormState(prev => ({...prev, description: e.target.value}))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2">
                                <Save className="h-4 w-4" /> Save
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4 mb-8">
                {projects?.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 dark:bg-slate-900 dark:border-white/5 rounded-lg group shadow-sm">
                         <div className="flex items-center gap-4">
                            <img src={project.image_url || ''} className="w-16 h-10 object-cover rounded" />
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white">{project.title}</h4>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleOpenForm(project)} className="p-2 text-blue-500 rounded-lg">
                                <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => deleteMutation.mutate(project.id)} className="p-2 text-red-500 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
