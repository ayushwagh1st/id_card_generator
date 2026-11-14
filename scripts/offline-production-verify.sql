SELECT jsonb_build_object(
  'roles',(SELECT jsonb_object_agg(role,n) FROM (SELECT raw_app_meta_data->>'role' role,count(*) n FROM auth.users GROUP BY raw_app_meta_data->>'role') r),
  'receipt_rls',(SELECT relrowsecurity FROM pg_class WHERE oid='public.offline_receipts'::regclass),
  'processor_security_definer',(SELECT prosecdef FROM pg_proc WHERE oid='public.apply_offline_operation(jsonb,uuid)'::regprocedure),
  'anon_execute',has_function_privilege('anon','public.apply_offline_operation(jsonb,uuid)','execute'),
  'authenticated_execute',has_function_privilege('authenticated','public.apply_offline_operation(jsonb,uuid)','execute'),
  'service_execute',has_function_privilege('service_role','public.apply_offline_operation(jsonb,uuid)','execute'),
  'editable_role_policies',(SELECT count(*) FROM pg_policies WHERE schemaname='public' AND (qual LIKE '%user_metadata%' OR with_check LIKE '%user_metadata%')),
  'unrestricted_profile_policies',(SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND ('public'=ANY(roles) OR qual='true' OR with_check='true')),
  'test_children',(SELECT count(*) FROM public.children WHERE name='__OFFLINE_SMOKE_TEST__'),
  'test_volunteers',(SELECT count(*) FROM public.volunteers WHERE full_name='__OFFLINE_SMOKE_TEST__'),
  'test_sessions',(SELECT count(*) FROM public.sessions WHERE name='__OFFLINE_SMOKE_TEST__'),
  'test_receipts',(SELECT count(*) FROM public.offline_receipts WHERE scope LIKE '__offline_smoke__:%')
) AS verification;
