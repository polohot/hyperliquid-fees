#!/usr/bin/env node
/**
 * Institutional-grade feasibility test.
 * 1. Pull the ~40k leaderboard (free stats-data endpoint).
 * 2. Sample accounts across tiers.
 * 3. For each: pull per-account endpoints (portfolio, fills, ledger, state)
 *    and compute every metric we'd want.
 * Reports exactly which metrics are computable for free, per account.
 *
 * No secrets. Public read API only.
 */
const STATS = 'https://stats-data.hyperliquid.xyz/Mainnet/leaderboard';
const INFO = 'https://api.hyperliquid.xyz/info';

async function info(body) {
  const res = await fetch(INFO, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  let j; try { j = JSON.parse(txt); } catch (_) { j = txt.slice(0, 200); }
  return { status: res.status, body: j };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- stat helpers ----
function seriesMetrics(equity) {
  if (!equity || equity.length < 3) return null;
  equity = equity.filter(p => Number.isFinite(+p.v)).map(p => ({ t: +p.t, v: +p.v }));
  if (equity.length < 3) return null;
  const rets = [];
  for (let i = 1; i < equity.length; i++) {
    const prev = equity[i - 1].v, cur = equity[i].v;
    if (prev > 0) rets.push((cur - prev) / prev);
  }
  if (!rets.length) return null;
  const n = rets.length;
  const mean = rets.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const downside = rets.filter(r => r < 0);
  const dsd = downside.length ? Math.sqrt(downside.reduce((a, b) => a + b * b, 0) / downside.length) : 0;
  let peak = equity[0].v, maxDD = 0;
  for (const p of equity) { peak = Math.max(peak, p.v); if (peak > 0) maxDD = Math.max(maxDD, (peak - p.v) / peak); }
  const first = equity[0].v, last = equity[equity.length - 1].v;
  const days = (equity[equity.length - 1].t - equity[0].t) / 86400000;
  const cagr = first > 0 && days > 0 ? Math.pow(last / first, 365 / days) - 1 : null;
  const ann = Math.sqrt(365);
  return { points: n, spanDays: +days.toFixed(1), annVolPct: +(sd * ann * 100).toFixed(1),
    sharpe: sd ? +(mean / sd * ann).toFixed(2) : null, sortino: dsd ? +(mean / dsd * ann).toFixed(2) : null,
    maxDDpct: +(maxDD * 100).toFixed(1), calmar: maxDD > 0 && cagr != null ? +(cagr / maxDD).toFixed(2) : null,
    cagrPct: cagr != null ? +(cagr * 100).toFixed(1) : null };
}
function fillMetrics(fills) {
  if (!Array.isArray(fills) || !fills.length) return null;
  const closers = fills.filter(f => Number(+f.closedPnl) !== 0);
  const wins = closers.filter(f => +f.closedPnl > 0);
  const losses = closers.filter(f => +f.closedPnl < 0);
  const grossWin = wins.reduce((a, f) => a + +f.closedPnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, f) => a + +f.closedPnl, 0));
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const winRate = closers.length ? wins.length / closers.length : null;
  const taker = fills.filter(f => f.crossed === true).length;
  return { fills: fills.length, closingFills: closers.length,
    winRatePct: winRate != null ? +(winRate * 100).toFixed(1) : null,
    payoff: avgLoss ? +(avgWin / avgLoss).toFixed(2) : null,
    profitFactor: grossLoss ? +(grossWin / grossLoss).toFixed(2) : null,
    expectancy: closers.length ? +((grossWin - grossLoss) / closers.length).toFixed(2) : null,
    takerPct: fills.length ? +(taker / fills.length * 100).toFixed(1) : null };
}
function extractEquitySeries(body) {
  let arr = null;
  if (Array.isArray(body)) arr = body;
  else if (body && typeof body === 'object') {
    for (const k of ['portfolioByTimeSeries', 'timeSeries', 'series', 'portfolio']) {
      if (Array.isArray(body[k])) { arr = body[k]; break; }
    }
  }
  if (!arr) return null;
  return arr.map(p => {
    if (typeof p !== 'object' || !p) return null;
    const t = +p.time || +p.t || +p.timestamp;
    const v = +p.accountValue || +p.value || +p.v || +p.equity;
    return Number.isFinite(t) && Number.isFinite(v) ? { t, v } : null;
  }).filter(Boolean);
}
const fmtUSD = x => {
  if (x == null || !isFinite(+x)) return String(x);
  const v = +x, a = Math.abs(v);
  if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (v / 1e3).toFixed(1) + 'k';
  return v.toFixed(0);
};

