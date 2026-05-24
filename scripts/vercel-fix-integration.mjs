// Astro integration that fixes two @astrojs/vercel@7 deployment problems.
// Wired in astro.config.mjs so it always runs during `astro build`, even
// when Vercel skips our npm pre/postbuild scripts (Vercel's auto-detection
// runs `astro build` directly unless vercel.json overrides it).
//
// 1) Force runtime = nodejs20.x
//    The adapter picks the runtime from the LOCAL Node major; on Vercel's
//    Linux build env this is fine, but defensive — also fixes local builds
//    on Node 22 / 24 / 25 where the adapter falls back to nodejs18.x.
//
// 2) Flatten the function bundle
//    The adapter writes the entry to
//      _render.func/.vercel/output/_functions/entry.mjs
//    and points the handler at that nested path. Vercel strips nested
//    `.vercel/` paths inside .func bundles at deploy time, so the handler
//    becomes a dangling path → ERR_MODULE_NOT_FOUND. Hoist the contents
//    of the nested .vercel/output/_functions/ directory up to the .func
//    root and rewrite the handler to "entry.mjs".

import { readdirSync, readFileSync, writeFileSync, statSync, renameSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TARGET_RUNTIME = 'nodejs20.x';
const NESTED_PATH = '.vercel/output/_functions';

function patchFuncDir(funcDir) {
  // 1) flatten the nested _functions/ into the .func root
  const nested = join(funcDir, NESTED_PATH);
  if (existsSync(nested)) {
    for (const entry of readdirSync(nested)) {
      renameSync(join(nested, entry), join(funcDir, entry));
    }
    rmSync(join(funcDir, '.vercel'), { recursive: true, force: true });
    console.log(`[vercel-fix] flattened ${funcDir}`);
  }

  // 2) patch .vc-config.json (runtime + handler path)
  const cfgPath = join(funcDir, '.vc-config.json');
  if (!existsSync(cfgPath)) return;
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  let changed = false;
  if (cfg.runtime && cfg.runtime !== TARGET_RUNTIME) {
    console.log(`[vercel-fix] runtime ${cfg.runtime} → ${TARGET_RUNTIME}`);
    cfg.runtime = TARGET_RUNTIME;
    changed = true;
  }
  if (cfg.handler && cfg.handler.startsWith(NESTED_PATH + '/')) {
    const flat = cfg.handler.slice((NESTED_PATH + '/').length);
    console.log(`[vercel-fix] handler ${cfg.handler} → ${flat}`);
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
      patchFuncDir(full);
    } else if (statSync(full).isDirectory()) {
      walk(full);
    }
  }
}

export default function vercelFix() {
  return {
    name: 'vercel-fix',
    hooks: {
      'astro:config:setup': ({ logger }) => {
        logger.info('vercel-fix: registered, will patch .vercel/output after build');
      },
      'astro:build:done': ({ logger }) => {
        logger.info('vercel-fix: running');
        try {
          walk('.vercel/output/functions');
          logger.info('vercel-fix: done');
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
          logger.info('vercel-fix: no .vercel/output/functions, skipping');
        }
      },
    },
  };
}
