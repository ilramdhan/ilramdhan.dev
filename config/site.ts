/**
 * Central site configuration.
 *
 * Every personal / site-specific value (name, domain, usernames, share URLs)
 * lives here so the rest of the code never hard-codes them. It is imported by
 * the app code and by `vite.config.ts`, which injects the values into
 * `index.html` at build time (`%SITE_*%` placeholders).
 */
export const siteConfig = {
  name: 'Ilham Ramadhan',
  title: 'Ilham Ramadhan | Web Developer & Portfolio',
  jobTitle: 'Web Developer',
  url: 'https://ilramdhan.dev',
  defaultLocale: 'en',
  locales: ['en', 'id'],
  description:
    "Ilham Ramadhan's personal portfolio — showcasing projects, skills, certifications, and blog posts on web development, design, and technology.",
  /** Fallback description used by `useDocumentMeta` when a page provides none. */
  metaDescription:
    "Ilham Ramadhan's personal portfolio website showcasing projects, skills, and blog posts.",
  ogDescription:
    'Showcasing projects, skills, certifications, and blog posts on web development, design, and technology.',
  jsonLdDescription:
    'Web developer specializing in modern web technologies. Portfolio showcasing projects, skills, and blog posts.',
  /** Path of the default Open Graph image (relative to the site root). */
  ogDefaultImage: '/logo.png',
  githubUsername: 'ilramdhan',
  /** Public WakaTime share JSON endpoints (Share -> Embeddable Charts). */
  wakatime: {
    languagesUrl:
      'https://wakatime.com/share/@ilramadhan/e5668821-74bc-46bf-8dc6-40ab8a343531.json',
    activityUrl: 'https://wakatime.com/share/@ilramadhan/3f350fd7-49e3-461a-a309-d820c7e93717.json',
  },
  /** Profile URLs used for JSON-LD `sameAs` (to be verified in T-38). */
  social: {
    github: 'https://github.com/ilramadhan',
    linkedin: 'https://linkedin.com/in/ilramadhan',
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Absolute URL for a site-relative path. */
export const absoluteUrl = (path = '/') => new URL(path, siteConfig.url).toString();

export const githubProfileUrl = `https://github.com/${siteConfig.githubUsername}`;
