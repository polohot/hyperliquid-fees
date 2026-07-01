// backend/src/metrics.js — the metric engine (pure functions, no I/O).
// Two families:
//   1) fillsMetrics(fills)  — trading-skill metrics from userFills (GRANULAR, TRUSTWORTHY, viable now)
//   2) seriesRiskMetrics(series) — Sharpe/Sortino/Calmar/MaxDD from a daily equity-or-return series
//      (feed it Hydromancer daily account_values, or a deposit-stripped daily PnL series)

const num = s => { const v = +s; return isFinite(v) ? v : 0; };

/** Trading-skill metrics from a list of userFills (userFillsByTime shape). */
export function fillsMetrics(fills) {
  const all = Array.isArray(fills) ? fills : [];
  const closers = all.filter(f => num(f.closedPnl) !== 0);
  const wins = closers.filter(f => +f.closedPnl > 0);
  const losses = closers.filter(f => +f.closedPnl < 0);
  const gW = wins.reduce((a, f) => a + +f.closedPnl, 0);
  const gL = Math.abs(losses.reduce((a, f) => a + +f.closedPnl, 0));
  const n = closers.length;
  const mean = n ? closers.reduce((a, f) => a + +f.closedPnl, 0) / n : 0;
  const sd = n > 1 ? Math.sqrt(closers.reduce((a, f) => a + (+f.closedPnl - mean) ** 2, 0) / (n - 1)) : 0;

  // maker/taker
  const taker = all.filter(f => f.crossed === true).length;

  // holding period via FIFO open/close per coin
  const q = {}, durs = [];
  for (const f of all.slice().sort((a, b) => +a.time - +b.time)) {
    const c = f.coin; if (!c) continue; q[c] = q[c] || [];
    if (/^open/i.test(f.dir)) q[c].push({ t: +f.time, sz: num(f.sz) });
    else if (/^close/i.test(f.dir)) {
      let rem = num(f.sz);
      while (rem > 0 && q[c].length) { const o = q[c][0]; const use = Math.min(o.sz, rem); if (o.t) durs.push((+f.time - o.t) / 36e5); o.sz -= use; rem -= use; if (o.sz <= 1e-7) q[c].shift(); }
    }
  }
  durs.sort((a, b) => a - b);
  const medH = durs.length ? durs[Math.floor(durs.length / 2)] : null;

  // biggest win/loss + per-coin
  const sorted = closers.slice().sort((a, b) => +b.closedPnl - +a.closedPnl);
  const coinPnl = {};
  for (const f of closers) coinPnl[f.coin] = (coinPnl[f.coin] || 0) + +f.closedPnl;
  const coins = Object.entries(coinPnl).map(([coin, pnl]) => ({ coin, pnl })).sort((a, b) => b.pnl - a.pnl);
  const fees = all.reduce((a, f) => a + Math.abs(num(f.fee)), 0);

  return {
    fills: all.length,
    closingFills: n,
    winRate: n ? +(wins.length / n * 100).toFixed(1) : null,           // %
    payoff: losses.length ? +((gW / wins.length) / (gL / losses.length)).toFixed(2) : null,
    profitFactor: gL ? +(gW / gL).toFixed(2) : null,
    expectancy: n ? +((gW - gL) / n).toFixed(2) : null,                // $ / trade
    edgeTStat: sd ? +(mean / (sd / Math.sqrt(n))).toFixed(2) : 0,      // >2 = real edge
    edgeSignificant: sd ? Math.abs(mean / (sd / Math.sqrt(n))) > 2 : false,
    makerPct: all.length ? +(((all.length - taker) / all.length) * 100).toFixed(0) : null,
    medianHoldHours: medH,
    biggestWin: sorted[0] ? +sorted[0].closedPnl : 0,
    biggestLoss: sorted.length ? +sorted[sorted.length - 1].closedPnl : 0,
    realizedPnl: +(gW - gL).toFixed(2),
    totalFees: +fees.toFixed(2),
    feeDragPct: (gW - gL) ? +(fees / Math.abs(gW - gL) * 100).toFixed(1) : null,
    coins,
  };
}

/** Risk metrics from an equity-or-return series.
 *  series: [{t, v}] equity points OR [{t, r}] precomputed returns. Auto-detected.
 *  Returns daily-resolved Sharpe/Sortino/Calmar/MaxDD — valid when fed Hydromancer
 *  daily account_values (or a deposit-stripped daily PnL series). */
export function seriesRiskMetrics(series) {
  if (!Array.isArray(series) || series.length < 3) return null;
  // build returns
  let rets = [];
  if (series[0].r != null) rets = series.map(p => +p.r);
  else {
    const eq = series.filter(p => Number.isFinite(+p.v) && +p.v > 0).sort((a, b) => a.t - b.t);
    for (let i = 1; i < eq.length; i++) { if (eq[i - 1].v > 0) rets.push(eq[i].v / eq[i - 1].v - 1); }
  }
  rets = rets.filter(r => isFinite(r) && Math.abs(r) <= 5); // drop discontinuities
  if (rets.length < 5) return null;
  const n = rets.length;
  const mean = rets.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const down = rets.filter(r => r < 0);
  const dsd = down.length ? Math.sqrt(down.reduce((a, b) => a + b * b, 0) / down.length) : 0;
  const ann = Math.sqrt(365); // daily
  // max drawdown over the equity curve
  const eq = series.filter(p => Number.isFinite(+p.v)).sort((a, b) => a.t - b.t);
  let peak = eq[0]?.v ?? 0, maxDD = 0;
  for (const p of eq) { peak = Math.max(peak, +p.v); if (peak > 0) maxDD = Math.max(maxDD, (peak - p.v) / peak); }
  const spanDays = eq.length > 1 ? (eq[eq.length - 1].t - eq[0].t) / 864e5 : 0;
  const cagr = eq.length > 1 && eq[0].v > 0 ? Math.pow(eq[eq.length - 1].v / eq[0].v, 365 / Math.max(spanDays, 1)) - 1 : null;
  return {
    nPoints: eq.length, spanDays: +spanDays.toFixed(0),
    sharpe: sd ? +(mean / sd * ann).toFixed(2) : null,
    sortino: dsd > 1e-6 ? +(mean / dsd * ann).toFixed(2) : null,
    maxDDpct: +(maxDD * 100).toFixed(1),
    calmar: maxDD > 0 && cagr != null ? +(cagr / maxDD).toFixed(2) : null,
    cagrPct: cagr != null ? +(cagr * 100).toFixed(1) : null,
    annVolPct: +(sd * ann * 100).toFixed(1),
  };
}
