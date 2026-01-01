import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Database } from '../../types';

type Profile = Database['public']['Tables']['profile']['Row'];

export function ProfileTab() {
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: api.getProfile,
    });

    const [formState, setFormState] = useState<Partial<Profile>>({});

    useEffect(() => {
        if (profile) {
            setFormState(profile);
        }
    }, [profile]);

    const updateMutation = useMutation({
        mutationFn: (updatedProfile: Partial<Profile>) => api.updateProfile(updatedProfile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile updated!');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formState);
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profile & Overview</h1>
                <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="Full Name"
                            value={formState.full_name || ''}
                            onChange={e => setFormState(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg"
                        />
                        <input
                            placeholder="Username"
                            value={formState.username || ''}
                            onChange={e => setFormState(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg"
                        />
                    </div>
                     <input
                        placeholder="Website URL"
                        value={formState.website || ''}
                        onChange={e => setFormState(prev => ({ ...prev, website: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg"
                    />
                    <div className="flex justify-end">
                        <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2">
                            <Save className="h-4 w-4" /> Save Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}