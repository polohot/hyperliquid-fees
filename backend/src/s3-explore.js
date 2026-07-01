// backend/src/s3-explore.js — map the Hydromancer archive structure. Prints NO secrets.
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: 'ap-northeast-1' });
const BUCKET = 'hydromancer-reservoir';

async function ls(prefix) {
  const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, Delimiter: '/', MaxKeys: 30, RequestPayer: 'requester' }));
  return { dirs: (r.CommonPrefixes || []).map(p => p.Prefix), objs: (r.Contents || []).map(c => ({ key: c.Key, size: c.Size })) };
}

(async () => {
  for (const p of ['global/snapshots/', 'global/fills/']) {
    console.log('\n=== ' + p + ' ===');
    let r = await ls(p);
    console.log('  subdirs:', r.dirs.join('  ') || '(none)');
    // go one level deeper into each subdir
    for (const d of r.dirs.slice(0, 4)) {
      const r2 = await ls(d);
      const sample = r2.objs[0];
      console.log('  ' + d + '→ ' + (r2.dirs.join(' ') || (sample ? `sample file: ${sample.key} (${sample.size} bytes)` : '(empty)')));
    }
  }
})().catch(e => console.log('ERR', e.name, String(e.message || '').slice(0, 150)));
