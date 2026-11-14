// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

let db: PGlite;
const actor = '00000000-0000-4000-8000-000000000001';
const sessionId = '00000000-0000-4000-8000-000000000002';
const childId = '00000000-0000-4000-8000-000000000003';
const qrId = '00000000-0000-4000-8000-000000000004';
const volunteerId = '00000000-0000-4000-8000-000000000005';
const base = `
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'SELECT ''{}''::jsonb';
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
CREATE TABLE public.profiles(id uuid PRIMARY KEY, role text);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow write profiles" ON public.profiles FOR ALL USING(true) WITH CHECK(true);
CREATE TABLE public.lecturers(id uuid PRIMARY KEY);
CREATE TABLE public.sessions(id uuid PRIMARY KEY, name text, date date, start_time time, end_time time);
CREATE TABLE public.volunteers(id text PRIMARY KEY, snk_id text UNIQUE, full_name text);
CREATE TABLE public.volunteer_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), volunteer_id text REFERENCES public.volunteers(id), session_id uuid REFERENCES public.sessions(id));
CREATE TABLE public.qr_codes(id uuid PRIMARY KEY, serial_number integer);
CREATE TABLE public.children(id uuid PRIMARY KEY, qr_id uuid UNIQUE NOT NULL, name text NOT NULL, contact_number text, session_id uuid REFERENCES public.sessions(id), created_at timestamptz DEFAULT now());
CREATE TABLE public.attendance(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), volunteer_id text REFERENCES public.volunteers(id), session_id uuid REFERENCES public.sessions(id), lecturer_id uuid REFERENCES public.lecturers(id), attendance_status text, check_in_time timestamptz, check_out_time timestamptz, attendance_date date, created_at timestamptz DEFAULT now(), UNIQUE(volunteer_id,session_id,attendance_date));
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on children" ON public.children FOR ALL TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY "Legacy role" ON public.sessions FOR SELECT TO authenticated USING((auth.jwt()->'user_metadata'->>'role') = 'LECTURER');
`;
beforeAll(async () => {
  db = new PGlite(); await db.exec(base);
  await db.exec(readFileSync('supabase/migrations/20261114095408_reliable_offline_sync.sql', 'utf8'));
}, 60000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec('TRUNCATE offline_receipts,attendance,volunteer_sessions,children,qr_codes,volunteers,sessions,lecturers RESTART IDENTITY CASCADE');
  await db.query('INSERT INTO sessions(id,name,date,start_time,end_time) VALUES($1,\'Morning\',\'2026-11-14\',\'09:00\',\'18:00\')', [sessionId]);
  await db.query('INSERT INTO qr_codes(id,serial_number) VALUES($1,1)', [qrId]);
  await db.query('INSERT INTO volunteers(id,snk_id,full_name) VALUES($1,\'SNK-1\',\'Volunteer\')', [volunteerId]);
  await db.query('INSERT INTO volunteer_sessions(volunteer_id,session_id) VALUES($1,$2)', [volunteerId, sessionId]);
});
const create = (id = 'create'): any => ({ id, scope: 'test-event', entity: 'children', action: 'CREATE', timestamp: 1, payload: { id: childId, qr_id: qrId, name: 'Child', contact_number: '1234567890', session_id: sessionId, serial_number: 'display-only' } });
const update = (mode: 'check-in' | 'check-out', timestamp: string, id = mode): any => ({ id, scope: 'test-event', entity: 'children', action: 'UPDATE', timestamp: 2, payload: { id: childId, status: mode === 'check-in' ? 'Checked In' : 'Checked Out', [mode === 'check-in' ? 'checked_in_at' : 'checked_out_at']: timestamp } });
const scan = (mode = 'check-in', timestamp = '2026-11-14T03:30:00Z', scanData = 'SNK-1', id = mode): any => ({ id, scope: 'test-event', entity: 'attendance_scans', action: 'CREATE', timestamp: 3, payload: { mode, timestamp, scanData, sessionId } });
const apply = async (item: any) => (await db.query<{ result: any }>('SELECT public.apply_offline_operation($1::jsonb,$2::uuid) AS result', [JSON.stringify(item),actor])).rows[0].result;
const rows = async (table: string) => (await db.query<any>(`SELECT * FROM ${table}`)).rows;

