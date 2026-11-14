# Public interface verification

Date: 2026-11-14. Mode: during, selected by the owner in this chat.

Scope: home, sign-in, support, archive viewer, and shared public header/footer. Authenticated management screens are outside this design pass. Public styles are isolated in `app/public.module.css`; global changes add interaction cursors, correct the default theme, and update browser chrome color.

Direction: owner-selected warm editorial, cream, navy, restrained saffron, real event photography. Design Read: volunteer registration portal for Model Heads and organizers; ENERGY 2 / RHYTHM 2 / MOTION 1. Reasons are recorded in `DESIGN.md`.

## Verification evidence

- Production: `npm run build -- --webpack` passed, including TypeScript and all 32 static pages.
- TypeScript: `npx tsc --noEmit` passed.
- Lint: ESLint passed for every changed TSX file and the new tests.
- UI tests: 9 passed, covering empty fields, password visibility, duplicate submission, loading, rejected credentials, connection errors, role destinations, and image loading/error feedback. Authentication is mocked in these tests; no requests leave the test process.
- Responsive: 22 page/theme/width combinations passed with no horizontal overflow or visible controls below 44px in either dimension. Home: 320, 390, 768, 1024, 1440px in both themes. Sign-in and support: 320, 768, 1440px in both themes.
- Browser: final console error query returned an empty array.
- Contrast: light primary text 13.19:1; light secondary text on its darkest surface 5.18:1; light action label 5.72:1; dark primary text 14.12:1; dark secondary text 7.51:1; dark action label 7.61:1; event-band secondary text 9.10:1. Ratios calculated from the actual CSS colors using WCAG relative luminance.
- Preview images and raw responsive results are saved in this chat's visualization directory as `bal-pradarshani-desktop.png`, `bal-pradarshani-mobile.png`, and `responsive-checks.json`.

## Recorded interaction checks

| Element | Observed result |
| --- | --- |
| Product-name link | Returned to the home page |
| Registration navigation | Reached `/#process` |
| Gallery navigation | Reached `/#gallery`; repeated section navigation replaces the fragment correctly |
| Support navigation | Opened `/support` |
| Header sign-in | Opened `/login` |
| Sign in to register | Opened `/login` |
| How registration works | Reached `/#process` |
| Open registration portal | Opened `/login` |
| Need help signing in | Opened `/support` |
| Sign-in support link | Opened `/support` |
| Footer support link | Opened `/support` |
| Back to the portal | Returned to `/` |
| Theme button | Switched both ways; checked all three public pages in both themes |
| Gallery thumbnails 1, 2, 3, 4, 5, 6 | Each opened the corresponding photograph in the dialog |
| View all 15 photographs | Opened the archive viewer |
| Next | Advanced through all 15 positions and wrapped to the first |
| Previous | Returned to the previous photograph |
| Arrow Left | Wrapped from photograph 1 to photograph 15 |
| Close | Dismissed the viewer |
| Escape | Dismissed the viewer and returned focus to its opening control |
| Tab / Shift+Tab in viewer | Wrapped between Close and Next, retaining focus in the dialog |
| Skip to content | Set `#main-content` and focused the MAIN element |
| Empty sign-in submission | Native required-field validation appeared and focused email |
| Password visibility | Show/hide changed input type in an isolated component test |
| Sign-in submission states | Mocked progress, rejection, connection error, duplicate prevention, and role redirects passed |
| Four telephone links | DOM/code inspection confirmed named `tel:` destinations matching existing repository contacts; no calls placed |
| Mandal website link | DOM/code inspection confirmed existing `https://www.nirankari.org/` destination and safe new-tab attributes |

## Core delivery gate: hard gates

- R-02 PASS: changed UI copy contains no em dash.
- R-03 PASS: 22 responsive/theme checks found no overflow or sub-44px visible controls; mobile screenshots reviewed.
- R-17 PASS: unsourced volunteer/model/division totals removed; remaining event details come from existing content, and archive/step counts are derived from real arrays.
- R-18 PASS: no testimonials or invented identities added.
- R-23 PASS: reused existing photographs, retained existing destinations, and used the product name as a text wordmark; no identity assets generated.
- R-24 PASS: internal destinations exist and were reached in browser checks.
- R-25 PASS: measured text combinations exceed 4.5:1; minimum measured secondary combination is 5.18:1.
- R-26 PASS: internal actions exercised; telephone/external destinations inspected; sign-in state behavior verified with mocked authentication.
- R-27 PASS: empty form, progress, rejection, connection error, photo loading, and photo failure states verified; the archive is a fixed collection of repository assets.
- R-28 PASS: no FAQ added.
- R-32 PASS: native links, buttons, fields, labels, visible focus rings, focused skip target, Escape, focus return, and explicit modal Tab wrapping verified.
- R-33 PASS: features implemented directly in source; no source-rewriting helper scripts added.
- R-34 PASS: home, sign-in, and support checked in both working themes.
- R-35 PASS for the scoped UI verification: app run, production built, console inspected, and interaction evidence recorded above; live authentication and telephone calls were deliberately excluded from browser actions.
- R-36 PASS: removed unsupported system-status and participation claims; no new compliance, security, performance, or customer claims.
- R-37 PASS: owner selected the direction before edits; dials and reasons recorded in `DESIGN.md`.
- R-38 PASS: event information, contact records, and images come from existing repository content; fields initialize empty.
- R-39 PASS: named native controls, visible labels, semantic landmarks, one H1 per public page, unique titles, language declaration, cursor states, and reduced-motion handling present.
- R-40 PASS: media frames reserve aspect ratios; hero uses HTML image, eager loading, and high fetch priority; no new third-party scripts. Lighthouse and field Web Vitals were not measured.

