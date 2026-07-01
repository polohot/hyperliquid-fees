#!/usr/bin/env node
/** Broad network capture of the Hyperliquid leaderboard UI. */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const reqs = [];
  const wsLog = [];

  page.on('request', req => {
    const t = req.resourceType();
    if (['xhr', 'fetch', 'websocket'].includes(t)) {
      reqs.push({ method: req.method(), url: req.url(), type: t, body: req.postData() });
    }
  });
  page.on('response', async res => {
    const r = res.request();
    if (['xhr', 'fetch'].includes(r.resourceType())) {
      const e = reqs.find(x => x.url === r.url() && !x.status);
      if (e) { e.status = res.status(); try { e.sample = (await res.text()).slice(0, 300); } catch(_){} }
    }
  });
  page.on('websocket', ws => {
    wsLog.push(ws.url());
    ws.on('framereceived', f => {
      const t = (typeof f.payload === 'string' ? f.payload : '').slice(0, 200);
      if (/leader|rank|pnl|trader/i.test(t)) wsLog.push('  WS← ' + t);
    });
  });

  console.log('loading leaderboard…');
  try { await page.goto('https://app.hyperliquid.xyz/leaderboard', { waitUntil: 'domcontentloaded', timeout: 50000 }); }
  catch (e) { console.log('nav: ' + e.message.split('\n')[0]); }
  await page.waitForTimeout(12000);
  console.log('final URL: ' + page.url());
  console.log('title: ' + await page.title().catch(()=>''));

  console.log('\n=== XHR/fetch/ws requests (by host) ===');
  const byHost = {};
  for (const r of reqs) {
    let h; try { h = new URL(r.url).host; } catch { h = r.url; }
    (byHost[h] = byHost[h] || []).push(r);
  }
  for (const [host, list] of Object.entries(byHost)) {
    console.log('\n## ' + host + '  (' + list.length + ')');
    const seen = new Set();
    for (const r of list) {
      let p; try { p = new URL(r.url).pathname; } catch { p = r.url; }
      const sig = r.method + ' ' + p + '|' + (r.body||'').slice(0,40);
      if (seen.has(sig)) continue; seen.add(sig);
      console.log('  ' + r.method + ' ' + p + '  [' + (r.type) + '] ' + (r.status||'?'));
      if (r.body) console.log('     body: ' + r.body.slice(0, 160));
      if (r.sample) console.log('     resp: ' + r.sample.slice(0, 160).replace(/\s+/g,' '));
    }
  }
  if (wsLog.length) { console.log('\n=== websockets ==='); wsLog.slice(0,20).forEach(w => console.log(' ' + w)); }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
