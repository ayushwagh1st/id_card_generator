# Production database verification

Verified on 14 November 2026 against the connected `volunteer-system` production project.

## Applied and verified

The owner approved `supabase/migrations/20261114095408_reliable_offline_sync.sql` and `scripts/offline-role-migration.sql`. Both were executed together in one transaction. Operational records were preserved, with the six existing operator assignments copied into server-controlled application metadata: two administrators, three model heads, and one lecturer.

Live verification confirmed:

- Durable receipt table has row-level security enabled.
- `apply_offline_operation(jsonb,uuid)` uses invoker security and an empty search path. Only the service role can execute it; anonymous and ordinary authenticated callers cannot.
- The Auth admin endpoint returns the migrated trusted administrator role. Existing operators must sign in again for refreshed JWT claims.
- No profile policies remain unrestricted, and no inspected policies use editable user metadata for authority.
- Anonymous REST execution of the processor returns permission denied. A malformed operation sent with the server credential is rejected without writing records.

`scripts/offline-production-smoke.sql` ran against the real processor under `service_role`, inside a transaction that ended with `ROLLBACK`. Assertions covered registration, duplicate replay after checkout, child QR resolution, checkout arriving before check-in, eventual volunteer check-in/checkout, altered operation identity rejection, five successful receipts, and Asia/Kolkata service dates. The final query confirmed zero remaining test children, receipts, sessions, or volunteers. No production attendee was used as a test subject.

Raw local evidence is in the ignored `verification-results/production-database.json`, `production-api.json`, and `production-smoke.json`. Verification scripts contain no embedded credentials.

## Approved access-policy follow-up applied

The subsequent security-advisor scan found five existing errors and nine warnings outside the approved migration. Live metadata inspection confirmed that `lecturers`, `sessions`, `volunteer_sessions`, and `attendance` have RLS disabled and anonymous read/write grants. The `attendance_stats` view uses its owner's privileges.

The owner separately approved `supabase/migrations/20261114124007_restrict_event_table_access.sql`. **It has been applied to production and verified.** Its effects are:

| Object | Administrator | Model head | Lecturer | Anonymous |
|---|---|---|---|---|
| Lecturer account rows | Manage all | No access | Read own row | No access |
| Sessions and enrollment | Manage | Read | Read | No access |
| Attendance | Manage | Manage | Manage | No access |
| Attendance statistics | Read through caller's policies | Same | Same | No access |

All grants to `PUBLIC`, `anon`, and `authenticated` on these objects are removed before the necessary privileges are restored. Ordinary authenticated roles receive no `TRUNCATE` privilege, since truncation bypasses row policies. The service role retains processor access. Existing policies on the four tables are replaced by policies using trusted application roles. The view switches to invoker security. The migration deletes no operational records and changes no account assignments.

The local PostgreSQL tests execute this exact migration and cover each role, anonymous denial, forged editable role claims, administrator maintenance, attendance checkout, view configuration, service writes, and denial of truncation. Separate action tests verify that a non-administrator cannot change a lecturer's Auth password before authorization is checked.

After this migration, the live advisor scan reports **zero errors and nine warnings**. The production processor smoke test passed again after the access changes and rolled back all fixtures. `scripts/offline-event-access-verify.sql` confirmed RLS on all four tables, no anonymous table privileges, no authenticated truncation, retained service access, and invoker security on the view; results are saved in `verification-results/production-event-access.json`. Actual anonymous REST requests to all five objects returned HTTP 401 with permission-denied code `42501`, without fetching attendee rows (`verification-results/production-event-api.json`).

## Other advisor warnings

The nine warnings are four mutable function search paths (`set_volunteer_id`, `handle_new_user`, `assign_snk_id`, `verify_volunteer`), anonymous/authenticated execution grants on two legacy definer functions (`handle_new_user`, `verify_volunteer`), and disabled leaked-password protection. They remain outside this follow-up. Public verification RPC behavior and Auth settings require their own compatibility review before changing them.

The original advisor findings and privilege inspection are saved locally as `verification-results/production-advisors.json` and `existing-table-access.json`. The post-fix advisor report is `verification-results/production-advisors-after.json`.

## Release and event readiness

The updated application has not been pushed or published by this task. Deploy a complete production build, sign operators in again, and prepare each assigned device using `docs/OFFLINE_OPERATIONS.md`. Desktop and rollback-only production tests cannot establish phone camera compatibility, venue Wi-Fi routing, TLS/DNS, radio coverage, storage retention, or power endurance. Rehearse on the actual event phones and network before relying on this system at the gates.
