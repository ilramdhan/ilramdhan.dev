#!/usr/bin/env node
// Checks the built assets in dist/assets against scripts/bundle-budget.json.
// Usage: npm run build && npm run size   (or: node scripts/check-bundle-size.mjs [distDir])
// Exits with code 1 when any budget is exceeded. Writes a Markdown table to
// $GITHUB_STEP_SUMMARY when running in GitHub Actions.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.resolve(root, process.argv[2] ?? 'dist');
const assetsDir = path.join(distDir, 'assets');
const { budgets } = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts', 'bundle-budget.json'), 'utf8'),
);

if (!fs.existsSync(assetsDir)) {
  console.error(
    `No build output at ${path.relative(root, assetsDir)} — run \`npm run build\` first.`,
  );
  process.exit(1);
}

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(assetsDir).map((file) => {
  const content = fs.readFileSync(file);
  return {
    name: path.relative(distDir, file),
    raw: content.length,
    gzip: zlib.gzipSync(content, { level: 9 }).length,
  };
});

/**
 * Static import graph: chunk file -> chunk files it imports with a static `import`
 * (dynamic `import()` is lazy and not part of the initial download).
 */
const byName = new Map(files.map((f) => [f.name, f]));
function staticImports(name) {
  const code = fs.readFileSync(path.join(distDir, name), 'utf8');
  const deps = new Set();
  for (const m of code.matchAll(
    /(?:^|[;\n}])\s*import\s*(?:[\w$*{}\s,]+from\s*)?["']\.\/([^"']+\.js)["']/g,
  )) {
    deps.add(`assets/${m[1]}`);
  }
  return [...deps].filter((d) => byName.has(d));
}
/** All JS reached through static imports from the start files (inclusive). */
function closure(start) {
  const seen = new Set();
  const queue = [...start];
  while (queue.length) {
    const name = queue.pop();
    if (seen.has(name)) continue;
    seen.add(name);
    queue.push(...staticImports(name));
  }
  return [...seen];
}
const indexHtml = path.join(distDir, 'index.html');
const entryFiles = fs.existsSync(indexHtml)
  ? [
      ...fs.readFileSync(indexHtml, 'utf8').matchAll(/<script[^>]+src="\/(assets\/[^"]+\.js)"/g),
    ].map((m) => m[1])
  : [];

/**
 * Files a budget measures. `initial` budgets measure what the browser downloads before
 * the route renders: the entry graph plus the static graph of the route chunk(s) matching
 * `route` (a regex on the file name), e.g. `assets/privacy-[hash].js`.
 */
function filesFor(budget) {
  if (budget.aggregate === 'initial') {
    const routeRe = budget.route ? new RegExp(budget.route) : null;
    const routeFiles = routeRe ? files.filter((f) => routeRe.test(f.name)).map((f) => f.name) : [];
    if (entryFiles.length === 0 || (routeRe && routeFiles.length === 0)) return null;
    return closure([...entryFiles, ...routeFiles]).map((n) => byName.get(n));
  }
  const re = new RegExp(budget.pattern);
  return files.filter((f) => re.test(f.name));
}

const kib = (bytes) => (bytes / 1024).toFixed(1);
const rows = budgets.map((budget) => {
  const matched = filesFor(budget);
  if (!matched) {
    return { ...budget, files: 0, actual: Infinity, limit: budget.maxKiB * 1024, ok: false };
  }
  const sizes = matched.map((f) => f[budget.metric]);
  const actual =
    budget.aggregate === 'max' ? Math.max(0, ...sizes) : sizes.reduce((a, b) => a + b, 0);
  const limit = budget.maxKiB * 1024;
  return { ...budget, files: matched.length, actual, limit, ok: actual <= limit };
});

console.log('Files:');
for (const f of [...files].sort((a, b) => b.raw - a.raw)) {
  console.log(
    `  ${f.name.padEnd(48)} ${kib(f.raw).padStart(9)} KiB raw ${kib(f.gzip).padStart(9)} KiB gzip`,
  );
}
console.log('\nBudgets:');
for (const r of rows) {
  const pct = ((r.actual / r.limit) * 100).toFixed(0);
  console.log(
    `  ${r.ok ? 'ok  ' : 'FAIL'} ${r.name.padEnd(26)} ${kib(r.actual).padStart(9)} / ${String(r.maxKiB).padStart(6)} KiB (${pct}%, ${r.files} file(s))`,
  );
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '### Bundle size',
    '',
    '| Budget | Actual (KiB) | Limit (KiB) | Status |',
    '| --- | ---: | ---: | :---: |',
    ...rows.map((r) => `| ${r.name} | ${kib(r.actual)} | ${r.maxKiB} | ${r.ok ? '✅' : '❌'} |`),
    '',
  ];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}

const failed = rows.filter((r) => !r.ok);
if (failed.length) {
  console.error(
    `\nBundle budget exceeded: ${failed.map((r) => r.name).join(', ')}. ` +
      'Reduce the bundle (code-split, lazy-load) or, if the growth is intended, raise the budget in scripts/bundle-budget.json with a justification in the PR.',
  );
  process.exit(1);
}
console.log('\nAll bundle budgets respected.');
