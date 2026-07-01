// backend/src/aws-check.js — diagnostic AWS + Hydromancer bucket check. Prints NO secrets.
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import {
  S3Client, ListBucketsCommand, GetBucketLocationCommand, ListObjectsV2Command, HeadBucketCommand,
} from '@aws-sdk/client-s3';

const BUCKET = 'hydromancer-reservoir';
const dump = (p, e) => console.log(`✗ ${p}: name=${e.name} code=${e.Code || e.code || '-'} http=${e.$metadata?.httpStatusCode ?? '-'} bucketRegion=${e.BucketRegion || '-'} msg=${String(e.message || '').slice(0, 150)}`);

(async () => {
  try {
    const id = await new STSClient({ region: 'ap-northeast-1' }).send(new GetCallerIdentityCommand({}));
    console.log('✓ auth OK → account', id.Account, '(' + id.Arn + ')');
  } catch (e) { dump('STS', e); return; }

  const s3u = new S3Client({ region: 'us-east-1' });
  // 1) global S3 connectivity
  try { const b = await s3u.send(new ListBucketsCommand({})); console.log('✓ S3 reachable (ListBuckets), owner:', b.Owner?.DisplayName || '?'); }
  catch (e) { dump('ListBuckets', e); }

  // 2) where is the bucket?
  let region = 'ap-northeast-1';
  try { const loc = await s3u.send(new GetBucketLocationCommand({ Bucket: BUCKET })); region = loc.LocationConstraint || 'us-east-1'; console.log('✓ bucket region:', region); }
  catch (e) { dump('GetBucketLocation', e); }

  // 3) head + list with requester-pays, in the bucket's own region
  const s3 = new S3Client({ region });
  try { await s3.send(new HeadBucketCommand({ Bucket: BUCKET })); console.log('✓ HeadBucket OK'); }
  catch (e) { dump('HeadBucket', e); }

  for (const prefix of ['', 'requester-pays/', 'global/', 'requester-pays/global/']) {
    try {
      const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, Delimiter: '/', MaxKeys: 10, RequestPayer: 'requester' }));
      const dirs = (r.CommonPrefixes || []).map(p => p.Prefix);
      const objs = (r.Contents || []).map(c => c.Key + '(' + c.Size + 'b)');
      console.log(`✓ list '${prefix || '/'}' → dirs: [${dirs.join(', ')}]${objs.length ? '  objs: ' + objs.slice(0, 3).join(', ') : ''}`);
    } catch (e) { dump(`List '${prefix}'`, e); }
  }
})();
