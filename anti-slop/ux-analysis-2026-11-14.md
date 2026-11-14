# UI/UX and layout analysis

## Assessment

The warm cream, navy, and saffron direction is a useful foundation. The next pass should make the authenticated app a compact, task-focused operations workspace. The largest gains will come from information hierarchy, record handling on phones, accurate labels, and predictable interaction states.

This is a read-only application review. Evidence comes from the current source, the supplied dashboard screenshot, and saved desktop/mobile previews from the preceding verification. No application code, routes, database behavior, or permissions were changed. Recommendations are design proposals, not implemented features or measured usability improvements.

The editorial treatment suits the public event pages. Operational pages need a smaller heading area, more readable working text, and earlier access to records and actions. Keep the palette, real photographs, accessible primitives, and physical badge formats.

## Prioritized findings

P1 means misleading information, a blocked route, an important recovery gap, or friction in a core task. P2 means a substantial workflow/layout improvement. P3 means refinement after the core flows work well.

### 1. P1: correct metric and entity labels

Confirmed: the dashboard's “Active Volunteers” value is `totalVolunteers`. The server counts all volunteers without an active/approved filter. Rename it “Registered volunteers,” or use the existing `approvedCount` and label it “Approved volunteers.” This needs no database change.

Confirmed: command search calls `/admin/directory` “Volunteer Directory,” but that page reads children. The Spot Registration command says it registers volunteers, while its component creates children. Use explicit “Volunteer roster,” “Children's directory,” “Register child,” and “Scan volunteer badge” wording where appropriate.

Evidence: [dashboard metric](C:/Users/Admin/Downloads/id_card_generator/app/admin/dashboard/page.tsx:97), [count sources](C:/Users/Admin/Downloads/id_card_generator/server/actions/dashboard.ts:34), [command labels](C:/Users/Admin/Downloads/id_card_generator/components/layout/CommandPalette.tsx:11), [children directory](C:/Users/Admin/Downloads/id_card_generator/app/admin/directory/page.tsx:5), [child registration](C:/Users/Admin/Downloads/id_card_generator/components/spot-registration/SpotRegistration.tsx:177).

Acceptance: every count names what it measures; every navigation label identifies the record type it opens. Internal schema names can remain unchanged.

### 2. P1: make command navigation match the user's role

Confirmed: every workspace header renders the same command palette. Its protected destinations all start with `/admin`. The middleware restricts those routes to admins, so Model Heads and security users can be offered destinations that redirect them to login.

Create one typed navigation registry containing label, destination, group, entity, and permitted role. Use it for both the sidebar and command palette. Preserve all server authorization checks.

The palette also updates `aria-activedescendant` when the keyboard selection changes, but contains no code to keep that item in the results viewport. Explicitly scroll the selected option within the list. The recent positioning fix remains useful; this addresses a separate keyboard interaction.

Evidence: [shared header](C:/Users/Admin/Downloads/id_card_generator/components/layout/Header.tsx:61), [command routes](C:/Users/Admin/Downloads/id_card_generator/components/layout/CommandPalette.tsx:9), [keyboard selection](C:/Users/Admin/Downloads/id_card_generator/components/layout/CommandPalette.tsx:42), [role restrictions](C:/Users/Admin/Downloads/id_card_generator/lib/supabase/middleware.ts:135).

