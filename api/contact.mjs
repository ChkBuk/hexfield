// Native Vercel serverless function — Node.js style (req, res).
// Uses .mjs for explicit ESM (avoids any auto-detection ambiguity from
// the parent package.json "type":"module").
//
// Required environment variables (set in Vercel dashboard):
//   RESEND_API_KEY       — Resend API key (required)
//   CONTACT_TO_EMAIL     — recipient (defaults to info@hexfield.com.au)
//   RESEND_FROM_EMAIL    — sender (defaults to onboarding@resend.dev)

import { Resend } from 'resend';
import { Buffer } from 'node:buffer';
import { parse as parseQS } from 'node:querystring';

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

function redirect(res, loc) {
  res.statusCode = 303;
  res.setHeader('Location', loc);
  res.end();
}

function escapeHtml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// Read the request body as a Buffer.
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end',  ()  => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Minimal multipart/form-data parser. Returns { fields, files }.
// Sufficient for our flat form (5 text fields + 1 optional file).
function parseMultipart(buf, boundary) {
  const fields = {};
  const files  = {};
  const delim = Buffer.from('--' + boundary);
  const close = Buffer.from('--' + boundary + '--');
  let start = 0;
  while (start < buf.length) {
    const next = buf.indexOf(delim, start);
    if (next === -1) break;
    if (buf.compare(close, 0, close.length, next, next + close.length) === 0) break;
    const partStart = next + delim.length + 2; // +CRLF
    const partEnd = buf.indexOf(delim, partStart);
    if (partEnd === -1) break;
    const part = buf.subarray(partStart, partEnd - 2); // strip trailing CRLF
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = partEnd; continue; }
    const headers = part.subarray(0, headerEnd).toString('utf8');
    const body    = part.subarray(headerEnd + 4);
    const nameMatch = headers.match(/name="([^"]+)"/i);
    const fileMatch = headers.match(/filename="([^"]*)"/i);
    if (nameMatch) {
      const name = nameMatch[1];
      if (fileMatch) {
        files[name] = { filename: fileMatch[1], content: body, size: body.length };
      } else {
        fields[name] = body.toString('utf8');
      }
    }
    start = partEnd;
  }
  return { fields, files };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL       = process.env.CONTACT_TO_EMAIL  ?? 'info@hexfield.com.au';
  const FROM_EMAIL     = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

  if (!RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY is not set');
    return redirect(res, '/contact/?error=server#slide-2');
  }

  let fields = {}, files = {};
  try {
    const buf = await readBody(req);
    const ctype = req.headers['content-type'] || '';
    if (ctype.startsWith('multipart/form-data')) {
      const m = ctype.match(/boundary=([^;]+)/);
      if (!m) return redirect(res, '/contact/?error=bad-request#slide-2');
      ({ fields, files } = parseMultipart(buf, m[1].trim().replace(/^"|"$/g, '')));
    } else if (ctype.startsWith('application/x-www-form-urlencoded')) {
      fields = parseQS(buf.toString('utf8'));
    } else {
      return redirect(res, '/contact/?error=bad-request#slide-2');
    }
  } catch (err) {
    console.error('[contact] body parse failed:', err);
    return redirect(res, '/contact/?error=bad-request#slide-2');
  }

  // Honeypot
  if (String(fields['company-website'] || '').length > 0) {
    return redirect(res, '/contact/thanks/');
  }

  const name    = String(fields.name    ?? '').trim();
  const email   = String(fields.email   ?? '').trim();
  const company = String(fields.company ?? '').trim();
  const service = String(fields.service ?? '').trim();
  const message = String(fields.message ?? '').trim();
  const consent = fields.consent;

  if (!name || !email || !service || !message || !consent) {
    return redirect(res, '/contact/?error=missing#slide-2');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return redirect(res, '/contact/?error=invalid-email#slide-2');
  }
  if (name.length > 200 || email.length > 200 || company.length > 200 || message.length > 5000) {
    return redirect(res, '/contact/?error=too-long#slide-2');
  }

  const attachments = [];
  const file = files.attachment;
  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return redirect(res, '/contact/?error=file-too-large#slide-2');
    }
    attachments.push({ filename: file.filename || 'attachment', content: file.content });
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
      return redirect(res, '/contact/?error=send-failed#slide-2');
    }
    console.log('[contact] sent', data?.id);
  } catch (err) {
    console.error('[contact] Unexpected failure:', err);
    return redirect(res, '/contact/?error=send-failed#slide-2');
  }

  return redirect(res, '/contact/thanks/');
}
