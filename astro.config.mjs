import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
// No Vercel adapter — using plain Astro static build (dist/). Vercel then
// auto-detects Astro, serves dist/, and ALSO auto-discovers serverless
// functions under /api/*.js at the project root. The Astro Vercel adapter
// (any variant) would commandeer the build output and silently exclude
// our native /api/contact.js, so we don't use it.

export default defineConfig({
  site: 'https://hexfield.com.au',
  trailingSlash: 'always',
  // Static output — every page is pre-rendered to dist/. The contact form's
  // serverless handler lives at /api/contact.js, deployed by Vercel as a
  // native function alongside the static site.
  output: 'static',
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
