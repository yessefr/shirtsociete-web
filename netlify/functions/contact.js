const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendEmail(payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}


async function saveToSupabase(row) {
  const url = process.env.DB_URL || process.env.SUPABASE_URL;
  const key = process.env.DB_SECRET || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) { console.error('Supabase env not set — message not stored'); return; }
  const res = await fetch(url + '/rest/v1/contact_messages', {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('Supabase insert failed: ' + t);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { name, email, subject, message } = JSON.parse(event.body || '{}');

    if (!name || !email || !message) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Name, email and message are required' }) };
    }
    if (String(email).indexOf('@') === -1) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid email address' }) };
    }
    // basic length guards
    if (String(message).length > 5000 || String(name).length > 200) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Message too long' }) };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Mail service not configured' }) };
    }

    // Store the message so it shows up in the admin, even if email fails
    try {
      await saveToSupabase({
        name: String(name).slice(0, 200),
        email: String(email).slice(0, 200),
        subject: subject ? String(subject).slice(0, 300) : null,
        message: String(message).slice(0, 5000)
      });
    } catch (e) {
      console.error('Could not store contact message:', e.message);
      // don't fail the request — email still goes out below
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject) || 'Website enquiry';
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    // 1. Notification to you
    await sendEmail({
      from: 'Shirt Societe <info@shirtsociete.com>',
      to: ['info@shirtsociete.com'],
      reply_to: email,
      subject: `Website contact: ${safeSubject}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0a0905;color:#f5f0e8;padding:32px">
          <div style="font-size:20px;color:#c8a950;margin-bottom:6px">New message from the website</div>
          <div style="font-size:12px;color:#8a8378;margin-bottom:24px;letter-spacing:1px;text-transform:uppercase">Shirt Societe</div>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#8a8378;width:90px">Name</td><td style="padding:8px 0">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#8a8378">Email</td><td style="padding:8px 0"><a href="mailto:${safeEmail}" style="color:#c8a950">${safeEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#8a8378">Subject</td><td style="padding:8px 0">${safeSubject}</td></tr>
          </table>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #1e1c17">
            <div style="color:#8a8378;font-size:12px;margin-bottom:10px">MESSAGE</div>
            <div style="font-size:14px;line-height:1.7">${safeMessage}</div>
          </div>
        </div>`
    });

    // 2. Confirmation to the sender
    try {
      await sendEmail({
        from: 'Shirt Societe <info@shirtsociete.com>',
        to: [email],
        subject: 'We received your message',
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0a0905;color:#f5f0e8;padding:32px">
            <div style="font-size:22px;color:#c8a950;font-style:italic;margin-bottom:6px">Shirt Societe</div>
            <div style="font-size:12px;color:#8a8378;margin-bottom:24px;letter-spacing:2px;text-transform:uppercase">Timeless. Original. Rare.</div>
            <p style="font-size:15px;line-height:1.7">Hi ${safeName},</p>
            <p style="font-size:15px;line-height:1.7">Thank you for reaching out. We have received your message and will get back to you as soon as possible.</p>
            <div style="margin:22px 0;padding:16px 18px;background:#111009;border-left:3px solid #c8a950;font-size:14px;line-height:1.7;color:#b0a898">${safeMessage}</div>
            <p style="font-size:14px;line-height:1.7;color:#8a8378">You can also reach us on Instagram <a href="https://www.instagram.com/shirtsociete/" style="color:#c8a950">@shirtsociete</a>.</p>
          </div>`
      });
    } catch (e) {
      // confirmation is nice to have; don't fail the request if it bounces
      console.error('Confirmation email failed:', e.message);
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('Contact form error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Failed to send message' }) };
  }
};
