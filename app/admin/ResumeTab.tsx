import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Save } from 'lucide-react';
import { Database } from '../../types';

type Resume = Database['public']['Tables']['resume']['Row'];
type ResumeInsert = Database['public']['Tables']['resume']['Insert'];

const initialExpForm: Omit<ResumeInsert, 'id' | 'user_id' | 'created_at' | 'type'> = {
    title: '',
    institution: '',
    period: '',
    description: '',
    tags: [],
    gpa: null,
};

const initialEduForm: Omit<ResumeInsert, 'id' | 'user_id' | 'created_at' | 'type'> = {
    title: '',
    institution: '',
    period: '',
    description: '',
    gpa: '',
    tags: [],
};

export function ResumeTab() {
    const queryClient = useQueryClient();

    const [showExpForm, setShowExpForm] = useState(false);
    const [showEduForm, setShowEduForm] = useState(false);
    const [editingExp, setEditingExp] = useState<Resume | null>(null);
    const [editingEdu, setEditingEdu] = useState<Resume | null>(null);
    
    const [expFormState, setExpFormState] = useState<Partial<ResumeInsert>>(initialExpForm);
    const [eduFormState, setEduFormState] = useState<Partial<ResumeInsert>>(initialEduForm);
    const [expTagsStr, setExpTagsStr] = useState('');
    const [eduTagsStr, setEduTagsStr] = useState('');

    const { data: experience, isLoading: isLoadingExp } = useQuery({
        queryKey: ['resume', 'experience'],
        queryFn: () => api.getResume('experience'),
    });
    const { data: education, isLoading: isLoadingEdu } = useQuery({
        queryKey: ['resume', 'education'],
        queryFn: () => api.getResume('education'),
    });

    const mutationOptions = {
        onError: (error: Error) => toast.error(error.message),
        onSettled: () => {
            setShowExpForm(false);
            setShowEduForm(false);
        }
    };

    const addMutation = useMutation({ ...mutationOptions, mutationFn: api.addResumeItem, onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['resume', data.type] }); toast.success(`Item added!`); } });
    const updateMutation = useMutation({ ...mutationOptions, mutationFn: api.updateResumeItem, onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['resume', data.type] }); toast.success(`Item updated!`); } });
    const deleteMutation = useMutation({ ...mutationOptions, mutationFn: (item: {id: number, type: string}) => api.deleteResumeItem(item.id).then(() => item), onSuccess: (item) => { queryClient.invalidateQueries({ queryKey: ['resume', item.type] }); toast.info(`Item removed.`); } });

    useEffect(() => {
        if (showExpForm && editingExp) {
            setExpFormState(editingExp);
            setExpTagsStr(editingExp.tags?.join(', ') || '');
        } else {
            setExpFormState(initialExpForm);
            setExpTagsStr('');
        }
    }, [editingExp, showExpForm]);

    useEffect(() => {
        if (showEduForm && editingEdu) {
            setEduFormState(editingEdu);
            setEduTagsStr(editingEdu.tags?.join(', ') || '');
        } else {
            setEduFormState(initialEduForm);
            setEduTagsStr('');
        }
    }, [editingEdu, showEduForm]);

    const handleOpenExpForm = (exp: Resume | null) => { setEditingExp(exp); setShowExpForm(true); };
    const handleOpenEduForm = (edu: Resume | null) => { setEditingEdu(edu); setShowEduForm(true); };

    const handleExpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...expFormState, type: 'experience', tags: expTagsStr.split(',').map(t => t.trim()).filter(Boolean) };
        if (editingExp) {
            updateMutation.mutate({ ...payload, id: editingExp.id } as Resume);
        } else {
            addMutation.mutate(payload as Omit<ResumeInsert, 'user_id'>);
        }
    };

    const handleEduSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...eduFormState, type: 'education', tags: eduTagsStr.split(',').map(t => t.trim()).filter(Boolean) };
        if (editingEdu) {
            updateMutation.mutate({ ...payload, id: editingEdu.id } as Resume);
        } else {
            addMutation.mutate(payload as Omit<ResumeInsert, 'user_id'>);
        }
    };

    const isPending = addMutation.isPending || updateMutation.isPending;

    if (isLoadingExp || isLoadingEdu) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Resume / CV Management</h1>
            {/* Experience Section */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold">Work Experience</h2><button onClick={() => handleOpenExpForm(null)} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add</button></div>
                {showExpForm && (
                    <form onSubmit={handleExpSubmit} className="form-container mb-6">
                        <h3 className="font-medium mb-4">{editingExp ? 'Edit Experience' : 'New Experience'}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Role / Position" required value={expFormState.title || ''} onChange={e => setExpFormState(p => ({...p, title: e.target.value}))} className="input" />
                            <input placeholder="Company Name" required value={expFormState.institution || ''} onChange={e => setExpFormState(p => ({...p, institution: e.target.value}))} className="input" />
                        </div>
                        <input placeholder="Period (e.g. 2020 - Present)" required value={expFormState.period || ''} onChange={e => setExpFormState(p => ({...p, period: e.target.value}))} className="input" />
                        <textarea placeholder="Description" value={expFormState.description || ''} onChange={e => setExpFormState(p => ({...p, description: e.target.value}))} className="input" rows={3} />
                        <input placeholder="Tags (comma-separated)" value={expTagsStr} onChange={e => setExpTagsStr(e.target.value)} className="input" />
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowExpForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={isPending} className="btn-primary">{isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}{editingExp ? 'Update' : 'Save'}</button></div>
                    </form>
                )}
                <div className="space-y-4">
                    {experience?.map(exp => (
                        <div key={exp.id} className="item-card">
                            <div>
                                <h3 className="font-bold">{exp.title}</h3>
                                <p className="text-sm text-indigo-500">{exp.institution} • {exp.period}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{exp.description}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => handleOpenExpForm(exp)} className="btn-icon-blue"><Edit className="h-4 w-4" /></button><button onClick={() => deleteMutation.mutate({id: exp.id, type: exp.type})} className="btn-icon-red"><Trash2 className="h-4 w-4" /></button></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Education Section */}
            <div>
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold">Education</h2><button onClick={() => handleOpenEduForm(null)} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add</button></div>
                {showEduForm && (
                     <form onSubmit={handleEduSubmit} className="form-container mb-6">
                        <h3 className="font-medium mb-4">{editingEdu ? 'Edit Education' : 'New Education'}</h3>
                        <div className="grid grid-cols-2 gap-4">
                           <input placeholder="Degree" required value={eduFormState.title || ''} onChange={e => setEduFormState(p => ({...p, title: e.target.value}))} className="input" />
                            <input placeholder="School / University" required value={eduFormState.institution || ''} onChange={e => setEduFormState(p => ({...p, institution: e.target.value}))} className="input" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Period (e.g. 2015 - 2019)" value={eduFormState.period || ''} onChange={e => setEduFormState(p => ({...p, period: e.target.value}))} className="input" />
                            <input placeholder="GPA (Optional)" value={eduFormState.gpa || ''} onChange={e => setEduFormState(p => ({...p, gpa: e.target.value}))} className="input" />
                        </div>
                        <textarea placeholder="Description" value={eduFormState.description || ''} onChange={e => setEduFormState(p => ({...p, description: e.target.value}))} className="input" rows={2} />
                        <input placeholder="Tags (comma-separated)" value={eduTagsStr} onChange={e => setEduTagsStr(e.target.value)} className="input" />
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowEduForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={isPending} className="btn-primary">{isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}{editingEdu ? 'Update' : 'Save'}</button></div>
                    </form>
                )}
                <div className="space-y-4">
                    {education?.map(edu => (
                        <div key={edu.id} className="item-card">
                             <div>
                                <h3 className="font-bold">{edu.title}</h3>
                                <p className="text-sm text-purple-500">{edu.institution} • {edu.period}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => handleOpenEduForm(edu)} className="btn-icon-blue"><Edit className="h-4 w-4" /></button><button onClick={() => deleteMutation.mutate({id: edu.id, type: edu.type})} className="btn-icon-red"><Trash2 className="h-4 w-4" /></button></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}