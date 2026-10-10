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

const kib = (bytes) => (bytes / 1024).toFixed(1);
const rows = budgets.map((budget) => {
  const re = new RegExp(budget.pattern);
  const matched = files.filter((f) => re.test(f.name));
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
