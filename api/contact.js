// Native Vercel serverless function for the contact form.
// Lives outside Astro's pipeline so it sidesteps the @astrojs/vercel@7
// adapter's broken function-bundling (nested .vercel/output/_functions/
// path gets stripped at deploy, causing ERR_MODULE_NOT_FOUND).
//
// Vercel auto-discovers files in /api/ at the project root and deploys
// each as its own serverless function. URL: /api/contact (no slash —
// Vercel native functions do NOT use trailing slashes).
//
// Required environment variables (set in Vercel dashboard):
//   RESEND_API_KEY       — Resend API key (required)
//   CONTACT_TO_EMAIL     — recipient (defaults to info@hexfield.com.au)
//   RESEND_FROM_EMAIL    — sender (defaults to onboarding@resend.dev)

import { Resend } from 'resend';
import { Buffer } from 'node:buffer';

export const config = { runtime: 'nodejs20.x' };

const FROM_NAME = 'Hexfield Website';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const SERVICE_LABEL = {
  'forms':         'Forms Digitalization',
  'web-design':    'Web Design',
  'web-dev':       'Web Development (MERN / Java)',
  'system-design': 'System Design & Development',
  'seo':           'SEO',
  'other':         'Something else',
};

function redirect(loc) {
  return new Response(null, { status: 303, headers: { Location: loc } });
}

function escapeHtml(s) {
  return s.replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL       = process.env.CONTACT_TO_EMAIL  ?? 'info@hexfield.com.au';
  const FROM_EMAIL     = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

  if (!RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY is not set');
    return redirect('/contact/?error=server#slide-2');
  }

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return redirect('/contact/?error=bad-request#slide-2');
  }

  // Honeypot
  if (String(formData.get('company-website') || '').length > 0) {
    return redirect('/contact/thanks/');
  }

  const name    = String(formData.get('name')    ?? '').trim();
  const email   = String(formData.get('email')   ?? '').trim();
  const company = String(formData.get('company') ?? '').trim();
  const service = String(formData.get('service') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const consent = formData.get('consent');

  if (!name || !email || !service || !message || !consent) {
    return redirect('/contact/?error=missing#slide-2');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return redirect('/contact/?error=invalid-email#slide-2');
  }
  if (name.length > 200 || email.length > 200 || company.length > 200 || message.length > 5000) {
    return redirect('/contact/?error=too-long#slide-2');
  }

  const attachments = [];
  const file = formData.get('attachment');
  if (file && typeof file === 'object' && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return redirect('/contact/?error=file-too-large#slide-2');
    }
    const buf = Buffer.from(await file.arrayBuffer());
    attachments.push({ filename: file.name || 'attachment', content: buf });
  }

  const serviceLabel = SERVICE_LABEL[service] ?? service;
  const subject = `[Hexfield] ${name} — ${serviceLabel}`;
  const text = [
    'New contact form submission', '',
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Company: ${company || '(not provided)'}`,
    `Service: ${serviceLabel}`, '',
    'Message:', message, '',
    attachments.length ? `Attachment: ${attachments[0].filename} (${(attachments[0].content.length / 1024).toFixed(1)} KB)` : '',
    '',
    '— Submitted via hexfield.com.au',
  ].filter(Boolean).join('\n');

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.55;color:#0F1014;max-width:640px;margin:0 auto;padding:24px;">
<h2 style="margin:0 0 16px;font-size:18px;">New contact form submission</h2>
<table style="border-collapse:collapse;width:100%;font-size:14px;">
<tr><td style="padding:6px 12px 6px 0;color:#6B6E73;vertical-align:top;">Name</td><td style="padding:6px 0;"><strong>${escapeHtml(name)}</strong></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#6B6E73;vertical-align:top;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#0F1014;">${escapeHtml(email)}</a></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#6B6E73;vertical-align:top;">Company</td><td style="padding:6px 0;">${escapeHtml(company) || '<em style="color:#A3A6AB;">(not provided)</em>'}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#6B6E73;vertical-align:top;">Service</td><td style="padding:6px 0;"><strong>${escapeHtml(serviceLabel)}</strong></td></tr>
</table>
<h3 style="margin:24px 0 8px;font-size:15px;">Message</h3>
<div style="background:#F3F4F2;padding:16px;border-radius:8px;font-size:14px;white-space:pre-wrap;">${escapeHtml(message)}</div>
${attachments.length ? `<p style="margin-top:16px;font-size:13px;color:#6B6E73;">Attachment: <strong>${escapeHtml(attachments[0].filename)}</strong> (${(attachments[0].content.length / 1024).toFixed(1)} KB)</p>` : ''}
<p style="margin-top:24px;font-size:12px;color:#A3A6AB;">Submitted via hexfield.com.au</p>
</body></html>`;

  const resend = new Resend(RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      replyTo: email,
      subject,
      text,
      html,
      attachments: attachments.length ? attachments : undefined,
    });
    if (error) {
      console.error('[contact] Resend error:', error);
      return redirect('/contact/?error=send-failed#slide-2');
    }
    console.log('[contact] sent', data?.id);
  } catch (err) {
    console.error('[contact] Unexpected failure:', err);
    return redirect('/contact/?error=send-failed#slide-2');
  }

  return redirect('/contact/thanks/');
}
