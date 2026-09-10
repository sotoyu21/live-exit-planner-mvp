import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { paymentConfig } from '../payment-config.js';
test('checkout disabled until server verification', () => assert.equal(paymentConfig.mode, 'disabled'));
for (const search of ['', '?session_id=cs_live_forged', '?session_id=cs_test_forged', '?session_id=%3Cscript%3E']) {
  test(`return page never grants entitlement: ${search}`, async () => {
    const mount = { innerHTML: '' }; const removed = [];
    vm.runInNewContext(await readFile(new URL('../success.js', import.meta.url), 'utf8'), {
      document: { querySelector: () => mount }, window: { location: { search } },
      localStorage: { removeItem: key => removed.push(key), setItem: () => assert.fail('must not grant access') }
    });
    assert.deepEqual(removed, ['mvp-paid-access']);
    assert.match(mount.innerHTML, /再購入せず/);
  });
}
test('blocked storage does not break recovery page', async () => {
  const mount = { innerHTML: '' };
  vm.runInNewContext(await readFile(new URL('../success.js', import.meta.url), 'utf8'), {
    document: { querySelector: () => mount }, localStorage: { removeItem: () => { throw Error('blocked'); } }
  });
  assert.match(mount.innerHTML, /購入を確認できません/);
});
