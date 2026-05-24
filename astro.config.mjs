import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://hexfield.com.au',
  trailingSlash: 'always',
  // Hybrid: every page is static by default; only routes that opt-in via
  // `export const prerender = false` (currently just /api/contact) ship as
  // a Vercel serverless function.
  output: 'hybrid',
  adapter: vercel(),
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    assets: 'assets',
  },
  // Pagefind ships /pagefind/pagefind.js at postbuild time, so Vite must not
  // try to resolve it from the module graph.
  vite: {
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind.js'],
      },
    },
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      changefreq: 'weekly',
      lastmod: new Date(),
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/contact/thanks/'),
      serialize(item) {
        const url = item.url;
        let priority = 0.6;
        let changefreq = 'monthly';
        if (url === 'https://hexfield.com.au/') { priority = 1.0; changefreq = 'weekly'; }
        else if (url.includes('/services/')) { priority = 0.9; changefreq = 'weekly'; }
        else if (url.includes('/case-studies/')) { priority = 0.8; changefreq = 'monthly'; }
        else if (url.includes('/locations/')) { priority = 0.85; changefreq = 'monthly'; }
        else if (url.includes('/industries/')) { priority = 0.85; changefreq = 'monthly'; }
        else if (url.includes('/team/')) { priority = 0.6; changefreq = 'monthly'; }
        else if (url.includes('/pricing/')) { priority = 0.9; changefreq = 'monthly'; }
        else if (url.includes('/contact/')) { priority = 0.8; changefreq = 'monthly'; }
        else if (url.includes('/about/')) { priority = 0.7; changefreq = 'monthly'; }
        else if (url.includes('/blog/')) { priority = 0.6; changefreq = 'weekly'; }
        else if (url.includes('/privacy/')) { priority = 0.3; changefreq = 'yearly'; }
        return { ...item, priority, changefreq };
      },
    }),
  ],
});
