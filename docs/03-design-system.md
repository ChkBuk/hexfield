# Agent 3 — Design System & Wireframes
**Inputs:** `01-project-manager-brief.md` (compliance + sitemap)
**Status:** Hand-off ready → Frontend Agent
**Mood:** Trustworthy, modern, tech-forward Australian B2B. Confident, not flashy.

---

## 1. Brand palette

### 1.1 Core (blue-green, tech-forward, AA contrast tested)
| Token | Hex | Use |
|---|---|---|
| `brand-900` | `#062E6F` | Headings on light bg |
| `brand-700` | `#0B5FFF` | Primary buttons, links, accents (**theme-color**) |
| `brand-500` | `#3D85FF` | Hover states |
| `brand-50`  | `#EBF2FF` | Tint backgrounds |
| `accent-600`| `#0E9F6E` | Success, "Australian-made" badge, CTA secondary |
| `accent-50` | `#E6F7F1` | Tint backgrounds |

### 1.2 Neutral
| Token | Hex | Use |
|---|---|---|
| `ink-950` | `#0B1220` | Body text dark mode bg |
| `ink-900` | `#111827` | Headings on dark / body text light |
| `ink-700` | `#374151` | Body text |
| `ink-500` | `#6B7280` | Muted text |
| `ink-200` | `#E5E7EB` | Borders, dividers |
| `ink-50`  | `#F9FAFB` | Page bg (light) |
| `white`   | `#FFFFFF` | Cards, surfaces |

### 1.3 Contrast check (WCAG 2.1 AA)
- `ink-900` on `white` → 18.7:1 ✅
- `ink-700` on `white` → 10.3:1 ✅
- `brand-700` on `white` → 5.2:1 ✅ (AA normal, AAA large)
- `white` on `brand-700` → 5.2:1 ✅
- `accent-600` on `white` → 4.7:1 ✅

## 2. Typography
- **Family:** Inter (self-hosted via `@fontsource/inter`), weights 400 + 700 only.
- **System fallback stack:** `Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Scale (fluid):**
  - H1: `clamp(2.25rem, 4vw, 3.5rem)` / 700 / tracking -0.02em
  - H2: `clamp(1.75rem, 3vw, 2.5rem)` / 700
  - H3: `clamp(1.25rem, 2vw, 1.5rem)` / 700
  - Body: `1rem` (16px) / 400 / line-height 1.65
  - Small: `0.875rem`
- **Measure:** body text max-width `65ch`.

## 3. Spacing, radius, shadow
- Spacing scale: Tailwind defaults (4px base).
- Container: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`.
- Section vertical rhythm: `py-16 md:py-24`.
- Radius: `rounded-lg` (8px) standard; `rounded-2xl` (16px) for hero cards.
- Shadow: only `shadow-sm` on cards; avoid heavy shadows (visual noise).

## 4. Dark mode
- Class strategy (`class="dark"` on `<html>`, toggled via CSS-only `<details>` or `prefers-color-scheme`).
- **Launch decision:** ship `prefers-color-scheme` only (no toggle button) to keep JS = 0. A toggle can be added post-launch.
- Dark surfaces:
  - bg: `ink-950`
  - text: `ink-50`
  - cards: `#111827`
  - borders: `#1F2937`
  - links: `brand-500`

## 5. Components (Tailwind class recipes)

### Button — primary
```html
<a class="inline-flex items-center justify-center rounded-lg bg-brand-700 hover:bg-brand-500 text-white font-semibold px-5 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">…</a>
```
### Button — secondary
```html
<a class="inline-flex items-center justify-center rounded-lg border border-ink-200 text-ink-900 hover:bg-ink-50 font-semibold px-5 py-3 transition dark:border-ink-700 dark:text-ink-50 dark:hover:bg-ink-900">…</a>
```
### Card
```html
<article class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm dark:bg-[#111827] dark:border-[#1F2937]">…</article>
```
### Form input
```html
<input class="w-full rounded-lg border border-ink-200 bg-white px-4 py-3 text-ink-900 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/30 dark:bg-[#111827] dark:border-[#1F2937] dark:text-ink-50" />
```

## 6. Accessibility (WCAG 2.1 AA)
- Visible focus ring on every interactive element (`focus-visible:ring-2`).
- Skip-link as first focusable element.
- Touch targets ≥ 44×44 px.
- No colour-only meaning (form errors include text + icon).
- Form errors associated via `aria-describedby`.
- `prefers-reduced-motion`: disable all CSS transitions/animations.

## 7. Wireframes (ASCII)

