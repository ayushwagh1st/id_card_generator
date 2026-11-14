// @vitest-environment node
import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
let db:PGlite;
const staff='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT (auth.jwt()->>'sub')::uuid$$;
    GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
    CREATE TABLE lecturers(id uuid PRIMARY KEY,name text,password text);
    CREATE TABLE sessions(id uuid PRIMARY KEY,name text);
    CREATE TABLE volunteer_sessions(id uuid PRIMARY KEY,volunteer_id text,session_id uuid);
    CREATE TABLE attendance(id uuid PRIMARY KEY,volunteer_id text,session_id uuid,check_out_time timestamptz);
    CREATE VIEW attendance_stats AS SELECT session_id,count(*) FROM attendance GROUP BY session_id;
    GRANT ALL ON lecturers,sessions,volunteer_sessions,attendance,attendance_stats TO PUBLIC,authenticated;
    INSERT INTO lecturers VALUES('${staff}','Staff','private'),('${other}','Other','private');
    INSERT INTO sessions VALUES('${staff}','Gate duty');
    INSERT INTO volunteer_sessions VALUES('${staff}','v1','${staff}');
    INSERT INTO attendance(id,volunteer_id,session_id) VALUES('${staff}','v1','${staff}');`);
  await db.exec(readFileSync('supabase/migrations/20261114124007_restrict_event_table_access.sql','utf8'));
},30000);
afterEach(async()=>{await db.exec('RESET ROLE;RESET request.jwt.claims');});
afterAll(async()=>db?.close());
async function login(role:string,trusted=true){await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:staff,[trusted?'app_metadata':'user_metadata']:{role}})]);await db.exec('SET ROLE authenticated');}
describe('event table access policies',()=>{
  it.each(['lecturers','sessions','volunteer_sessions','attendance'])('denies anonymous reads and writes on %s',async table=>{
    const privileges=await db.query<{read:boolean;write:boolean}>("SELECT has_table_privilege('anon',$1,'SELECT') AS read,has_table_privilege('anon',$1,'INSERT,UPDATE,DELETE') AS write",[table]);
    expect(privileges.rows[0]).toEqual({read:false,write:false});await db.exec('SET ROLE anon');await expect(db.query(`SELECT * FROM ${table}`)).rejects.toThrow('permission denied');
  });
  it.each(['SUPER_ADMIN','MODEL_HEAD','LECTURER'])('allows %s to read operational sessions and enrollment',async role=>{
    await login(role);expect((await db.query('SELECT * FROM sessions')).rows).toHaveLength(1);expect((await db.query('SELECT * FROM volunteer_sessions')).rows).toHaveLength(1);
  });
  it.each(['lecturers','sessions','volunteer_sessions','attendance'])('revokes authenticated TRUNCATE privileges on %s',async table=>{
    expect((await db.query<{allowed:boolean}>("SELECT has_table_privilege('authenticated',$1,'TRUNCATE') AS allowed",[table])).rows[0].allowed).toBe(false);
    await login('LECTURER');await expect(db.exec(`TRUNCATE ${table}`)).rejects.toThrow('permission denied');
  });
  it('allows administrators to manage sessions and enrollments',async()=>{
    await login('SUPER_ADMIN');await db.query('INSERT INTO sessions VALUES($1,$2)',[other,'Added']);expect((await db.query('DELETE FROM sessions WHERE id=$1 RETURNING id',[other])).rows).toHaveLength(1);
    await db.query('INSERT INTO volunteer_sessions VALUES($1,$2,$3)',[other,'v2',staff]);expect((await db.query('DELETE FROM volunteer_sessions WHERE id=$1 RETURNING id',[other])).rows).toHaveLength(1);
  });
  it('blocks staff session and enrollment writes',async()=>{
    await login('LECTURER');await expect(db.query('INSERT INTO sessions VALUES($1,$2)',[other,'Denied'])).rejects.toThrow('row-level security');
    await expect(db.query('INSERT INTO volunteer_sessions VALUES($1,$2,$3)',[other,'v2',staff])).rejects.toThrow('row-level security');
  });
  it('allows an operator to update attendance for existing bulk checkout',async()=>{
    await login('LECTURER');expect((await db.query('UPDATE attendance SET check_out_time=now() WHERE id=$1 RETURNING id',[staff])).rows).toHaveLength(1);
    await db.exec('RESET ROLE');await db.query('UPDATE attendance SET check_out_time=NULL WHERE id=$1',[staff]);
  });
  it('shows lecturers only their own account record',async()=>{await login('LECTURER');expect((await db.query('SELECT id FROM lecturers')).rows).toEqual([{id:staff}]);});
  it('allows administrators to see all lecturer accounts',async()=>{await login('SUPER_ADMIN');expect((await db.query('SELECT id FROM lecturers')).rows).toHaveLength(2);});
  it('does not expose lecturer account details to model heads',async()=>{await login('MODEL_HEAD');expect((await db.query('SELECT id FROM lecturers')).rows).toHaveLength(0);});
  it('rejects an untrusted editable role claim',async()=>{
    await login('SUPER_ADMIN',false);expect((await db.query('SELECT * FROM sessions')).rows).toHaveLength(0);
    await expect(db.query('INSERT INTO attendance(id) VALUES($1)',[other])).rejects.toThrow('row-level security');
  });
  it('denies anonymous attendance statistics and uses invoker security',async()=>{
    const options=await db.query<{reloptions:string[]}>('SELECT reloptions FROM pg_class WHERE oid=\'attendance_stats\'::regclass');expect(options.rows[0].reloptions).toContain('security_invoker=true');
    await db.exec('SET ROLE anon');await expect(db.query('SELECT * FROM attendance_stats')).rejects.toThrow('permission denied');
  });
  it('keeps the service-role sync processor able to write operational records',async()=>{
    await db.exec('SET ROLE service_role');expect((await db.query('SELECT * FROM lecturers')).rows).toHaveLength(2);await db.query('INSERT INTO attendance(id) VALUES($1)',[other]);await db.query('DELETE FROM attendance WHERE id=$1',[other]);
  });
});
