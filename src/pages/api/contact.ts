// Contact form handler — POSTed to from /contact/.
// Validates, sends email via Resend, then redirects.
//
// Environment variables required on Vercel:
//   RESEND_API_KEY       — Resend API key (https://resend.com/api-keys)
//   CONTACT_TO_EMAIL     — recipient (defaults to info@hexfield.com.au)
//   RESEND_FROM_EMAIL    — sender (defaults to onboarding@resend.dev which
//                          works without DNS verification; once Hexfield
//                          domain is verified on Resend, swap to a branded
//                          address like noreply@hexfield.com.au)
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Tell Astro this route must be a serverless function, not pre-rendered.
export const prerender = false;

// Read at runtime via process.env — NOT import.meta.env. Vite statically
// replaces import.meta.env.* at build time, so any env var that's absent
// during the build gets inlined as `undefined` and the dead-code eliminator
// will then strip every branch that depends on it (e.g. the whole Resend
// send path). process.env is read at request time, on the Vercel function.
const FROM_NAME = 'Hexfield Website';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const SERVICE_LABEL: Record<string, string> = {
  'forms':         'Forms Digitalization',
  'web-design':    'Web Design',
  'web-dev':       'Web Development (MERN / Java)',
  'system-design': 'System Design & Development',
  'seo':           'SEO',
  'other':         'Something else',
};

function bad(redirectTo: string): Response {
  return new Response(null, { status: 303, headers: { Location: redirectTo } });
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

export const POST: APIRoute = async ({ request }) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL       = process.env.CONTACT_TO_EMAIL   ?? 'info@hexfield.com.au';
  const FROM_EMAIL     = process.env.RESEND_FROM_EMAIL  ?? 'onboarding@resend.dev';

  // Resend key not configured (e.g. running locally without env vars). Fail
  // gracefully — redirect back with a server-config error instead of 500'ing.
  if (!RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY is not set');
    return bad('/contact/?error=server#slide-2');
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return bad('/contact/?error=bad-request#slide-2');
  }

  // Honeypot — bots fill this, real users don't see it.
  if (String(formData.get('company-website') || '').length > 0) {
    // Pretend success so the bot doesn't retry; don't actually send.
    return bad('/contact/thanks/');
  }

  const name    = String(formData.get('name')    ?? '').trim();
  const email   = String(formData.get('email')   ?? '').trim();
  const company = String(formData.get('company') ?? '').trim();
  const service = String(formData.get('service') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const consent = formData.get('consent');

  // Required-field validation
  if (!name || !email || !service || !message || !consent) {
    return bad('/contact/?error=missing#slide-2');
  }
  // Basic email shape
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad('/contact/?error=invalid-email#slide-2');
  }
  if (name.length > 200 || email.length > 200 || company.length > 200 || message.length > 5000) {
    return bad('/contact/?error=too-long#slide-2');
  }

  // Optional file attachment
  const attachments: Array<{ filename: string; content: Buffer }> = [];
  const file = formData.get('attachment');
  if (file && file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return bad('/contact/?error=file-too-large#slide-2');
    }
    const buf = Buffer.from(await file.arrayBuffer());
    attachments.push({ filename: file.name || 'attachment', content: buf });
  }

  // Build email content
  const serviceLabel = SERVICE_LABEL[service] ?? service;
  const subject = `[Hexfield] ${name} — ${serviceLabel}`;
  const text = [
    `New contact form submission`,
    ``,
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Company: ${company || '(not provided)'}`,
    `Service: ${serviceLabel}`,
    ``,
    `Message:`,
    message,
    ``,
    attachments.length ? `Attachment: ${attachments[0].filename} (${(attachments[0].content.length / 1024).toFixed(1)} KB)` : '',
    ``,
    `— Submitted via hexfield.com.au`,
  ].filter(Boolean).join('\n');

  const html = `
<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.55; color: #0F1014; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h2 style="margin: 0 0 16px; font-size: 18px;">New contact form submission</h2>
  <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
    <tr><td style="padding: 6px 12px 6px 0; color: #6B6E73; vertical-align: top;">Name</td><td style="padding: 6px 0;"><strong>${escapeHtml(name)}</strong></td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #6B6E73; vertical-align: top;">Email</td><td style="padding: 6px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #0F1014;">${escapeHtml(email)}</a></td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #6B6E73; vertical-align: top;">Company</td><td style="padding: 6px 0;">${escapeHtml(company) || '<em style="color: #A3A6AB;">(not provided)</em>'}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #6B6E73; vertical-align: top;">Service</td><td style="padding: 6px 0;"><strong>${escapeHtml(serviceLabel)}</strong></td></tr>
  </table>
  <h3 style="margin: 24px 0 8px; font-size: 15px;">Message</h3>
  <div style="background: #F3F4F2; padding: 16px; border-radius: 8px; font-size: 14px; white-space: pre-wrap;">${escapeHtml(message)}</div>
  ${attachments.length ? `<p style="margin-top: 16px; font-size: 13px; color: #6B6E73;">📎 Attachment: <strong>${escapeHtml(attachments[0].filename)}</strong> (${(attachments[0].content.length / 1024).toFixed(1)} KB)</p>` : ''}
  <p style="margin-top: 24px; font-size: 12px; color: #A3A6AB;">Submitted via hexfield.com.au</p>
</body></html>`;

  // Send via Resend
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
      console.error('[contact] Resend returned error:', error);
      return bad('/contact/?error=send-failed#slide-2');
    }
    console.log('[contact] sent', data?.id);
  } catch (err) {
    console.error('[contact] Unexpected send failure:', err);
    return bad('/contact/?error=send-failed#slide-2');
  }

  return bad('/contact/thanks/');
};
