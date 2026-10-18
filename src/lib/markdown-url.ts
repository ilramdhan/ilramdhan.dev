const GITHUB_FILE = /^https?:\/\/github\.com\/([^/]+\/[^/]+)\/(?:blob|raw)\/([^?#]+)/;

/**
 * Image URL a browser can actually load. GitHub `blob`/`raw` file pages
 * (`github.com/{owner}/{repo}/blob/{ref}/{path}`, optionally `?raw=true`) are HTML or
 * redirects, so they are rewritten to `raw.githubusercontent.com`. Anything else is
 * returned unchanged. Only for image sources; links to blob pages should stay links.
 */
export function toEmbeddableImageUrl<T extends string | undefined>(url: T): T | string {
  const match = url?.match(GITHUB_FILE);
  return match ? `https://raw.githubusercontent.com/${match[1]}/${match[2]}` : url;
}

/**
 * Any `|` (tables), `~~`, task box `[ ]`/`[x]`, footnote `[^`, a bare URL / `www.` (start of
 * line or after whitespace, so not `](…)` or `<…>`), or an email. Deliberately loose: a
 * false positive only costs the GFM download, a false negative renders CommonMark.
 */
const GFM_SYNTAX = /\||~~|\[[ xX]\]|\[\^|(?:^|\s)(?:https?:\/\/|www\.)\w|\w@[\w-]+\.\w/;

/** Whether `text` may use GitHub-flavoured Markdown syntax that CommonMark renders differently. */
export function needsGfm(text: string | null | undefined): boolean {
  return !!text && GFM_SYNTAX.test(text);
}
