// netlify/functions/admin-orders.js
// Orders beheren (alleen voor ingelogde admin)
// GET - alle orders
// PUT - update status / tracking_code

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.DB_URL,
  process.env.DB_SECRET
);

async function verifyAdmin(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '');
  const userClient = createClient(
    process.env.DB_URL,
    process.env.DB_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return false;
  return user.email === process.env.ADMIN_EMAIL;
}

async function sendTrackingEmail(order) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping tracking email');
    return;
  }
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0905;color:#fff;padding:32px;">
      <h1 style="font-family:Georgia,serif;font-style:italic;color:#c8a950;">Shirt Société</h1>
      <h2 style="color:#c8a950;">Je bestelling is onderweg!</h2>
      <p>Hallo ${order.customer_first_name},</p>
      <p>Goed nieuws — je bestelling <strong>${order.order_ref}</strong> is verzonden.</p>
      <p><strong>Track & Trace code:</strong> ${order.tracking_code}</p>
      <p>Je kunt je pakket volgen via PostNL of jouw vervoerder.</p>
      <p style="color:#888;margin-top:32px;">Bedankt voor je aankoop!<br>info@shirtsociete.com</p>
    </div>
  `;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ShirtSociete <noreply@shirtsociete.com>',
        to: order.customer_email,
        subject: `Je bestelling is verzonden — ${order.order_ref}`,
        html
      })
    });
  } catch (err) {
    console.error('Tracking email failed:', err);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://shirtsociete.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    };
  }

  const isAdmin = await verifyAdmin(event);
  if (!isAdmin) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const headers = { 'Content-Type': 'application/json' };

  try {
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      const { id, status, tracking_code, notes } = body;

      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };
      }

      const updates = {};
      if (status) updates.status = status;
      if (tracking_code !== undefined) updates.tracking_code = tracking_code;
      if (notes !== undefined) updates.notes = notes;

      // Als status verandert naar shipped, voeg shipped_at timestamp toe
      if (status === 'shipped') {
        updates.shipped_at = new Date().toISOString();
      }

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Stuur tracking email als status nu shipped is EN er een tracking code is
      if (status === 'shipped' && updatedOrder.tracking_code) {
        await sendTrackingEmail(updatedOrder);
      }

      return { statusCode: 200, headers, body: JSON.stringify(updatedOrder) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('admin-orders error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