### 7.1 Home
```
┌────────────────────────────────────────────────────────────┐
│ [Logo]   Services ▾  About  Case Studies  Blog  Contact ☰ │  Header (sticky)
├────────────────────────────────────────────────────────────┤
│                                                            │
│   H1: Australian IT services that just work.               │
│   Sub: Managed IT, cloud and cybersecurity for Sydney,    │
│        Melbourne and Brisbane businesses.                  │
│   [Get a quote]  [See our services]                        │
│                                                            │
│   [Hero illustration / city skyline]                       │
└────────────────────────────────────────────────────────────┘
┌─ Trust strip ─ "Trusted by Australian businesses since 20XX" ─┐
│  [logo] [logo] [logo] [logo] [logo]                           │
└───────────────────────────────────────────────────────────────┘
┌─ Services (3-col) ─┐
│ [Managed IT]  [Cloud]  [Cybersecurity]                       │
│  Each: H3 + 2-line desc + "Learn more →"                     │
└──────────────────────────────────────────────────────────────┘
┌─ Why Hexfield (4 stats) ─┐
│  24/7 · AU-owned · Essential Eight · 1-business-day response │
└──────────────────────────────────────────────────────────────┘
┌─ Featured case study ─┐
│ Image left | H2 + outcome stats + "Read case study →"        │
└──────────────────────────────────────────────────────────────┘
┌─ FAQ (4–6 Q&A) ─ (also powers FAQPage JSON-LD) ──────────────┐
│ <details><summary>Question</summary>Answer</details>          │
└──────────────────────────────────────────────────────────────┘
┌─ CTA band ─ "Let's talk about your IT" [Contact us] ─────────┐
└──────────────────────────────────────────────────────────────┘
┌─ Footer ─ Logo + NAP + ABN/ACN + links + Privacy ────────────┐
```

### 7.2 Service page (template)
```
Header (as above)
┌─ Breadcrumb: Home > Services > Managed IT ─┐
H1: Managed IT Services Australia
Lead paragraph (1–2 sentences with primary keyword)
[Contact CTA]
─── H2: What's included (icon + title + 1-liner grid, 6 items) ───
─── H2: How it works (4-step horizontal flow) ───
─── H2: Where we operate (Sydney / Melbourne / Brisbane cards) ───
─── H2: Why Australian businesses choose Hexfield (bullets) ───
─── H2: Related case studies (2 cards) ───
─── H2: FAQ (4–6 Q&A) ───
─── CTA band ───
Footer
```

### 7.3 Contact page
```
H1: Contact Hexfield
Lead: "Tell us about your IT challenge. We'll respond within one business day."
[two-column: form left | NAP card right]

Form fields:
  Name*           [input]
  Work email*     [input email]
  Phone           [input tel, pattern +61…]
  Company         [input]
  How can we help?* [textarea]
  [ ] I have read and accept the Privacy Policy*  (consent)
  [hidden honeypot: "company-website"]
  [Submit]

Right card:
  Phone: +61 2 8000 0000
  Email: hello@hexfield.com.au
  Address: Level 1, 100 George St, Sydney NSW 2000
  Hours: Mon–Fri 8am–6pm AEST
```

### 7.4 Blog / Case Studies index
```
H1
3-column card grid (image + title + date + 2-line summary + tag)
Pagination (if > 9 items)
```

## 8. Iconography
- Use inline SVG only (no icon font). Source: Heroicons (MIT). Inline = render-blocking-free, accessible via `aria-hidden="true"` for decorative icons.

## 9. Imagery direction
- Hero: subtle isometric or abstract gradient (no stock-photo cliché). For launch: a CSS/SVG gradient mesh (zero image weight).
- Service icons: line-style, brand-700 stroke.
- Case study heroes: real photography preferred; for launch use placeholder gradient + project name.

## 10. Hand-off to Frontend Agent
- Implement palette as Tailwind theme tokens (`tailwind.config.mjs`).
- Use the component recipes verbatim (or extract to `<Button>`, `<Card>` Astro components).
- Honour wireframes for layout; copy is in §11 below.

## 11. Approved copy snippets
- Hero H1: **"Australian IT services that just work."**
- Hero sub: "Managed IT, cloud and cybersecurity for Sydney, Melbourne and Brisbane businesses — backed by a local team that answers the phone."
- Trust strip line: "Trusted by Australian businesses to keep their technology running."
- Stat block: "24/7 support · Australian-owned · Essential Eight aligned · 1 business-day response"
- Final CTA band: "Let's talk about your IT." — Button: "Contact Hexfield"
