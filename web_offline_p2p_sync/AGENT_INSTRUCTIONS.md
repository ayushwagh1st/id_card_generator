# Maintaining the event offline implementation

The active integration is `components/SyncProvider.tsx`. The supported application commands and operational prerequisites are documented in this folder's README and `docs/OFFLINE_OPERATIONS.md`.

- Preserve the single durable queue across attendance scanning, spot registration, and directory actions. Do not reintroduce the separate localStorage attendance uploader.
- Preserve existing legacy sources during migration. Never clear a batch based only on a top-level success flag. Every operation needs its own acknowledgment.
- Resolve saves after the IndexedDB transaction commits, including abort handling. Keep local snapshots separate from delivery state and retained history.
- New entities/actions require explicit payload validation and a transactional server implementation. Arbitrary table writes are intentionally rejected.
- Do not accept a peer-provided delivery flag or unsigned operation as a server acknowledgment. Preserve actor/device/event binding, certificate verification, payload signatures, durable deduplication, and reconnect catch-up.
- Authorization comes from server-controlled app metadata and current operator status. Do not fall back to editable user metadata or the former unrestricted profile policy.
- Server receipt insertion and business mutation must stay in the same database transaction. A replay returns its original receipt without applying the action again.
- Build production HTML, static assets, service worker, and offline asset manifest together. A missing, empty, or wrong-content-type asset must fail preparation while preserving the previous complete bundle.
- Use the Next.js guides bundled with the installed framework before changing routes, build behavior, or service-worker integration.
- Run the offline regressions and real-browser suite after relevant changes. Test fixtures must not create production attendees or send real email.
- The production migration and application deployment remain separate external actions. Do not infer production readiness from local passing tests or a successful QR pairing. Check the current rollout status and physical-device rehearsal.
