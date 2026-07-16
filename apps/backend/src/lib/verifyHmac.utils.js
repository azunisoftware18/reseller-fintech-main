import crypto from 'node:crypto';

export function verifyHmac({
  rawQuery,
  headers,
  secret,
  algo = 'sha256',
  headerName = 'x-signature',
}) {
  const signature = headers[headerName];

  if (!signature || !rawQuery || !secret) return false;

  const computed = crypto
    .createHmac(algo, secret)
    .update(rawQuery)
    .digest('hex');

  // 🔐 Convert both to same encoding
  const sigBuf = Buffer.from(signature, 'hex');
  const compBuf = Buffer.from(computed, 'hex');

  // 🔒 Prevent timingSafeEqual crash
  if (sigBuf.length !== compBuf.length) return false;

  return crypto.timingSafeEqual(sigBuf, compBuf);
}
