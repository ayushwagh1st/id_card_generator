import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient, requireOperator, issueCredential } from '@/lib/offline/server';
import { EVENT_SCOPE } from '@/web_offline_p2p_sync/core/protocol';
import { errorMessage } from '@/web_offline_p2p_sync/core/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function allRows(table: string, columns: string) {
  const client = adminClient();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; from < 100000; from += 1000) {
    const { data, error } = await client.from(table).select(columns).order('id').range(from, from + 999);
    if (error) throw new Error(`Cannot prepare ${table}: ${error.message}`);
    const records: unknown[] = data || [];
    for (const record of records) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error(`Invalid ${table} preparation data.`);
      rows.push(record as Record<string, unknown>);
    }
    if (!data || data.length < 1000) return rows;
  }
  throw new Error(`${table} exceeds the preparation limit. No partial snapshot was saved.`);
}

export async function POST(request: Request) {
  try {
    const user = await requireOperator();
    const body = z.object({ deviceId: z.uuid(), publicKey: z.object({ kty: z.literal('EC'), crv: z.literal('P-256'), x: z.string().length(43), y: z.string().length(43) }) }).parse(await request.json());
    const client = adminClient();
    const { error } = await client.from('offline_receipts').select('sequence').limit(0);
    if (error) throw new Error('Offline database migration is not installed. Ask the administrator to apply the tested migration.');
    const [sessions, children, volunteers, enrollments, qrCodes] = await Promise.all([
      allRows('sessions', '*'), allRows('children', '*'), allRows('volunteers', 'id,full_name,snk_id,model_id,status'), allRows('volunteer_sessions', '*'), allRows('qr_codes', 'id,serial_number'),
    ]);
    const preparedAt = Date.now();
    const certificate = issueCredential({ actorId: user.id, role: user.app_metadata.role, deviceId: body.deviceId, publicKey: body.publicKey, scope: EVENT_SCOPE, expiresAt: preparedAt + 7 * 86400000 });
    return NextResponse.json({ ...certificate, snapshot: { sessions, children, volunteers, enrollments, qrCodes, preparedAt }, serverTime: preparedAt, expiresAt: preparedAt + 7 * 86400000 }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error: unknown) {
    const message=errorMessage(error);
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'OPERATOR_ROLE_REQUIRED' ? 403 : error instanceof z.ZodError ? 400 : 503;
    return NextResponse.json({ error: message === 'OPERATOR_ROLE_REQUIRED' ? 'This account needs a server-controlled operator role before offline preparation.' : message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
