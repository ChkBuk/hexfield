# Agent 2 — SEO & Performance Specification
**Inputs:** `01-project-manager-brief.md`
**Status:** Hand-off ready → Frontend Agent
**Goal:** Hexfield ranks #1 brand + page-1 for primary commercial terms within 6 months of indexing.

---

## 1. Keyword strategy

### 1.1 Page-level keyword mapping
| URL | Primary | Secondary | Local |
|---|---|---|---|
| `/` | `it services australia` | `managed it services`, `business it support` | `it support sydney melbourne brisbane` |
| `/services/` | `it services for business australia` | `managed services provider australia` | — |
| `/services/managed-it/` | `managed it services australia` | `outsourced it support`, `24/7 it helpdesk` | `managed it sydney`, `managed it melbourne`, `managed it brisbane` |
| `/services/cloud/` | `cloud services australia` | `microsoft 365 migration`, `aws consulting australia`, `azure consulting` | `cloud consultant sydney`, `cloud consultant melbourne` |
| `/services/cybersecurity/` | `cybersecurity services australia` | `essential eight compliance`, `penetration testing australia`, `iso 27001 consulting` | `cybersecurity sydney`, `cybersecurity melbourne`, `cybersecurity brisbane` |
| `/about/` | `hexfield pty ltd` | `australian it company`, `australian msp` | — |
| `/case-studies/` | `it case studies australia` | `msp case studies` | — |
| `/blog/` | `australian it blog` | `it advice for small business australia` | — |
| `/contact/` | `contact hexfield` | `it support enquiry australia` | `it support sydney contact` |

### 1.2 Ranking strategy
- **Brand moat:** consistent NAP + LocalBusiness schema = guaranteed #1 for `hexfield pty ltd`.
- **Commercial terms:** topical authority via service pages (≥800 words, H1 + 3–5 H2s, internal links to case studies & blog).
- **Local pack:** LocalBusiness schema with `areaServed` array; city-specific content blocks on each service page; future Google Business Profiles per metro (out of website scope).
- **Long-tail:** blog posts target problem-aware queries → internal-link to service pages → conversion.

## 2. Meta tags — per page

> Title ≤ 60 chars, description 140–158 chars. Australian English.

| URL | Title | Description |
|---|---|---|
| `/` | Hexfield \| IT Services Australia — Managed IT, Cloud & Cybersecurity | Hexfield Pty Ltd delivers managed IT, cloud and cybersecurity services to Australian businesses. Local support in Sydney, Melbourne, Brisbane. |
| `/services/` | IT Services for Australian Business \| Hexfield | Explore Hexfield's managed IT, cloud and cybersecurity services — built for Australian SMBs and mid-market organisations. |
| `/services/managed-it/` | Managed IT Services Australia \| 24/7 Support \| Hexfield | Outsource your IT to Hexfield. 24/7 helpdesk, proactive monitoring and on-site support across Sydney, Melbourne and Brisbane. |
| `/services/cloud/` | Cloud Services Australia — AWS, Azure, Microsoft 365 \| Hexfield | Cloud migration, optimisation and managed cloud services. Certified AWS and Microsoft partners supporting Australian businesses. |
| `/services/cybersecurity/` | Cybersecurity Services Australia \| Essential Eight \| Hexfield | Cybersecurity assessments, Essential Eight uplift, penetration testing and 24/7 SOC services for Australian organisations. |
| `/about/` | About Hexfield Pty Ltd \| Australian IT Services Company | Meet Hexfield — an Australian-owned IT services company helping businesses run secure, modern and reliable technology. |
| `/case-studies/` | Case Studies \| Hexfield IT Services Australia | Real results from Australian businesses we've helped with managed IT, cloud migration and cybersecurity uplift. |
| `/blog/` | Insights & Advice \| Hexfield IT Blog Australia | Practical IT, cloud and cybersecurity guidance for Australian businesses, written by the Hexfield team. |
| `/contact/` | Contact Hexfield \| IT Support Australia | Get in touch with Hexfield Pty Ltd. Australian IT support across Sydney, Melbourne and Brisbane. Response within one business day. |
| `/privacy/` | Privacy Policy \| Hexfield Pty Ltd | How Hexfield Pty Ltd collects, uses and protects your personal information under the Australian Privacy Act 1988. |

### 2.1 Universal `<head>` requirements
- `<meta charset="UTF-8">`
- `<meta name="viewport" content="width=device-width,initial-scale=1">`
- `<meta name="robots" content="index,follow,max-image-preview:large">`
- `<link rel="canonical" href="{absolute URL}">`
- `<link rel="alternate" hreflang="en-AU" href="{absolute URL}">`
- `<link rel="alternate" hreflang="x-default" href="{absolute URL}">`
- Open Graph: `og:title`, `og:description`, `og:type`, `og:url`, `og:image` (1200×630), `og:locale=en_AU`
- Twitter: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`
- `<meta name="theme-color" content="#0B5FFF">`
- Favicon + `apple-touch-icon`

### 2.2 Per-page robots overrides
- `/privacy/` → `index,follow` (allowed, but low priority in sitemap)
- `/404` → `noindex,follow`
- Pagination in blog → `noindex,follow` after page 1

## 3. Structured data (JSON-LD)

### 3.1 Site-wide (in `<head>` of every page) — Organization + LocalBusiness
```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "https://hexfield.com.au/#organization",
  "name": "Hexfield Pty Ltd",
  "alternateName": "Hexfield",
  "url": "https://hexfield.com.au",
  "logo": "https://hexfield.com.au/images/logo.svg",
  "image": "https://hexfield.com.au/images/og-default.png",
  "description": "Australian IT services company providing managed IT, cloud and cybersecurity services.",
  "telephone": "+61-2-8000-0000",
  "email": "hello@hexfield.com.au",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Level 1, 100 George Street",
    "addressLocality": "Sydney",
    "addressRegion": "NSW",
    "postalCode": "2000",
    "addressCountry": "AU"
  },
  "areaServed": [
    {"@type": "Country", "name": "Australia"},
    {"@type": "City", "name": "Sydney"},
    {"@type": "City", "name": "Melbourne"},
    {"@type": "City", "name": "Brisbane"}
  ],
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "08:00",
    "closes": "18:00"
  }],
  "sameAs": [
    "https://www.linkedin.com/company/hexfield"
  ]
}
```

### 3.2 Per service page — Service + BreadcrumbList
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Managed IT Services",
  "provider": {"@id": "https://hexfield.com.au/#organization"},
  "areaServed": ["Australia","Sydney","Melbourne","Brisbane"],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Managed IT",
    "itemListElement": [
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"24/7 Helpdesk"}},
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"Proactive Monitoring"}},
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"On-site Support"}}
    ]
  }
}
```
+ `BreadcrumbList` (Home → Services → {service}).