describe('transactional offline database processor', () => {
  it('applies a registration and one durable receipt', async () => { await apply(create()); expect(await rows('children')).toHaveLength(1); expect(await rows('offline_receipts')).toHaveLength(1); });
  it('replays the same operation without resetting newer attendance', async () => {
    await apply(create()); await apply(update('check-out', '2026-11-14T10:00:00Z')); expect((await apply(create())).duplicate).toBe(true);
    expect((await rows('children'))[0].status).toBe('Checked Out'); expect(await rows('offline_receipts')).toHaveLength(2);
  });
  it('does not reset attendance when an old CREATE arrives under another operation ID', async () => {
    await apply(create()); await apply(update('check-in', '2026-11-14T08:00:00Z')); await apply(create('replicated-create'));
    expect((await rows('children'))[0].status).toBe('Checked In');
  });
  it('rejects reused operation IDs with changed contents', async () => {
    await apply(create()); await expect(apply({ ...create(), payload: { ...create().payload, name: 'Different' } })).rejects.toThrow('different content');
    expect((await rows('children'))[0].name).toBe('Child');
  });
  it('keeps conflicting QR assignments for review rather than overwriting a child', async () => {
    await apply(create()); await expect(apply({ ...create('conflict'), payload: { ...create().payload, id: crypto.randomUUID(), name: 'Other child' } })).rejects.toThrow('already assigned');
    expect(await rows('children')).toHaveLength(1); expect(await rows('offline_receipts')).toHaveLength(1);
  });
  it('never acknowledges a nonexistent update target', async () => { await expect(apply(update('check-in', '2026-11-14T08:00:00Z'))).rejects.toThrow('not arrived'); expect(await rows('offline_receipts')).toHaveLength(0); });
  it('rejects unsupported actions', async () => { await expect(apply({ ...create(), action: 'DELETE' })).rejects.toThrow('Unsupported'); expect(await rows('offline_receipts')).toHaveLength(0); });
  it('replays child QR scans through the same processor as volunteer scans', async () => {
    await apply(create()); const result = await apply(scan('check-in', '2026-11-14T08:00:00Z', qrId));
    expect(result.kind).toBe('child'); expect((await rows('children'))[0].status).toBe('Checked In'); expect(await rows('attendance')).toHaveLength(0);
  });
  it('resolves volunteers by SNK ID and UUID', async () => {
    await apply(scan()); await apply(scan('check-out', '2026-11-14T06:00:00Z', volunteerId));
    expect(await rows('attendance')).toHaveLength(1); expect((await rows('attendance'))[0].check_out_time).toBeTruthy();
  });
  it('uses the earliest check-in across devices without duplicate attendance', async () => {
    await apply(scan('check-in', '2026-11-14T04:00:00Z', 'SNK-1', 'late')); await apply(scan('check-in', '2026-11-14T03:30:00Z', 'SNK-1', 'earlier'));
    const records = await rows('attendance'); expect(records).toHaveLength(1); expect(records[0].attendance_status).toBe('Present'); expect(new Date(records[0].check_in_time).toISOString()).toBe('2026-11-14T03:30:00.000Z');
  });
  it('defers checkout until check-in arrives and then accepts the same operation', async () => {
    const checkout = scan('check-out', '2026-11-14T06:00:00Z'); await expect(apply(checkout)).rejects.toThrow('not arrived');
    await apply(scan()); await apply(checkout); expect(await rows('offline_receipts')).toHaveLength(2);
  });
  it('uses the India event date for scans before 05:30 local time', async () => {
    await db.query('UPDATE sessions SET start_time=\'00:00\' WHERE id=$1',[sessionId]); await apply(scan('check-in','2026-11-13T19:00:00Z'));
    expect(new Date((await rows('attendance'))[0].attendance_date).toISOString().slice(0,10)).toBe('2026-11-14');
  });
  it('computes late status against India session time with the 15 minute grace period', async () => {
    await apply(scan('check-in','2026-11-14T03:46:00Z')); expect((await rows('attendance'))[0].attendance_status).toBe('Late');
  });
  it('rejects scans for the wrong event date', async () => { await expect(apply(scan('check-in','2026-11-13T08:00:00Z'))).rejects.toThrow('differs'); });
  it('keeps overnight checkout on the original session service date',async()=>{
    await db.query("UPDATE sessions SET date='2026-11-13',start_time='22:00',end_time='02:00' WHERE id=$1",[sessionId]);
    await apply(scan('check-in','2026-11-13T16:30:00Z'));await apply(scan('check-out','2026-11-13T19:00:00Z'));
    const record=(await rows('attendance'))[0];expect(new Date(record.attendance_date).toISOString().slice(0,10)).toBe('2026-11-13');expect(record.check_out_time).toBeTruthy();
  });
  it('rejects unenrolled volunteers', async () => { await db.exec('TRUNCATE volunteer_sessions'); await expect(apply(scan())).rejects.toThrow('not enrolled'); });
  it('does not regress a child status when older check-in arrives after checkout', async () => {
    await apply(create()); await apply(update('check-out','2026-11-14T10:00:00Z')); await apply(update('check-in','2026-11-14T08:00:00Z'));
    expect((await rows('children'))[0].status).toBe('Checked Out');
  });
  it('retains a later child check-in after an earlier checkout', async () => {
    await apply(create()); await apply(update('check-in','2026-11-14T10:00:00Z')); await apply(update('check-out','2026-11-14T08:00:00Z'));
    expect((await rows('children'))[0].status).toBe('Checked In');
  });
  it('rejects checkouts before the recorded check-in', async () => { await apply(scan()); await expect(apply(scan('check-out','2026-11-14T03:00:00Z'))).rejects.toThrow('precedes'); });
  it('rolls back mutation and receipt together on database constraint failure', async () => {
    const invalid = create(); invalid.payload.session_id = crypto.randomUUID(); await expect(apply(invalid)).rejects.toThrow(); expect(await rows('children')).toHaveLength(0); expect(await rows('offline_receipts')).toHaveLength(0);
  });
  it('does not grant the privileged RPC to anonymous or authenticated clients', async () => {
    const result = await db.query<any>("SELECT has_function_privilege('anon','public.apply_offline_operation(jsonb,uuid)','execute') AS anon,has_function_privilege('authenticated','public.apply_offline_operation(jsonb,uuid)','execute') AS authenticated,has_function_privilege('service_role','public.apply_offline_operation(jsonb,uuid)','execute') AS service");
    expect(result.rows[0]).toEqual({ anon: false, authenticated: false, service: true });
  });
  it('replaces user-editable role claims in existing policies', async () => {
    const policies = await db.query<any>("SELECT qual,with_check FROM pg_policies WHERE schemaname='public'");
    expect(JSON.stringify(policies.rows)).not.toContain('user_metadata'); expect(JSON.stringify(policies.rows)).toContain('app_metadata');
  });
  it('removes unrestricted public profile access', async () => {
    const policies=await db.query<any>("SELECT roles,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='profiles'");
    expect(policies.rows).toHaveLength(2); expect(policies.rows.every(row=>row.roles.includes('authenticated'))).toBe(true);
    expect(policies.rows.some(row=>row.qual==='true' || row.with_check==='true')).toBe(false);
  });
  it('validates the rollback-only production smoke script without leaving fixtures',async()=>{
    await db.exec('ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS mobile_number text; GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role; GRANT USAGE ON SCHEMA public TO service_role');
    const results=await db.exec(readFileSync('scripts/offline-production-smoke.sql','utf8'));
    expect((results[results.length-1].rows[0] as {result:unknown}).result).toEqual({smoke_assertions:'passed',remaining_test_children:0,remaining_test_volunteers:0,remaining_test_sessions:0,remaining_test_receipts:0});
  });
});
