import { siteConfig } from '@/config/site';

/** Version from `package.json`, injected at build time (`0.0.0` if missing, e.g. in tests). */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

/** Short commit SHA of the deployed build, or `''` when not built on Vercel. */
export const APP_COMMIT: string = typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : '';

/** Display label, e.g. `v0.3.0`. */
export function versionLabel(version: string = APP_VERSION): string {
  return `v${version.replace(/^v/, '')}`;
}

/** GitHub Release page for a version, e.g. `…/releases/tag/v0.3.0`. */
export function releaseUrl(version: string = APP_VERSION, repoUrl: string = siteConfig.repoUrl) {
  return `${repoUrl.replace(/\/+$/, '')}/releases/tag/${versionLabel(version)}`;
}

/** Accessible name for the footer link, mentioning the commit when known. */
export function versionAriaLabel(version: string = APP_VERSION, commit: string = APP_COMMIT) {
  const base = `Release notes for version ${versionLabel(version)}`;
  return commit ? `${base} (build ${commit})` : base;
}
