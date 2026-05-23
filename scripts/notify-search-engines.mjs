#!/usr/bin/env node
// Notifies search engines that the sitemap has been updated.
// Runs after a successful Netlify deploy.
//
// 1. Google: GET https://www.google.com/ping?sitemap=...   (legacy but still functional)
// 2. Bing:   GET https://www.bing.com/ping?sitemap=...
// 3. IndexNow (Bing, Yandex, Seznam, Naver):
//      POST https://api.indexnow.org/IndexNow with a JSON body listing changed URLs.
//
// IndexNow requires a "key file" to be hosted at /<key>.txt on the site,
// containing the key. We use INDEXNOW_KEY from env (set in Netlify env vars).
// If the key is unset, IndexNow is skipped.
//
// Failures are logged but never fail the script — search-engine notification
// is best-effort and must not block a deploy.

const SITE = process.env.SITE_URL ?? 'https://hexfield.com.au';
const SITEMAP = `${SITE}/sitemap-index.xml`;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

async function safeFetch(label, url, opts) {
  try {
    const res = await fetch(url, opts);
    console.log(`[notify] ${label}: HTTP ${res.status}`);
  } catch (err) {
    console.warn(`[notify] ${label}: failed —`, err.message);
  }
}

// Google + Bing sitemap ping (legacy URLs — still accepted as of 2026)
await safeFetch('Google ping', `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`);
await safeFetch('Bing ping',   `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`);

// IndexNow — notifies a set of search engines about specific changed URLs.
// Without a specific URL list we just notify the sitemap; engines will re-crawl.
if (INDEXNOW_KEY) {
  const body = {
    host: new URL(SITE).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
    urlList: [SITE, SITEMAP],
  };
  await safeFetch('IndexNow', 'https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
} else {
  console.log('[notify] IndexNow: skipped (INDEXNOW_KEY not set)');
}
