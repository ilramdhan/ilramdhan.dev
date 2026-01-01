import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, Loader2, FileText } from 'lucide-react';
import { Database } from '../../types';
import { supabase } from '../../lib/supabase/client';
import { ensureFullUrl } from '../../lib/utils';

type Certificate = Database['public']['Tables']['certificates']['Row'];
type CertificateInsert = Database['public']['Tables']['certificates']['Insert'];

const initialCertForm: Omit<CertificateInsert, 'id' | 'user_id' | 'created_at'> = {
    title: '',
    description: '',
    issued_by: '',
    issued_date: '',
    expiry_date: '',
    credential_url: '',
    file_url: '',
};

export function CertificatesTab() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCert, setEditingCert] = useState<Certificate | null>(null);
    const [formState, setFormState] = useState<Partial<CertificateInsert>>(initialCertForm);
    const [file, setFile] = useState<File | null>(null);

    const { data: certificates, isLoading } = useQuery({
        queryKey: ['certificates'],
        queryFn: api.getCertificates,
    });

    const mutationOptions = {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['certificates'] });
            setIsFormOpen(false);
        },
    };

    const addMutation = useMutation({ ...mutationOptions, mutationFn: api.addCertificate, onSuccess: () => { mutationOptions.onSuccess(); toast.success('Certificate added!'); } });
    const updateMutation = useMutation({ ...mutationOptions, mutationFn: api.updateCertificate, onSuccess: () => { mutationOptions.onSuccess(); toast.success('Certificate updated!'); } });
    const deleteMutation = useMutation({ ...mutationOptions, mutationFn: api.deleteCertificate, onSuccess: () => { mutationOptions.onSuccess(); toast.info('Certificate removed.'); } });

    useEffect(() => {
        if (isFormOpen && editingCert) {
            setFormState(editingCert);
        } else {
            setFormState(initialCertForm);
        }
        setFile(null);
    }, [editingCert, isFormOpen]);

    const handleOpenForm = (cert: Certificate | null) => {
        setEditingCert(cert);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let file_url = formState.file_url;

        if (file) {
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('ilramdhan.dev').upload(`certificates/${fileName}`, file);
            if (error) {
                toast.error(`Upload Error: ${error.message}`);
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('ilramdhan.dev').getPublicUrl(data.path);
            file_url = publicUrl;
        }

        const payload = { ...formState, file_url, credential_url: ensureFullUrl(formState.credential_url) };

        if (editingCert) {
            updateMutation.mutate({ ...payload, id: editingCert.id } as Certificate);
        } else {
            addMutation.mutate(payload as Omit<CertificateInsert, 'user_id'>);
        }
    };

    const isPending = addMutation.isPending || updateMutation.isPending;

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Certificates</h1>
                <button onClick={() => handleOpenForm(null)} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add Certificate</button>
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="form-container mb-6">
                    <h3 className="font-medium mb-4">{editingCert ? 'Edit Certificate' : 'New Certificate'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Title" required value={formState.title || ''} onChange={e => setFormState(p => ({...p, title: e.target.value}))} className="input" />
                        <input placeholder="Issued By" value={formState.issued_by || ''} onChange={e => setFormState(p => ({...p, issued_by: e.target.value}))} className="input" />
                        <input type="date" placeholder="Issued Date" value={formState.issued_date || ''} onChange={e => setFormState(p => ({...p, issued_date: e.target.value}))} className="input" />
                        <input type="date" placeholder="Expiry Date" value={formState.expiry_date || ''} onChange={e => setFormState(p => ({...p, expiry_date: e.target.value}))} className="input" />
                    </div>
                    <textarea placeholder="Description (Markdown)" value={formState.description || ''} onChange={e => setFormState(p => ({...p, description: e.target.value}))} className="input" rows={3} />
                    <input placeholder="Credential URL" value={formState.credential_url || ''} onChange={e => setFormState(p => ({...p, credential_url: e.target.value}))} className="input" />
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Certificate File (PDF/Image)</label>
                        <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="input-file" />
                        {formState.file_url && <a href={formState.file_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 mt-1 block">Current File</a>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={isPending} className="btn-primary">
                             {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                             {editingCert ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4">
                {certificates?.map(cert => (
                    <div key={cert.id} className="item-card group">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-yellow-600 dark:text-yellow-400">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold">{cert.title}</h3>
                                <p className="text-sm text-slate-500">{cert.issued_by} • {cert.issued_date}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenForm(cert)} className="btn-icon-blue"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => deleteMutation.mutate(cert.id)} className="btn-icon-red"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}