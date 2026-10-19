import { lazy, Suspense } from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import type { Element, Root, RootContent } from 'hast';
import { createLowlight } from 'lowlight';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import go from 'highlight.js/lib/languages/go';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

const MarkdownGfm = lazy(() => import('@/components/ui/MarkdownGfm'));

// A small subset instead of lowlight's `common`/`all` sets. Aliases (js, jsx, ts, tsx, sh,
// zsh, html, yml, md, toml, golang, py, ...) are declared by the grammars themselves.
const LANGUAGES = {
  bash,
  css,
  diff,
  go,
  javascript,
  json,
  markdown,
  python,
  shell,
  sql,
  typescript,
  xml,
  yaml,
};

// `rehype-highlight` imports lowlight's whole `common` set at module level, which defeats a
// language subset; this plugin registers only LANGUAGES. Unknown languages stay untouched.
const lowlight = createLowlight(LANGUAGES);
lowlight.registerAlias({ javascript: ['jsx'], typescript: ['tsx'] });

const textOf = (node: RootContent): string =>
  node.type === 'text'
    ? node.value
    : node.type === 'element'
      ? node.children.map(textOf).join('')
      : '';

function highlightTree(node: Root | Element) {
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tagName === 'pre') {
      const code = child.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code',
      );
      const classes = code?.properties.className;
      const lang = Array.isArray(classes)
        ? String(classes.find((c) => String(c).startsWith('language-')) ?? '').slice(9)
        : '';
      if (code && lang && lowlight.registered(lang)) {
        code.children = lowlight.highlight(lang, textOf(code)).children as Element['children'];
        code.properties.className = ['hljs', ...(classes as string[])];
      }
    } else {
      highlightTree(child);
    }
  }
}

const rehypeHighlightSubset = () => highlightTree;
const REHYPE_PLUGINS: NonNullable<Options['rehypePlugins']> = [rehypeHighlightSubset];

/**
 * `react-markdown` plus syntax highlighting, lazy-loaded (own `highlight` chunk) only for
 * content with a fenced code block that names a language. `gfm` content additionally loads
 * the GFM renderer, which takes these rehype plugins.
 */
export default function MarkdownHighlight({ gfm, ...options }: Options & { gfm?: boolean }) {
  const plain = <ReactMarkdown {...options} rehypePlugins={REHYPE_PLUGINS} />;
  if (!gfm) return plain;
  return (
    <Suspense fallback={plain}>
      <MarkdownGfm {...options} rehypePlugins={REHYPE_PLUGINS} />
    </Suspense>
  );
}
