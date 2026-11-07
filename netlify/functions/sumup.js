/*  netlify/functions/sumup.js
 *  ─────────────────────────────────────────────────────────────────────
 *  Back end for the "Kassa" tab in the admin. The SumUp API key never
 *  reaches the browser.
 *
 *  POST /.netlify/functions/sumup     (header: Authorization: Bearer <admin login>)
 *    { action: 'readers' }                                   list paired Solo readers
 *    { action: 'pair', pairing_code, name }                  pair a Solo (code from the Solo: Connections > API)
 *    { action: 'checkout', reader_id, amount_cents, description, ref }   send an amount to the Solo
 *    { action: 'terminate', reader_id }                      cancel what is on the Solo
 *    { action: 'phone_link', amount_cents, title, ref, callback }   build the link that opens the SumUp app on this phone
 *    { action: 'sold', shirt_ids:[...], method, amount_cents, items:[...] }   mark shirts sold + log the sale
 *
 *  ENV (Netlify → Site configuration → Environment variables)
 *    SUMUP_API_KEY         secret key from developer.sumup.com (sup_sk_...)
 *    SUMUP_MERCHANT_CODE   MK7F1GF8
 *    SUMUP_AFFILIATE_KEY   affiliate key from developer.sumup.com (needed for Solo checkouts)
 *    SUMUP_APP_ID          the app id (the one the affiliate key belongs to)
 *    ADMIN_EMAIL           the e-mail address you log in to the admin with (comma-separated if more)
 *    DB_URL, DB_SECRET     already in your Netlify env (Supabase URL + service key)
 *    SUPABASE_ANON_KEY     optional; used to check the login. Falls back to DB_SECRET.
 */
const SUMUP = 'https://api.sumup.com';
const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' };
const out = (code, body) => ({ statusCode: code, headers: H, body: JSON.stringify(body) });

async function whoIs(token) {
  const key = process.env.SUPABASE_ANON_KEY || process.env.DB_SECRET;
  const r = await fetch(process.env.DB_URL + '/auth/v1/user', { headers: { apikey: key, Authorization: 'Bearer ' + token } });
  if (!r.ok) return null;
  return r.json();
}
async function sumup(path, method, body) {
  const r = await fetch(SUMUP + path, {
    method, headers: { Authorization: 'Bearer ' + process.env.SUMUP_API_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null; try { data = await r.json(); } catch (e) {}
  return { ok: r.ok, status: r.status, data };
}
async function db(path, method, body, prefer) {
  const r = await fetch(process.env.DB_URL + '/rest/v1/' + path, {
    method, headers: { apikey: process.env.DB_SECRET, Authorization: 'Bearer ' + process.env.DB_SECRET, 'Content-Type': 'application/json', Prefer: prefer || 'return=minimal' },
    body: body ? JSON.stringify(body) : undefined
  });
  return { ok: r.ok, status: r.status, text: r.ok ? '' : await r.text() };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return out(200, {});
  if (event.httpMethod !== 'POST') return out(405, { error: 'POST only' });

  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  const admins = (process.env.ADMIN_EMAIL || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (!admins.length) return out(500, { error: 'ADMIN_EMAIL is not set in Netlify.' });
  const user = token ? await whoIs(token) : null;
  if (!token) return out(401, { error: 'Not allowed: no login was sent. Log out of the admin and back in.' });
  if (!user || !user.email) return out(401, { error: 'Not allowed: the login has expired or is not valid. Log out of the admin and back in.' });
  if (!admins.includes(String(user.email).toLowerCase())) return out(401, { error: 'Not allowed: you are logged in as ' + user.email + ', which is not the address set in ADMIN_EMAIL in Netlify.' });

  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) { return out(400, { error: 'Bad JSON' }); }
  const M = process.env.SUMUP_MERCHANT_CODE;

  try {
    if (b.action === 'readers') {
      const r = await sumup(`/v0.1/merchants/${M}/readers`, 'GET');
      return out(r.ok ? 200 : r.status, r.data);
    }
    if (b.action === 'pair') {
      const r = await sumup(`/v0.1/merchants/${M}/readers`, 'POST', { pairing_code: String(b.pairing_code || '').trim(), name: b.name || 'Solo' });
      return out(r.ok ? 200 : r.status, r.data);
    }
    if (b.action === 'checkout') {
      const cents = Math.round(Number(b.amount_cents));
      if (!b.reader_id || !(cents > 0)) return out(400, { error: 'reader_id and amount_cents are required' });
      const body = { total_amount: { currency: 'EUR', minor_unit: 2, value: cents } };
      if (process.env.SUMUP_AFFILIATE_KEY) body.affiliate = { app_id: process.env.SUMUP_APP_ID || 'shirtsociete', key: process.env.SUMUP_AFFILIATE_KEY, foreign_transaction_id: String(b.ref || Date.now()) };
      if (b.description) body.description = String(b.description).slice(0, 120);
      const r = await sumup(`/v0.1/merchants/${M}/readers/${encodeURIComponent(b.reader_id)}/checkout`, 'POST', body);
      return out(r.ok ? 200 : r.status, r.data);
    }
    if (b.action === 'phone_link') {
      // Opens the SumUp app on the phone (Payment Switch). The affiliate key stays in Netlify.
      const cents = Math.round(Number(b.amount_cents));
      if (!(cents > 0)) return out(400, { error: 'amount_cents is required' });
      const key = process.env.SUMUP_AFFILIATE_KEY, appId = process.env.SUMUP_APP_ID;
      if (!key || !appId) return out(200, { configured: false });
      const cb = String(b.callback || 'https://shirtsociete.com/admin.html');
      if (!/^https:\/\/shirtsociete\.com\//.test(cb)) return out(400, { error: 'Bad callback' });
      const q = new URLSearchParams({
        'affiliate-key': key, 'app-id': appId,
        total: (cents / 100).toFixed(2), amount: (cents / 100).toFixed(2), currency: 'EUR',
        title: String(b.title || 'Shirt Société').slice(0, 100),
        'foreign-tx-id': String(b.ref || ('pos-' + Date.now())).slice(0, 120),
        'skip-screen-success': 'true',
        callback: cb, callbacksuccess: cb, callbackfail: cb
      });
      return out(200, { configured: true, url: 'sumupmerchant://pay/1.0?' + q.toString() });
    }
    if (b.action === 'terminate') {
      const r = await sumup(`/v0.1/merchants/${M}/readers/${encodeURIComponent(b.reader_id)}/terminate`, 'POST', {});
      return out(r.ok ? 200 : r.status, r.data || {});
    }
    if (b.action === 'sold') {
      const ids = (b.shirt_ids || []).filter(Boolean);
      if (!ids.length) return out(400, { error: 'shirt_ids required' });
      for (const id of ids) {
        const r = await db('shirts?id=eq.' + encodeURIComponent(id), 'PATCH', { available: false });
        if (!r.ok) return out(500, { error: 'Could not mark sold: ' + r.text });
      }
      // sale log (table pos_sales, see supabase-kassa.sql); a missing table must not block the sale
      const log = await db('pos_sales', 'POST', { method: b.method || 'other', amount_cents: Math.round(Number(b.amount_cents) || 0), items: b.items || [], shirt_ids: ids, sold_by: user.email });
      return out(200, { ok: true, logged: log.ok });
    }
    return out(400, { error: 'Unknown action' });
  } catch (e) {
    return out(500, { error: String(e.message || e) });
  }
};
