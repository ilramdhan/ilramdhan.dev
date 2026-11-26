// Loads every Vercel function the way production does: compiled with api/tsconfig.json
// (what @vercel/node picks up) and require()d as CommonJS. Catches module-format crashes
// (FUNCTION_INVOCATION_FAILED on load) that typecheck and the Vite build never see.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, symlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = mkdtempSync(join(tmpdir(), 'check-api-'));
execFileSync(
  'npx',
  ['tsc', '-p', 'api/tsconfig.json', '--noEmit', 'false', '--outDir', out, '--rootDir', '.'],
  {
    cwd: root,
    stdio: 'inherit',
  },
);
symlinkSync(join(root, 'node_modules'), join(out, 'node_modules'));
const require = createRequire(join(out, 'index.js'));
for (const file of readdirSync(join(root, 'api')).filter((f) => f.endsWith('.ts'))) {
  const mod = require(join(out, 'api', file.replace(/\.ts$/, '.js')));
  const handlers = ['GET', 'POST'].filter((m) => typeof mod[m] === 'function');
  if (!handlers.length) throw new Error(`api/${file}: no GET/POST handler exported`);
  console.log(`api/${file}: loads as CommonJS, exports ${handlers.join(', ')}`);
}
