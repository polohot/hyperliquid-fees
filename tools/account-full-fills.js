#!/usr/bin/env node
/** Paginate userFillsByTime to pull EVERY trade for an account (2000/call cap). */
const ADDR = process.argv[2] || '0xd8c5228c515db3043dfa0c8cd6f22450ee9a99b0';
const INFO = 'https://api.hyperliquid.xyz/info';
const post = b => fetch(INFO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
const sleep = ms => new Promise(r => setTimeout(r, ms));
const num = s => { const v = +s; return isFinite(v) ? v : 0; };
const fmt = x => { if (x == null || !isFinite(+x)) return '-'; const v = +x, a = Math.abs(v); if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B'; if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M'; if (a >= 1e3) return (v / 1e3).toFixed(1) + 'k'; return v.toFixed(2); };
const dt = t => new Date(t).toISOString().slice(0, 10);

(async () => {
  // account start from portfolio
  const port = await post({ type: 'portfolio', user: ADDR });
  const el = Array.isArray(port) && port.find(x => Array.isArray(x) && x[0] === 'allTime');
  const startT = el ? +el[1].accountValueHistory[0][0] : Date.now() - 365 * 864e5;
  console.log('Paginating all fills for ' + ADDR + ' (account start ' + dt(startT) + ')…');

  const all = [], seen = new Set();
  let endTime = Date.now(), pages = 0, guard = 0;
  while (guard++ < 500) {
    const page = await post({ type: 'userFillsByTime', user: ADDR, startTime: startT, endTime });
    if (!Array.isArray(page) || !page.length) break;
    let newOnes = 0;
    for (const f of page) { const k = (f.hash || '') + '|' + (f.oid || '') + '|' + (f.tid || '') + '|' + f.time; if (!seen.has(k)) { seen.add(k); all.push(f); newOnes++; } }
    pages++;
    const times = page.map(f => +f.time).sort((a, b) => a - b);
    process.stdout.write('\r  page ' + pages + ': +' + newOnes + ' (total ' + all.length + '), oldest in page ' + dt(times[0]) + '   ');
    if (page.length < 2000) { console.log('\n  (short page → reached beginning)'); break; }
    if (newOnes === 0) { console.log('\n  (no new fills → stop)'); break; }
    endTime = times[0] - 1;
    await sleep(200);
  }

  all.sort((a, b) => +a.time - +b.time);
  const spanD = all.length ? (+all[all.length - 1].time - +all[0].time) / 864e5 : 0;
  console.log('\n\n═══ FULL TRADE HISTORY ═══');
  console.log('  total fills: ' + all.length + '   pages: ' + pages);
  console.log('  span: ' + dt(+all[0].time) + ' → ' + dt(+all[all.length - 1].time) + '  (' + spanD.toFixed(0) + 'd)');

  // recompute on FULL history
  const closers = all.filter(f => num(f.closedPnl) !== 0);
  const wins = closers.filter(f => +f.closedPnl > 0), losses = closers.filter(f => +f.closedPnl < 0);
  const gW = wins.reduce((a, f) => a + +f.closedPnl, 0), gL = Math.abs(losses.reduce((a, f) => a + +f.closedPnl, 0));
  const cp = closers.map(f => +f.closedPnl), n = cp.length;
  const mean = n ? cp.reduce((a, b) => a + b, 0) / n : 0;
  const sd = n > 1 ? Math.sqrt(cp.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  const tstat = sd ? mean / (sd / Math.sqrt(n)) : 0;
  const coinPnl = {}; for (const f of closers) coinPnl[f.coin] = (coinPnl[f.coin] || 0) + +f.closedPnl;
  const coinArr = Object.entries(coinPnl).sort((a, b) => b[1] - a[1]);
  console.log('\n  ─ FULL-HISTORY metrics (all ' + spanD.toFixed(0) + ' days) ─');
  console.log('  closing fills: ' + closers.length + '   win rate: ' + (wins.length / closers.length * 100).toFixed(1) + '%');
  console.log('  payoff: ' + ((gW / wins.length) / (gL / losses.length)).toFixed(2) + '   profit factor: ' + (gW / gL).toFixed(2) + '   expectancy: $' + fmt(mean) + '/trade');
  console.log('  realized PnL (sum closedPnl): $' + fmt(gW - gL));
  console.log('  edge t-stat: ' + tstat.toFixed(2) + (Math.abs(tstat) > 2 ? '  → REAL edge' : ''));
  console.log('  per-coin PnL (top 6 / bottom 3):');
  coinArr.slice(0, 6).forEach(([c, p]) => console.log('     ' + (c || '?').padEnd(16) + '$' + fmt(p)));
  console.log('     …');
  coinArr.slice(-3).forEach(([c, p]) => console.log('     ' + (c || '?').padEnd(16) + '$' + fmt(p)));
  console.log('  coins traded: ' + coinArr.length);
})().catch(e => console.error('FATAL', e));
