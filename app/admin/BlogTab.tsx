import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Save, Loader2, Image, Trash } from 'lucide-react';
import { Database } from '../../types';
import { supabase } from '../../lib/supabase/client';

type Blog = Database['public']['Tables']['blogs']['Row'];
type BlogInsert = Database['public']['Tables']['blogs']['Insert'];

const initialBlogForm: Omit<BlogInsert, 'user_id' | 'id' | 'created_at' | 'slug' | 'published_at'> = {
    title: '',
    excerpt: '',
    content: '',
    images: [],
    tags: [],
    is_featured: false,
};

const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function BlogTab() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
    
    const [formState, setFormState] = useState<Partial<BlogInsert>>(initialBlogForm);
    const [tagsStr, setTagsStr] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    const { data: blogsData, isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: () => api.getBlogs({ page: 1, limit: 100 }),
    });
    const blogs = blogsData?.data || [];

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            setIsFormOpen(false);
        },
        onError: (error: Error) => toast.error(error.message),
    };

    const addMutation = useMutation({ ...mutationOptions, mutationFn: api.addBlog, onSuccess: () => { mutationOptions.onSuccess(); toast.success("Article added!"); } });
    const updateMutation = useMutation({ ...mutationOptions, mutationFn: api.updateBlog, onSuccess: () => { mutationOptions.onSuccess(); toast.success("Article updated!"); } });
    const deleteMutation = useMutation({ ...mutationOptions, mutationFn: api.deleteBlog, onSuccess: () => { mutationOptions.onSuccess(); toast.info("Article removed."); } });

    useEffect(() => {
        if (isFormOpen) {
            if (editingBlog) {
                setFormState(editingBlog);
                setTagsStr(editingBlog.tags?.join(', ') || '');
            } else {
                setFormState(initialBlogForm);
                setTagsStr('');
            }
            setFiles([]);
        }
    }, [editingBlog, isFormOpen]);

    const handleOpenForm = (blog: Blog | null) => {
        setEditingBlog(blog);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let newImageUrls: string[] = [];
        if (files.length > 0) {
            const uploadPromises = files.map(async file => {
                const fileName = `${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage.from('ilramdhan.dev').upload(`blogs/${fileName}`, file);
                if (error) throw new Error(`Image Upload Error: ${error.message}`);
                return supabase.storage.from('ilramdhan.dev').getPublicUrl(data.path).data.publicUrl;
            });
            try {
                newImageUrls = await Promise.all(uploadPromises);
            } catch (error: any) {
                toast.error(error.message);
                return;
            }
        }

        const finalPayload: Partial<BlogInsert> = {
            ...formState,
            slug: generateSlug(formState.title || ''),
            tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
            images: [...(formState.images || []), ...newImageUrls],
            published_at: formState.published_at || new Date().toISOString(),
        };

        if (editingBlog) {
            updateMutation.mutate({ ...finalPayload, id: editingBlog.id } as Blog);
        } else {
            addMutation.mutate(finalPayload as Omit<BlogInsert, 'user_id'>);
        }
    };

    const isPending = addMutation.isPending || updateMutation.isPending;

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Articles</h1>
                <button onClick={() => handleOpenForm(null)} className="btn-primary"><Plus className="h-4 w-4" /> Write Article</button>
            </div>

            {isFormOpen && (
                <div className="mb-8 p-6 bg-white dark:bg-slate-900 border rounded-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-lg font-bold">{editingBlog ? 'Edit Article' : 'Create Article'}</h3>
                        <input required placeholder="Title" value={formState.title || ''} onChange={e => setFormState(p => ({...p, title: e.target.value}))} className="input" />
                        <textarea placeholder="Excerpt" value={formState.excerpt || ''} onChange={e => setFormState(p => ({...p, excerpt: e.target.value}))} className="input" rows={2}/>
                        <textarea placeholder="Content (Markdown)" value={formState.content || ''} onChange={e => setFormState(p => ({...p, content: e.target.value}))} className="input" rows={10}/>
                        <input placeholder="Tags (comma-separated)" value={tagsStr} onChange={e => setTagsStr(e.target.value)} className="input" />
                        <div className="flex items-center gap-2"><input type="checkbox" checked={!!formState.is_featured} onChange={e => setFormState(p => ({...p, is_featured: e.target.checked}))} /> Featured</div>
                        
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
                {blogs?.map(blog => (
                    <div key={blog.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-lg group">
                        <div className="flex items-center gap-4">
                             {blog.images && blog.images.length > 0 ? (
                                <img src={blog.images[0]} className="h-10 w-16 object-cover rounded" />
                            ) : (
                                <div className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400"><Image/></div>
                            )}
                            <div>
                                <h4 className="font-medium">{blog.title}</h4>
                                <p className="text-sm text-slate-500">{blog.excerpt}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleOpenForm(blog)} className="p-2 text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => deleteMutation.mutate(blog.id)} className="p-2 text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
