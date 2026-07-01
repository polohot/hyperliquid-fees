// backend/src/clean-metrics.js — deposit-stripped (clean) risk metrics + validation.
// clean_pnl(d) = Δequity(d) − net_capital_flow(d); clean_return(d) = clean_pnl(d)/equity(d−1).
// Reads daily equity from hl.db; pulls capital flows from the free ledger API.
// Usage: node --env-file=../.env src/clean-metrics.js [addr]
import Database from 'better-sqlite3';
import path from 'path';
import { seriesRiskMetrics } from './metrics.js';

const INFO = 'https://api.hyperliquid.xyz/info';
const DBPATH = path.join(import.meta.dirname, '..', 'data', 'hl.db');
const ADDR = (process.argv[2] || '0xd8c5228c515db3043dfa0c8cd6f22450ee9a99b0').toLowerCase();
const num = s => { const v = +s; return isFinite(v) ? v : 0; };
const post = b => fetch(INFO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());

// signed impact of a ledger delta on total account value (capital flow)
function signedFlow(d, self) {
  switch (d && d.type) {
    case 'deposit': return num(d.usdc);
    case 'withdraw': return -num(d.usdc);
    case 'vaultDeposit': return -num(d.usdc);
    case 'vaultWithdraw': return num(d.netWithdrawnUsd != null ? d.netWithdrawnUsd : d.usdc);
    case 'send': return (d.destination && d.destination.toLowerCase() === self) ? 0 : -num(d.usdcValue != null ? d.usdcValue : d.amount);
    default: return 0; // accountClassTransfer / spotTransfer / spotGenesis / cStakingTransfer / vaultCreate = internal
  }
}
async function fetchLedger(addr, startMs) {
  const r = await post({ type: 'userNonFundingLedgerUpdates', user: addr, startTime: startMs });
  const arr = Array.isArray(r) ? r : [];
  return arr.map(x => ({ t: +x.time, type: x.delta && x.delta.type, flow: signedFlow(x.delta, addr.toLowerCase()) }));
}

(async () => {
  const db = new Database(DBPATH, { readonly: true });
  const eq = db.prepare('SELECT date, eq FROM equity WHERE user=? ORDER BY date').all(ADDR);
  if (!eq.length) { console.log('no equity in hl.db for', ADDR); return; }
  console.log('equity days:', eq.length, '|', eq[0].date, '→', eq[eq.length - 1].date);

  // ledger flows across the equity window
  const startMs = Date.parse(eq[0].date) - 86400000;
  const ledger = await fetchLedger(ADDR, startMs);
  const flowByType = {}, flowByDay = {};
  for (const e of ledger) { flowByType[e.type] = (flowByType[e.type] || 0) + e.flow; const day = new Date(e.t).toISOString().slice(0, 10); flowByDay[day] = (flowByDay[day] || 0) + e.flow; }
  const sumFlow = ledger.reduce((a, e) => a + e.flow, 0);

  // clean daily pnl + returns + clean equity curve
  const cleanReturns = [], cleanCurve = [{ t: Date.parse(eq[0].date), v: eq[0].eq }];
  let cleanEq = eq[0].eq;
  for (let i = 1; i < eq.length; i++) {
    const prev = eq[i - 1].eq, cur = eq[i].eq, dEq = cur - prev;
    const cleanPnl = dEq - (flowByDay[eq[i].date] || 0);
    if (prev > 0) cleanReturns.push(cleanPnl / prev);
    cleanEq += cleanPnl; cleanCurve.push({ t: Date.parse(eq[i].date), v: cleanEq });
  }
  const rawGrowth = eq[eq.length - 1].eq - eq[0].eq;
  const cleanTotalPnl = cleanEq - eq[0].eq; // == rawGrowth - sumFlow

  const rawM = seriesRiskMetrics(eq.map(e => ({ t: Date.parse(e.date), v: e.eq })));
  // build clean metrics from the clean equity curve (correct MaxDD/Calmar/CAGR too)
  const cleanM = seriesRiskMetrics(cleanCurve);

  const M = x => (x == null ? '-' : x);
  console.log('\n=== growth decomposition (over window) ===');
  console.log('  raw equity growth : $' + (rawGrowth / 1e6).toFixed(2) + 'M');
  console.log('  net capital flow  : $' + (sumFlow / 1e6).toFixed(2) + 'M   by type:', JSON.stringify(flowByType));
  console.log('  clean trading PnL : $' + (cleanTotalPnl / 1e6).toFixed(2) + 'M');

  console.log('\n=== risk metrics — RAW (contaminated) vs CLEAN (deposit-stripped) ===');
  console.log('            RAW          CLEAN');
  console.log('  Sharpe    ' + String(M(rawM?.sharpe)).padStart(6) + '        ' + String(M(cleanM?.sharpe)).padStart(6));
  console.log('  Sortino   ' + String(M(rawM?.sortino)).padStart(6) + '        ' + String(M(cleanM?.sortino)).padStart(6));
  console.log('  MaxDD %   ' + String(M(rawM?.maxDDpct)).padStart(6) + '        ' + String(M(cleanM?.maxDDpct)).padStart(6));
  console.log('  CAGR %    ' + String(M(rawM?.cagrPct)).padStart(6) + '    ' + String(M(cleanM?.cagrPct)).padStart(6));

  console.log('\n=== validation gate ===');
  const flowShare = rawGrowth ? (sumFlow / rawGrowth * 100) : 0;
  console.log('  flows = ' + flowShare.toFixed(0) + '% of raw growth  |  clean PnL = ' + (cleanTotalPnl >= 0 ? '+' : '') + '$' + (cleanTotalPnl / 1e6).toFixed(2) + 'M');
  console.log('  → final trust check: reconcile cleanTotalPnl against Hyperliquid snapshot allTime pnl (same window) — match = trustworthy, mismatch = flag/exclude.');
})().catch(e => console.log('ERR', e.name, e.message));