## Core delivery gate: purpose gates

- R-01 PASS: cream/navy/saffron follow the owner's selected identity; action color identifies the registration action.
- R-04 PASS: sun/moon represent theme choice; telephone represents calling; no decorative feature icons.
- R-06 PASS: Georgia gives the event a warm editorial voice; existing Inter serves compact controls and instructions; Devanagari face supports the event theme.
- R-07 PASS: no background grid or decorative pattern.
- R-08 PASS: down arrow indicates section navigation; diagonal arrows indicate portal entry or photo enlargement.
- R-09 PASS: no eyebrow capsule, promotional badge, or decorative status indicator.
- R-10 PASS: no glass or blur surfaces in the redesigned public interface.
- R-12 PASS: flat sections avoid unnecessary elevation; archive dialog is distinguished with a backdrop.
- R-13 PASS: no glow effects.
- R-14 PASS: instructions use ordered rows; support uses a contact list; photography uses an archive grid, not feature cards.
- R-19 PASS: only brief interaction feedback; no entrance animations or loops; reduced-motion override included.
- R-22 PASS: existing event photography replaces the generic hero illustration.

## Core delivery gate: liveliness

- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 declared before generation.
- Dial consistency PASS: expressive serif introduction, varied content-led sections, calm interaction-only motion.
- Focal points PASS: introduction headline on home, sign-in form on login, contact introduction/list on support.
- Whitespace PASS: section separation is larger than spacing between related fields or steps.
- Accent PASS: saffron identifies the main action and editorial headline emphasis.
- Motif PASS: programme-style captions, horizontal rules, serif voice, and one softened photo corner repeat deliberately.
- Design Read PASS: communicated before implementation and recorded above.

## Core delivery gate: craftsmanship and quality locks

- C-1 PASS: major choices have one-line reasons in `DESIGN.md`.
- C-2 PASS: enabled controls have real behaviors; evidence and testing boundaries are recorded above.
- C-3 PASS: every section serves event context, registration, the existing archive, or support.
- C-4 PASS: checked two themes, five home widths, three widths for other pages, keyboard interactions, and loading/error states.
- C-5 PASS: no invented testimonials, metrics, or claims.
- R-05 PASS: editorial introduction, event-theme band, ordered registration list, photo archive, and short registration prompt follow actual content needs.
- R-11 PASS: 4px controls, nearly square photographs with one softened corner, circular theme control, and 6px dialog have distinct functions.
- R-15 PASS: action labels name registration, sign-in, contact, or archive actions.
- R-16 PASS: generic marketing language and the old spatial-portal claims removed.
- R-20 PASS: actual event photography, bilingual theme, volunteer-specific instructions, and programme-style composition establish the identity.
- R-21 PASS: working light/dark choice is available; light is the explicit default.
- R-29 PASS: cream, navy, and restrained saffron form the core palette, with neutral variants for readability.
- R-30 PASS: no named-product visual clone used.
- R-31 PASS: color, layout, typography, spacing, motif, surfaces, radius, icons, motion, theme, and content reasons written down.

## UI supplement

- Palette PASS: owner-selected direction recorded in `DESIGN.md`.
- Accent restraint PASS: concentrated on the main action and editorial emphasis.
- Emoji PASS: none added.
- Composition PASS: variations match RHYTHM 2.
- Template shapes PASS: no bento, fake terminal, pricing grid, or decorative left stripe.
- Headline space PASS: event details are plain text, with no capsule badge.
- Destinations PASS: internal links tested, external schemes inspected, authentication behavior mocked.
- Motion PASS: interaction feedback only, with reduced-motion support.
- Effects PASS: no glass, glow, or card-wide shadows.
- Status lights PASS: no decorative status dots.
- App job PASS: public content centers on volunteer registration; no generic dashboard shell introduced.
- Navigation shell PASS: three existing destinations remain visible at phone widths, the current public page is marked, and no collapsing rail is introduced.
- Numbers/content PASS: derived archive counts and inherited event/contact information only.
- Form content PASS: empty initial values and descriptive placeholders.
- States PASS: specific loading, authentication, connection, and image-failure feedback.
- Resilience PASS: recorded responsive, theme, focus, and state checks passed.
- Media/performance PASS: reserved image space, correct hero priority, no added blocking third-party scripts; no fabricated metrics.

## Verification boundaries and existing tooling issues

- Automatic approval review rejected a live test-credential submission because it could trigger authentication or security effects. The live request was not retried or routed through another mechanism. The safer replacement was isolated component testing with a mocked authentication client. A real account sign-in was not verified.
- The full existing suite reports 35 passing tests, 9 failing backend tests, and one suite failing to load, across four backend test files. Failures concern missing Supabase configuration and incomplete activity/attendance/session/lecturer mocks. Those backend actions and tests were not changed by this design pass.
- Default Turbopack production build succeeded once, but a later repeat encountered an internal Google-font resolver error (`next/font/google queries have exactly one entry`). The final supported Webpack production build passed. The build script and bundler configuration were not changed.
- Telephone links were not used to place calls, contact details were retained from the repository rather than independently verified, and the external Mandal website was not audited.
