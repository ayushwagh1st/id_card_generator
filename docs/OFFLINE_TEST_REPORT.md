# Offline remediation and verification report

Date: 14 November 2026, Asia/Kolkata.

**Both approved database migrations have been applied to production and verified.** The six existing operator assignments were preserved in server-controlled roles. Production rollback-only tests passed and left no test records. Anonymous calls to the new processor and the five newly protected event objects are denied. The advisor check now reports zero errors and nine older warnings. The application release itself has not been published, and physical event-device/network rehearsal remains necessary. See `docs/PRODUCTION_DATABASE_VERIFICATION.md` for the live evidence and remaining warnings.

## Verification results

| Check | Result | Evidence |
|---|---|---|
| Complete repository unit/component/action/SQL suite | 182 passed, 0 failed, 26 files | `verification-results/unit-results.json` |
| Offline and event-access regressions included in that run | 102 passed, 0 failed, 8 files | `__tests__/offline/` |
| Production Chromium integration tests | 7 passed, 0 failed, 0 skipped, 0 flaky | `verification-results/browser-results.json` |
| Normal production build and isolated verification build | Both passed compilation, TypeScript, and prerendering | `npm run build`, `npm run build:offline-test`, `npm run test:browser` |
| Required offline assets | 97 production files packaged; build-specific manifest matches the operator page | Generated `.next/static/<build-id>/offline-assets.json` |
| Standalone strict TypeScript check | Passed | `node node_modules/typescript/bin/tsc --noEmit --incremental false` |
| New offline core, provider, APIs, and operator page lint | Passed with no errors | Targeted ESLint command below |
| Original working-tree whitespace check | No whitespace errors reported | `git diff --check`; Git emitted line-ending notices |
| Hosted schema and role inspection | Passed | Six trusted roles verified: 2 admins, 3 model heads, 1 lecturer |
| Hosted migration, live RPC smoke test, and processor authorization verification | Passed | `scripts/offline-production-smoke.sql`, `verification-results/production-database.json`, `verification-results/production-api.json` |
| Production event-table/view access verification | Passed; RLS enabled, anonymous REST reads denied on all five objects, authenticated truncation denied | `verification-results/production-event-access.json`, `production-event-api.json` |
| Broader production security advisors | 0 errors; 9 older warnings remain | `verification-results/production-advisors-after.json`; details in the production verification report |
| Actual event phones, camera scanning, venue Wi-Fi, and router TLS/DNS/power rehearsal | Not performed | Requires the physical event environment |

The full Chromium run finished with all seven cases passing. Its last 1,000-operation test saved the backlog in about **1.53 seconds** on the development machine, retained all 1,000 operations after storage restart, uploaded 1,000 unique IDs, and left zero outstanding items. This is a measured desktop result, not a promised phone throughput or network capacity.

The focused offline test groups cover:

| Area | Cases |
|---|---:|
| Actual transactional SQL processor in isolated PostgreSQL/PGlite, including production smoke script validation | 24 |
| Event-table RLS, role matrix, view security, anonymous denial, and truncation denial | 20 |
| IndexedDB persistence, isolation, projections, migration, and abort handling | 16 |
| Upload concurrency, partial acknowledgments, retries, and imports | 9 |
| Device certificates/signatures, tampering, backup verification, shared device enrollment | 12 |
| Upload API authentication, validation, limits, and per-record responses | 8 |
| Reachability, captive portals, database failures, timeouts, and probe coalescing | 6 |
| Persistent local WebSocket relay authorization, deduplication, catch-up, and restart | 7 |

The seven real-browser cases exercise:

1. Prepare the actual production operator page and files, disconnect the browser, save a scan through the real UI, reload offline, navigate directly to a protected scanner URL and recover through `/offline`, then reconnect and acknowledge the preserved record.
2. Connect separate browser contexts through real WebRTC data channels in an A–B–C chain; forward a record to C; connect another device later and receive the retained history.
3. Commit 1,000 scan operations using real IndexedDB, recreate the manager, and drain the queue while verifying every unique ID and retained history.
4. Fail preparation with a missing script and with an HTML response masquerading as JavaScript; confirm the previous complete application bundle remains active and usable after disconnecting.
5. Prepare a persistent Chromium profile, close the entire browser process, reopen that profile offline, restore the cached sessions, and commit a newly signed scan using the persisted non-exportable device key.
6. Reject development-mode preparation with a useful message instead of using a stale production asset list. The worker harness deliberately serves an unrelated legacy root manifest; preparation uses the build-specific manifest from the actual operator page. Mismatched release IDs are rejected while the previous complete bundle remains usable.
7. Exercise long-error and expanded-backup states at 320, 390, 668, and 1280 pixels in light and dark themes. Verify no visible element overflows horizontally, the dialog remains inside the viewport, footer actions remain visible, focus stays in the dialog, and Escape closes it. Screenshots are saved under `verification-results/sync-dialog-*.png`.

## How the audit findings were addressed

