# Hexfield Website — Multi-Agent Build Overview

This document defines the **6-agent pipeline** that produced this website. Each agent has a single role, named outputs, and explicit hand-off rules. The pipeline is sequential by default, with a loop-back path for SEO/perf regressions.

```
PM ──► SEO ─┐
            ├──► Frontend ──► Backend ──► QA ──► (live)
Designer ───┘                              │
   ▲                                       │ loop-back if Lighthouse SEO < 95
   └───────────────────────────────────────┘
```

---

## Agent 1 — Project Manager

| | |
|---|---|
| **Goal** | Plan structure, milestones, AU compliance, coordinate other agents. |
| **Outputs** | Sitemap, tech stack (Astro + Tailwind + Netlify), timeline (5 days), keyword research brief, Australian compliance scope, NAP placeholders. |
| **Hand-off** | → SEO Agent (keyword brief + NAP) and → Designer Agent (sitemap + compliance). |
| **Artifact** | [`docs/01-project-manager-brief.md`](./01-project-manager-brief.md) |

## Agent 2 — SEO & Performance (specialised)

| | |
|---|---|
| **Goal** | Make Hexfield rank #1 brand + page-1 for primary commercial terms within 6 months. |
| **Outputs** | Keyword strategy (primary + secondary + local), per-page meta tags, JSON-LD snippets (Organization, Service, BreadcrumbList, FAQPage, BlogPosting), semantic HTML rules, internal linking plan, Core Web Vitals budget, sitemap.xml + robots.txt rules, hreflang + canonical rules. |
| **Hand-off** | → Frontend Agent (must implement spec verbatim). |
| **Artifact** | [`docs/02-seo-spec.md`](./02-seo-spec.md) |

## Agent 3 — Designer

| | |
|---|---|
| **Goal** | Trustworthy, modern, tech-forward Australian B2B style. |
| **Outputs** | Tailwind palette (blue + green), typography, component recipes (button/card/input/form), dark mode strategy, WCAG 2.1 AA contrast/focus/motion rules, wireframes for every page, approved copy. |
| **Hand-off** | → Frontend Agent (style guide + wireframes). |
| **Artifact** | [`docs/03-design-system.md`](./03-design-system.md) |

## Agent 4 — Frontend

| | |
|---|---|
| **Goal** | Build the site implementing SEO + Design specs without deviation. |
| **Outputs** | Astro 4 + Tailwind 3 project — 17 pages, 4-5 JSON-LD blocks per page, semantic HTML, lazy/eager image discipline, contact form with honeypot + consent, Australian phone format, footer NAP + ABN/ACN. Zero JS shipped; ≤ 250 KB total page weight. |
| **Hand-off** | → Backend Agent (form wiring) and → QA Agent. |
| **Artifact** | `src/` (component-driven Astro project) — see `src/pages/`, `src/components/`, `src/layouts/`, `src/lib/schema.ts`, `src/config/site.ts`. |

## Agent 5 — Backend & Form Handler (lightweight)

| | |
|---|---|
| **Goal** | Serverless form handling that meets Australian Privacy Act + Spam Act. |
| **Outputs** | Netlify Forms wiring (`data-netlify`, honeypot, hidden form-name), `netlify.toml` with security headers + Lighthouse CI plugin, APP-compliant consent checkbox, privacy policy, redirect rules, autoresponder spec. |
| **Hand-off** | → QA Agent (integrated code + deployment instructions). |
| **Artifact** | [`docs/05-backend-spec.md`](./05-backend-spec.md) + [`netlify.toml`](../netlify.toml) + [`src/pages/contact.astro`](../src/pages/contact.astro). |

## Agent 6 — QA, Performance & Deployment

| | |
|---|---|
| **Goal** | Validate SEO + perf + a11y; deploy live; produce post-launch instructions. |
| **Outputs** | Build verification (all 17 pages 200), SEO acceptance matrix, performance budget audit, WCAG 2.1 AA checklist, AU compliance checklist, issues-found log, Netlify deployment runbook, Google Search Console submission steps. |
| **Hand-off** | → Live site, or loop back to SEO/Frontend if Lighthouse SEO < 95 or Perf/A11y < 90. |
| **Artifact** | [`docs/06-qa-and-deployment.md`](./06-qa-and-deployment.md) |

---

## Rules of interaction (enforced during this build)

1. **Sequential by default.** No agent starts before its inputs are signed off.
2. **Loop-back gate.** If QA fails on SEO/Perf/A11y thresholds, control returns to the responsible upstream agent — the work is re-run, not patched in place.
3. **Production-ready code.** All code is committed, documented, and self-contained. No TODOs in shipped code; gaps are tracked in `docs/06-qa-and-deployment.md` §7.
4. **Australian spelling** throughout (e.g. "optimisation", "cybersecurity", "behaviour").
5. **ABN/ACN in footer**; phone in `+61 …` format; trading entity = `Hexfield Pty Ltd`.

## End-state acceptance (signed by QA)

- ✅ 17 pages deployed
- ✅ Sitemap + robots.txt valid
- ✅ Per-page JSON-LD (Organization, WebSite, BreadcrumbList, Service/FAQ/BlogPosting as relevant)
- ✅ Zero JS shipped, ≤ 250 KB total page weight, latin-only fonts
- ✅ APP-compliant privacy + form consent
- ✅ Australian-owned, Australian-spelled, Australian NAP
- ⏳ Replace placeholders (ABN/ACN/phone/address) before DNS cutover

See [`docs/06-qa-and-deployment.md`](./06-qa-and-deployment.md) for the deployment runbook.
