import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { Database } from '../../types';

type Blog = Database['public']['Tables']['blogs']['Row'];
type BlogInsert = Database['public']['Tables']['blogs']['Insert'];

const initialBlogForm: Omit<BlogInsert, 'user_id' | 'id' | 'created_at'> = {
    title: '',
    content: '',
    image_url: '',
    is_featured: false,
    published_at: new Date().toISOString(),
};

export function BlogTab() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
    const [formState, setFormState] = useState<Partial<BlogInsert>>(initialBlogForm);

    const { data: blogsData, isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: () => api.getBlogs({ page: 1, limit: 100 }), // Fetch all for admin
    });
    const blogs = blogsData?.data || [];

    const addMutation = useMutation({
        mutationFn: (newBlog: Omit<BlogInsert, 'user_id'>) => api.addBlog(newBlog),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            toast.success("Article added!");
            setIsFormOpen(false);
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updatedBlog: Partial<Blog> & { id: number }) => api.updateBlog(updatedBlog),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            toast.success("Article updated!");
            setIsFormOpen(false);
        }
    });
    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.deleteBlog(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            toast.info("Article removed.");
        }
    });

    useEffect(() => {
        if (editingBlog) {
            setFormState(editingBlog);
        } else {
            setFormState(initialBlogForm);
        }
    }, [editingBlog]);

    const handleOpenForm = (blog: Blog | null) => {
        setEditingBlog(blog);
        setIsFormOpen(true);
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBlog) {
            updateMutation.mutate({ ...formState, id: editingBlog.id } as Blog);
        } else {
            addMutation.mutate(formState as Omit<BlogInsert, 'user_id'>);
        }
    };

    if (isLoading) return <div>Loading...</div>

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Articles</h1>
                <button onClick={() => handleOpenForm(null)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Plus className="h-4 w-4" /> Write Article
                </button>
            </div>

            {isFormOpen && (
                <div className="mb-8 p-6 bg-white border border-slate-200 dark:bg-slate-900 dark:border-white/10 rounded-xl shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editingBlog ? 'Edit Article' : 'Create Article'}</h3>
                        <input
                            required
                            placeholder="Title"
                            value={formState.title || ''}
                            onChange={e => setFormState(prev => ({...prev, title: e.target.value}))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white mb-4"
                        />
                        <textarea
                            placeholder="Content..."
                            value={formState.content || ''}
                            onChange={e => setFormState(prev => ({ ...prev, content: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white mb-4"
                            rows={6}
                        />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2">
                                <Save className="h-4 w-4" /> Publish
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4 mb-8">
                {blogs?.map(blog => (
                    <div key={blog.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 dark:bg-slate-900 dark:border-white/5 rounded-lg group shadow-sm">
                        <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">{blog.title}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleOpenForm(blog)} className="p-2 text-blue-500 rounded-lg">
                                <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => deleteMutation.mutate(blog.id)} className="p-2 text-red-500 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
