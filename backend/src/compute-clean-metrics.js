// backend/src/compute-clean-metrics.js — batch: deposit-stripped, VALIDATED risk ratios.
// Reads daily equity from hl.db + ledger from the free API → clean metrics in `clean_metrics`.
// Vault-excluded + strong sanity gates (degenerate/inactive/bad_stripping/low_coverage). Resumable.
// Usage: node --env-file=../.env src/compute-clean-metrics.js [limitAccts=30] [concurrency=5]
import Database from 'better-sqlite3';
import path from 'path';
import { fetchLeaderboard, fetchLedger } from './hyperliquid.js';
import { cleanMetrics } from './metrics.js';

const LIMIT = +(process.argv[2] || 30);
const CONC = +(process.argv[3] || 5);
const DBPATH = path.join(import.meta.dirname, '..', 'data', 'hl.db');
const MIN_DAYS = 60;
const VAULTS_URL = 'https://stats-data.hyperliquid.xyz/Mainnet/vaults';

const db = new Database(DBPATH);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS clean_metrics(
  user TEXT PRIMARY KEY, nDays INT, sortino REAL, sharpe REAL, maxDD REAL, calmar REAL, cagr REAL,
  cleanTotalPnl REAL, snapshotPnl REAL, validated INT, quality TEXT, updated TEXT)`);
const ins = db.prepare(`INSERT OR REPLACE INTO clean_metrics(user,nDays,sortino,sharpe,maxDD,calmar,cagr,cleanTotalPnl,snapshotPnl,validated,quality,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);
const pool = (items, n, fn) => { let i = 0; return Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const idx = i++; await fn(items[idx]); } })); };

// quality gate — only 'good' is trustworthy enough to rank
function quality(cm, snap, acct) {
  if (cm.sortino == null || cm.nDays < MIN_DAYS) return 'short_history';
  if (cm.minCleanV < 0 || cm.maxDDpct > 95 || Math.abs(cm.sortino) > 15 || Math.abs(cm.sharpe) > 15) return 'degenerate';
  if (acct > 0 && Math.abs(cm.cleanTotalPnl) < acct * 0.001) return 'inactive'; // PnL negligible vs size (flat/system/vault)
  const tol = Math.max(1000, Math.abs(snap) * 0.2);
  if (cm.cleanTotalPnl > snap + tol) return 'bad_stripping'; // window PnL can't exceed Hyperliquid's allTime total
  if (snap > 0 && cm.cleanTotalPnl < snap * 0.05) return 'low_coverage'; // window misses the track record
  return 'good';
}

(async () => {
  const t0 = Date.now();
  const [lb, vres] = await Promise.all([
    fetchLeaderboard(),
    fetch(VAULTS_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.json()),
  ]);
  const pnl = {}, acct = {};
  for (const r of lb) { const u = r.addr.toLowerCase(); pnl[u] = +r.wp?.allTime?.pnl || 0; acct[u] = +r.acct || 0; }
  const vaults = new Set((Array.isArray(vres) ? vres : []).map(v => v?.summary?.vaultAddress?.toLowerCase()).filter(Boolean));
  console.log(`leaderboard ${lb.length} | vaults excluded ${vaults.size}`);

  const done = new Set(db.prepare('SELECT user FROM clean_metrics').all().map(r => r.user));
  let cands = db.prepare('SELECT user FROM leaderboard WHERE acct IS NOT NULL ORDER BY acct DESC').all()
    .map(r => r.user).filter(u => !done.has(u) && !vaults.has(u));
  if (LIMIT > 0) cands = cands.slice(0, LIMIT);
  console.log(`processing ${cands.length} (top by acct, vaults excluded, conc=${CONC})`);

  const q = { good: 0, degenerate: 0, inactive: 0, bad_stripping: 0, low_coverage: 0, short_history: 0, err: 0 };
  let n = 0;
  await pool(cands, CONC, async (user) => {
    try {
      const eq = db.prepare('SELECT date, eq FROM equity WHERE user=? ORDER BY date').all(user);
      const ledger = eq.length ? await fetchLedger(user, Date.parse(eq[0].date) - 86400000) : [];
      const cm = eq.length >= MIN_DAYS ? cleanMetrics(eq, ledger) : null;
      const ql = cm ? quality(cm, pnl[user] || 0, acct[user] || 0) : 'short_history';
      q[ql]++;
      if (cm) ins.run(user, cm.nDays, cm.sortino ?? null, cm.sharpe ?? null, cm.maxDDpct ?? null, cm.calmar ?? null, cm.cagrPct ?? null, cm.cleanTotalPnl, pnl[user] || 0, ql === 'good' ? 1 : 0, ql, new Date().toISOString());
    } catch (e) { q.err++; }
    n++;
    if (n % 100 === 0 || n === cands.length) console.log(`  ${n}/${cands.length}  good=${q.good} degen=${q.degenerate} inact=${q.inactive} badstrip=${q.bad_stripping} lowcov=${q.low_coverage} short=${q.short_history} err=${q.err}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  });

  console.log(`\nDONE in ${((Date.now() - t0) / 1000).toFixed(0)}s — quality: ${JSON.stringify(q)}`);
  const top = db.prepare(`SELECT c.user,l.acct,c.sortino,c.sharpe,c.maxDD,c.cleanTotalPnl,c.snapshotPnl,c.nDays
    FROM clean_metrics c JOIN leaderboard l ON c.user=l.user
    WHERE c.quality='good' ORDER BY c.sortino DESC LIMIT 10`).all();
  console.log('\nTOP 10 by CLEAN Sortino (quality=good, vaults+inactive excluded, validated):');
  console.log('#  Sortino Sharpe maxDD  nDays  acct     cleanPnl   snapPnl    user');
  top.forEach((r, i) => console.log(
    String(i + 1).padStart(2) + ' ' +
    String(r.sortino).padStart(6) + ' ' + String(r.sharpe).padStart(5) + ' ' + String(r.maxDD + '%').padStart(5) + '  ' +
    String(r.nDays).padStart(4) + '  ' + ('$' + (r.acct / 1e6).toFixed(1) + 'M').padStart(7) + '  ' +
    ('$' + (r.cleanTotalPnl / 1e3).toFixed(0) + 'k').padStart(7) + '  ' + ('$' + (r.snapshotPnl / 1e3).toFixed(0) + 'k').padStart(7) + '   ' + r.user.slice(0, 12)));
})().catch(e => console.log('ERR', e.name, e.message));
