import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyOrderPayment } from '../checkout-policy.js';
const order = { id:'order-1', sessionId:'cs_test_example', amount:200, currency:'jpy', priceId:'price_example', state:'pending', livemode:false };
const session = { id:order.sessionId, mode:'payment', status:'complete', payment_status:'paid', amount_total:200, currency:'jpy', livemode:false, client_reference_id:order.id, metadata:{order_id:order.id}, line_items:{has_more:false,data:[{quantity:1,price:{id:order.priceId}}]} };
test('complete matching server response qualifies',()=>assert.equal(verifyOrderPayment(order,session).eligible,true));
for (const patch of [{payment_status:'unpaid'}, {payment_status:'no_payment_required'}, {status:'open'}, {amount_total:100}, {currency:'usd'}, {livemode:true}, {client_reference_id:'other'}, {id:'other'}, {metadata:{}}, {line_items:{has_more:true,data:[]}}]) {
  test(`reject mismatch ${JSON.stringify(patch)}`,()=>assert.equal(verifyOrderPayment(order,{...session,...patch}).eligible,false));
}
test('refund/revocation cannot be undone by old success response',()=>assert.equal(verifyOrderPayment({...order,state:'refunded'},session).eligible,false));
test('malformed response fails closed',()=>assert.equal(verifyOrderPayment(order,null).eligible,false));
