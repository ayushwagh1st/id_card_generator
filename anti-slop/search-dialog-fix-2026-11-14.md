# Search dialog visibility fix

The command palette now uses explicit top/side insets instead of shared modal translations. Its maximum height accounts for the top offset and bottom safe area. The results list shrinks and scrolls independently, leaving the title, input, and close control visible. Short windows omit secondary description/hint text to preserve usable results space. Search filtering, keyboard commands, routes, and close behavior are unchanged.

## Verification

- PASS: dialog, title, input, and close control stayed within the viewport at 1440×900, 1280×550, 1024×600, 375×667, 320×480, 844×390, and 320×300.
- PASS: each size retained a scrollable results region without outer-dialog scrolling.
- PASS: filtering at 320×300 kept the dialog between y=24 and y=276.
- PASS: Escape returned focus to the search trigger.
- PASS: all three existing workspace-navigation tests passed.
- PASS: CSS parsed successfully with PostCSS.

## Scoped design delivery gate

- R-03 / R-35 / C-4 PASS: seven measured viewport checks, including landscape and a short 300px window, verify the reported clipping fix.
- R-24 / R-26 / R-32 / R-39 PASS: route and input behavior unchanged; navigation tests and keyboard focus return verified.
- R-19 PASS: frequent command search remains instant; no animation introduced.
- R-29 / R-31 PASS: existing palette and typography retained; layout changes serve viewport containment and input visibility.
- Remaining core, UI, and mobile gate decisions carry forward from `workspace-verification-2026-11-14.md`; this CSS-only change adds no content, assets, data claims, dependencies, or backend operations.

The browser check used the existing isolated harness with labelled mock data. Its temporary banner was placed below app overlays for visibility testing. No live data or authentication state was changed. Screenshot and raw measurements are saved as `search-dialog-fixed.png` and `search-dialog-fixed-checks.json` in this chat's visualization directory.
