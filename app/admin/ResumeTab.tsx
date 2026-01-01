import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Database } from '../../types';

type Resume = Database['public']['Tables']['resume']['Row'];
type ResumeInsert = Database['public']['Tables']['resume']['Insert'];

const initialExpForm: Omit<ResumeInsert, 'id' | 'user_id' | 'created_at' | 'type'> = {
    title: '',
    institution: '',
    start_date: '',
    end_date: '',
    description: '',
};

const initialEduForm: Omit<ResumeInsert, 'id' | 'user_id' | 'created_at' | 'type'> = {
    title: '',
    institution: '',
    start_date: '',
    end_date: '',
    description: '',
};

export function ResumeTab() {
    const queryClient = useQueryClient();

    // --- State ---
    const [showExpForm, setShowExpForm] = useState(false);
    const [showEduForm, setShowEduForm] = useState(false);
    const [editingExp, setEditingExp] = useState<Resume | null>(null);
    const [editingEdu, setEditingEdu] = useState<Resume | null>(null);
    const [expFormState, setExpFormState] = useState<Partial<ResumeInsert>>(initialExpForm);
    const [eduFormState, setEduFormState] = useState<Partial<ResumeInsert>>(initialEduForm);

    // --- Queries ---
    const { data: experience, isLoading: isLoadingExp } = useQuery({
        queryKey: ['resume', 'experience'],
        queryFn: () => api.getResume('experience'),
    });
    const { data: education, isLoading: isLoadingEdu } = useQuery({
        queryKey: ['resume', 'education'],
        queryFn: () => api.getResume('education'),
    });

    // --- Mutations ---
    const addMutation = useMutation({
        mutationFn: (newItem: Omit<ResumeInsert, 'user_id'>) => api.addResumeItem(newItem),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['resume', data.type] });
            toast.success(`Resume item added!`);
            setShowExpForm(false);
            setShowEduForm(false);
        }
    });
    const updateMutation = useMutation({
        mutationFn: (updatedItem: Partial<Resume> & { id: number }) => api.updateResumeItem(updatedItem),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['resume', data.type] });
            toast.success(`Resume item updated!`);
            setShowExpForm(false);
            setShowEduForm(false);
        }
    });
    const deleteMutation = useMutation({
        mutationFn: (item: { id: number, type: string }) => api.deleteResumeItem(item.id).then(() => item),
        onSuccess: (item) => {
            queryClient.invalidateQueries({ queryKey: ['resume', item.type] });
            toast.info(`Resume item removed.`);
        }
    });

    // --- Effects to manage form state ---
    useEffect(() => {
        if (editingExp) {
            setExpFormState(editingExp);
        } else {
            setExpFormState(initialExpForm);
        }
    }, [editingExp]);

    useEffect(() => {
        if (editingEdu) {
            setEduFormState(editingEdu);
        } else {
            setEduFormState(initialEduForm);
        }
    }, [editingEdu]);

    // --- Handlers ---
    const handleOpenExpForm = (exp: Resume | null) => {
        setEditingExp(exp);
        setShowExpForm(true);
    };

    const handleOpenEduForm = (edu: Resume | null) => {
        setEditingEdu(edu);
        setShowEduForm(true);
    };

    const handleExpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...expFormState, type: 'experience' };
        if (editingExp) {
            updateMutation.mutate({ ...payload, id: editingExp.id } as Resume);
        } else {
            addMutation.mutate(payload as Omit<ResumeInsert, 'user_id'>);
        }
    };

    const handleEduSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...eduFormState, type: 'education' };
        if (editingEdu) {
            updateMutation.mutate({ ...payload, id: editingEdu.id } as Resume);
        } else {
            addMutation.mutate(payload as Omit<ResumeInsert, 'user_id'>);
        }
    };

    if (isLoadingExp || isLoadingEdu) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Resume / CV Management</h1>
            {/* Experience Section */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Work Experience</h2>
                    <button onClick={() => handleOpenExpForm(null)} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add</button>
                </div>

                {showExpForm && (
                    <form onSubmit={handleExpSubmit} className="bg-white border border-slate-200 dark:bg-slate-900 p-6 rounded-xl dark:border-white/10 mb-6 space-y-4 shadow-sm">
                        {/* Experience Form Fields */}
                        <h3 className="text-slate-900 dark:text-white font-medium mb-2">{editingExp ? 'Edit Experience' : 'New Experience'}</h3>
                        <input placeholder="Role / Position" required value={expFormState.title || ''} onChange={e => setExpFormState(prev => ({...prev, title: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-slate-900 dark:text-white" />
                        <input placeholder="Company" required value={expFormState.institution || ''} onChange={e => setExpFormState(prev => ({...prev, institution: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-slate-900 dark:text-white" />
                        {/* Add other fields like start_date, end_date, description */}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowExpForm(false)} className="text-slate-500 dark:text-slate-400 text-sm">Cancel</button>
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">{editingExp ? 'Update' : 'Save'}</button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {experience?.map(exp => (
                        <div key={exp.id} className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-white/5 p-4 rounded-lg flex justify-between items-start group shadow-sm">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{exp.title}</h3>
                                <div className="text-indigo-600 dark:text-indigo-400 text-sm">{exp.institution}</div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenExpForm(exp)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit className="h-4 w-4" /></button>
                                <button onClick={() => deleteMutation.mutate({id: exp.id, type: exp.type})} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Education Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Education</h2>
                    <button onClick={() => handleOpenEduForm(null)} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add</button>
                </div>

                {showEduForm && (
                     <form onSubmit={handleEduSubmit} className="bg-white border border-slate-200 dark:bg-slate-900 p-6 rounded-xl dark:border-white/10 mb-6 space-y-4 shadow-sm">
                        {/* Education Form Fields */}
                        <h3 className="text-slate-900 dark:text-white font-medium mb-2">{editingEdu ? 'Edit Education' : 'New Education'}</h3>
                        <input placeholder="Degree" required value={eduFormState.title || ''} onChange={e => setEduFormState(prev => ({...prev, title: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-slate-900 dark:text-white" />
                        <input placeholder="School / University" required value={eduFormState.institution || ''} onChange={e => setEduFormState(prev => ({...prev, institution: e.target.value}))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-slate-900 dark:text-white" />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowEduForm(false)} className="text-slate-500 dark:text-slate-400 text-sm">Cancel</button>
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">{editingEdu ? 'Update' : 'Save'}</button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {education?.map(edu => (
                        <div key={edu.id} className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-white/5 p-4 rounded-lg flex justify-between items-start group shadow-sm">
                             <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{edu.title}</h3>
                                <div className="text-purple-600 dark:text-purple-400 text-sm">{edu.institution}</div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEduForm(edu)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit className="h-4 w-4" /></button>
                                <button onClick={() => deleteMutation.mutate({id: edu.id, type: edu.type})} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}