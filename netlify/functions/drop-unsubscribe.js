// netlify/functions/drop-unsubscribe.js
// Afmeldlink voor de Collector List. GET ?e=<email>&t=<token>
// Het token is een HMAC van het e-mailadres met DROP_SECRET, zodat niemand een ander kan afmelden.
// Er wordt niets gewist: alleen drop_signups.unsubscribed_at wordt gezet.

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.DB_URL, process.env.DB_SECRET);

function token(email) {
  return crypto.createHmac('sha256', process.env.DROP_SECRET || '').update(String(email).trim().toLowerCase()).digest('hex').slice(0, 32);
}

function page(title, text) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | Shirt Société</title></head>
<body style="margin:0;background:#0a0905;color:#f5f0e8;font-family:Arial,Helvetica,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px">
<div style="max-width:440px"><div style="font-family:Georgia,serif;font-style:italic;font-weight:900;font-size:26px;color:#c8a950;margin-bottom:24px">Shirt Société</div>
<h1 style="font-family:Georgia,serif;font-style:italic;font-size:26px;margin:0 0 14px">${title}</h1><p style="color:#cfc8bc;line-height:1.7">${text}</p>
<p style="margin-top:28px"><a href="https://shirtsociete.com" style="color:#c8a950">Back to shirtsociete.com</a></p></div></body></html>`
  };
}

exports.handler = async (event) => {
  if (!process.env.DROP_SECRET) return page('Not available', 'This link is not available right now. Email info@shirtsociete.com and we remove you by hand.');
  const q = event.queryStringParameters || {};
  const email = String(q.e || '').trim().toLowerCase();
  const t = String(q.t || '');
  const ok = email && t.length === 32 && crypto.timingSafeEqual(Buffer.from(token(email)), Buffer.from(t));
  if (!ok) return page('Link not valid', 'This unsubscribe link is not valid. Email info@shirtsociete.com and we remove you by hand.');

  try {
    const { error } = await supabase.from('drop_signups')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', email);
    if (error) throw error;
    return page('You are unsubscribed', 'You will not receive any more Collector List emails from us. Changed your mind? Join again any time on shirtsociete.com.');
  } catch (err) {
    console.error('drop-unsubscribe error:', err);
    return page('Something went wrong', 'We could not process this right now. Email info@shirtsociete.com and we remove you by hand.');
  }
};

exports.token = token;
