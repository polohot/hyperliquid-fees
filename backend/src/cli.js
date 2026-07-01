// backend/src/cli.js — profile any Hyperliquid account: snapshot + fills-based metric panel.
// Usage: node src/cli.js <address>
import { fetchSnapshot, fetchAllFills } from './hyperliquid.js';
import { fillsMetrics } from './metrics.js';

const fmt = x => { if (x == null || !isFinite(+x)) return '-'; const v = +x, a = Math.abs(v); if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B'; if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M'; if (a >= 1e3) return (v / 1e3).toFixed(1) + 'k'; return v.toFixed(2); };
const dt = t => new Date(t).toISOString().slice(0, 10);

const addr = process.argv[2] || '0xd8c5228c515db3043dfa0c8cd6f22450ee9a99b0';

(async () => {
  console.log('Profiling ' + addr + ' …');
  const [snap, fills] = await Promise.all([fetchSnapshot(addr), fetchAllFills(addr, { maxPages: 30 })]);
  if (!snap) { console.log('Not found in leaderboard.'); process.exit(0); }

  const m = fillsMetrics(fills);
  console.log('\n═══ ' + addr + (snap.name ? '  (' + snap.name + ')' : '') + ' ═══');
  console.log('accountValue: $' + fmt(snap.acct));
  console.log('\n— SNAPSHOT (Hyperliquid-normalized) —');
  for (const w of ['day', 'week', 'month', 'allTime']) { const x = snap.wp[w]; if (x) console.log('  ' + w.padEnd(8) + 'pnl $' + fmt(x.pnl).padStart(9) + '  roi ' + (x.roi * 100).toFixed(1).padStart(7) + '%  vlm $' + fmt(x.vlm)); }

  console.log('\n— FILLS-BASED METRICS (' + (fills[0] ? dt(+fills[0].time) : '?') + ' → ' + (fills[fills.length - 1] ? dt(+fills[fills.length - 1].time) : '?') + ', ' + m.fills + ' fills) —');
  console.log('  win rate: ' + m.winRate + '%   payoff: ' + m.payoff + '   profit factor: ' + m.profitFactor + '   expectancy: $' + fmt(m.expectancy) + '/trade');
  console.log('  edge t-stat: ' + m.edgeTStat + (m.edgeSignificant ? '  ✅ REAL EDGE' : '  (not significant)') + '   maker: ' + m.makerPct + '%');
  console.log('  median hold: ' + (m.medianHoldHours != null ? (m.medianHoldHours < 24 ? m.medianHoldHours.toFixed(1) + 'h' : (m.medianHoldHours / 24).toFixed(1) + 'd') : '-') + '   biggest win $' + fmt(m.biggestWin) + '   biggest loss $' + fmt(m.biggestLoss));
  console.log('  realized PnL $' + fmt(m.realizedPnl) + '   fees $' + fmt(m.totalFees) + (m.feeDragPct != null ? '  (' + m.feeDragPct + '% of PnL)' : ''));
  console.log('  top coins: ' + m.coins.slice(0, 4).map(c => c.coin + ' $' + fmt(c.pnl)).join(', '));
  if (m.coins.length > 4) console.log('           worst: ' + m.coins.slice(-3).map(c => c.coin + ' $' + fmt(c.pnl)).join(', '));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
