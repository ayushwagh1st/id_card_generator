import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createECDH, createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { EVENT_SCOPE, operationSchema, signingData } from '@/web_offline_p2p_sync/core/protocol';
import type { OutboxItem } from '@/web_offline_p2p_sync/core/OfflineStore';
import type { DeviceCredential } from '@/web_offline_p2p_sync/core/DeviceIdentity';

export const OPERATOR_ROLES = ['SUPER_ADMIN', 'MODEL_HEAD', 'LECTURER'];
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Offline server credentials are not configured.');
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal || AbortSignal.timeout(15000) }) } });
}
export async function requireOperator() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('AUTH_REQUIRED');
  if (!OPERATOR_ROLES.includes(user.app_metadata?.role)) throw new Error('OPERATOR_ROLE_REQUIRED');
  return user;
}
function signingKey() {
  const secret = process.env.OFFLINE_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Offline signing is not configured.');
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(createHash('sha256').update(`offline-device-credential-v1:${secret}`).digest());
  const point = ecdh.getPublicKey();
  return createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: ecdh.getPrivateKey().toString('base64url'), x: point.subarray(1, 33).toString('base64url'), y: point.subarray(33).toString('base64url') }, format: 'jwk' });
}
export function issueCredential(claims: DeviceCredential) {
  const key = signingKey();
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = sign('sha256', Buffer.from(body), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return { credential: `${body}.${signature}`, serverPublicKey: createPublicKey(key).export({ format: 'jwk' }) };
}
export function verifyOperation(item: OutboxItem): DeviceCredential {
  operationSchema.parse(item);
  if (!item.credential || !item.signature) throw new Error('Unsigned operation. Prepare the device and retry its preserved queue.');
  const [body, signature, extra] = item.credential.split('.');
  if (extra || !body || !signature || !verify('sha256', Buffer.from(body), { key: createPublicKey(signingKey()), dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url'))) throw new Error('Invalid device credential.');
  const claims: DeviceCredential = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (claims.actorId !== item.actorId || claims.deviceId !== item.deviceId || claims.scope !== EVENT_SCOPE || item.scope !== EVENT_SCOPE || !OPERATOR_ROLES.includes(claims.role)) throw new Error('Operation identity does not match its device credential.');
  if (!Number.isFinite(claims.expiresAt) || item.timestamp > claims.expiresAt || Date.now() > claims.expiresAt + 30 * 86400000) throw new Error('Device authorization has expired. Export these records for review.');
  if (!verify('sha256', Buffer.from(signingData(item)), { key: createPublicKey({ key: claims.publicKey as import('node:crypto').JsonWebKey, format: 'jwk' }), dsaEncoding: 'ieee-p1363' }, Buffer.from(item.signature, 'base64url'))) throw new Error('Operation signature does not match its contents.');
  return claims;
}

export function signServerOperation(item: OutboxItem, actorId: string, role: string): OutboxItem {
  const key = signingKey();
  const publicKey = createPublicKey(key).export({ format: 'jwk' });
  const deviceId = '00000000-0000-4000-8000-000000000001';
  const claims = { actorId, role, deviceId, publicKey, scope: EVENT_SCOPE, expiresAt: Date.now() + 7 * 86400000 };
  const { credential } = issueCredential(claims);
  const signed = { ...item, actorId, deviceId, scope: EVENT_SCOPE, credential };
  return { ...signed, signature: sign('sha256', Buffer.from(signingData(signed)), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url') };
}

export async function applyOperation(item: OutboxItem, actorId: string) {
  // Delivery state is local to a browser and must never be part of a server receipt.
  const operation = { ...JSON.parse(signingData(item)), credential: item.credential, signature: item.signature };
  const { data, error } = await adminClient().rpc('apply_offline_operation', { p_item: operation, p_actor: actorId });
  if (error) return { error: error.message, retryable: !['22023', '23505', '23502', '22P02', '42501'].includes(error.code) };
  return { data };
}
