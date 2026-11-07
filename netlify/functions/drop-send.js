// netlify/functions/drop-send.js
// Sends a drop email to every subscriber — ONE SEPARATE EMAIL PER PERSON.
// Nobody sees anyone else's address, because each message has a single recipient.
// Pass { testEmail: "..." } to send only to that address (safe dry run).

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(process.env.DB_URL, process.env.DB_SECRET);
const resend = new Resend(process.env.RESEND_API_KEY);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

const SEND_SECRET = process.env.DROP_SECRET || 'ss-drop-2026';

// Email in the same style as the signup confirmation
function buildEmail(o) {
  return `
  <div style="background:#0a0905;color:#f5f0e8;font-family:Arial,Helvetica,sans-serif;padding:40px 32px;max-width:560px;margin:0 auto">
    <div style="margin:0 0 32px;font-family:Georgia,serif;font-style:italic;font-weight:900;font-size:26px;letter-spacing:1px;color:#c8a950;line-height:1">Shirt Société<div style="height:2px;width:48px;background:#c8a950;margin-top:10px"></div></div>
    <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8a950;margin:0 0 14px;font-weight:600">${o.eyebrow}</p>
    <h2 style="font-family:Georgia,serif;font-style:italic;font-size:26px;margin:0 0 18px;color:#f5f0e8;font-weight:900;line-height:1.25">${o.heading}</h2>
    ${o.lines.map(l => `<p style="color:#e2dccd;font-size:16px;line-height:1.7;margin:0 0 16px">${l}</p>`).join('')}
    ${o.highlight ? `<div style="background:#111009;border-left:3px solid #c8a950;padding:16px 18px;margin:22px 0;color:#efe9db;font-size:15px;line-height:1.7">${o.highlight}</div>` : ''}
    <a href="${o.ctaUrl}" style="display:inline-block;background:#c8a950;color:#0a0905;text-decoration:none;padding:13px 26px;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;border-radius:2px;margin-top:10px">${o.ctaText}</a>
    <p style="color:#b8b0a0;font-size:12px;margin-top:34px;border-top:1px solid #1e1c17;padding-top:16px;line-height:1.6">
      Shirt Societe &middot; Harderwijk, Netherlands &middot; <a href="https://shirtsociete.com" style="color:#b8b0a0">shirtsociete.com</a><br>
      You receive this because you signed up for drop alerts.
    </p>
  </div>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const p = JSON.parse(event.body || '{}');
    if (p.secret !== SEND_SECRET) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Not authorised' }) };
    }

    const subject = p.subject || 'The next drop is coming';
    const content = {
      eyebrow:   p.eyebrow   || 'Drop announcement',
      heading:   p.heading   || 'Ten shirts<br>Thursday 6 August, 16:00',
      lines:     Array.isArray(p.lines) && p.lines.length ? p.lines : ['The next drop goes live on Thursday.'],
      highlight: p.highlight || '',
      ctaText:   p.ctaText   || 'Visit the shop',
      ctaUrl:    p.ctaUrl    || 'https://shirtsociete.com'
    };
    const html = buildEmail(content);

    // Test mode: send only to the given address
    let emails;
    if (p.testEmail) {
      emails = [String(p.testEmail).trim()];
    } else {
      const { data: signups, error } = await supabase.from('drop_signups').select('email');
      if (error) throw error;
      emails = (signups || []).map(s => (s.email || '').trim()).filter(e => e && e.includes('@'));
    }

    if (!emails.length) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ sent: 0, note: 'No recipients' }) };
    }

    let sent = 0;
    const failed = [];

    // ── ONE EMAIL PER PERSON ──
    // Single recipient per send, so no one can see the rest of the list.
    for (const to of emails) {
      try {
        await resend.emails.send({
          from: 'Shirt Societe <info@shirtsociete.com>',
          to: to,
          subject: subject,
          html: html
        });
        sent++;
      } catch (e) {
        console.error('Send failed for', to, e.message);
        failed.push(to);
      }
      await new Promise(r => setTimeout(r, 600));
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ sent, total: emails.length, failed, test: !!p.testEmail })
    };

  } catch (err) {
    console.error('drop-send error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
