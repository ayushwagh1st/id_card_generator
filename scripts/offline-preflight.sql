SELECT jsonb_build_object(
  'users', (SELECT count(*) FROM auth.users),
  'trusted_roles', (SELECT count(*) FROM auth.users WHERE raw_app_meta_data->>'role' IN ('SUPER_ADMIN','MODEL_HEAD','LECTURER')),
  'profile_roles', (SELECT jsonb_object_agg(role, n) FROM (SELECT role,count(*) n FROM public.profiles GROUP BY role) counts),
  'missing_operator_profiles', (SELECT count(*) FROM auth.users u LEFT JOIN public.profiles p ON p.id=u.id WHERE p.id IS NULL AND u.raw_user_meta_data->>'role' IN ('SUPER_ADMIN','MODEL_HEAD','LECTURER')),
  'conflicting_roles', (SELECT count(*) FROM auth.users u JOIN public.profiles p ON p.id=u.id WHERE p.role IS DISTINCT FROM u.raw_user_meta_data->>'role' AND u.raw_user_meta_data->>'role' IS NOT NULL)
) AS readiness;
SELECT policyname,cmd,qual,with_check FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='profiles';
