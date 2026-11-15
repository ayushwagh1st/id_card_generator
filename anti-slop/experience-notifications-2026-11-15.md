# Experience and notification refinement

The owner's warm editorial direction and ENERGY 2 / RHYTHM 2 / MOTION 1 remain unchanged. The review covered public links/gallery, workspace navigation, overlays, roster operations, forms, imports, reports, enrollment, and scan feedback in source. This continues the operation-feedback pass rather than replacing it.

## Decisions and implementation

- Retained existing short dialog/drawer/menu transitions and pointer-gated photo enlargement. Navigation, search, rows, charts, and frequent keyboard operations receive no new entrance animation. Ambient pulses and page fades remain suppressed in the workspace.
- Reworked the shared Sonner presentation for all routes: solid semantic surfaces, restrained status rail/icons, readable title/detail hierarchy, named 44px dismissal/action targets, keyboard focus, and safe-area-aware mobile placement. Three visible notifications limit stacking. Sonner retains its established interruptible stacking/swipe mechanics; no toast keyframes or new animation dependency were introduced.
- Errors can explain recovery; status failures include an explicit Retry action. The retry prevents premature dismissal, changes the same notification to pending, and replaces it with the final outcome. Notification IDs coalesce repeated outcomes for the same status record.
- Updated profile creation/editing/approval, roster import, report generation, session assignment, sign-in, and child registration/attendance messages. Offline saves explicitly state that server confirmation is pending. Report messages describe preparation rather than asserting a completed browser download.
- Busy action buttons reserve their normal and pending labels in the same grid cell so adjacent actions do not move during processing. Hidden labels are also hidden from assistive technology.
- Replaced the child-attendance component's unconditional 100ms vibration with the existing opt-in, coarse-pointer, reduced-motion-aware 10ms feedback helper. No new audio or celebration effect added. Hardware feedback remains optional and browser-dependent.
- Corrected the account-menu color rule: touch preferences use normal foreground; only Sign out uses the destructive color.

## Verification and limitations

- Component regression run: 49 tests passed across 10 files before the additional toast tests.
- Production build passed compilation, TypeScript, 33 static pages, and offline packaging with 96 assets.
- Added actual Sonner component tests for current-theme rendering, readable content, named dismissal, recovery actions, and replacement of pending/outcome content. A first test exposed a rapid retry/dismissal race, which was corrected.
- Final targeted run passed all 9 notification/operation/status tests. Standalone TypeScript, notification-component/test lint, and whitespace checks passed.
- Browser access recovered through the supported native Chrome fallback. Inspected the actual signed-in localhost volunteer page and account menu in dark mode; the touch preference was visible. No volunteer status or account record was changed.
- Browser inspection then stopped automatically because the computer-use tool could not verify the current URL with sufficient confidence. No further browser inputs were issued. New toast appearance at phone sizes and physical vibration therefore remain unverified; this is not a claim that every route and hardware state was visually accepted.

## Scoped design gate

- Purpose/motion PASS: only actual feedback uses motion; no added decorative movement or navigation delay. Existing motion tokens and Sonner are reused. Reduced motion suppresses new spinner/vibration and toast movement.
- Content/identity PASS: real outcomes and recovery detail replace generic success phrases; no fabricated metrics, testimonials, media, or security claims. Existing cream/navy/saffron identity continues into notifications.
- Interaction/accessibility PASS in automated coverage: pending locks and retries are exercised, toast dismissal is named, toast controls have 44px styling and focus states, hidden busy labels have matching ARIA state, and text wraps within notification content.
- Source preservation PASS: edits were authored directly; no source-rewriting script, new dependency, authentication change, schema change, print artwork change, or production deployment.
- Live visual gate remains incomplete because browser control was interrupted. Mobile appearance, every route, and physical vibration are not claimed as verified.
