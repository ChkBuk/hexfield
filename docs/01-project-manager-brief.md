# Agent 1 — Project Manager Brief
**Project:** Hexfield Pty Ltd — Marketing Website
**Owner role:** Project Manager Agent
**Status:** Hand-off ready → Designer Agent + SEO & Performance Agent

---

## 1. Business snapshot
- **Entity:** Hexfield Pty Ltd (Australian proprietary company)
- **Industry:** IT services — Managed IT, Cloud, Cybersecurity
- **Target markets:** Sydney, Melbourne, Brisbane (primary metros); national SMB & mid-market secondary.
- **Compliance scope:**
  - Australian Privacy Act 1988 (APP 1, 3, 5, 11)
  - Spam Act 2003 (explicit consent on contact form)
  - ABN/ACN disclosure in footer (placeholders until provided)
  - Accessibility: WCAG 2.1 AA (legal best practice for AU service providers)

## 2. Site map
```
/                       Home
/services/              Services (overview)
  /managed-it/          Managed IT Services
  /cloud/               Cloud Services (AWS / Azure / M365)
  /cybersecurity/       Cybersecurity Services (Essential Eight aligned)
/about/                 About Hexfield
/case-studies/          Case Studies (index)
  /[slug]/              Individual case study
/blog/                  Blog (index)
  /[slug]/              Article
/contact/               Contact + enquiry form
/privacy/               Privacy Policy (APP compliant)
/sitemap.xml            Generated
/robots.txt             Generated
/404                    Custom 404
```

**URL conventions:**
- Trailing slash on all routes (consistent canonicals).
- Kebab-case slugs.
- No query strings for marketing pages.

## 3. Tech stack decision

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro 4.x** | Ships zero JS by default → best Core Web Vitals; native MDX for blog/case studies; islands architecture if interactivity needed later. |
| Styling | **Tailwind CSS 3.x** | Atomic, tree-shaken, pairs with Astro's per-page CSS extraction. |
| Hosting | **Netlify** | Free SSL, global CDN, native Forms (covers Agent 5), atomic deploys, branch previews. |
| Forms | **Netlify Forms** + honeypot | No client JS required; spam protection; submissions stored + emailed. |
| Images | Astro `<Image>` + WebP/AVIF | Built-in responsive `srcset`, lazy loading, dimension hints (CLS=0). |
| Analytics | **None at launch** (privacy-first) | Avoids cookie banner friction + CWV penalty. Add Plausible (self-hosted, cookieless) post-launch if needed. |
| Repo | Git (this directory) | Single repo, single deploy. |

**Rejected alternatives:**
- Next.js — heavier baseline JS; overkill for a static marketing site.
- WordPress — slower CWV, security overhead, hosting cost.
- React SPA — terrible for SEO crawl + LCP.

## 4. Milestones & timeline (working-day estimate)

| # | Milestone | Owner | Days |
|---|---|---|---|
| M1 | Brief + sitemap + keyword brief | PM | 0.5 |
| M2 | SEO spec (keywords, meta, JSON-LD, CWV budget) | SEO | 0.5 |
| M3 | Design system + wireframes | Designer | 1 |
| M4 | Frontend build (all pages, SEO baked in) | Frontend | 2 |
| M5 | Form handler + privacy/consent | Backend | 0.5 |
| M6 | QA, Lighthouse ≥ 95, deploy, GSC instructions | QA | 0.5 |
| **Total** | | | **5 days** |

## 5. Keyword research brief (input for Agent 2)

> The SEO Agent will expand this into a full strategy. PM provides the **intent map** and **seed terms** only.

### 5.1 Brand terms (must rank #1)
- `hexfield`
- `hexfield pty ltd`
- `hexfield it`
- `hexfield australia`

### 5.2 Primary national service terms (head)
- `it services australia`
- `managed it services australia`
- `cloud services australia`
- `cybersecurity services australia`

### 5.3 Local service terms (high commercial intent)
Pattern: `{service} {city}` for Sydney, Melbourne, Brisbane.
- `it support sydney`, `managed it sydney`, `cybersecurity sydney`
- `it support melbourne`, `managed it melbourne`, `cybersecurity melbourne`
- `it support brisbane`, `managed it brisbane`, `cybersecurity brisbane`

### 5.4 Long-tail / problem-aware (blog & case study fuel)
- `essential eight compliance for small business`
- `microsoft 365 migration consultant australia`
- `aws cost optimisation australia`
- `business continuity plan template australia`
- `ransomware response checklist for smbs`

### 5.5 Intent map
| Intent | Page type | Conversion goal |
|---|---|---|
| Informational | Blog | Email capture (future) / trust building |
| Commercial investigation | Service pages, Case studies | Contact form submit |
| Transactional | Contact, Home hero CTA | Contact form submit |
| Navigational (brand) | Home, About | Brand authority |

### 5.6 Geo signals required (for SEO Agent)
- LocalBusiness JSON-LD with `areaServed` = AU + 3 metros
- NAP (Name / Address / Phone) consistent across footer + contact + JSON-LD
- Phone in AU format: `+61 2 XXXX XXXX` (Sydney HQ placeholder)

## 6. Content placeholders (PM-approved)

| Field | Placeholder value |
|---|---|
| Company legal name | Hexfield Pty Ltd |
| ABN | 00 000 000 000 |
| ACN | 000 000 000 |
| HQ address | Level 1, 100 George Street, Sydney NSW 2000 |
| Phone | +61 2 8000 0000 |
| Email | hello@hexfield.com.au |
| Domain | https://hexfield.com.au |

> **Action for client:** replace ABN/ACN/phone/address before going live. Locations are marked with `<!-- PLACEHOLDER -->` in code.

## 7. Hand-off

→ **SEO Agent:** consume §5 (keyword brief) + §6 (NAP) + §2 (sitemap) → produce SEO spec.
→ **Designer Agent:** consume §2 (sitemap) + §1 (compliance scope) → produce style guide + wireframes.

**Gate before frontend build:** both SEO spec and Design system must be approved.
