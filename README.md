# Hexfield Pty Ltd — Website

Production website for **Hexfield Pty Ltd**, an Australian IT services company (Managed IT · Cloud · Cybersecurity).

Built with **Astro 4 + Tailwind CSS 3**, deployed to **Netlify**. Ships zero JavaScript by default, optimised for Core Web Vitals and Google's mobile-first indexing.

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
npm run preview    # serve dist/ locally
```

## Project layout

```
src/
  components/    Reusable Astro components (Header, Footer, Seo, JsonLd, Faq, ...)
  layouts/       BaseLayout — head, JSON-LD wiring, header, footer
  pages/         Route files (1 file = 1 URL)
  content/       Blog + case-study Markdown collections
  config/site.ts Single source of truth for NAP + brand metadata
  lib/schema.ts  JSON-LD generators (Organization, Service, FAQ, BlogPosting, Breadcrumb)
  styles/        Global Tailwind layer + component recipes
public/          Static assets (favicon, logo, og image, manifest, robots.txt)
docs/            Multi-agent specs (PM → SEO → Designer → Frontend → Backend → QA)
astro.config.mjs Site config + Tailwind + sitemap integration
netlify.toml     Build, security headers, redirects, Lighthouse CI
tailwind.config.mjs  Brand tokens, fonts, spacing
```

## How this site was built (multi-agent pipeline)

The site was produced by 6 specialised agents working sequentially.
The full architecture lives in [`docs/00-multi-agent-overview.md`](./docs/00-multi-agent-overview.md).

- [`docs/01-project-manager-brief.md`](./docs/01-project-manager-brief.md) — sitemap, tech stack, keyword brief
- [`docs/02-seo-spec.md`](./docs/02-seo-spec.md) — meta tags, JSON-LD, CWV budget
- [`docs/03-design-system.md`](./docs/03-design-system.md) — palette, typography, wireframes
- [`docs/05-backend-spec.md`](./docs/05-backend-spec.md) — Netlify Forms + APP compliance
- [`docs/06-qa-and-deployment.md`](./docs/06-qa-and-deployment.md) — QA report + deployment runbook

## Before going live

Search the codebase for `PLACEHOLDER` and replace:

- ABN / ACN — in [`src/config/site.ts`](./src/config/site.ts)
- Phone / email / address — same file
- Real client logos in the trust strip on [`src/pages/index.astro`](./src/pages/index.astro)
- Optional: convert [`public/images/og-default.svg`](./public/images/og-default.svg) to a 1200×630 PNG (some social platforms don't render SVG OG images)

Then follow the deployment runbook in [`docs/06-qa-and-deployment.md`](./docs/06-qa-and-deployment.md) §8.
