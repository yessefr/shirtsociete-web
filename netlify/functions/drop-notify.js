const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(process.env.DB_URL, process.env.DB_SECRET);
const resend = new Resend(process.env.RESEND_API_KEY);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { email, drop } = JSON.parse(event.body);
    if (!email || !email.includes('@')) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid email' }) };

    // Store in Supabase drop_signups table (create if needed)
    await supabase.from('drop_signups').upsert({ email, drop, created_at: new Date().toISOString() }, { onConflict: 'email' });

    // Send confirmation to subscriber
    await resend.emails.send({
      from: 'Shirt Société <info@shirtsociete.com>',
      to: email,
      subject: 'You\'re on the list | Shirt Société',
      html: `
        <div style="background:#0a0905;color:#f5f0e8;font-family:sans-serif;padding:40px;max-width:520px;margin:0 auto">
          <div style="margin:0 0 32px;font-family:Georgia,serif;font-style:italic;font-weight:900;font-size:26px;letter-spacing:1px;color:#c8a950;line-height:1">Shirt Société<div style="height:2px;width:48px;background:#c8a950;margin-top:10px"></div></div>
          <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8a950;margin:0 0 14px;font-weight:600">You are on the list</p>
          <h2 style="font-family:Georgia,serif;font-style:italic;font-size:26px;margin:0 0 16px;color:#f5f0e8;font-weight:900;line-height:1.2">Be first to see new shirts</h2>
          <p style="color:#888070;font-size:15px;line-height:1.7;margin-bottom:16px">
            Thank you for joining. We will let you know the moment new shirts go live, before they appear anywhere else.
          </p>
          <p style="color:#888070;font-size:15px;line-height:1.7;margin-bottom:32px">
            A curated selection of vintage national and club shirts and match worn originals. Every shirt is one of one, so when something catches your eye it is worth being quick.
          </p>
          <a href="https://shirtsociete.com" style="background:#c8a950;color:#0a0905;text-decoration:none;padding:12px 24px;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;border-radius:2px">
            Visit the Shop
          </a>
          <p style="color:#3a3830;font-size:12px;margin-top:32px">Shirt Soci&eacute;t&eacute; | shirtsociete.com</p>
        </div>
      `
    });

    // Notify owner
    await resend.emails.send({
      from: 'Shirt Société <info@shirtsociete.com>',
      to: process.env.NOTIFY_EMAIL,
      subject: `New drop signup: ${email}`,
      html: `<p>${email} signed up for the drop: ${drop}</p>`
    });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('drop-signup error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
