import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/features/profile/api';
import { PROFILE_TRANSLATED_FIELDS } from '@/features/profile/api';
import { profileKeys, profileQueries } from '@/features/profile/queries';
import { ResourceForm } from '@/features/admin';
import { changedFields } from '@/features/admin/diff';
import { idTranslation, mergeTranslations, type Translation } from '@/features/admin/translations';
import { resolveUploads } from '@/features/admin/uploads';
import {
  profileSchema,
  profileSections,
  profileToPayload,
  profileToValues,
  type ProfileValues,
} from '@/features/admin/resources/profile';

export function ProfileTab() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery(profileQueries.admin());

  const save = useMutation({
    mutationFn: async ({
      values,
      translation,
    }: {
      values: ProfileValues;
      translation: Translation;
    }) => {
      if (!profile) return;
      const uploaded = await resolveUploads(profileSections, values);
      const payload: Record<string, unknown> = { ...profileToPayload(uploaded, profile) };
      const merged = mergeTranslations(
        profile.translations,
        translation,
        'translations' in profile,
      );
      if (merged) payload.translations = merged;
      const patch = changedFields(payload, profile as Record<string, unknown>);
      if (Object.keys(patch).length > 0) await api.updateProfile(patch);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success('Profile updated!');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <>
      <h1 tabIndex={-1} className="text-section font-semibold text-ink outline-none">
        General Settings
      </h1>
      {isLoading && (
        <p role="status" className="mt-6 text-body text-ink-muted">
          Loading...
        </p>
      )}
      {profile && (
        <ResourceForm<ProfileValues>
          // Re-mount with fresh values (and cleared file inputs) after each save.
          key={JSON.stringify(profile)}
          className="mt-8 space-y-8"
          sections={profileSections}
          schema={profileSchema}
          defaultValues={profileToValues(profile)}
          isPending={save.isPending}
          submitLabel="Save Changes"
          translatable={PROFILE_TRANSLATED_FIELDS}
          defaultTranslation={idTranslation(profile.translations)}
          onSubmit={(values, translation) => save.mutate({ values, translation })}
        />
      )}
    </>
  );
}
