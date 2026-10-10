import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/features/profile/api';
import { profileKeys, profileQueries } from '@/features/profile/queries';
import { ResourceForm } from '@/features/admin';
import { changedFields } from '@/features/admin/diff';
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
  const { data: profile, isLoading } = useQuery(profileQueries.detail());

  const save = useMutation({
    mutationFn: async (values: ProfileValues) => {
      if (!profile) return;
      const uploaded = await resolveUploads(profileSections, values);
      const patch = changedFields(profileToPayload(uploaded, profile), profile);
      if (Object.keys(patch).length > 0) await api.updateProfile(patch);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success('Profile updated!');
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold">General Settings</h1>
      {profile && (
        <ResourceForm<ProfileValues>
          // Re-mount with fresh values (and cleared file inputs) after each save.
          key={JSON.stringify(profile)}
          className="form-container"
          sections={profileSections}
          schema={profileSchema}
          defaultValues={profileToValues(profile)}
          isPending={save.isPending}
          submitLabel="Save Changes"
          onSubmit={(values) => save.mutate(values)}
        />
      )}
    </div>
  );
}
