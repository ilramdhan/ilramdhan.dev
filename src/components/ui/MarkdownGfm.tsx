import ReactMarkdown, { type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const REMARK_PLUGINS = [remarkGfm];

/**
 * `react-markdown` plus GFM, lazy-loaded by `Markdown` only for content that uses GFM syntax.
 * Takes Markdown's resolved options (URL transform, components) so the two never drift.
 */
export default function MarkdownGfm(options: Options) {
  return <ReactMarkdown {...options} remarkPlugins={REMARK_PLUGINS} />;
}
