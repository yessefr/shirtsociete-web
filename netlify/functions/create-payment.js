// netlify/functions/create-payment.js
const { createClient } = require('@supabase/supabase-js');
const { validateCode } = require('./validate-discount');
const { createMollieClient } = require('@mollie/api-client');

const supabase = createClient(
  process.env.DB_URL,
  process.env.DB_SECRET
);

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Shipping rates per country (in EUR)
// Free shipping threshold: EU countries at €150+, non-EU never free
const SHIPPING = {
  NL: { rate: 5.95,  free_at: 150, zone: 'eu',     label: 'Netherlands' },
  BE: { rate: 8.95,  free_at: 150, zone: 'eu',     label: 'Belgium' },
  DE: { rate: 9.95,  free_at: 150, zone: 'eu',     label: 'Germany' },
  LU: { rate: 9.95,  free_at: 150, zone: 'eu',     label: 'Luxembourg' },
  FR: { rate: 12.95, free_at: 150, zone: 'eu',     label: 'France' },
  AT: { rate: 12.95, free_at: 150, zone: 'eu',     label: 'Austria' },
  DK: { rate: 12.95, free_at: 150, zone: 'eu',     label: 'Denmark' },
  SE: { rate: 13.95, free_at: 150, zone: 'eu',     label: 'Sweden' },
  FI: { rate: 13.95, free_at: 150, zone: 'eu',     label: 'Finland' },
  PL: { rate: 11.95, free_at: 150, zone: 'eu',     label: 'Poland' },
  ES: { rate: 13.95, free_at: 150, zone: 'eu',     label: 'Spain' },
  PT: { rate: 13.95, free_at: 150, zone: 'eu',     label: 'Portugal' },
  IT: { rate: 12.95, free_at: 150, zone: 'eu',     label: 'Italy' },
  GB: { rate: 16.95, free_at: null, zone: 'non_eu', label: 'United Kingdom', customs: true },
  CH: { rate: 14.95, free_at: null, zone: 'non_eu', label: 'Switzerland', customs: true },
  NO: { rate: 14.95, free_at: null, zone: 'non_eu', label: 'Norway', customs: true },
};

function getShipping(country, subtotal) {
  const config = SHIPPING[country] || { rate: 14.95, free_at: null, zone: 'non_eu' };
  const isFree = config.free_at !== null && subtotal >= config.free_at;
  return {
    cost: isFree ? 0 : config.rate,
    isFree,
    freeAt: config.free_at,
    hasCustoms: config.customs || false,
    zone: config.zone
  };
}

// Builds a real sequential order number by counting the orders already in the database.
// Format: OR-2026-0001, OR-2026-0002, ... so you can see at a glance how many orders
// you've had this year and in which order they came in.
// The date-based fallback below is only used if the count can't be read.
async function generateOrderRef(supabaseClient) {
  const year = new Date().getFullYear();
  try {
    const startOfYear = `${year}-01-01T00:00:00.000Z`;
    const { count, error } = await supabaseClient
      .from('orders')
      .select('order_ref', { count: 'exact', head: true })
      .gte('created_at', startOfYear);

    if (!error && typeof count === 'number') {
      const next = String(count + 1).padStart(4, '0');
      return `OR-${year}-${next}`;
    }
    console.error('Order count failed, using time-based fallback:', error);
  } catch (e) {
    console.error('Order count threw, using time-based fallback:', e);
  }

  // fallback: still unique, still starts with OR
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const secs = String(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()).padStart(5, '0');
  return `OR-${year}${m}${d}-${secs}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { items, customer, discountCode } = data;

    if (!items || items.length === 0) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Cart is empty' }) };
    }

    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'street', 'housenr', 'postal', 'city', 'country'];
    for (const field of requiredFields) {
      if (!customer[field] || customer[field].trim() === '') {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Missing required field: ${field}` }) };
      }
    }

    // Fetch shirts from DB to verify prices
    const shirtIds = items.map(i => i.id);
    const { data: shirts, error: shirtError } = await supabase
      .from('shirts')
      .select('id, title, price, available, images')
      .in('id', shirtIds);

    if (shirtError) throw shirtError;

    const unavailable = shirts.filter(s => !s.available);
    if (unavailable.length > 0) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Some items no longer available', items: unavailable.map(s => s.title) }) };
    }

    if (shirts.length !== items.length) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Some items not found' }) };
    }

    const subtotal = shirts.reduce((sum, s) => sum + parseFloat(s.price), 0);

    // Re-validate the discount code on the server. Whatever the browser claimed is ignored:
    // the amount is recalculated here so the price can never be tampered with.
    let discountAmount = 0;
    let discountCodeApplied = null;
    if (discountCode) {
      const check = validateCode(discountCode, subtotal);
      if (check.valid) {
        discountAmount = check.amount;
        discountCodeApplied = check.code;
      }
      // an invalid code is simply ignored rather than blocking the order
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const shipping = getShipping(customer.country, discountedSubtotal);
    const total = (discountedSubtotal + shipping.cost).toFixed(2);

    const itemsSnapshot = shirts.map(s => ({
      id: s.id,
      title: s.title,
      price: parseFloat(s.price),
      image: s.images && s.images[0] ? s.images[0] : null
    }));

    const orderRef = await generateOrderRef(supabase);
    const siteUrl = 'https://shirtsociete.com';

    const payment = await mollie.payments.create({
      amount: { currency: 'EUR', value: total },
      description: `ShirtSociete order ${orderRef}`,
      redirectUrl: `${siteUrl}/bedankt.html?ref=${orderRef}`,
      webhookUrl: `https://shirtsociete.netlify.app/api/mollie-webhook`,
      metadata: { orderRef }
    });

    const { error: orderError } = await supabase.from('orders').insert({
      order_ref: orderRef,
      status: 'pending',
      total: parseFloat(total),
      payment_id: payment.id,
      customer_first_name: customer.first_name,
      customer_last_name: customer.last_name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_street: customer.street,
      shipping_housenr: customer.housenr,
      shipping_postal: customer.postal,
      shipping_city: customer.city,
      shipping_country: customer.country,
      items: itemsSnapshot,
      notes: [
        customer.notes || null,
        discountCodeApplied ? `Discount ${discountCodeApplied}: -€${discountAmount.toFixed(2)} (subtotal €${subtotal.toFixed(2)})` : null
      ].filter(Boolean).join(' | ') || null
    });

    if (orderError) throw orderError;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        checkoutUrl: payment.getCheckoutUrl(),
        orderRef,
        shipping: {
          cost: shipping.cost,
          isFree: shipping.isFree,
          hasCustoms: shipping.hasCustoms
        }
      })
    };

  } catch (err) {
    console.error('create-payment error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
