import test from 'node:test';
import assert from 'node:assert/strict';
import { googleTransitUrl, googleWalkingUrl } from '../external-route.js';
test('detail route uses walking rather than transit',()=>{
 const url=new URL(googleWalkingUrl('Kアリーナ横浜','横浜駅'));
 assert.equal(url.searchParams.get('travelmode'),'walking');
 assert.equal(url.searchParams.get('destination'),'横浜駅');
});
test('external route carries venue, destination and transit mode',()=>{
 const url=new URL(googleTransitUrl('東京ドーム 日本','名古屋駅'));
 assert.equal(url.origin,'https://www.google.com');
 assert.equal(url.searchParams.get('origin'),'東京ドーム 日本');
 assert.equal(url.searchParams.get('destination'),'名古屋駅');
 assert.equal(url.searchParams.get('travelmode'),'transit');
});
test('empty destinations rejected',()=>assert.throws(()=>googleTransitUrl('会場','  ')));
test('input cannot inject query parameters or change host',()=>{
 const url=new URL(googleTransitUrl('会場','駅&travelmode=driving'));
 assert.equal(url.searchParams.get('travelmode'),'transit');
 assert.equal(url.searchParams.get('destination'),'駅&travelmode=driving');
});