(async () => {
  console.log('Fetching leaderboard (33MB)…');
  const lb = (await (await fetch(STATS, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json()).leaderboardRows;
  console.log('traders:', lb.length);

  // flatten windowPerformances into a map
  const rows = lb.map(r => {
    const wp = {}; for (const [w, m] of (r.windowPerformances || [])) wp[w] = m;
    return { addr: r.ethAddress, name: r.displayName, acct: +r.accountValue, wp };
  }).sort((a, b) => (+b.wp.allTime?.vlm || 0) - (+a.wp.allTime?.vlm || 0));

  // samples: top 3 by allTime volume + one mid-tier
  const samples = [
    { tag: 'TOP1 by allTime volume', r: rows[0] },
    { tag: 'TOP2 by allTime volume', r: rows[1] },
    { tag: 'TOP3 by allTime volume', r: rows[2] },
    { tag: 'MID (rank ~20000)', r: rows[20000] },
  ].filter(s => s.r);

  const DAY = 86400000, now = Date.now();

  for (const s of samples) {
    const { r, tag } = s;
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`█ ${tag}`);
    console.log(`  addr: ${r.addr}   name: ${r.name || '(none)'}   accountValue: $${fmtUSD(r.acct)}`);
    console.log('  ─ leaderboard snapshot (free) ─');
    for (const w of ['day', 'week', 'month', 'allTime']) {
      const m = r.wp[w];
      if (m) console.log(`    ${w.padEnd(8)} pnl $${fmtUSD(m.pnl).padStart(9)}  roi ${(m.roi * 100).toFixed(2).padStart(7)}%  vlm $${fmtUSD(m.vlm)}`);
    }

    // --- portfolio (equity time series) ---
    const port = await info({ type: 'portfolio', user: r.addr });
    const series = extractEquitySeries(port.body);
    console.log('  ─ portfolio endpoint ─ status ' + port.status +
      (port.body && typeof port.body === 'object' ? '  keys: ' + Object.keys(port.body).join(',') : '') +
      '  series points: ' + (series ? series.length : 'NONE'));
    const sm = seriesMetrics(series);
    if (sm) console.log('     RISK-ADJ: Sharpe=' + sm.sharpe + ' Sortino=' + sm.sortino + ' Calmar=' + sm.calmar +
      ' annVol=' + sm.annVolPct + '% maxDD=' + sm.maxDDpct + '% CAGR=' + sm.cagrPct + '% span=' + sm.spanDays + 'd');
    else console.log('     (no usable equity series → Sharpe/Sortino/MaxDD NOT computable from this call)');

    // --- userFillsByTime (30d) ---
    await sleep(250);
    const fillsRes = await info({ type: 'userFillsByTime', user: r.addr, startTime: now - 30 * DAY });
    const fills = Array.isArray(fillsRes.body) ? fillsRes.body : null;
    console.log('  ─ userFillsByTime(30d) ─ status ' + fillsRes.status + '  fills: ' + (fills ? fills.length : 'N/A ' + JSON.stringify(fillsRes.body).slice(0, 60)));
    if (fills && fills[0]) console.log('     fill keys: ' + Object.keys(fills[0]).join(', '));
    const fm = fillMetrics(fills);
    if (fm) console.log('     TRADE: winRate=' + fm.winRatePct + '% payoff=' + fm.payoff + ' profitFactor=' + fm.profitFactor +
      ' expectancy=$' + fmtUSD(fm.expectancy) + ' taker=' + fm.takerPct + '%');

    // --- userNonFundingLedgerUpdates (180d) — daily realized PnL source ---
    await sleep(250);
    const led = await info({ type: 'userNonFundingLedgerUpdates', user: r.addr, startTime: now - 180 * DAY });
    const ledArr = Array.isArray(led.body) ? led.body : (led.body && led.body.ledgerUpdates);
    console.log('  ─ userNonFundingLedgerUpdates(180d) ─ status ' + led.status + '  updates: ' + (ledArr ? ledArr.length : 'N/A ' + JSON.stringify(led.body).slice(0, 60)));
    if (ledArr && ledArr[0]) console.log('     ledger keys: ' + Object.keys(ledArr[0]).join(', '));

    // --- clearingHouseState (open positions) ---
    await sleep(250);
    let st = await info({ type: 'clearingHouseState', user: r.addr });
    if (st.status !== 200) st = await info({ type: 'userState', user: r.addr });
    const assetPos = st.body && st.body.assetPositions;
    console.log('  ─ state/positions ─ status ' + st.status + '  open positions: ' + (assetPos ? assetPos.length : 'N/A'));
    await sleep(400);
  }

  console.log('\n══════════════ DONE ══════════════');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
