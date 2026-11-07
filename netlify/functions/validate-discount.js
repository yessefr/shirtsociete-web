const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// ── YOUR DISCOUNT CODES ──
// type 'percent' → value is a percentage (10 = 10% off)
// type 'fixed'   → value is an amount in euros (15 = €15 off)
// minSubtotal    → optional: only valid from this order value
// expires        → optional: 'YYYY-MM-DD', code stops working after this date
// active         → set to false to switch a code off without deleting it
const DISCOUNT_CODES = {
  WELCOME10:  { type: 'percent', value: 10, active: true,  label: '10% off' },
  SHIRT15:    { type: 'percent', value: 15, active: true,  minSubtotal: 200, label: '15% off orders over €200' },
  LEIPZIG25:  { type: 'fixed',   value: 25, active: true,  minSubtotal: 150, expires: '2026-10-05', label: '€25 off' },
  VINTAGE20:  { type: 'percent', value: 20, active: false, label: '20% off' }
};

function calculateDiscount(entry, subtotal) {
  if (entry.type === 'percent') {
    return Math.round(subtotal * (entry.value / 100) * 100) / 100;
  }
  // fixed amount, never more than the subtotal
  return Math.min(entry.value, subtotal);
}

// shared so create-payment can use the exact same rules
function validateCode(rawCode, subtotal) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { valid: false, error: 'No code entered' };

  const entry = DISCOUNT_CODES[code];
  if (!entry || !entry.active) return { valid: false, error: 'This code is not valid' };

  if (entry.expires) {
    const today = new Date().toISOString().slice(0, 10);
    if (today > entry.expires) return { valid: false, error: 'This code has expired' };
  }

  const sub = parseFloat(subtotal) || 0;
  if (entry.minSubtotal && sub < entry.minSubtotal) {
    return { valid: false, error: `This code applies to orders over €${entry.minSubtotal}` };
  }

  const amount = calculateDiscount(entry, sub);
  return {
    valid: true,
    code,
    type: entry.type,
    value: entry.value,
    amount,
    label: entry.label || (entry.type === 'percent' ? `${entry.value}% off` : `€${entry.value} off`)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { code, subtotal } = JSON.parse(event.body || '{}');
    const result = validateCode(code, subtotal);
    return {
      statusCode: result.valid ? 200 : 400,
      headers: CORS,
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('Discount validation error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ valid: false, error: 'Could not check this code' }) };
  }
};

// exported so create-payment.js can reuse the same validation
exports.validateCode = validateCode;
exports.DISCOUNT_CODES = DISCOUNT_CODES;