| Original finding | Implemented measure |
|---|---|
| Failed and newly appended attendance scans were erased | One append-only operation queue; only individual server acknowledgments change delivery status; no batch-wide deletion |
| Child badge replay differed from online attendance | One transactional scan processor resolves both volunteers and children; online compatibility actions use the same event format |
| Scanner did not participate in P2P | Scanner, spot registration, and directory attendance controls use SyncManager |
| Failed/in-flight records became stranded | Recover interrupted states; count all outstanding work; retry transient failures; retain terminal failures with reasons and explicit retry |
| Concurrent uploads and queue starvation | Synchronous in-process worker guard, Web Locks across tabs, drain-until-empty processing, periodic reconnect/focus wakeups |
| A later chunk failure replayed acknowledged work | Preserve per-record acknowledgments; durable server operation receipts and mutation application in one transaction |
| Old CREATE replay reset newer attendance | Duplicate operations return their receipt; repeated registrations never overwrite attendance; QR conflicts are rejected for review |
| Mesh lacked history, forwarding, and reliable deduplication | Inventory/request reconciliation, retained history, forwarding after durable receipt, persistent operation lookup beyond the memory cache |
| An outbox was the only offline data source | Separately persisted event snapshots, local projections, and retained operation history; local reads survive upload and restart |
| API acknowledged invalid or zero-row mutations | Entity/action/payload validation, allowlisted commands, explicit target checks in SQL, per-ID applied/rejected/deferred outcomes |
| Sync payload used nonexistent columns | No blanket `updated_at` injection; display serials are not written as child columns; tracked schema adds necessary attendance fields |
| Non-atomic last-write-wins and clock-sensitive toggles | Explicit scan events, atomic receipt processing, deterministic timestamp merges, original actor attribution, server-time calibration |
| IndexedDB writes resolved before commit | Resolve on transaction completion; reject on abort; regression test aborts after request success and verifies no false save |
| Connectivity status trusted ineffective signals | GET health verification and payload check, captive-portal rejection, bounded timeout; every action persists before any upload |
| Pairing declared success too early | Wait for complete ICE gathering and the specific peer's open channel; bounded connection errors; capped signaling size |
| Wi-Fi router was only an unimplemented client | Optional runnable HTTPS/WSS SQLite relay with a token, origin restriction, signature verification, history, and reconnect |
| Cached pages did not guarantee offline restart | Public `/offline` operator shell, verified complete build assets, explicit native recovery links, previous complete bundle retained on failure |
| Development preview or another build supplied an incompatible global asset list | Bind the operator page and immutable manifest to one build ID; reject development previews; validate the page/manifest identity; fetch the current shell online and retain offline fallback |
| Cross-account queues and user-editable authorization | Per-user/event partitions, logout lock, non-exportable device keys, signed actor/device/event commands, trusted app-metadata role checks; both approved database policy migrations applied |
| Additional event tables exposed anonymously and statistics bypassed caller policies | RLS with trusted operator roles, anonymous grants removed, authenticated truncation denied, statistics switched to invoker security |
| Lecturer password changes happened before administrator authorization | Check the trusted administrator role before any Auth admin mutation; regression tests reject non-administrators without side effects |
| Attendance dates depended on UTC/server timezone | Asia/Kolkata service dates, explicit session timezone, preserved scan instants, overnight checkout regression |

## Limits of the test evidence

- Unit/action/API tests use controlled Supabase responses rather than production attendee data. The SQL suite executes the actual migration and function in an isolated PostgreSQL runtime with representative fixture tables.
- The production-page browser test uses mocked bootstrap/upload responses to avoid creating production registrations or attendance. Browser storage, service-worker caching, WebCrypto signing, page reloads, and the process restart are real.
- WebRTC tests use separate desktop Chromium contexts. Cryptographic rejection and relay validation are tested separately. They do not establish iOS/Android camera behavior, venue access-point routing, or radio coverage.
- Relay protocol/persistence tests use real local WebSocket sockets and SQLite. The deployable router requires trusted TLS; the venue certificate chain, DNS, firewall, hardware, and power supply were not available for rehearsal here.
- The approved migration was applied to the hosted project. The real processor was exercised under `service_role` in a transaction that rolled back every fixture. Live REST probes confirmed anonymous denial and invalid-operation rejection without writes, and the Auth admin endpoint returned the migrated trusted role. Existing operators still need to sign in again to refresh their JWT claims.
- No application release was pushed or published by this task. Rebuild and deploy the complete production artifact together, then prepare every assigned device.

## Reproduce the checks

```text
npm run test:verify -- --maxWorkers=1
npm run test:offline
npm run test:browser
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js web_offline_p2p_sync/core components/SyncProvider.tsx app/api/offline app/api/sync/route.ts lib/offline app/offline/page.tsx --quiet
```

The first command saves its JSON evidence under `verification-results`; Playwright uses a separate results file there, so its cleanup cannot erase the unit-test report. Browser traces and failure screenshots go under the ignored `test-results` directory. Chromium must be installed once using `npx playwright install chromium`.

Follow `docs/OFFLINE_OPERATIONS.md` for deployment, preparation, router configuration, backup/import, and the physical event rehearsal. The software checks establish the tested behaviors above; they cannot honestly guarantee that no issue will occur on untested phones or an untested venue network.

See `docs/OFFLINE_ASSET_FIX.md` for the missing-chunk reproduction and sync-dialog follow-up.