Acceptance: each role reaches only its existing permitted destinations; repeated Arrow Down keeps the selected item visible. W3C requires authors to keep the active descendant in view. [WAI-ARIA guidance](https://www.w3.org/TR/wai-aria/#aria-activedescendant).

### 3. P1: design the phone roster around identity and action

The saved mobile preview exposes checkbox, ID, and photo columns before the full name. Status and actions are farther to the right. Users must scroll sideways to identify someone and act on the record. Before the roster, filters and separate export buttons also consume substantial vertical space.

Desktop proposal: combine photo, name, role, and secondary ID into one identity column. Follow with model, status, contact, and actions. Keep comparison-friendly tables on desktop.

Phone proposal: use compact record rows with name, status, model, and a visible details/action control. Put secondary fields inside an expandable detail view. Retain bulk selection. Keep search visible; move secondary filters into a labelled filter sheet and PDF/CSV into one Export menu. Show applied filter chips and a clear reset action.

Evidence: [column order](C:/Users/Admin/Downloads/id_card_generator/app/admin/volunteers/_components/VolunteersTable.tsx:90), [toolbar composition](C:/Users/Admin/Downloads/id_card_generator/app/admin/volunteers/page.tsx:51), saved `workspace-volunteers-mobile.png`.

Acceptance: at 375px, a user can read a volunteer's name, status, and model, then open details without horizontal scrolling. Tables can legitimately use local horizontal scrolling under WCAG, but reduced scrolling can improve usability. [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Desktop tables should support finding, comparing, inspecting, and acting on records. [NN/G table-task guidance](https://www.nngroup.com/articles/data-tables/).

### 4. P1: bring useful work into the dashboard's first screen

The dashboard devotes a large area to an editorial introduction, an aggregate count, and six evenly presented metrics. Its chart and activity appear afterward. The backend already returns `pendingCount`, `approvedCount`, and `todaySessions`, but those are not surfaced as the dashboard's main priorities.

Use a compact “Event overview” header. Lead with pending approvals and a Review volunteers action, approved volunteers, and children checked in. Show session-today context using the existing value. Keep the total registered count as supporting information. Place workload distribution and recent activity below this decision area.

A pending-review count can use current data. Showing individual pending records would require fetching an additional list and should be treated as a separate implementation step. Opening a prefiltered roster also needs URL/filter-state wiring; that changes navigation state, not approval rules.

Evidence: [dashboard structure](C:/Users/Admin/Downloads/id_card_generator/app/admin/dashboard/page.tsx:142), [available counts](C:/Users/Admin/Downloads/id_card_generator/server/actions/dashboard.ts:112), [current heading and metric styles](C:/Users/Admin/Downloads/id_card_generator/app/workspace.css:76).

Acceptance: at a 1280×720 viewport, the page exposes its primary task and an actionable attention area without scrolling through a promotional introduction.

### 5. P1: distinguish loading, empty data, and failed data

Confirmed: the dashboard action returns `{ error }` on failure, but the page dispatches the result as successful data without checking that field. The next render assumes `stats` exists. This can turn a recoverable data error into a page error.

Live attendance starts with an empty array and zero counts without a dedicated loading/error state. The empty message can therefore appear before loading completes, or remain after a failure toast.

Use separate loading, loaded-empty, filtered-empty, and error states. Errors need a persistent explanation and Retry action. Keep previously loaded data visible during refresh where appropriate, with an accurate refresh indicator.

Evidence: [dashboard dispatch](C:/Users/Admin/Downloads/id_card_generator/app/admin/dashboard/page.tsx:68), [server error response](C:/Users/Admin/Downloads/id_card_generator/server/actions/dashboard.ts:126), [attendance initialization](C:/Users/Admin/Downloads/id_card_generator/app/admin/live-attendance/page.tsx:12).

Acceptance: a failed request never appears as “zero people” or “no scans,” and users can retry without restarting their workflow.

### 6. P2: make navigation easier to scan on short screens

The admin rail contains 13 destinations. Its brand, role block, and bottom event/sign-out area take space away from the scrollable navigation. The supplied screenshot shows only part of the destination list at once.

Reduce rail branding and footer height while retaining readable 44px targets. Group by the record/task users recognize:

- Overview.
- Volunteers: roster, models, Model Heads.
- Children: directory, spot registration, QR stickers.
- Event operations: sessions, enrollment, attendance, security staff.
- Outputs: ID printing, reports.

Make groups collapsible if required and keep the current group open. Model Head navigation can remain short. Security navigation should emphasize session selection and scanning. Avoid imposing the same mobile navigation arrangement on every role.

Evidence: [sidebar destinations](C:/Users/Admin/Downloads/id_card_generator/components/layout/Sidebar.tsx:14), [brand/footer spacing](C:/Users/Admin/Downloads/id_card_generator/app/workspace.css:123).

### 7. P2: standardize page headers, filters, and bulk actions

Use one compact operational header: title and short context on the left, the page's primary action on the right. Place search/filter controls immediately above records. Keep export and other secondary actions together.

Show selected count and bulk actions in one clear contextual bar. Say “Select this page,” because the current select-all implementation selects loaded page records. Make retained selections across pages/filters explicit. Preserve filter and pagination state when users inspect a record and return.

Evidence: [current toolbar](C:/Users/Admin/Downloads/id_card_generator/app/admin/volunteers/_components/VolunteersFilters.tsx:45), [select-all scope](C:/Users/Admin/Downloads/id_card_generator/app/admin/volunteers/_hooks/useVolunteersState.ts:386).

Acceptance: primary action placement is predictable, selection scope is unambiguous, and returning from details retains the user's place.

### 8. P2: give long volunteer forms a clearer structure

Add/edit dialogs contain identity, contact, assignment, emergency, accommodation, remarks, and photo fields in one scrolling form. Section these into Personal details, Assignment, Emergency contact, and Photo. Keep required and optional fields explicit. Keep Save/Cancel visible using an action area that does not cover the last field.

A desktop side panel and a full-height mobile editor are suitable candidates; verify them against the existing modal before selecting the final pattern. This can preserve the same form values, validation rules, cropper, and save callbacks.

Approved Model Head records currently open an Edit action with disabled fields and disabled Save. Label that entry “View details” and explain the lock immediately. Do not loosen the existing approval lock.

Evidence: [volunteer dialogs](C:/Users/Admin/Downloads/id_card_generator/app/admin/volunteers/_components/VolunteersModals.tsx:86), [approved-profile state](C:/Users/Admin/Downloads/id_card_generator/app/head/volunteers/page.tsx:618).

### 9. P2: make the print preview fit the available screen

The A4 sheet is correctly kept at 210×297mm. The screen zoom starts at 100%, and the zoom-out control stops at 50%. A 210mm sheet is approximately 794 CSS pixels wide, so even 50% is about 397px before surrounding padding. A phone cannot fit the whole sheet at that minimum.

Add Fit width and Fit page, calculated from the preview container. Apply that scale only to the on-screen preview. Retain actual badge sizes, A4 layout, QR payloads, print margins, duplex behavior, and print output.

Place the selected scope, card count, sheet count, and Print action together. On phones, make settings a compact expandable section instead of a long block before the canvas.

Evidence: [zoom limits](C:/Users/Admin/Downloads/id_card_generator/app/admin/print/_components/PrintSettings.tsx:97), [A4 preview](C:/Users/Admin/Downloads/id_card_generator/app/admin/print/page.tsx:235).

### 10. P2: adapt enrollment to viewport height and phone use

Available and enrolled volunteers each occupy a fixed 720px panel. On phones they stack, separating the selection task from its result by a long scroll.

Use available/enrolled tabs with counts on phones and preserve selection while switching. On desktop, bound the two list panels to the remaining viewport height. Keep selected count and Enroll selected near the list being acted on.

Evidence: [available panel](C:/Users/Admin/Downloads/id_card_generator/app/admin/session-enrollment/page.tsx:230), [enrolled panel](C:/Users/Admin/Downloads/id_card_generator/app/admin/session-enrollment/page.tsx:369).

### 11. P2: make scanner intent and results explicit

The app has different scanner entry points for children and volunteers. The dashboard Quick Scan ID currently reads a QR code and displays its raw value in a toast. It does not perform the same operation as attendance scanning.

Use labels that name the entity and operation. Keep check-in/check-out mode and selected session visible. Give successful, duplicate, invalid, offline-queued, and failed scans distinct persistent feedback. Surface the existing manual-entry alternative in the security scanner.

Either label the dashboard's existing action as reading a QR code, or define a verified-result workflow as a separate enhancement. Do not imply verification/check-in when the handler only displays raw QR text.

Evidence: [dashboard scan result](C:/Users/Admin/Downloads/id_card_generator/app/admin/dashboard/page.tsx:272), [child scan/registration component](C:/Users/Admin/Downloads/id_card_generator/components/spot-registration/SpotRegistration.tsx:68).

### 12. P2: expose actionable CSV validation details

The import code creates row-level validation errors. Its preview shows valid rows and an invalid-record count, but does not render the collected error list. Users need row number, field, and reason to repair a file.

Render those existing errors in a review list before confirmation. An optional downloadable invalid-row file can follow. Keep the current import rules and duplicate handling.

Evidence: [validation errors](C:/Users/Admin/Downloads/id_card_generator/components/volunteers/CSVUpload.tsx:86), [preview](C:/Users/Admin/Downloads/id_card_generator/components/volunteers/CSVUpload.tsx:194).

### 13. P2: replace broad styling overrides with explicit components

The design currently relies on global rules such as `.ui-panel:has(h1)` and broad recoloring of legacy utility colors. Those rules helped unify the app, but they make later layout changes harder to predict. Search positioning also shared centering rules with other dialogs until the recent fix.

Build explicit PageHeader, DataToolbar, StatusBadge, RecordIdentity, SelectionBar, FormSection, and overlay variants. Reuse the installed Base UI components. Keep component-specific placement rules separate for centered forms, command search, and side panels.

Use an operational scale: approximately 28–32px page headings, 14px working/navigation text, and 13px secondary details. Reserve 10–11px for nonessential metadata. These are proposed product choices, not WCAG font-size requirements. Keep the current larger editorial type on public pages.

Evidence: [broad surface rules](C:/Users/Admin/Downloads/id_card_generator/app/workspace.css:76), [navigation type](C:/Users/Admin/Downloads/id_card_generator/app/workspace.css:132), [overlay rules](C:/Users/Admin/Downloads/id_card_generator/app/workspace.css:149).

### 14. P3: make reports easier to choose and scope

Report cards repeat icon, description, and PDF/CSV buttons. A compact report list with a clear report name, included records, and format menu would be easier to scan as options grow. Clearly state when an export includes all records rather than the current visible selection.

Date-range filters, saved report presets, and report previews would be new workflow work. They should follow the core layout pass and be implemented only with matching data/query support.

Evidence: [report collection](C:/Users/Admin/Downloads/id_card_generator/app/admin/reports/page.tsx:227).

## Proposed page structures

These are text wireframes using existing data/actions, not generated visual assets.

```text
Administration overview
  Compact title                              Primary action
  Pending approvals | Approved volunteers | Children checked in
  Attention: pendingCount awaiting review     Review volunteers
  Model allocation                           Recent activity
```

```text
Desktop volunteer roster
  Volunteers                                 Add volunteer
  Status tabs: All / Pending / Approved / Rejected
  Search                         Model filter    Export menu
  Selection bar, when needed
  Person: photo + name + ID | Model | Status | Contact | Actions
```

```text
Phone volunteer roster
  Volunteers                      Add
  Search                          Filters
  Applied filter chips
  Name                            Status
  ID · Model                      View details
```

No figure in these wireframes is invented application data. Status counts and lists must remain tied to the existing data source.

## Implementation order

1. Correct labels, role-aware commands, and load-error handling. These address trust and dead ends.
2. Build the compact operational PageHeader/DataToolbar and a better mobile roster. Apply the pattern to volunteers first, then sessions, heads, and security.
3. Recompose the dashboard using its already available pending/approved/session counts. Reduce rail overhead.
4. Improve long forms, enrollment panels, CSV error review, print fit controls, and scanner feedback.
5. Consolidate styles and refine reports once the core flows have been checked with users.

Most of this work can retain current APIs, database schema, business rules, permissions, and print artwork. Additional pending-record lists, true global record search, report date filters, saved presets, or new verification behavior should be scoped separately rather than disguised as layout changes.

## How to judge the result

- At 375px, identify a volunteer, read status, and open details without sideways scrolling.
- At 1280×720, see a useful dashboard task and initial roster content without a large introductory block.
- At short heights and 200% browser zoom, keep dialog input/actions visible or reachable with a clear scroll strategy.
- Use every command with the keyboard, including off-screen results, empty matches, Escape, and focus return.
- Confirm each role's visible navigation matches existing route permissions.
- Verify loaded-empty, filtered-empty, offline, refresh, failed-save, and failed-load states separately.
- Verify selected-row scope across pagination and filter changes before approving or printing.
- Confirm screen preview fitting never changes physical badge/A4 output. Validate one physical print separately.
- Test the real camera, permissions, session selection, and repeated scans on a phone in a safe test environment.
- Observe representative Admin, Model Head, and security users completing their core tasks. Record completion time, unnecessary navigation, mistakes, and requests for help; compare those observations with a baseline. No improvement percentages are claimed before that comparison.

Recommended first implementation slice: compact volunteer page + identity-first mobile records + role-aware command navigation, followed by the action-oriented dashboard. That slice gives a visible improvement and exercises the shared patterns before extending them across the app.
