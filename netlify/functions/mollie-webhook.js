// netlify/functions/mollie-webhook.js
// Mollie roept deze function aan zodra betaalstatus verandert
// We checken de status en updaten Supabase

const { createClient } = require('@supabase/supabase-js');
const { createMollieClient } = require('@mollie/api-client');

const supabase = createClient(
  process.env.DB_URL,
  process.env.DB_SECRET
);

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

// Klantgegevens komen uit een openbaar formulier: nooit ongefilterd in e-mail-HTML zetten.
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const euro = (n) => '\u20ac' + parseFloat(n).toFixed(2);

// Email versturen via Resend (alleen als RESEND_API_KEY is ingesteld)
async function sendEmail({ from, to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping email to', to);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html })
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Resend error:', res.status, text);
    }
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

function buildCustomerEmail(order) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;">
        ${item.image ? `<img src="${esc(item.image)}" width="60" style="vertical-align:middle;border-radius:4px;margin-right:12px;">` : ''}
        ${esc(item.title)}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">${euro(item.price)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0905;color:#fff;padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-family:Georgia,serif;font-style:italic;color:#c8a950;margin:0;font-size:32px;">Shirt Société</h1>
        <p style="color:#888;font-style:italic;font-size:14px;">Timeless, Original, Rare</p>
      </div>
      <h2 style="color:#c8a950;border-bottom:1px solid #333;padding-bottom:12px;">Bedankt voor je bestelling!</h2>
      <p>Hallo ${esc(order.customer_first_name)},</p>
      <p>Je betaling is ontvangen. Hieronder vind je je bestelgegevens.</p>
      <p><strong>Ordernummer:</strong> ${esc(order.order_ref)}</p>
      <table style="width:100%;border-collapse:collapse;color:#fff;">
        ${itemsHtml}
        <tr>
          <td style="padding:12px 0;font-weight:bold;">Totaal</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;color:#c8a950;">${euro(order.total)}</td>
        </tr>
      </table>
      <h3 style="color:#c8a950;margin-top:24px;">Verzendadres</h3>
      <p style="line-height:1.6;">
        ${esc(order.customer_first_name)} ${esc(order.customer_last_name)}<br>
        ${esc(order.shipping_street)} ${esc(order.shipping_housenr)}<br>
        ${esc(order.shipping_postal)} ${esc(order.shipping_city)}<br>
        ${esc(order.shipping_country)}
      </p>
      <p style="margin-top:32px;color:#888;font-size:13px;">
        We pakken je shirt zorgvuldig in en versturen binnen 1-2 werkdagen.<br>
        Vragen? Beantwoord deze mail of neem contact op via info@shirtsociete.com
      </p>
    </div>
  `;
}

function buildOwnerEmail(order) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <h2>🎉 Nieuwe bestelling: ${esc(order.order_ref)}</h2>
      <p><strong>Totaal:</strong> ${euro(order.total)}</p>
      <p><strong>Klant:</strong> ${esc(order.customer_first_name)} ${esc(order.customer_last_name)}<br>
         ${esc(order.customer_email)}<br>
         ${esc(order.customer_phone)}</p>
      <p><strong>Verzendadres:</strong><br>
         ${esc(order.shipping_street)} ${esc(order.shipping_housenr)}<br>
         ${esc(order.shipping_postal)} ${esc(order.shipping_city)}<br>
         ${esc(order.shipping_country)}</p>
      <p><strong>Items:</strong></p>
      <ul>${order.items.map(i => `<li>${esc(i.title)} — ${euro(i.price)}</li>`).join('')}</ul>
      ${order.notes ? `<p><strong>Opmerkingen:</strong> ${esc(order.notes)}</p>` : ''}
      <p><a href="https://shirtsociete.netlify.app/admin.html">Bekijk in admin →</a></p>
    </div>
  `;
}

