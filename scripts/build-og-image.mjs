#!/usr/bin/env node
// Generates public/images/og-default.png from public/images/og-default.svg.
// We render to PNG because most social platforms (X, LinkedIn, Slack)
// either won't render SVG OG images or render them inconsistently.
//
// Usage:
//   node scripts/build-og-image.mjs
//
// Output: public/images/og-default.png (1200×630, ~10–30 KB)
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'public/images/og-default.svg');
const dst = resolve(root, 'public/images/og-default.png');

const svg = await readFile(src);
const png = await sharp(svg, { density: 144 })
  .resize(1200, 630, { fit: 'cover' })
  .png({ compressionLevel: 9, palette: false })
  .toBuffer();

await writeFile(dst, png);
console.log(`✅ Wrote ${dst} (${(png.length / 1024).toFixed(1)} KB)`);
