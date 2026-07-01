// backend/src/hyperliquid.js — Hyperliquid free public-API fetcher.
// No auth, no AWS. Snapshot (all ~40k) + per-account fills (forward-paginated) + equity.
const STATS = 'https://stats-data.hyperliquid.xyz/Mainnet/leaderboard';
const INFO = 'https://api.hyperliquid.xyz/info';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function postInfo(body, tries = 5) {
  for (let t = 0; t < tries; t++) {
    try {
      const res = await fetch(INFO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 429 || res.status >= 500) { await sleep(600 * (t + 1) + t * t * 400); continue; }
      const txt = await res.text();
      let j; try { j = JSON.parse(txt); } catch (_) {}
      return { status: res.status, body: j };
    } catch (e) { await sleep(500 * (t + 1)); }
  }
  return { status: 0, body: null };
}

/** Full leaderboard snapshot (~40k). One fetch. Returns flat rows. */
export async function fetchLeaderboard() {
  const r = await fetch(STATS, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const j = await r.json();
  return (j.leaderboardRows || []).map(row => {
    const wp = {}; for (const [w, m] of (row.windowPerformances || [])) wp[w] = m;
    return { addr: row.ethAddress, name: row.displayName, acct: +row.accountValue, prize: +row.prize, wp };
  });
}

/** Find one account in the leaderboard. */
export async function fetchSnapshot(addr) {
  const lb = await fetchLeaderboard();
  return lb.find(r => r.addr.toLowerCase() === addr.toLowerCase()) || null;
}

/** ALL fills for an account via FORWARD pagination (endpoint returns earliest 2000 after startTime).
 *  Caps at maxPages to bound runtime. Returns deduped fills oldest→newest. */
export async function fetchAllFills(addr, { maxPages = 60, startTime = 0 } = {}) {
  const out = [], seen = new Set();
  let st = startTime, pages = 0;
  while (pages++ < maxPages) {
    const { body } = await postInfo({ type: 'userFillsByTime', user: addr, startTime: st });
    if (!Array.isArray(body) || !body.length) break;
    let nw = 0;
    for (const f of body) {
      const k = (f.hash || '') + '|' + (f.oid || '') + '|' + (f.tid || '') + '|' + f.time;
      if (!seen.has(k)) { seen.add(k); out.push(f); nw++; }
    }
    const ts = body.map(f => +f.time).sort((a, b) => a - b);
    if (body.length < 2000 || nw === 0) break;
    st = ts[ts.length - 1] + 1;
    await sleep(150);
  }
  return out.sort((a, b) => +a.time - +b.time);
}

/** allTime equity series [{t,v}] (coarse ~weekly — for drawdown only; NOT for Sortino). */
export async function fetchEquity(addr) {
  const { body } = await postInfo({ type: 'portfolio', user: addr });
  if (!Array.isArray(body)) return [];
  const el = body.find(x => Array.isArray(x) && x[0] === 'allTime');
  if (!el || !el[1] || !Array.isArray(el[1].accountValueHistory)) return [];
  return el[1].accountValueHistory.map(([t, v]) => ({ t: +t, v: +v })).filter(p => p.v > 0).sort((a, b) => a.t - b.t);
}
