# Event-day offline operations

The operator app saves each registration or scan in IndexedDB before displaying a saved message. Server validation happens afterward. A saved record is not an admission approval or proof that another device has received it.

## Release requirements

Status on 14 November 2026: the sync migration, six-account role mapping, and separately approved event-table access migration were applied and verified on the connected production project. The updated application release has not been published by this task. See `docs/PRODUCTION_DATABASE_VERIFICATION.md` for the live checks and remaining advisor warnings.

1. Database prerequisite is complete on the connected production project. For another environment, apply `supabase/migrations/20261114095408_reliable_offline_sync.sql` with an explicit existing-account role mapping in one transaction, followed by `supabase/migrations/20261114124007_restrict_event_table_access.sql`. Review the mapping for that environment; do not copy production account assignments blindly. The app's ordinary API/service credential cannot run this DDL; use an authorized Supabase CLI or SQL Editor session.
2. Deploy a production build created with **`npm run build`**. The build command binds the operator page to a unique build ID and generates `/_next/static/<build-id>/offline-assets.json` alongside that build's actual static files. Deploy the HTML, static assets, service worker, API routes, and manifest together. Another local/test build cannot overwrite this release's manifest. Do not mix files from different builds or run bare `next build` for a release.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` on the server only. It supplies the privileged transaction processor and derives a signing key for device-enrollment certificates. Optionally set a separate strong `OFFLINE_SIGNING_SECRET`; changing either signing secret invalidates old device certificates, so preserve the signing secret through the event.
4. Use the same `NEXT_PUBLIC_EVENT_ID` throughout the portal build, server, devices, and local router. The default is `bal-pradarshani`. The present participant tables describe one event; changing this setting namespaces device queues and receipts, but does not automatically create a separate participant database.
5. Existing operators must sign in again after trusted-role migration so RLS sees their refreshed `app_metadata` claims. New lecturer and model-head creation now writes the trusted role. Editable `user_metadata` no longer grants application authority.

The migration is additive for operational records. It adds durable receipts and a transaction processor, tightens profile/child policies, and switches policies that used editable role claims. It does not delete attendance, registration data, or existing browser queues.

## Prepare each assigned device

While the internet connection is reliable:

1. Sign in with the operator account assigned to that device. Use an HTTPS production deployment in a supported current browser. Open **Preparation and saved records** or the header sync status.
2. Choose **Prepare offline access**. Keep the page open until preparation finishes. A complete event snapshot, a seven-day signed device certificate, and every required application asset must be saved. A missing asset or database migration causes a visible error; it does not count as completed preparation.
3. Check the displayed event-data time, **Offline application files verified** time, and offline authorization expiration. Prepare again before the certificate expires or after the event roster changes. New scans stop with an explicit error if offline authorization has expired; existing records remain stored.
4. Visit `/offline`, select the intended duty session, disconnect the internet, reload the app, and confirm that the sessions and scanner still open. Reconnect before performing real attendee transactions in a dry run. Use staging fixtures for test badges.
5. Keep automatic device time enabled. The app calibrates scan time using the server during preparation; the processor uses Asia/Kolkata session dates and handles overnight sessions. Review clock warnings rather than changing timestamps casually.

Installing a PWA icon alone does not prepare its data and files. Do not clear browser storage, use a private-browsing session, uninstall the app, or switch browser/origin while records are outstanding. Choose reliable assigned devices and keep them powered.

The development preview (`npm run dev`) cannot certify offline application files. Use the published app, or run `npm run build` followed by `npm start` for a local production rehearsal. If app-file preparation fails, keep the connection and retry. A missing file or mixed release is never ignored; any previous complete bundle and saved records remain available. The dialog separates saved event data, verified app files, and authorization so a partial preparation stays visibly incomplete.

## On the ground

- Use the attendance scanner for explicit check-in or checkout, or spot registration for a pre-generated badge in the prepared inventory. The directory's individual and bulk attendance controls also use the shared durable queue.
- A saved message means the local transaction committed. The operator app distinguishes outstanding records, failed records, a reachable server, and connected peers. It preserves errors and all unacknowledged work.
- If a participant or QR badge is not in the prepared data, do not infer that another gate has never seen it. Connect to the registration device/router, refresh preparation online, or follow the event's manual verification process.
- Keep the phone until its outstanding count is zero and the server reports the expected attendance. Rejected records remain visible with reasons; export them for review. Retry does not erase them.
- A logout locks local access without deleting the previous operator's partition. Sign back in as that operator to resume its queue. Another operator's account has a separate partition.

Two completely isolated gates cannot prevent a person from presenting the same badge at both gates in real time. Use a common local network/router or assign distinct admission lanes when strict cross-gate duplicate prevention is required.

## Device bridges

For direct WebRTC pairing, connect both phones to a shared Wi-Fi network that allows device-to-device traffic. Exchange the offer and answer QR codes. The host only reports connected after its actual data channel opens. Pairing signals do not provide a radio connection; different hotspots or Wi-Fi client isolation can prevent a connection.

Connected devices exchange inventories, request missing operations, persist verified operations, and forward them through a chain. History is retained after cloud acknowledgment for late-device catch-up. A temporary disconnect retains work and reconciles on recovery. If a connection fails completely, pair again. Same-browser BroadcastChannel is a separate cross-tab mechanism and does not connect phones by itself.

Every relayed operation carries a server-enrolled device credential and a device signature. Altering the actor, event, action, or payload invalidates it. The cloud also checks that the original operator remains authorized. A peer copy is never accepted as a cloud acknowledgment.

## Optional durable Wi-Fi router

`npm run offline:relay` starts the companion router in `scripts/offline-relay.mjs`. It is a persistent relay, not a replacement for the full cloud backend. It works without internet and stores verified operations in SQLite with WAL and full synchronization. Phones retain their own copies and later obtain cloud receipts. The router requests records that existed before it connected and retains its own history across restart.

Requirements:

- Node.js 22.13 or newer; the verified development runtime was Node 24.5.0. Node may print a notice that its SQLite module is experimental.
- A venue LAN that reaches the router, a stable hostname, and a valid trusted TLS certificate for that hostname. Provision DNS and certificates before the event. HTTP/`ws://` is not an acceptable fallback from an HTTPS portal.
- A strong private token shared only with authorized operators. Use a fresh value for each event. The router also restricts browser origins and verifies the portal/device signatures.
- Reliable power and a protected, backed-up SQLite database. Keep its `-wal`/`-shm` companions with a running database; shut down cleanly before copying a file backup.

