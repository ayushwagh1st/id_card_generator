import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OutboxItem } from '@/web_offline_p2p_sync/core/OfflineStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const batch: OutboxItem[] = body.batch || body.items || [];

    if (!Array.isArray(batch) || batch.length === 0) {
      return NextResponse.json({ successIds: [], failedIds: [] });
    }

    const supabase = await createClient();
    const successIds: string[] = [];
    const failedIds: Array<{ id: string; error: string }> = [];

    for (const item of batch) {
      try {
        const { id, entity, action, payload } = item;

        if (!entity || !action) {
          failedIds.push({ id, error: 'Invalid outbox item structure' });
          continue;
        }

        let error: any = null;

        if (entity === 'children') {
          if (action === 'CREATE') {
            const { error: insertErr } = await supabase.from('children').upsert(payload, { onConflict: 'qr_id' });
            error = insertErr;
          } else if (action === 'UPDATE') {
            const targetId = payload.id;
            if (targetId) {
              const { error: updateErr } = await supabase.from('children').update(payload).eq('id', targetId);
              error = updateErr;
            } else if (payload.qr_id) {
              const { error: updateErr } = await supabase.from('children').update(payload).eq('qr_id', payload.qr_id);
              error = updateErr;
            }
          } else if (action === 'DELETE') {
            const { error: deleteErr } = await supabase.from('children').delete().eq('id', payload.id);
            error = deleteErr;
          }
        } else if (entity === 'attendance') {
          if (action === 'CREATE') {
            const { error: insertErr } = await supabase.from('attendance').insert(payload);
            error = insertErr;
          } else if (action === 'UPDATE') {
            const { error: updateErr } = await supabase.from('attendance').update(payload).eq('id', payload.id);
            error = updateErr;
          }
        } else if (entity === 'volunteers') {
          if (action === 'CREATE') {
            const { error: insertErr } = await supabase.from('volunteers').upsert(payload, { onConflict: 'snk_id' });
            error = insertErr;
          } else if (action === 'UPDATE') {
            const { error: updateErr } = await supabase.from('volunteers').update(payload).eq('id', payload.id);
            error = updateErr;
          } else if (action === 'DELETE') {
            const { error: deleteErr } = await supabase.from('volunteers').delete().eq('id', payload.id);
            error = deleteErr;
          }
        } else {
          // Generic fallback for any other table entity
          if (action === 'CREATE') {
            const { error: insertErr } = await supabase.from(entity).insert(payload);
            error = insertErr;
          } else if (action === 'UPDATE' && payload.id) {
            const { error: updateErr } = await supabase.from(entity).update(payload).eq('id', payload.id);
            error = updateErr;
          } else if (action === 'DELETE' && payload.id) {
            const { error: deleteErr } = await supabase.from(entity).delete().eq('id', payload.id);
            error = deleteErr;
          }
        }

        if (error) {
          console.error(`[Sync API] Error processing item ${id} (${entity}:${action}):`, error);
          failedIds.push({ id, error: error.message || 'Database mutation failed' });
        } else {
          successIds.push(id);
        }
      } catch (err: any) {
        console.error(`[Sync API] Exception processing item ${item.id}:`, err);
        failedIds.push({ id: item.id, error: err.message || 'Unknown processing error' });
      }
    }

    return NextResponse.json({ successIds, failedIds });
  } catch (error: any) {
    console.error('[Sync API] Batch request exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
