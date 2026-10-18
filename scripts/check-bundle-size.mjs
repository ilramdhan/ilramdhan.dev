#!/usr/bin/env node
// Checks the built assets in dist/assets against scripts/bundle-budget.json.
// Usage: npm run build && npm run size   (or: node scripts/check-bundle-size.mjs [distDir])
// Exits with code 1 when any budget is exceeded. Writes a Markdown table to
// $GITHUB_STEP_SUMMARY when running in GitHub Actions.
// Options: --json <out>      write the measured sizes (budgets + per-route chunks) as JSON
//          --compare <json>  diff against a baseline written by --json (skipped if missing/invalid)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const jsonOut = takeFlag('--json');
const comparePath = takeFlag('--compare');
function takeFlag(name) {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  const value = argv[i + 1];
  argv.splice(i, value === undefined ? 1 : 2);
  return value ?? null;
}
const distDir = path.resolve(root, argv[0] ?? 'dist');
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

// Hashed build output plus the static 3D models served from public/models.
const modelsDir = path.join(distDir, 'models');
const files = [...walk(assetsDir), ...(fs.existsSync(modelsDir) ? walk(modelsDir) : [])].map(
  (file) => {
    const content = fs.readFileSync(file);
    return {
      name: path.relative(distDir, file),
      raw: content.length,
      gzip: zlib.gzipSync(content, { level: 9 }).length,
    };
  },
);

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
    return {
      ...budget,
      files: 0,
      actual: Infinity,
      limit: budget.maxKiB * 1024,
      ok: false,
      chunks: [],
    };
  }
  const sizes = matched.map((f) => f[budget.metric]);
  const actual =
    budget.aggregate === 'max' ? Math.max(0, ...sizes) : sizes.reduce((a, b) => a + b, 0);
  const limit = budget.maxKiB * 1024;
  const chunks =
    budget.aggregate === 'initial'
      ? matched.map((f) => ({ name: f.name, gzip: f.gzip })).sort((a, b) => b.gzip - a.gzip)
      : [];
  return { ...budget, files: matched.length, actual, limit, ok: actual <= limit, chunks };
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

const chunkLabel = (name) => name.replace(/^assets\//, '').replace(/-[\w-]{8}(\.js)$/, '$1');
console.log('\nInitial JS per route (gzip, largest first):');
for (const r of rows.filter((x) => x.aggregate === 'initial' && x.chunks.length)) {
  console.log(`  ${r.name}`);
  for (const c of r.chunks) {
    console.log(`    ${chunkLabel(c.name).padEnd(40)} ${kib(c.gzip).padStart(8)} KiB`);
  }
}

const measured = {
  budgets: Object.fromEntries(
    rows.map((r) => [
      r.name,
      {
        bytes: Number.isFinite(r.actual) ? r.actual : null,
        chunks: Object.fromEntries(r.chunks.map((c) => [chunkLabel(c.name), c.gzip])),
      },
    ]),
  ),
};
if (jsonOut) {
  fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true });
  fs.writeFileSync(path.resolve(jsonOut), JSON.stringify(measured, null, 2) + '\n');
}

/** @returns {typeof measured | null} baseline, or null when absent/unusable */
function loadBaseline() {
  if (!comparePath) return null;
  try {
    const data = JSON.parse(fs.readFileSync(path.resolve(comparePath), 'utf8'));
    if (data && typeof data.budgets === 'object') return data;
  } catch {
    // fall through
  }
  console.log(`\nBaseline ${comparePath} missing or invalid: skipping comparison.`);
  return null;
}
const baseline = loadBaseline();
const delta = (now, before) => {
  if (now == null || before == null) return 'n/a';
  const d = (now - before) / 1024;
  return `${d > 0 ? '+' : ''}${d.toFixed(1)}`;
};
/** Markdown diff table (budgets, then per-chunk changes of initial budgets). */
function diffLines() {
  const lines = [
    '#### Change vs base',
    '',
    '| Budget | Base (KiB) | PR (KiB) | Delta (KiB) |',
    '| --- | ---: | ---: | ---: |',
  ];
  for (const r of rows) {
    const before = baseline.budgets[r.name]?.bytes ?? null;
    const now = Number.isFinite(r.actual) ? r.actual : null;
    lines.push(
      `| ${r.name} | ${before == null ? 'n/a' : kib(before)} | ${now == null ? 'n/a' : kib(now)} | ${delta(now, before)} |`,
    );
  }
  for (const r of rows.filter((x) => x.aggregate === 'initial')) {
    const prev = baseline.budgets[r.name]?.chunks ?? {};
    const cur = Object.fromEntries(r.chunks.map((c) => [chunkLabel(c.name), c.gzip]));
    const names = [...new Set([...Object.keys(prev), ...Object.keys(cur)])]
      .filter((n) => prev[n] !== cur[n])
      .sort(
        (a, b) =>
          Math.abs((cur[b] ?? 0) - (prev[b] ?? 0)) - Math.abs((cur[a] ?? 0) - (prev[a] ?? 0)),
      );
    if (!names.length) continue;
    lines.push('', `<details><summary>${r.name}: chunk changes</summary>`, '');
    lines.push('| Chunk | Base (KiB) | PR (KiB) | Delta (KiB) |', '| --- | ---: | ---: | ---: |');
    for (const n of names) {
      lines.push(
        `| ${n} | ${prev[n] == null ? '-' : kib(prev[n])} | ${cur[n] == null ? '-' : kib(cur[n])} | ${delta(cur[n] ?? 0, prev[n] ?? 0)} |`,
      );
    }
    lines.push('', '</details>');
  }
  return lines;
}
if (baseline) {
  console.log('\nChange vs baseline (gzip):');
  for (const r of rows) {
    const before = baseline.budgets[r.name]?.bytes ?? null;
    const now = Number.isFinite(r.actual) ? r.actual : null;
    console.log(`  ${r.name.padEnd(26)} ${delta(now, before).padStart(8)} KiB`);
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '### Bundle size',
    '',
    '| Budget | Actual (KiB) | Limit (KiB) | Status |',
    '| --- | ---: | ---: | :---: |',
    ...rows.map((r) => `| ${r.name} | ${kib(r.actual)} | ${r.maxKiB} | ${r.ok ? '✅' : '❌'} |`),
    '',
    ...rows
      .filter((r) => r.aggregate === 'initial' && r.chunks.length)
      .flatMap((r) => [
        `<details><summary>${r.name}: chunks</summary>`,
        '',
        '| Chunk | gzip (KiB) |',
        '| --- | ---: |',
        ...r.chunks.map((c) => `| ${chunkLabel(c.name)} | ${kib(c.gzip)} |`),
        '',
        '</details>',
        '',
      ]),
    ...(baseline ? [...diffLines(), ''] : []),
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
