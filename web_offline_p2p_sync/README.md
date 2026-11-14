# Event offline synchronization

This module is the portal's event-operations implementation. It is not a generic arbitrary-table replication library.

Supported commands:

- `children / CREATE`: register a prepared QR badge.
- `children / UPDATE`: record an explicit child check-in or checkout with its timestamp.
- `attendance_scans / CREATE`: record a volunteer or child scan with `scanData`, `sessionId`, `mode`, and the original timestamp.

Every operation commits to IndexedDB before the UI says it was saved. The uploader uses a durable server receipt per operation ID. Failed records and acknowledged history are retained. Local state combines the prepared event snapshot with verified operations.

Devices must prepare online before the event. Preparation downloads the event data, enrolls a device public key, and verifies the complete production application bundle. An offline authorization lasts seven days. The non-exportable private key remains in that operator's IndexedDB partition; other devices and the cloud verify signed operations.

Device transports are same-browser BroadcastChannel, manually paired WebRTC data channels, and an optional authenticated WSS relay. WebRTC still requires a usable shared network. Inventories and missing-record requests provide catch-up for late peers; updates are forwarded only after durable receipt. Peer delivery never counts as cloud acknowledgment. The runnable local relay is `scripts/offline-relay.mjs` and requires trusted TLS, the portal public key, a strong token, and approved origins.

Production requires the transactional SQL migration, explicit trusted operator-role mapping, and a matching production build/asset manifest. Do not enable server writes by restoring a generic table fallback or accepting unsigned peer packets.

Read `docs/OFFLINE_OPERATIONS.md` for preparation, deployment, local-router setup, backups, imports, and event rehearsal. `docs/OFFLINE_TEST_REPORT.md` records the verification evidence and remaining rollout requirements.

```text
npm run test:offline
npm run test:browser
npm run offline:relay
```

The example component in `examples/` demonstrates the former generic API shape and is not the portal's active integration. Use `components/SyncProvider.tsx` and the operator pages as the integration reference.
