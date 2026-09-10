// Server-use policy, not an authorization endpoint. Inputs MUST come from the
// server-owned order database and Stripe's authenticated API, never the browser.
// This pure function alone does not verify signatures or grant entitlements.
export function verifyOrderPayment(order, session) {
  const reject = reason => ({ eligible:false, reason });
  if (!order || !session || !order.id || !order.sessionId || !order.priceId) return reject('missing_record');
  if (!['pending','paid'].includes(order.state)) return reject('order_not_payable');
  if (!Number.isInteger(order.amount) || order.amount <= 0 || order.currency !== 'jpy' || typeof order.livemode !== 'boolean') return reject('invalid_order');
  if (session.id !== order.sessionId || session.client_reference_id !== order.id || session.metadata?.order_id !== order.id) return reject('order_mismatch');
  if (session.mode !== 'payment' || session.status !== 'complete' || session.payment_status !== 'paid') return reject('not_paid');
  if (session.amount_total !== order.amount || session.currency !== order.currency || session.livemode !== order.livemode) return reject('payment_mismatch');
  const items = session.line_items;
  if (!items || items.has_more !== false || !Array.isArray(items.data) || items.data.length !== 1 || items.data[0]?.quantity !== 1 || items.data[0]?.price?.id !== order.priceId) return reject('product_mismatch');
  return { eligible:true, orderId:order.id };
}
