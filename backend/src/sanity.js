// backend/src/sanity.js — pull ONE Hydromancer parquet, confirm schema + find test account. No secrets printed.
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import * as hq from 'hyparquet';

const s3 = new S3Client({ region: 'ap-northeast-1' });
const BUCKET = 'hydromancer-reservoir';
const TEST = '0xd8c5228c515db3043dfa0c8cd6f22450ee9a99b0';
const RP = { RequestPayer: 'requester' };

const list = (prefix) => s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, Delimiter: '/', MaxKeys: 1000, ...RP }));
const get = async (key) => { const r = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key, ...RP })); return Buffer.from(await r.Body.transformToByteArray()); };

async function readParquet(buf) {
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); // Buffer → ArrayBuffer
  if (hq.parquetReadObjects) return await hq.parquetReadObjects({ file: ab });
  let p; try { p = hq.parquetRead({ file: ab, rowFormat: 'object' }); } catch (_) {}
  if (p && typeof p.then === 'function') return await p;
  return await new Promise(res => hq.parquetRead({ file: ab, rowFormat: 'object', onComplete: res }));
}

(async () => {
  console.log('hyparquet exports:', Object.keys(hq).join(', '));
  console.log('\n=== account_values sanity ===');
  const av = await list('global/snapshots/account_values/');
  const dates = (av.CommonPrefixes || []).map(p => p.Prefix).filter(d => /date=/.test(d)).sort();
  const latest = dates[dates.length - 1];
  console.log('dates total:', dates.length, '| earliest:', dates[0], '| latest:', latest);
  const keys = ((await list(latest)).Contents || []).map(c => c.Key).filter(k => k.endsWith('.parquet'));
  const key = keys[0];
  console.log('latest-date file:', key, '| files in date:', keys.length);
  const buf = await get(key);
  console.log('downloaded size:', (buf.length / 1024).toFixed(1) + ' KB');
  const rows = await readParquet(buf);
  console.log('rows in file:', rows.length);
  console.log('columns:', rows[0] ? Object.keys(rows[0]).join(', ') : '(empty)');
  const dexCounts = {}; for (const r of rows) dexCounts[r.dex] = (dexCounts[r.dex] || 0) + 1;
  console.log('dex distribution:', JSON.stringify(dexCounts));
  const hits = rows.filter(r => String(r.user || '').toLowerCase() === TEST);
  console.log('\ntest account rows (' + hits.length + '):');
  hits.forEach(r => console.log('  ', JSON.stringify(r)));
})().catch(e => console.log('ERR', e.name, e.message));