exports.handler = async (event) => {
  // Mollie stuurt POST met body: id=tr_xxx
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    // Body komt als form data: id=tr_xxx
    const params = new URLSearchParams(event.body);
    const paymentId = params.get('id');

    if (!paymentId) {
      return { statusCode: 400, body: 'Missing payment id' };
    }

    // Haal actuele payment status op bij Mollie
    const payment = await mollie.payments.get(paymentId);

    // Zoek de bijbehorende order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // echte databasefout: opnieuw proberen
    if (fetchError || !order) {
      console.error('Order not found for payment', paymentId);
      return { statusCode: 200, body: 'OK' }; // onbekende order: niet opnieuw laten proberen
    }

    // Update order op basis van Mollie status
    if (payment.status === 'paid' && order.status === 'pending') {
      // Controle: het betaalde bedrag moet gelijk zijn aan het ordertotaal. Zo niet, dan markeren we
      // NIETS als betaald en waarschuwen we de eigenaar (handmatig nakijken in Mollie).
      const paidAmount = parseFloat(payment.amount && payment.amount.value);
      if (payment.amount && payment.amount.currency !== 'EUR' || !isFinite(paidAmount) || Math.abs(paidAmount - parseFloat(order.total)) > 0.005) {
        console.error('Amount mismatch', paymentId, payment.amount, order.total);
        await sendEmail({
          from: 'ShirtSociete <noreply@shirtsociete.com>',
          to: process.env.NOTIFY_EMAIL,
          subject: `LET OP: bedrag klopt niet, order ${order.order_ref}`,
          html: `<p>Mollie meldt betaald (${esc(paymentId)}), maar het bedrag (${esc(payment.amount && payment.amount.value)} ${esc(payment.amount && payment.amount.currency)}) is niet gelijk aan het ordertotaal (${esc(order.total)}). De order is niet als betaald gemarkeerd. Controleer dit in Mollie en de admin.</p>`
        });
        return { statusCode: 200, body: 'OK' };
      }

      // 1. Markeer shirts als verkocht (veilig om te herhalen: Mollie probeert opnieuw bij een fout)
      const shirtIds = order.items.map(i => i.id);
      const { error: shirtErr } = await supabase
        .from('shirts')
        .update({ available: false, sold_at: new Date().toISOString() })
        .in('id', shirtIds);
      if (shirtErr) throw shirtErr;

      // 2. Zet de order op betaald, ALLEEN als hij nog pending is. Komt er geen rij terug, dan heeft een
      //    andere aanroep dit al afgehandeld: niet nogmaals klantomzet tellen of mails sturen.
      const { data: updated, error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', order.id)
        .eq('status', 'pending')
        .select('id');
      if (orderErr) throw orderErr;
      if (!updated || !updated.length) {
        return { statusCode: 200, body: 'OK' };
      }

      // 3. Klantrecord en e-mails: een fout hier mag de betaalde order niet terugdraaien (alleen loggen)
      try {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, total_spent')
          .eq('email', order.customer_email)
          .maybeSingle();

        if (existingCustomer) {
          await supabase
            .from('customers')
            .update({
              last_order_at: new Date().toISOString(),
              total_spent: parseFloat(existingCustomer.total_spent || 0) + parseFloat(order.total)
            })
            .eq('id', existingCustomer.id);
        } else {
          await supabase.from('customers').insert({
            email: order.customer_email,
            first_name: order.customer_first_name,
            last_name: order.customer_last_name,
            phone: order.customer_phone,
            shipping_address: {
              street: order.shipping_street,
              housenr: order.shipping_housenr,
              postal: order.shipping_postal,
              city: order.shipping_city,
              country: order.shipping_country
            },
            last_order_at: new Date().toISOString(),
            total_spent: parseFloat(order.total)
          });
        }
      } catch (custErr) {
        console.error('customer update failed (order is wel betaald):', custErr);
      }

      const fromAddress = 'ShirtSociete <noreply@shirtsociete.com>';
      await sendEmail({
        from: fromAddress,
        to: order.customer_email,
        subject: `Bestelling bevestigd — ${order.order_ref}`,
        html: buildCustomerEmail(order)
      });
      await sendEmail({
        from: fromAddress,
        to: process.env.NOTIFY_EMAIL,
        subject: `Nieuwe bestelling: ${order.order_ref} — €${order.total}`,
        html: buildOwnerEmail(order)
      });
    } else if (['failed', 'expired', 'canceled'].includes(payment.status)) {
      // alleen een order die nog pending is annuleren; een betaalde order nooit overschrijven
      const { error: cancelErr } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
        .eq('status', 'pending');
      if (cancelErr) throw cancelErr;
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('webhook error:', err);
    // Onbekende betaling bij Mollie (bijv. een verzonnen id): niet opnieuw laten proberen.
    if (err && (err.statusCode === 404 || err.status === 404)) return { statusCode: 200, body: 'OK' };
    // Elke andere fout: 500, zodat Mollie het later opnieuw probeert en een betaalde order niet blijft hangen.
    return { statusCode: 500, body: 'Retry' };
  }
};
