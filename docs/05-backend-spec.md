# Agent 5 — Backend & Form Handler Spec
**Inputs:** Frontend code, PM compliance scope (Australian Privacy Act 1988)
**Status:** Hand-off ready → QA & Deployment Agent

---

## 1. Architecture decision: Netlify Forms

We avoid running our own backend. Trade-offs evaluated:

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Netlify Forms (chosen)** | Zero code; built-in honeypot + reCAPTCHA option; AU data egress via Netlify CDN; submissions stored + emailed | 100 submissions/month free, then paid | ✅ Best fit for marketing site |
| Formspree | Easy | Third-party data processor (US); GDPR/APP review needed | ❌ unnecessary risk |
| Custom Netlify Function | Full control | More code to maintain; same outcome | ❌ overkill |
| Mailto: link | No infra | Terrible UX; no record | ❌ |

## 2. How it works in this repo

1. The form in `src/pages/contact.astro` carries `data-netlify="true"`.
2. On `npm run build`, Astro renders the form to static HTML in `dist/`.
3. On `netlify deploy`, Netlify's HTML post-processor scans `dist/` for `data-netlify` forms and registers them.
4. POST submissions to `/contact/` are intercepted by Netlify, validated against the registered form, and:
   - written to the site's Forms dashboard,
   - emailed to the configured notification address,
   - and the user is redirected to `/contact/thanks/`.

## 3. Spam prevention (no JS, no third-party tracking)

- **Honeypot field:** `company-website` — hidden via `class="hidden"`, `tabindex="-1"`, `autocomplete="off"`. Bots fill it; humans don't.
- **No reCAPTCHA at launch** to avoid Google tracking + CWV penalty. If spam rises above ~5% of submissions, enable Netlify's invisible reCAPTCHA from the dashboard.
- **Honeypot is enforced by Netlify** via `netlify-honeypot="company-website"` attribute on `<form>`.

## 4. Australian Privacy Act (APP) compliance

| Principle | How we comply |
|---|---|
| APP 1 — open & transparent management | `/privacy/` page; clear consent text on form |
| APP 3 — collection of solicited info | Only fields necessary for an enquiry (name, email, phone, company, message) |
| APP 5 — notification | Form copy explicitly states purpose + privacy policy link |
| APP 6 — use & disclosure | Privacy policy commits to enquiry-response use only |
| APP 8 — cross-border disclosure | Privacy policy discloses that processing may occur via Netlify CDN |
| APP 11 — security | HTTPS only, HSTS preload, no analytics retention, Netlify Forms encryption at rest |

## 5. Consent gating (built into form)

- Required checkbox `consent` with label linking to `/privacy/`.
- `aria-required="true"`, browser-native required validation.
- Form does not submit without it (HTML5 `required` attribute).
- Submission stores the timestamped consent record (Netlify records every field, including `consent=on`).

## 6. Notification configuration (post-deploy, manual)

In Netlify dashboard → Forms → contact → Notifications:
1. Add email recipient: `hello@hexfield.com.au` (and optional Slack webhook).
2. Subject template: `[hexfield.com.au] New enquiry from {{name}}`.
3. Enable "Send autoresponder" → use `/contact/thanks/` copy as basis (optional).

## 7. Data retention policy

- Netlify Forms submissions: 30 days in dashboard, then exported to ops mailbox for archival.
- Documented in `/privacy/`.
- No third-party analytics; nothing else to retain.

## 8. Hand-off to QA Agent

Verify the following:
- [x] Form has `data-netlify="true"` and `netlify-honeypot` attributes.
- [x] `form-name` hidden input matches `name="contact"`.
- [x] `action="/contact/thanks/"` exists.
- [x] `/contact/thanks/` is `noindex`.
- [x] Consent checkbox is `required`.
- [x] `netlify.toml` sets `[build] publish = "dist"` and includes security headers + Lighthouse plugin.
- [ ] After first deploy: confirm form appears in Netlify Forms dashboard.
- [ ] Test a submission end-to-end on a deploy preview.
