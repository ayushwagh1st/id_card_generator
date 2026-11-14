import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient, applyOperation, OPERATOR_ROLES, requireOperator, verifyOperation } from '@/lib/offline/server';
import { operationSchema } from '@/web_offline_p2p_sync/core/protocol';
import type { OutboxItem } from '@/web_offline_p2p_sync/core/OfflineStore';
import { errorMessage } from '@/web_offline_p2p_sync/core/errors';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    await requireOperator();
    if (Number(request.headers.get('content-length') || 0) > 256000) return NextResponse.json({ error: 'Batch exceeds 256 KB' }, { status: 413 });
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 256000) return NextResponse.json({ error: 'Batch exceeds 256 KB' }, { status: 413 });
    const { batch } = z.object({ batch: z.array(z.unknown()).min(1).max(20) }).parse(JSON.parse(raw));
    const successIds: string[] = [];
    const failedIds: Array<{ id: string; error: string; retryable: boolean }> = [];
    const actors = new Map<string, boolean>();
    for (const rawItem of batch) {
      const candidate = rawItem as Record<string, unknown>;
      const id = typeof candidate?.id === 'string' ? candidate.id : 'invalid';
      try {
        const parsed = operationSchema.parse(candidate);
        const item = parsed as OutboxItem;
        const claims = verifyOperation(item);
        if (!actors.has(claims.actorId)) {
          const { data, error } = await adminClient().auth.admin.getUserById(claims.actorId);
          if (error) throw new Error('Could not verify the original operator. Retry when authentication is available.');
          actors.set(claims.actorId, !!data.user && (!data.user.banned_until || Date.parse(data.user.banned_until) <= Date.now()) && OPERATOR_ROLES.includes(data.user.app_metadata?.role));
        }
        if (!actors.get(claims.actorId)) {
          failedIds.push({ id, error: 'The original operator is no longer authorized.', retryable: false });
          continue;
        }
        const result = await applyOperation(item, claims.actorId);
        if (result.error) failedIds.push({ id, error: result.error, retryable: result.retryable });
        else successIds.push(id);
      } catch (error: unknown) {
        const message=errorMessage(error);
        failedIds.push({ id, error: error instanceof z.ZodError ? 'Invalid operation data. Export this record for review.' : message, retryable: !(error instanceof z.ZodError) && message.includes('Retry when') });
      }
    }
    return NextResponse.json({ successIds, failedIds }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const message=errorMessage(error);
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'OPERATOR_ROLE_REQUIRED' ? 403 : 400;
    return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