### 3.3 Blog post — BlogPosting
- `headline`, `datePublished`, `dateModified`, `author` (Person), `publisher` (→ Organization @id), `image`, `mainEntityOfPage`.

### 3.4 Case study — Article + reference to Service
- Same as BlogPosting + `about` linking to the Service.

### 3.5 FAQ page — FAQPage (homepage + service pages)
- 4–6 Q&A pairs each, mirroring on-page H3s.

## 4. Semantic HTML structure (mandatory rules for Frontend Agent)

- **One `<h1>` per page.** It must contain the primary keyword.
- Heading order strictly hierarchical: H1 → H2 → H3 (no skipping).
- Use `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>` — not `<div>` soup.
- Every `<img>` requires descriptive `alt` (or `alt=""` if purely decorative).
- Every `<a>` requires discernible text; external links get `rel="noopener"` (and `noreferrer` if user-provided).
- Forms: `<label for>` paired with `id`; required fields have `aria-required="true"`.
- Skip-link: `<a href="#main" class="sr-only focus:not-sr-only">Skip to main content</a>` as first focusable element.

## 5. Internal linking plan
- **Home** links to all three service pages + 1 featured case study + 3 featured blog posts.
- **Each service page** links to: 2 sibling services, 1–2 relevant case studies, 1–2 relevant blog posts, Contact CTA.
- **Each case study** links to the relevant service page + Contact.
- **Each blog post** links to ≥1 service page + ≥1 related blog post.
- Footer link cluster: all services, About, Case Studies, Blog, Contact, Privacy.

## 6. Core Web Vitals — performance budget

| Metric | Budget | Strategy |
|---|---|---|
| **LCP** | < 2.0s | Hero image: WebP, 1600w max, `fetchpriority="high"`, preloaded. No render-blocking JS. |
| **INP** | < 200ms | Almost no JS. Mobile nav uses CSS-only `<details>` or checkbox-hack. |
| **CLS** | < 0.05 | All images/iframes have explicit `width`/`height`. Fonts: `font-display: swap` + preload. |
| **TTFB** | < 600ms | Static site on Netlify CDN. |
| **Total page weight** | < 250 KB on first load (incl. images) | Tailwind purged; no JS framework runtime. |
| **JS budget** | < 10 KB | Vanilla form validation only. |
| **Fonts** | 1 family, 2 weights (400, 700) | Self-host (Inter via Fontsource) — no Google Fonts request. |

### 6.1 Implementation rules
- Astro builds with `output: 'static'`, `compressHTML: true`.
- Images via Astro `<Image>` → AVIF + WebP fallback, responsive `srcset`.
- `loading="lazy"` on all images below the fold; `loading="eager"` + `fetchpriority="high"` on hero only.
- CSS inlined for above-the-fold (Astro does this automatically per route).
- No client-side router. Plain anchor links.
- No third-party scripts at launch (no GA, no Tag Manager, no chat widget).

## 7. sitemap.xml & robots.txt

### 7.1 robots.txt
```
User-agent: *
Allow: /
Disallow: /404

Sitemap: https://hexfield.com.au/sitemap.xml
```

### 7.2 sitemap.xml — generation rules
- Use `@astrojs/sitemap` integration.
- `changefreq`: `weekly` for blog index + service pages; `monthly` for others.
- `priority`: 1.0 Home; 0.9 Services index + each service; 0.8 Case studies index + Contact; 0.7 About; 0.6 Blog index + posts; 0.3 Privacy.
- Exclude: `/404`.
- `<lastmod>` auto-populated from file mtime.

## 8. hreflang & canonical
- Single locale (`en-AU`) — still emit `hreflang="en-AU"` + `hreflang="x-default"` to the same URL for clarity.
- Canonical = self-referential absolute URL, always with trailing slash.

## 9. Hand-off to Frontend Agent

The Frontend Agent must implement **all of the following** without deviation:
1. Meta tags from §2 (use a `<Seo>` component that takes `title`, `description`, `canonical`, optional `image`).
2. JSON-LD from §3 (site-wide block in `BaseLayout`, page-specific blocks injected via slot).
3. Semantic structure rules from §4 (lint manually before QA hand-off).
4. Internal linking from §5.
5. CWV constraints from §6 (no JS frameworks, no remote fonts, image discipline).
6. Sitemap + robots from §7.
7. hreflang + canonical from §8.

**Gate before Backend Agent:** Lighthouse SEO ≥ 95 in local preview (`astro preview` + `npx lighthouse`).
