import { NextResponse } from 'next/server';
import { adminClient, requireOperator } from '@/lib/offline/server';
import { EVENT_SCOPE } from '@/web_offline_p2p_sync/core/protocol';
import { errorMessage } from '@/web_offline_p2p_sync/core/errors';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    await requireOperator();
    const after = new URL(request.url).searchParams.get('after') || '0';
    if (!/^\d{1,18}$/.test(after)) return NextResponse.json({ error: 'Invalid change cursor' }, { status: 400 });
    const { data, error } = await adminClient().from('offline_receipts').select('sequence,operation').eq('scope', EVENT_SCOPE).gt('sequence', after).order('sequence').limit(200);
    if (error) throw error;
    return NextResponse.json({ items: (data || []).map(row => row.operation), cursor: data?.length ? String(data[data.length - 1].sequence) : after, hasMore: data?.length === 200 }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error: unknown) {
    const message=errorMessage(error);
    return NextResponse.json({ error: message }, { status: message === 'AUTH_REQUIRED' ? 401 : message === 'OPERATOR_ROLE_REQUIRED' ? 403 : 503 });
  }
}
