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
        ${item.image ? `<img src="${item.image}" width="60" style="vertical-align:middle;border-radius:4px;margin-right:12px;">` : ''}
        ${item.title}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">€${parseFloat(item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0905;color:#fff;padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-family:Georgia,serif;font-style:italic;color:#c8a950;margin:0;font-size:32px;">Shirt Société</h1>
        <p style="color:#888;font-style:italic;font-size:14px;">Timeless, Original, Rare</p>
      </div>
      <h2 style="color:#c8a950;border-bottom:1px solid #333;padding-bottom:12px;">Bedankt voor je bestelling!</h2>
      <p>Hallo ${order.customer_first_name},</p>
      <p>Je betaling is ontvangen. Hieronder vind je je bestelgegevens.</p>
      <p><strong>Ordernummer:</strong> ${order.order_ref}</p>
      <table style="width:100%;border-collapse:collapse;color:#fff;">
        ${itemsHtml}
        <tr>
          <td style="padding:12px 0;font-weight:bold;">Totaal</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;color:#c8a950;">€${parseFloat(order.total).toFixed(2)}</td>
        </tr>
      </table>
      <h3 style="color:#c8a950;margin-top:24px;">Verzendadres</h3>
      <p style="line-height:1.6;">
        ${order.customer_first_name} ${order.customer_last_name}<br>
        ${order.shipping_street} ${order.shipping_housenr}<br>
        ${order.shipping_postal} ${order.shipping_city}<br>
        ${order.shipping_country}
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
      <h2>🎉 Nieuwe bestelling: ${order.order_ref}</h2>
      <p><strong>Totaal:</strong> €${parseFloat(order.total).toFixed(2)}</p>
      <p><strong>Klant:</strong> ${order.customer_first_name} ${order.customer_last_name}<br>
         ${order.customer_email}<br>
         ${order.customer_phone}</p>
      <p><strong>Verzendadres:</strong><br>
         ${order.shipping_street} ${order.shipping_housenr}<br>
         ${order.shipping_postal} ${order.shipping_city}<br>
         ${order.shipping_country}</p>
      <p><strong>Items:</strong></p>
      <ul>${order.items.map(i => `<li>${i.title} — €${parseFloat(i.price).toFixed(2)}</li>`).join('')}</ul>
      ${order.notes ? `<p><strong>Opmerkingen:</strong> ${order.notes}</p>` : ''}
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

    if (fetchError || !order) {
      console.error('Order not found for payment', paymentId);
      return { statusCode: 200, body: 'OK' }; // Mollie altijd 200 geven
    }

    // Update order op basis van Mollie status
    if (payment.status === 'paid' && order.status === 'pending') {
      // 1. Update order status
      await supabase
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', order.id);

      // 2. Markeer shirts als verkocht
      const shirtIds = order.items.map(i => i.id);
      await supabase
        .from('shirts')
        .update({ available: false, sold_at: new Date().toISOString() })
        .in('id', shirtIds);

      // 3. Update of maak customer record
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

      // 4. Stuur emails (alleen als Resend is ingericht)
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
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('webhook error:', err);
    // Mollie verwacht altijd 200, anders blijft 't proberen
    return { statusCode: 200, body: 'OK' };
  }
};
