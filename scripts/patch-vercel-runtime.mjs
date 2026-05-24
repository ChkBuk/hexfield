// Vercel deprecated nodejs18.x. The @astrojs/vercel@7 adapter picks the
// runtime from the local Node version's major and only knows about 18 / 20 —
// any other local version (e.g. Node 22 / 24 / 25) silently falls back to
// nodejs18.x, which Vercel now rejects at deploy time.
//
// We force-patch every generated .vc-config.json under .vercel/output/functions
// to nodejs20.x so deploys succeed regardless of the local Node version.

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TARGET_RUNTIME = 'nodejs20.x';
const ROOT = '.vercel/output/functions';

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (entry === '.vc-config.json') {
      const cfg = JSON.parse(readFileSync(full, 'utf8'));
      if (cfg.runtime && cfg.runtime !== TARGET_RUNTIME) {
        const old = cfg.runtime;
        cfg.runtime = TARGET_RUNTIME;
        writeFileSync(full, JSON.stringify(cfg, null, '\t') + '\n');
        console.log(`✅ Patched ${full}: ${old} → ${TARGET_RUNTIME}`);
      }
    }
  }
}

try {
  walk(ROOT);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('No serverless functions to patch (static-only build).');
    process.exit(0);
  }
  throw err;
}
