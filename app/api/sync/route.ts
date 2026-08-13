import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OutboxItem } from '@/web_offline_p2p_sync/core/OfflineStore';

// Helper for Last-Write-Wins (LWW) Conflict Resolution
async function performLwwUpdate(supabase: any, table: string, payload: any, matchColumn: string, matchValue: any) {
  const { data: existing, error: fetchErr } = await supabase.from(table).select('updated_at').eq(matchColumn, matchValue).single();
  if (!fetchErr && existing?.updated_at && payload.updated_at && new Date(payload.updated_at) < new Date(existing.updated_at)) {
    console.log(`[Sync API] Skipped older UPDATE for ${table} ${matchValue}`);
    return null; // Skip without error
  }
  const { error } = await supabase.from(table).update(payload).eq(matchColumn, matchValue);
  return error;
}

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
            const { error: insertErr } = await supabase.from('children').upsert(payload, { onConflict: 'id' });
            error = insertErr;
          } else if (action === 'UPDATE') {
            const targetId = payload.id;
            if (targetId) {
              error = await performLwwUpdate(supabase, 'children', payload, 'id', targetId);
            } else if (payload.qr_id) {
              error = await performLwwUpdate(supabase, 'children', payload, 'qr_id', payload.qr_id);
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
            error = await performLwwUpdate(supabase, 'attendance', payload, 'id', payload.id);
          }
        } else if (entity === 'volunteers') {
          if (action === 'CREATE') {
            const { error: insertErr } = await supabase.from('volunteers').upsert(payload, { onConflict: 'snk_id' });
            error = insertErr;
          } else if (action === 'UPDATE') {
            error = await performLwwUpdate(supabase, 'volunteers', payload, 'id', payload.id);
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
            error = await performLwwUpdate(supabase, entity, payload, 'id', payload.id);
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
