SELECT jsonb_build_object('tables',(SELECT jsonb_agg(to_jsonb(access)) FROM (
SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,
  has_table_privilege('anon',c.oid,'SELECT') AS anon_read,
  has_table_privilege('anon',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') AS anon_write,
  has_table_privilege('authenticated',c.oid,'TRUNCATE') AS authenticated_truncate,
  has_table_privilege('service_role',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS service_access
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('lecturers','sessions','volunteer_sessions','attendance')
ORDER BY c.relname) access),'view',(SELECT to_jsonb(access) FROM (

SELECT relname,reloptions,has_table_privilege('anon',oid,'SELECT') AS anon_read,
  has_table_privilege('authenticated',oid,'SELECT') AS authenticated_read
FROM pg_catalog.pg_class WHERE oid='public.attendance_stats'::regclass) access),
'policies',(SELECT jsonb_agg(to_jsonb(access)) FROM (

SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_catalog.pg_policies
WHERE schemaname='public' AND tablename IN ('lecturers','sessions','volunteer_sessions','attendance')
ORDER BY tablename,policyname) access)) AS verification;
