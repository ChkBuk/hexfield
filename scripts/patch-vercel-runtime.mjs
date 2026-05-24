// Two postbuild fixes for the @astrojs/vercel@7 adapter.
//
// 1) Runtime patch:
//    Vercel deprecated nodejs18.x. The adapter picks the runtime from the
//    LOCAL Node major and only knows about 18 / 20 — any other local
//    version (Node 22 / 24 / 25) silently falls back to nodejs18.x, which
//    Vercel now rejects at deploy time. We force-patch every generated
//    .vc-config.json under .vercel/output/functions to nodejs20.x.
//
// 2) Function-bundle flattening:
//    The adapter places the function entry at
//      _render.func/.vercel/output/_functions/entry.mjs
//    with a handler path of ".vercel/output/_functions/entry.mjs". When
//    Vercel builds and deploys this on its own infra (not from prebuilt
//    artifacts), the nested `.vercel/` path inside the .func bundle gets
//    stripped — Vercel treats `.vercel/` paths as deployment metadata,
//    not function code. Result: the launcher tries to import
//      /var/task/.vercel/output/_functions/entry.mjs
//    and gets ERR_MODULE_NOT_FOUND.
//
//    Fix: hoist the contents of `.vercel/output/_functions/` up to the
//    .func root (where all the entry's relative imports still resolve)
//    and rewrite the handler path to just `entry.mjs`.

import { readdirSync, readFileSync, writeFileSync, statSync, renameSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TARGET_RUNTIME = 'nodejs20.x';
const ROOT = '.vercel/output/functions';
const NESTED_PATH = '.vercel/output/_functions';

function patchRuntimeAndFlatten(funcDir) {
  // --- 1) flatten ---
  const nested = join(funcDir, NESTED_PATH);
  if (existsSync(nested)) {
    for (const entry of readdirSync(nested)) {
      renameSync(join(nested, entry), join(funcDir, entry));
    }
    rmSync(join(funcDir, '.vercel'), { recursive: true, force: true });
    console.log(`✅ Flattened ${funcDir}: lifted ${NESTED_PATH}/* to .func/ root`);
  }

  // --- 2) patch .vc-config.json (runtime + handler path) ---
  const cfgPath = join(funcDir, '.vc-config.json');
  if (!existsSync(cfgPath)) return;
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  let changed = false;
  if (cfg.runtime && cfg.runtime !== TARGET_RUNTIME) {
    console.log(`✅ Patched ${cfgPath}: runtime ${cfg.runtime} → ${TARGET_RUNTIME}`);
    cfg.runtime = TARGET_RUNTIME;
    changed = true;
  }
  if (cfg.handler && cfg.handler.startsWith(NESTED_PATH + '/')) {
    const flat = cfg.handler.slice((NESTED_PATH + '/').length);
    console.log(`✅ Patched ${cfgPath}: handler ${cfg.handler} → ${flat}`);
    cfg.handler = flat;
    changed = true;
  }
  if (changed) writeFileSync(cfgPath, JSON.stringify(cfg, null, '\t') + '\n');
}

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry.endsWith('.func') && statSync(full).isDirectory()) {
      patchRuntimeAndFlatten(full);
    } else if (statSync(full).isDirectory()) {
      walk(full);
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
