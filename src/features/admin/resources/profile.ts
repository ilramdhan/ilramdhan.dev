import { z } from 'zod';
import type { Profile } from '@/features/profile/api';
import type { TablesUpdate } from '@/types';
import { IMAGE_MIME_TYPES, PDF_MIME_TYPES } from '@/lib/upload';
import { ensureFullUrl } from '@/lib/utils';
import * as f from '../fields';
import type { FieldConfig, FormSection } from '../fields';

const SOCIAL = [
  ['github', 'GitHub URL'],
  ['linkedin', 'LinkedIn URL'],
  ['twitter', 'Twitter URL'],
  ['instagram', 'Instagram URL'],
  ['youtube', 'YouTube URL'],
  ['whatsapp', 'WhatsApp URL'],
  ['mail', 'Email Address'],
  ['steam', 'Steam URL'],
] as const;
type SocialKey = (typeof SOCIAL)[number][0];

const socialSchema = z.object(
  Object.fromEntries(
    SOCIAL.map(([key]) => [key, key === 'mail' ? f.optionalEmail : f.optionalUrl]),
  ) as unknown as Record<SocialKey, typeof f.optionalUrl>,
);

export const profileSchema = z.object({
  display_name: f.optionalText(100),
  badge_text: f.optionalText(100),
  hero_title: f.optionalText(300),
  short_description: f.optionalText(1000),
  detailed_bio: f.markdownText(),
  logo_text: f.optionalText(100),
  address: f.optionalText(300),
  footer_text: f.optionalText(300),
  avatar: f.mediaFile,
  logo: f.mediaFile,
  resume: f.mediaFile,
  social_links: socialSchema,
  privacy_content: f.markdownText(),
  terms_content: f.markdownText(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

const text = (name: FieldConfig<ProfileValues>['name'], label: string) =>
  ({ name, label, kind: 'text', placeholder: '' }) as const;
const markdown = (name: FieldConfig<ProfileValues>['name'], label: string, rows = 5) =>
  ({ name, label, kind: 'markdown', rows, placeholder: '' }) as const;

export const profileSections: FormSection<ProfileValues>[] = [
  { columns: 2, fields: [text('display_name', 'Display Name'), text('badge_text', 'Badge Text')] },
  {
    fields: [
      text('hero_title', 'Hero Title'),
      markdown('short_description', 'Short Description', 2),
      markdown('detailed_bio', 'Detailed Bio (Markdown)', 8),
    ],
  },
  {
    divider: true,
    columns: 2,
    fields: [
      text('logo_text', 'Logo Text (Fallback)'),
      text('address', 'Address'),
      text('footer_text', 'Footer Text'),
    ],
  },
  {
    columns: 3,
    fields: [
      {
        name: 'avatar',
        label: 'Avatar Image',
        kind: 'file',
        folder: 'avatars',
        accept: IMAGE_MIME_TYPES,
        preview: 'avatar',
      },
      {
        name: 'logo',
        label: 'Logo Image',
        kind: 'file',
        folder: 'logos',
        accept: IMAGE_MIME_TYPES,
        preview: 'image',
      },
      {
        name: 'resume',
        label: 'Resume / CV (PDF)',
        kind: 'file',
        folder: 'cv',
        accept: PDF_MIME_TYPES,
        preview: 'link',
        linkLabel: 'Current CV',
      },
    ],
  },
  {
    divider: true,
    title: 'Social Links',
    columns: 2,
    fields: SOCIAL.map(([key, label]) => ({
      name: `social_links.${key}` as const,
      label,
      kind: key === 'mail' ? ('email' as const) : ('url' as const),
      placeholder: key === 'mail' ? 'you@example.com' : `https://${key}.com/yourusername`,
    })),
  },
  {
    divider: true,
    fields: [
      markdown('privacy_content', 'Privacy Policy (Markdown)'),
      markdown('terms_content', 'Terms of Service (Markdown)'),
    ],
  },
];

const socialOf = (p: Profile) => (p.social_links ?? {}) as Record<string, string | null>;

export function profileToValues(p: Profile): ProfileValues {
  const links = socialOf(p);
  return {
    display_name: p.display_name ?? '',
    badge_text: p.badge_text ?? '',
    hero_title: p.hero_title ?? '',
    short_description: p.short_description ?? '',
    detailed_bio: p.detailed_bio ?? '',
    logo_text: p.logo_text ?? '',
    address: p.address ?? '',
    footer_text: p.footer_text ?? '',
    avatar: f.toMediaFile(p.avatar_url),
    logo: f.toMediaFile(p.logo_url),
    resume: f.toMediaFile(p.resume_url),
    social_links: Object.fromEntries(
      SOCIAL.map(([key]) => [key, links[key] ?? '']),
    ) as ProfileValues['social_links'],
    privacy_content: p.privacy_content ?? '',
    terms_content: p.terms_content ?? '',
  };
}

/** URLs get https:// when the scheme is missing; the mail address is stored as typed. */
export function profileToPayload(v: ProfileValues, current: Profile): TablesUpdate<'profile'> {
  const social: Record<string, string | null> = { ...socialOf(current) };
  for (const [key] of SOCIAL) {
    const value = v.social_links[key].trim();
    social[key] = key === 'mail' ? value : (ensureFullUrl(value) ?? '');
  }
  return {
    display_name: v.display_name,
    badge_text: v.badge_text,
    hero_title: v.hero_title,
    short_description: v.short_description,
    detailed_bio: v.detailed_bio,
    logo_text: v.logo_text,
    address: v.address,
    footer_text: v.footer_text,
    avatar_url: v.avatar.url || null,
    logo_url: v.logo.url || null,
    resume_url: v.resume.url || null,
    social_links: social,
    privacy_content: v.privacy_content,
    terms_content: v.terms_content,
  };
}
