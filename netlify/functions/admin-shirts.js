const { createClient } = require('@supabase/supabase-js');

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.DB_URL,
  process.env.DB_SECRET  // service role key - bypasses RLS
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  // Only the admin may read, add, change or delete shirts. This function uses the
  // service key, so without this check anyone on the internet could call it.
  const admins = (process.env.ADMIN_EMAIL || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  let allowed = false;
  if (admins.length && token) {
    try {
      const r = await fetch(process.env.DB_URL + '/auth/v1/user', {
        headers: { apikey: process.env.SUPABASE_ANON_KEY || process.env.DB_SECRET, Authorization: 'Bearer ' + token }
      });
      if (r.ok) { const u = await r.json(); allowed = !!(u && u.email && admins.includes(String(u.email).toLowerCase())); }
    } catch (e) { allowed = false; }
  }
  if (!allowed) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Not allowed.' }) };

  const id = event.queryStringParameters?.id;

  try {
    // GET - list all shirts
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('shirts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
    }

    // POST - create shirt
    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('shirts')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return { statusCode: 201, headers: CORS, body: JSON.stringify(data) };
    }

    // PATCH - update shirt
    if (event.httpMethod === 'PATCH') {
      if (!id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing id' }) };
      const payload = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('shirts')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
    }

    // DELETE - delete shirt
    if (event.httpMethod === 'DELETE') {
      if (!id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing id' }) };
      const { error } = await supabase
        .from('shirts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (err) {
    console.error('admin-shirts error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
