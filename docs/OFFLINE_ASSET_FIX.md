# Offline asset error and sync dialog follow-up

Date: 14 November 2026, Asia/Kolkata.

## Investigation

The reported script was `/_next/static/chunks/004uscel7d8j1.js`. A local development server reproduced the exact mismatch: `/offline-assets.json` returned HTTP 200 with production build `047007d0e9219933`, while that referenced script returned HTTP 404. The file existed under the production `.next/static` directory and was absent from the development output. Both normal builds and isolated test builds previously wrote the same public manifest, making a build mismatch possible.

The dialog also placed four long controls in one footer row at wider breakpoints inside a narrow modal. The raw script path and inflexible controls caused the horizontal scrollbar shown in the attachment.

## Implemented fix

`npm run build` now runs `scripts/build.cjs`, which supplies one unique build ID to Next.js and the asset generator. The operator page contains that identity, and its manifest is packaged at `/offline-releases/<build-id>/assets.json`. Isolated builds write only inside their own build directory. The service worker reads the current operator page first, requests that page's manifest, and verifies the identities match before caching. It still requires every asset to succeed and publishes the complete cache pointer last.

Development previews explicitly explain that offline access must be prepared in the published app. They cannot accidentally certify an old production bundle. A local production rehearsal uses `npm run build` then `npm start`. Online `/offline` navigation requests the current page, with the previous complete page retained as the network-failure fallback. Preparation uses an activated worker when available and follows the current registration during first activation; a background update does not block an already usable worker.

The dialog follows the existing cream/navy/saffron design. It has a bounded scrolling body, a persistent footer with Close and Prepare actions, readable delivery counts, and separate checks for event data, application files, and authorization. Partial preparation and expired authorization cannot appear ready. Missing-file messages explain recovery and preserve technical details in a disclosure. Backup and router actions remain available in a keyboard-accessible disclosure, and transfer failures are displayed instead of becoming unhandled rejections.

## Verification

- Full suite: **186 passed, 0 failed, 27 files**.
- Production-browser suite: **7 passed, 0 failed, 0 skipped, 0 flaky**.
- Production build and strict TypeScript compilation passed.
- Targeted dialog/provider lint passed with no errors.
- The normal and isolated builds each contain their own manifest and 97 assets. The browser asserts that the served page, actual build ID, and retrieved manifest agree.
- Missing assets, incorrect MIME types, and mismatched release IDs preserve the previous complete bundle. Development mode returns the intended actionable message.
- Browser regressions still cover offline reload, complete browser-process restart, real chained WebRTC, and replay-safe draining of 1,000 saved scans.
- Dialog regression tests preserve upload guards, reject partial/expired readiness, keep the preparation callback, and surface backup errors. The focused rerun passed without React update warnings.

UI delivery checks:

| Check | Result and evidence |
|---|---|
| Responsive layout | PASS: zero visible horizontal overflow at 320, 390, 668, and 1280 pixels in both themes; footer controls remain in the viewport |
| Keyboard and focus | PASS: focus remains inside the dialog through repeated Tab presses; Escape closes it; import has a real button and a named file input |
| Error and progress states | PASS: partial/expired preparation tests, disabled in-progress actions, missing-file recovery message, and backup-error regression |
| Existing design direction | PASS: existing colors, typography, and restrained motion; reduced motion disables the progress spinner |
| Actual behavior | PASS: real production build, browser interaction checks, offline cache verification, and existing restart/transport regressions |

Screenshots and raw test evidence are stored locally under ignored `verification-results/`. The overview image is `verification-results/sync-dialog-overview.png`; narrow and dark-mode cases use `sync-dialog-<width>-<theme>.png`.

## Status

The code and local production build are complete. This follow-up does not publish the application. Deploy the complete generated release and prepare devices again in the published app. Venue-phone and network rehearsal remains necessary, as described in `docs/OFFLINE_OPERATIONS.md`.

Investigation learning: an offline cache manifest must identify the same release as its HTML shell. A mutable, shared public manifest cannot safely represent simultaneous production, development, and test builds.

## Published-site follow-up

The subsequent phone screenshot showed `Offline worker update timed out`. The previous client selected `installing || waiting || active` and waited on that single captured instance for 15 seconds, even when another worker was already active. Slow installation or replacement could therefore block preparation unnecessarily. The new helper uses an already activated worker, follows replacement instances during first activation, requests activation of waiting workers, and bounds startup at 60 seconds. Legacy cache deletion no longer blocks activation. Four regression cases cover these states and bounded failure without data deletion.

Public HTTP inspection confirmed that the published `/offline` page identified build `a681ecb5-2827-44d9-bf56-ddc072c0ad82`, but its `/_next/static/<build-id>/offline-assets.json` returned **404**. The generator now additionally publishes the immutable manifest as `public/offline-releases/<build-id>/assets.json`, and the worker requests that public URL. The proxy explicitly permits anonymous access to these code manifests. Build identity verification and complete-asset validation remain required. The browser suite requests the public manifest without authentication and checks it against the served page.

These changes require a new application deployment. The public inspection confirms the existing deployment defect; local tests cannot claim that an unpublished fix has repaired the phone's installed release.
