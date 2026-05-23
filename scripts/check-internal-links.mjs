#!/usr/bin/env node
// Walks every HTML file in dist/ and verifies that every internal href:
//   - resolves to a file that exists in dist/  (page or asset)
//   - if it's a same-page fragment (#foo), the id exists somewhere in the page
//
// Errors are reported and the process exits non-zero so CI fails on broken links.
// External http(s) links, mailto:, tel:, and anchor-only links pointing to known
// special pages (404 redirect targets, etc.) are skipped.
//
// Usage:
//   node scripts/check-internal-links.mjs            # checks ./dist
//   node scripts/check-internal-links.mjs ./dist     # explicit path
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';

const root = resolve(process.argv[2] ?? './dist');

async function walkHtml(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

async function pathExists(p) {
  try { await stat(p); return true; } catch { return false; }
}

/** Resolve an internal href to a filesystem path that should exist in dist. */
function resolveHref(href, fromFile, distRoot) {
  const [pathPart] = href.split('#');
  // root-relative
  let target = pathPart.startsWith('/')
    ? join(distRoot, pathPart)
    : resolve(dirname(fromFile), pathPart);
  if (target.endsWith('/')) target += 'index.html';
  return target;
}

const files = await walkHtml(root);
const errors = [];
let totalChecked = 0;

for (const file of files) {
  const html = await readFile(file, 'utf8');
  // collect all id="..." for fragment validation
  const idMatches = html.matchAll(/\sid="([^"]+)"/g);
  const ids = new Set([...idMatches].map((m) => m[1]));

  // every href/src that is not external, mailto, tel, javascript, hash-only
  const hrefMatches = html.matchAll(/\s(?:href|src)="([^"]+)"/g);
  for (const m of hrefMatches) {
    const href = m[1];
    totalChecked++;
    if (
      /^(https?:|mailto:|tel:|javascript:|data:|#)/.test(href) ||
      href === ''
    ) continue;

    const [pathPart, fragment] = href.split('#');
    const target = resolveHref(href, file, root);
    const exists = await pathExists(target);
    if (!exists) {
      errors.push({ file: file.replace(root, ''), href, target: target.replace(root, '') });
      continue;
    }
    // If fragment-on-same-page, verify the id exists in the source file
    if (fragment && (pathPart === '' || resolve(dirname(file), pathPart) === file)) {
      if (!ids.has(fragment)) {
        errors.push({ file: file.replace(root, ''), href, target: `#${fragment} (missing id)` });
      }
    }
  }
}

if (errors.length) {
  console.error(`\n❌ Found ${errors.length} broken internal link(s):\n`);
  for (const e of errors) {
    console.error(`  ${e.file}`);
    console.error(`    href:   ${e.href}`);
    console.error(`    target: ${e.target}`);
    console.error('');
  }
  process.exit(1);
} else {
  console.log(`✅ Internal links OK — ${totalChecked} hrefs across ${files.length} HTML files.`);
}
