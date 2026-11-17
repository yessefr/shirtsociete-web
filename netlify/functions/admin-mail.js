// netlify/functions/admin-mail.js
// Mail sturen naar een klant vanuit de admin (alleen voor de ingelogde admin).
// POST { order_id, subject, message }
// De ontvanger komt ALTIJD uit de order (customer_email), nooit uit het verzoek,
// zodat deze functie niet voor willekeurige mail gebruikt kan worden.
// Afzender: Shirt Societe <info@shirtsociete.com>, kopie (bcc) naar info@shirtsociete.com.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.DB_URL, process.env.DB_SECRET);

const CORS = {
  'Access-Control-Allow-Origin': 'https://shirtsociete.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

async function verifyAdmin(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '');
  const userClient = createClient(process.env.DB_URL, process.env.DB_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return false;
  return user.email === process.env.ADMIN_EMAIL;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Maakt van gewone tekst nette HTML: regels worden alinea's, links worden klikbaar.
function messageToHtml(text) {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map(p => '<p style="color:#e2dccd;font-size:15px;line-height:1.7;margin:0 0 16px">'
      + p.replace(/\n/g, '<br>')
          .replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" style="color:#c8a950">$1</a>')
      + '</p>')
    .join('');
}

function buildEmail(message) {
  return `
  <div style="background:#0a0905;color:#f5f0e8;font-family:Arial,Helvetica,sans-serif;padding:40px 32px;max-width:560px;margin:0 auto">
    <div style="margin:0 0 28px;font-family:Georgia,serif;font-style:italic;font-weight:900;font-size:26px;letter-spacing:1px;color:#c8a950;line-height:1">Shirt Société<div style="height:2px;width:48px;background:#c8a950;margin-top:10px"></div></div>
    ${messageToHtml(message)}
    <p style="color:#b8b0a0;font-size:12px;margin-top:30px;border-top:1px solid #1e1c17;padding-top:16px;line-height:1.6">
      Shirt Société &middot; Harderwijk, Netherlands &middot; <a href="https://shirtsociete.com" style="color:#b8b0a0">shirtsociete.com</a><br>
      Reply to this email and we will get back to you.
    </p>
  </div>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!(await verifyAdmin(event))) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  if (!process.env.RESEND_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'RESEND_API_KEY is not set' }) };
  }

  try {
    const p = JSON.parse(event.body || '{}');
    const subject = String(p.subject || '').trim();
    const message = String(p.message || '').trim();
    if (!p.order_id || !subject || !message) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'order_id, subject and message are required' }) };
    }
    if (subject.length > 200 || message.length > 5000) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Subject or message is too long' }) };
    }

    const { data: order, error } = await supabase
      .from('orders').select('id, order_ref, customer_email').eq('id', p.order_id).single();
    if (error || !order || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(order.customer_email || '')) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Order or customer email not found' }) };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Shirt Societe <info@shirtsociete.com>',
        to: [order.customer_email],
        bcc: ['info@shirtsociete.com'],
        reply_to: 'info@shirtsociete.com',
        subject,
        html: buildEmail(message),
        text: message
      })
    });
    if (!res.ok) {
      const t = await res.text();
      console.error('admin-mail Resend error:', res.status, t);
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Email service error ' + res.status }) };
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ sent: true, to: order.customer_email, order_ref: order.order_ref }) };
  } catch (err) {
    console.error('admin-mail error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