Example PowerShell setup, replacing the example paths and hostname with the actual venue configuration:

```powershell
$env:OFFLINE_TLS_CERT = 'C:\event-router\router-certificate.pem'
$env:OFFLINE_TLS_KEY = 'C:\event-router\router-private-key.pem'
$env:OFFLINE_PUBLIC_KEY_FILE = 'C:\event-router\event-router-public-key.json'
$env:OFFLINE_RELAY_DATABASE = 'C:\event-router\event.sqlite'
$env:OFFLINE_ALLOWED_ORIGINS = 'https://your-production-portal.example'
$env:OFFLINE_RELAY_TOKEN = '<a private random token of at least 32 characters>'
npm run offline:relay
```

Obtain `event-router-public-key.json` using **Export router public key** on a prepared device. This is the portal's public verification key, not its service credential and not the router's private TLS key. In the app's Local WiFi tab, connect to `wss://your-router-hostname:8080/?token=<the-router-token>`. The app waits for the socket to open and reports certificate/address failures rather than silently claiming success.

The default storage ceiling is 100,000 operations. The exported `attachRelay` function supports an explicit tested ceiling for a larger event. At the ceiling, clients disconnect and retain their queues; records are never silently discarded. Capacity planning and the real venue network still require an on-site rehearsal.

## Backup and recovery

- **Export saved records** downloads a versioned JSON backup with snapshot data, immutable operations, and delivery results. It excludes device private keys. Protect the file because it contains attendee information.
- **Import saved records** on an already prepared device verifies every signature and event before accepting the backup. Repeated operation IDs are stored once. Exported delivery flags are not trusted; the cloud confirms them again using its idempotency receipts. A tampered or unsupported backup is rejected before insertion.
- Legacy IndexedDB outbox data and `pending-scans:v1` localStorage data are preserved during migration. The first preparing operator claims migration on that browser; legacy scans receive stable import IDs and a legacy marker. Invalid legacy data remains available in its original source for investigation. Never clear that source to silence an error.
- After restart, in-flight uploads return to the retry queue. Temporary failures retry with bounded backoff and jitter. Requests have timeouts. Authentication failures ask the operator to sign in again while retaining records. Permanently rejected records require review or an explicit retry.
- A check-out received before its volunteer check-in is deferred without a receipt, and succeeds when the missing check-in arrives. QR registration conflicts are retained for review instead of overwriting another attendee.

## Repeatable verification

```text
npm test -- --run
npm run test:offline
npm run test:browser
```

The browser command creates `.next-offline-tests`, generates its asset manifest, and runs Chromium against an isolated production server. This prevents another local build from deleting assets during a test. It also tests real IndexedDB and WebRTC in separate browser contexts. `npx playwright install chromium` is required once on a new machine.

Before the event, repeat the cold offline reload and scanning checks on the actual assigned phones and venue LAN. Test router power loss, reconnect, token expiration, two gates scanning the same badge, and the roster/queue size expected for the event. No desktop-only test can establish venue radio coverage, phone camera compatibility, storage retention, or battery endurance.
