// netlify/functions/customer-orders.js
// Haalt bestelhistorie op voor ingelogde klant
// GET - lijst eigen orders (op basis van email in JWT)

const { createClient } = require('@supabase/supabase-js');

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

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Lees JWT uit Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not logged in' }) };
  }

  const token = authHeader.replace('Bearer ', '');

  // Vraag Supabase wie deze gebruiker is
  const userClient = createClient(
    process.env.DB_URL,
    process.env.DB_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) };
  }

  // Haal alleen orders op van deze gebruiker (RLS doet dit ook, maar dubbel check)
  const supabase = createClient(
    process.env.DB_URL,
    process.env.DB_SECRET
  );

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('order_ref, status, total, items, tracking_code, created_at, paid_at, shipped_at')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('customer-orders error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
