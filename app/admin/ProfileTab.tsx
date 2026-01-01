import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { Database } from '../../types';
import { supabase } from '../../lib/supabase/client';
import { ensureFullUrl } from '../../lib/utils';

type Profile = Database['public']['Tables']['profile']['Row'];

export function ProfileTab() {
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: api.getProfile,
    });

    const [formState, setFormState] = useState<Partial<Profile>>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [cvFile, setCvFile] = useState<File | null>(null);

    useEffect(() => {
        if (profile) {
            setFormState(profile);
        }
    }, [profile]);

    const updateMutation = useMutation({
        mutationFn: async (updatedProfile: Partial<Profile>) => {
            let avatar_url = updatedProfile.avatar_url;
            let logo_url = updatedProfile.logo_url;
            let resume_url = updatedProfile.resume_url;

            if (avatarFile) {
                const fileName = `avatar-${Date.now()}`;
                const { data, error } = await supabase.storage
                    .from('ilramdhan.dev')
                    .upload(`avatars/${fileName}`, avatarFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });
                
                if (error) throw new Error(`Avatar Upload Error: ${error.message}`);

                const { data: { publicUrl } } = supabase.storage
                    .from('ilramdhan.dev')
                    .getPublicUrl(data.path);
                
                avatar_url = publicUrl;
            }

            if (logoFile) {
                const fileName = `logo-${Date.now()}`;
                const { data, error } = await supabase.storage
                    .from('ilramdhan.dev')
                    .upload(`logos/${fileName}`, logoFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });
                
                if (error) throw new Error(`Logo Upload Error: ${error.message}`);

                const { data: { publicUrl } } = supabase.storage
                    .from('ilramdhan.dev')
                    .getPublicUrl(data.path);
                
                logo_url = publicUrl;
            }

            if (cvFile) {
                const fileName = `cv-${Date.now()}`;
                const { data, error } = await supabase.storage
                    .from('ilramdhan.dev')
                    .upload(`cv/${fileName}`, cvFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });
                
                if (error) throw new Error(`CV Upload Error: ${error.message}`);

                const { data: { publicUrl } } = supabase.storage
                    .from('ilramdhan.dev')
                    .getPublicUrl(data.path);
                
                resume_url = publicUrl;
            }

            const processedSocialLinks: { [key: string]: string } = {};
            if (updatedProfile.social_links && typeof updatedProfile.social_links === 'object') {
                for (const [key, value] of Object.entries(updatedProfile.social_links)) {
                    processedSocialLinks[key] = ensureFullUrl(value as string) || '';
                }
            }

            const profileToUpdate = {
                ...updatedProfile,
                avatar_url,
                logo_url,
                resume_url,
                social_links: processedSocialLinks,
            };

            return api.updateProfile(profileToUpdate);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile updated!');
            setAvatarFile(null);
            setLogoFile(null);
            setCvFile(null);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formState);
    };

    if (isLoading) return <div>Loading...</div>;

    const renderInput = (id: keyof Profile, label: string) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <input
                id={id}
                value={formState[id] as string || ''}
                onChange={e => setFormState(prev => ({ ...prev, [id]: e.target.value }))}
                className="input"
            />
        </div>
    );
    
    const renderTextarea = (id: keyof Profile, label: string, rows: number = 5) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <textarea
                id={id}
                rows={rows}
                value={formState[id] as string || ''}
                onChange={e => setFormState(prev => ({ ...prev, [id]: e.target.value }))}
                className="input"
            />
        </div>
    );

    const renderSocialInput = (platform: string, label: string) => (
        <div>
            <label htmlFor={`social-${platform}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <input
                id={`social-${platform}`}
                value={(formState.social_links as any)?.[platform] || ''}
                onChange={e => setFormState(prev => ({
                    ...prev,
                    social_links: { ...(prev.social_links as any), [platform]: e.target.value }
                }))}
                className="input"
                placeholder={`https://${platform}.com/yourusername`}
            />
        </div>
    );

    return (
        <div className="max-w-4xl space-y-8">
            <h1 className="text-2xl font-bold">General Settings</h1>
            <form onSubmit={handleSubmit} className="form-container">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput('display_name', 'Display Name')}
                    {renderInput('badge_text', 'Badge Text')}
                </div>
                
                {renderInput('hero_title', 'Hero Title')}
                {renderTextarea('short_description', 'Short Description', 2)}
                {renderTextarea('detailed_bio', 'Detailed Bio (Markdown)', 8)}

                <hr className="border-slate-200 dark:border-white/10"/>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput('logo_text', 'Logo Text (Fallback)')}
                    {renderInput('address', 'Address')}
                    {renderInput('footer_text', 'Footer Text')}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Avatar Image</label>
                        <input type="file" onChange={e => setAvatarFile(e.target.files ? e.target.files[0] : null)} className="input-file" />
                        {profile?.avatar_url && <img src={profile.avatar_url} className="h-12 w-12 rounded-full object-cover mt-2"/>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo Image</label>
                        <input type="file" onChange={e => setLogoFile(e.target.files ? e.target.files[0] : null)} className="input-file" />
                        {profile?.logo_url && <img src={profile.logo_url} className="h-8 w-auto object-contain mt-2"/>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resume / CV (PDF)</label>
                        <input type="file" onChange={e => setCvFile(e.target.files ? e.target.files[0] : null)} className="input-file" />
                        {profile?.resume_url && <a href={profile.resume_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 mt-2 block">Current CV</a>}
                    </div>
                </div>
                
                <hr className="border-slate-200 dark:border-white/10"/>
                
                <h2 className="text-xl font-bold mb-4">Social Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderSocialInput('github', 'GitHub URL')}
                    {renderSocialInput('linkedin', 'LinkedIn URL')}
                    {renderSocialInput('twitter', 'Twitter URL')}
                    {renderSocialInput('instagram', 'Instagram URL')}
                    {renderSocialInput('youtube', 'YouTube URL')}
                    {renderSocialInput('whatsapp', 'WhatsApp URL')}
                    {renderSocialInput('mail', 'Email Address')}
                    {renderSocialInput('steam', 'Steam URL')}
                </div>

                <hr className="border-slate-200 dark:border-white/10"/>
                
                {renderTextarea('privacy_content', 'Privacy Policy (Markdown)')}
                {renderTextarea('terms_content', 'Terms of Service (Markdown)')}

                <div className="flex justify-end">
                    <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}