// backend/src/backfill.js — production backfill.
// Hydromancer raw account_values (all dexes) → derived SQLite table (per-account daily equity,
// SUMMED across dexes, filtered to the ~40k leaderboard). RAW FILE DELETED after each day.
// Resumable. Usage: node --env-file=.env backend/src/backfill.js [limitDays]   (0 = all)
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import * as hq from 'hyparquet';
import { fetchLeaderboard } from './hyperliquid.js';
import { seriesRiskMetrics } from './metrics.js';

const LIMIT = +(process.argv[2] || 10);
const DBPATH = path.join(import.meta.dirname, '..', 'data', 'hl.db');
const TMP = '/tmp/hl_av.parquet';
fs.mkdirSync(path.dirname(DBPATH), { recursive: true });

const s3 = new S3Client({ region: 'ap-northeast-1' });
const BUCKET = 'hydromancer-reservoir';
const RP = { RequestPayer: 'requester' };
const list = (p) => s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: p, Delimiter: '/', MaxKeys: 1000, ...RP }));
const download = async (k) => { const r = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: k, ...RP })); fs.writeFileSync(TMP, Buffer.from(await r.Body.transformToByteArray())); };
const readObjs = (buf, cols) => hq.parquetReadObjects({ file: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), columns: cols });
const ADDR = '0xd8c5228c515db3043dfa0c8cd6f22450ee9a99b0'.toLowerCase();

const db = new Database(DBPATH);
db.pragma('journal_mode = WAL');
db.exec('CREATE TABLE IF NOT EXISTS leaderboard(user TEXT PRIMARY KEY, name TEXT, acct REAL)');
db.exec('CREATE TABLE IF NOT EXISTS equity(user TEXT, date TEXT, eq REAL, PRIMARY KEY(user,date))');
db.exec('CREATE TABLE IF NOT EXISTS done(date TEXT PRIMARY KEY)');
const insEq = db.prepare('INSERT OR REPLACE INTO equity(user,date,eq) VALUES(?,?,?)');
const insLb = db.prepare('INSERT OR REPLACE INTO leaderboard(user,name,acct) VALUES(?,?,?)');
const insDone = db.prepare('INSERT OR REPLACE INTO done(date) VALUES(?)');

(async () => {
  const t0 = Date.now();
  let lbCount = db.prepare('SELECT COUNT(*) c FROM leaderboard').get().c;
  if (lbCount === 0) {
    console.log('fetching leaderboard (40k)…');
    const lb = await fetchLeaderboard();
    const tx = db.transaction((rs) => { for (const r of rs) insLb.run(r.addr.toLowerCase(), r.name || '', +r.acct || 0); });
    tx(lb);
    lbCount = lb.length;
  }
  console.log('leaderboard rows:', lbCount);
  const lbSet = new Set(db.prepare('SELECT user FROM leaderboard').all().map(r => r.user));

  const av = await list('global/snapshots/account_values/');
  const dates = (av.CommonPrefixes || []).map(p => p.Prefix).filter(d => /date=/.test(d)).sort();
  const doneSet = new Set(db.prepare('SELECT date FROM done').all().map(r => r.date));
  let todo = dates.filter(d => !doneSet.has(d.match(/date=(\d{4}-\d{2}-\d{2})/)[1]));
  todo = LIMIT > 0 ? todo.slice(-LIMIT) : todo; // most-recent first when limiting
  console.log('dates total:', dates.length, '| done:', doneSet.size, '| processing:', todo.length, todo.length ? `(${todo[0].slice(-11,-1)} → ${todo[todo.length-1].slice(-11,-1)})` : '');

  for (let i = 0; i < todo.length; i++) {
    const dateStr = todo[i].match(/date=(\d{4}-\d{2}-\d{2})/)[1];
    const keys = ((await list(todo[i])).Contents || []).map(c => c.Key).filter(k => k.endsWith('.parquet'));
    for (const k of keys) {
      await download(k);
      const rows = await readObjs(fs.readFileSync(TMP), ['user', 'dex', 'account_value']);
      fs.unlinkSync(TMP); // discard raw
      const sums = {};
      for (const r of rows) { const u = String(r.user).toLowerCase(); if (lbSet.has(u)) sums[u] = (sums[u] || 0) + (+r.account_value || 0); }
      const entries = Object.entries(sums);
      const tx = db.transaction((es) => { for (const [u, eq] of es) insEq.run(u, dateStr, eq); });
      tx(entries);
    }
    insDone.run(dateStr);
    if ((i + 1) % 5 === 0 || i === todo.length - 1) console.log(`  ${i + 1}/${todo.length} (${dateStr})  ${(fs.statSync(DBPATH).size / 1e6).toFixed(0)}MB  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }

  const rows = db.prepare('SELECT date, eq FROM equity WHERE user=? ORDER BY date').all(ADDR);
  console.log(`\n${ADDR} series: ${rows.length} days`);
  rows.slice(0, 6).forEach(r => console.log(`  ${r.date}  $${(r.eq / 1e6).toFixed(3)}M`));
  if (rows.length > 6) console.log(`  …(+${rows.length - 6} more)`);
  const m = seriesRiskMetrics(rows.map(r => ({ t: Date.parse(r.date), v: r.eq })));
  console.log('risk metrics:', m ? JSON.stringify(m) : '(too few — run more days)');
  console.log(`\nequity rows: ${db.prepare('SELECT COUNT(*) c FROM equity').get().c.toLocaleString()} | derived DB: ${(fs.statSync(DBPATH).size / 1e6).toFixed(1)}MB | elapsed ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})().catch(e => console.log('ERR', e.name, e.message));
