# Operation feedback and motion review

Date: 15 November 2026. Direction retained: warm cream/navy/saffron; ENERGY 2 / RHYTHM 2 / MOTION 1. This change addresses ambiguous operations and repeated clicks, with motion only for useful feedback.

## Main correction

Volunteer status changes previously waited for the server action and a subsequent roster fetch with no indication on the selector. They now immediately show Saving with the requested status, disable the selector, and guard the request synchronously. The hook shares one in-flight promise per record, including across responsive copies of the selector. A confirmed server response updates the displayed record before the roster fetch finishes. Failed writes retain the original status and show an inline retry explanation alongside the existing error toast. The follow-up refresh uses the latest filters.

This improves perceived responsiveness and suppresses duplicate requests; no reduction in database/server response time is claimed. Authorization, validation, activity logging, and server actions are retained.

## Feedback scope

- Shared ActionForm immediately locks submissions and native form fields, announces Saving changes, and recovers after completion. Applied to volunteer forms in both roles, sessions, exhibition models, Model Head accounts, and security accounts, including their existing password forms.
- Shared AsyncButton provides synchronous duplicate-click protection, a pending label/spinner, and recovery for bulk approval, enrollment, and enrollment removal.
- Existing scanner processing and spot-registration loading feedback were inspected and retained. No per-scan vibration or celebration animation was added.
- Touch feedback is optional under the account menu, off by default, and stored on this browser. A 10ms vibration acknowledges supported touch actions only when enabled, a coarse pointer is present, and reduced motion is not requested. Unsupported/denied vibration never affects saving.

## Motion decisions

| Candidate | Frequency and purpose | Decision |
| --- | --- | --- |
| Volunteer status update | Frequent; acknowledge input and show pending work | Immediate text/disabled state; spinner during the real request. Keep rows stationary. |
| Form submission | Occasional; prevent ambiguous duplicate saves | Immediate lock and live saving feedback. No entrance/exit movement. |
| Bulk approval and enrollment | Occasional; state indication | Pending label and spinner until completion. |
| Command search, keyboard navigation, table filtering | Frequent/keyboard driven | No added animation. |
| Operational page entrances | Frequent navigation | Removed repeated fade-in animations through the workspace rule. |
| Present-status dot and live-feed icon | Persistent information | Removed ambient pulsing; a static indicator accurately describes the state. |
| Existing menus, dialogs, drawers, and press feedback | Existing spatial/press feedback | Retained the existing tokens and reduced-motion rules. |
| Scanner success celebration | High-frequency operational data | Rejected; retain readable processing/result feedback. |

The only new animated property is spinner transform rotation, at 800ms linear per cycle while work is pending. Reduced motion stops rotation and retains the text. No motion library was installed, no list movement/layout animation added, and no timer delays a completed response.

## Verification

- Complete regression suite: 198 tests passed across 29 files.
- Component suite: 47 tests passed across 9 files at the first focused run.
- Additional request-coordination tests: 2 passed. They verify shared promises, early confirmed-state display, original-state retention on failure, and a successful later retry.
- Delayed-promise component tests verify immediate form locks, repeated submission/click suppression, pending labels, failure recovery, and optional/reduced-motion/unsupported haptic behavior.
- Standalone TypeScript, focused new-component/test lint, and git diff whitespace checks passed.
- Final production build passed after the enrollment integration: compilation, TypeScript, 33 generated static pages, and an offline manifest containing 96 assets.

No real volunteer status, enrollment, or account data was mutated by testing. No production deployment was performed.

## Design gate and remaining coverage

- Purpose gate PASS: every new feedback element reflects an actual request or an explicit user preference. The selected visual identity and existing controls remain in place.
- Motion gate PASS: frequent navigation and keyboard operations receive no added motion. The spinner represents real pending work and respects reduced motion. Records remain stationary.
- Interaction gate PASS (automated): duplicate requests, pending states, success confirmation, rejection recovery, and unsupported haptics have test evidence above.
- Content/asset gate PASS: no invented metrics, security claims, media, or identity assets were added. New copy describes pending operations and errors directly.
- Implementation gate PASS: changes were authored directly in source, with no source-rewriting script. No auth, schema, server validation, scan payload, or physical print changes.
- Live visual/hardware review remains unverified: the in-app browser control timed out during initialization. A native Chrome fallback returned unavailable input geometry and then a screenshot inconsistent with the selected window; it was stopped without further input. No live screenshot or physical vibration verification is claimed. Real-device contrast/reflow and vibration feel therefore still need a working browser/device session; this report is not a claim of complete visual acceptance.
