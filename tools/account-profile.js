#!/usr/bin/env node
/** Full data inventory for one Hyperliquid account — everything we can see + compute. */
const ADDR = process.argv[2] || '0xd8c5228c515db3043dfa0c8cd6f22450ee9a99b0';
const INFO = 'https://api.hyperliquid.xyz/info';
const STATS = 'https://stats-data.hyperliquid.xyz/Mainnet/leaderboard';
const post = b => fetch(INFO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
const DAY = 86400000, now = Date.now();
const num = s => { const v = +s; return isFinite(v) ? v : 0; };
const fmt = x => { if (x == null || !isFinite(+x)) return '-'; const v = +x, a = Math.abs(v); if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B'; if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M'; if (a >= 1e3) return (v / 1e3).toFixed(1) + 'k'; return v.toFixed(2); };
const dt = t => new Date(t).toISOString().slice(0, 10);
const signedFlow = (d, self) => { switch (d && d.type) { case 'deposit': return num(d.usdc); case 'withdraw': return -num(d.usdc); case 'vaultDeposit': return -num(d.usdc); case 'vaultWithdraw': return num(d.netWithdrawnUsd != null ? d.netWithdrawnUsd : d.usdc); case 'send': return (d.destination && d.destination.toLowerCase() === self) ? 0 : -num(d.usdcValue != null ? d.usdcValue : d.amount); default: return 0; } };

(async () => {
  console.log('Fetching all data for ' + ADDR + ' …\n');

  // 1) snapshot from leaderboard
  const lb = (await (await fetch(STATS, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json()).leaderboardRows;
  const row = lb.find(r => r.ethAddress.toLowerCase() === ADDR.toLowerCase());
  let snap = null;
  if (row) { const wp = {}; for (const [w, m] of row.windowPerformances) wp[w] = m; snap = { name: row.displayName, prize: row.prize, acct: +row.accountValue, wp }; }

  // 2) equity curve
  const port = await post({ type: 'portfolio', user: ADDR });
  const el = Array.isArray(port) && port.find(x => Array.isArray(x) && x[0] === 'allTime');
  const eq = el ? el[1].accountValueHistory.map(([t, v]) => ({ t: +t, v: +v })).filter(p => p.v > 0).sort((a, b) => a.t - b.t) : [];

  // 3) fills (30d)
  const fills = Array.isArray(await post({ type: 'userFillsByTime', user: ADDR, startTime: now - 30 * DAY })) ? await post({ type: 'userFillsByTime', user: ADDR, startTime: now - 30 * DAY }) : [];

  // 4) ledger (full span)
  const startLed = eq.length ? eq[0].t : now - 365 * DAY;
  const ledRaw = Array.isArray(await post({ type: 'userNonFundingLedgerUpdates', user: ADDR, startTime: startLed })) ? await post({ type: 'userNonFundingLedgerUpdates', user: ADDR, startTime: startLed }) : [];
  const isVault = ledRaw.some(x => x.delta && x.delta.type === 'vaultCreate' && x.delta.vault && x.delta.vault.toLowerCase() === ADDR.toLowerCase());
  const netFlow = ledRaw.reduce((a, x) => a + signedFlow(x.delta, ADDR.toLowerCase()), 0);

  // ===== PRINT =====
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' ACCOUNT PROFILE: ' + ADDR);
  console.log(' display name: ' + (snap && snap.name || '(unset)') + '   vault? ' + (isVault ? 'YES' : 'no'));
  console.log('═══════════════════════════════════════════════════════════════════');

  console.log('\n── 1) SNAPSHOT (leaderboard — Hyperliquid-normalized, TRUSTWORTHY) ──');
  if (snap) {
    console.log('   accountValue: $' + fmt(snap.acct) + '   prize: $' + fmt(snap.prize));
    console.log('   window      pnl           roi        volume');
    for (const w of ['day', 'week', 'month', 'allTime']) { const m = snap.wp[w]; if (m) console.log('   ' + w.padEnd(9) + ('$' + fmt(m.pnl)).padStart(13) + ((m.roi * 100).toFixed(1) + '%').padStart(10) + ('$' + fmt(m.vlm)).padStart(14)); }
  } else console.log('   (not in leaderboard)');

  console.log('\n── 2) EQUITY CURVE (portfolio → allTime accountValueHistory) ──');
  if (eq.length) {
    const span = (eq[eq.length - 1].t - eq[0].t) / DAY;
    const dts = []; for (let i = 1; i < eq.length; i++) dts.push(eq[i].t - eq[i - 1].t); dts.sort((a, b) => a - b);
    const resH = ((dts[Math.floor(dts.length / 2)] || 0) / 36e5);
    let peak = eq[0].v, maxDD = 0; for (const p of eq) { peak = Math.max(peak, p.v); if (peak > 0) maxDD = Math.max(maxDD, (peak - p.v) / peak); }
    console.log('   points: ' + eq.length + '   span: ' + span.toFixed(0) + 'd   resolution: ~' + resH.toFixed(0) + 'h between points');
    console.log('   start: $' + fmt(eq[0].v) + ' (' + dt(eq[0].t) + ')   end: $' + fmt(eq[eq.length - 1].v) + ' (' + dt(eq[eq.length - 1].t) + ')');
    console.log('   max drawdown (raw curve): ' + (maxDD * 100).toFixed(1) + '%');
    console.log('   ⚠ Sortino/Sharpe from this curve = UNRELIABLE (coarse + deposit-contaminated)');
  } else console.log('   (none)');

  console.log('\n── 3) TRADES (userFillsByTime, last 30d) ──');
  console.log('   fills returned: ' + fills.length + (fills.length >= 2000 ? '  ⚠ likely CAPPED at 2000 (paginate for full)' : ''));
  if (fills[0]) {
    console.log('   raw fill field set: ' + Object.keys(fills[0]).join(', '));
    console.log('   sample fill: ' + JSON.stringify({ coin: fills[0].coin, side: fills[0].side, px: fills[0].px, sz: fills[0].sz, dir: fills[0].dir, time: dt(+fills[0].time), closedPnl: fills[0].closedPnl, crossed: fills[0].crossed, fee: fills[0].fee }));
    const closers = fills.filter(f => num(f.closedPnl) !== 0);
    const wins = closers.filter(f => +f.closedPnl > 0), losses = closers.filter(f => +f.closedPnl < 0);
    const gW = wins.reduce((a, f) => a + +f.closedPnl, 0), gL = Math.abs(losses.reduce((a, f) => a + +f.closedPnl, 0));
    const winRate = closers.length ? wins.length / closers.length : 0;
    const payoff = losses.length ? (gW / wins.length) / (gL / losses.length) : null;
    const pf = gL ? gW / gL : null;
    const exp = closers.length ? (gW - gL) / closers.length : 0;
    const taker = fills.filter(f => f.crossed === true).length;
    const biggest = closers.slice().sort((a, b) => +b.closedPnl - +a.closedPnl);
    // per-trade t-stat (raw $)
    const cp = closers.map(f => +f.closedPnl), n = cp.length;
    const mean = n ? cp.reduce((a, b) => a + b, 0) / n : 0;
    const sd = n > 1 ? Math.sqrt(cp.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
    const tstat = sd ? mean / (sd / Math.sqrt(n)) : 0;
    // holding period via FIFO open/close per coin
    const openQ = {}, durs = [];
    for (const f of fills.slice().sort((a, b) => +a.time - +b.time)) {
      const c = f.coin; if (!c) continue;
      openQ[c] = openQ[c] || [];
      if (/^open/i.test(f.dir)) openQ[c].push({ t: +f.time, sz: num(f.sz) });
      else if (/^close/i.test(f.dir)) { let rem = num(f.sz); while (rem > 0 && openQ[c].length) { const o = openQ[c][0]; const use = Math.min(o.sz, rem); if (o.t) durs.push((+f.time - o.t) / 36e5); o.sz -= use; rem -= use; if (o.sz <= 0.0000001) openQ[c].shift(); } }
    }
    durs.sort((a, b) => a - b); const medDur = durs.length ? durs[Math.floor(durs.length / 2)] : null;
    // per-coin pnl
    const coinPnl = {}; for (const f of closers) coinPnl[f.coin] = (coinPnl[f.coin] || 0) + +f.closedPnl;
    const coinArr = Object.entries(coinPnl).sort((a, b) => b[1] - a[1]);
    console.log('\n   ─ fills-derived metrics (GRANULAR & TRUSTWORTHY) ─');
    console.log('   closing fills: ' + closers.length + '   win rate: ' + (winRate * 100).toFixed(1) + '%');
    console.log('   payoff (avgWin/avgLoss): ' + (payoff ? payoff.toFixed(2) : '-') + '   profit factor: ' + (pf ? pf.toFixed(2) : '-'));
    console.log('   expectancy: $' + fmt(exp) + '/trade   maker ' + (((fills.length - taker) / fills.length) * 100).toFixed(0) + '% / taker ' + ((taker / fills.length) * 100).toFixed(0) + '%');
    console.log('   trades/day: ' + (fills.length / 30).toFixed(1) + '   median holding period: ' + (medDur != null ? (medDur < 24 ? medDur.toFixed(1) + 'h' : (medDur / 24).toFixed(1) + 'd') : '-'));
    console.log('   biggest win: $' + fmt(biggest[0] ? biggest[0].closedPnl : 0) + '   biggest loss: $' + fmt(biggest[biggest.length - 1] ? biggest[biggest.length - 1].closedPnl : 0));
    console.log('   edge significance: per-trade $ t-stat = ' + tstat.toFixed(2) + (Math.abs(tstat) > 2 ? '  → statistically REAL edge' : '  → NOT significant'));
    console.log('   top coins by PnL: ' + coinArr.slice(0, 4).map(([c, p]) => c + ' $' + fmt(p)).join(', ') + (coinArr.length > 4 ? ' | worst: ' + coinArr.slice(-2).map(([c, p]) => c + ' $' + fmt(p)).join(', ') : ''));
  }

  console.log('\n── 4) CAPITAL FLOWS (userNonFundingLedgerUpdates) ──');
  const types = {}; for (const x of ledRaw) { const k = x.delta && x.delta.type; types[k] = (types[k] || 0) + 1; }
  console.log('   events: ' + ledRaw.length + '   types: ' + Object.entries(types).map(([k, v]) => k + '×' + v).join(', '));
  console.log('   net external capital flow (sum, deposit/withdraw/send/vault): $' + fmt(netFlow));
  if (ledRaw[0]) console.log('   sample: ' + JSON.stringify(ledRaw[0].delta));

  console.log('\n── 5) WHAT WE CANNOT see (free public API) ──');
  console.log('   • open positions snapshot (clearingHouseState/userState = 422 on public API)');
  console.log('   • intraday/mark-to-market within a trade (so no exact MAE/MFE)');
  console.log('   • stop prices / arrival (decision) price (so R-multiples & slippage are approximations)');
  console.log('   • funding payments via a clean type (userFundings 422) — derivable indirectly');
})().catch(e => console.error('FATAL', e));
