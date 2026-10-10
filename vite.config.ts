import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { absoluteUrl, siteConfig } from './config/site';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Injects values from `config/site.ts` into `index.html`:
 * replaces `%SITE_*%` placeholders and adds the JSON-LD `Person` block.
 */
function siteConfigHtml(): Plugin {
  const replacements: Record<string, string> = {
    SITE_NAME: siteConfig.name,
    SITE_TITLE: siteConfig.title,
    SITE_DESCRIPTION: siteConfig.description,
    SITE_OG_DESCRIPTION: siteConfig.ogDescription,
    SITE_URL: absoluteUrl('/'),
    SITE_OG_IMAGE: absoluteUrl(siteConfig.ogDefaultImage),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.name,
    url: siteConfig.url,
    jobTitle: siteConfig.jobTitle,
    sameAs: [siteConfig.social.github, siteConfig.social.linkedin],
    image: absoluteUrl(siteConfig.ogDefaultImage),
    description: siteConfig.jsonLdDescription,
  };

  return {
    name: 'site-config-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return {
          html: html.replace(/%(SITE_[A-Z_]+)%/g, (match, key: string) =>
            key in replacements ? escapeHtml(replacements[key]) : match,
          ),
          tags: [
            {
              tag: 'script',
              attrs: { type: 'application/ld+json' },
              children: JSON.stringify(jsonLd, null, 2).replace(/</g, '\\u003c'),
              injectTo: 'head',
            },
          ],
        };
      },
    },
  };
}

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), siteConfigHtml()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
