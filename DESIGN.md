# Bal Pradarshani portal

Owner-selected direction: warm and editorial, cream, deep navy, restrained saffron, and real event photography.

Audience: Model Heads and Samagam organizers registering volunteers and preparing event IDs.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1.

- Color: warm cream creates a paper-like setting; deep navy gives forms and copy clarity; saffron identifies the primary registration action.
- Typography: Georgia lends the event a warm editorial voice; the existing locally served Inter keeps navigation and form fields easy to scan; Noto Sans Devanagari supports the event theme.
- Layout: the introduction pairs purpose with real photography, registration becomes an ordered list, and the archive becomes a photo gallery, each following its content.
- Spacing: generous section separation distinguishes introduction, instructions, and archive; compact spacing connects labels with their fields.
- Motif: editorial captions and simple horizontal rules connect the interface to an event programme, without background patterns.
- Surfaces: flat sections replace decorative cards; only the photograph viewer is elevated as a modal.
- Radius: modest rounded controls remain distinct from photography; one softened image corner adds warmth and repeats across home and sign-in.
- Icons: sun and moon communicate display modes, and the telephone marks a call action; arrows are reserved for directional actions and photo enlargement.
- Motion: navigation, tabs, search, and frequent keyboard actions are immediate. Occasional menus use 180ms opacity/scale feedback. Dialogs use a 250ms opacity/scale transition; navigation drawers use 250ms translation. Reduced motion removes translation/scale. Only a real loading operation gets a progress spinner.
- Theme: cream light surfaces and ink-dark alternatives preserve the same content hierarchy; the public header offers the theme choice.
- Assets: existing event photography is reused. The product name is a text wordmark; no new logo, illustration, avatar, or identity is generated.
- Content: existing event details, registration steps, archive images, and support contacts are retained; unsourced participation figures and system-status claims are removed.
- Scope: home, sign-in, support, verification, and all administration, model-head, and security workspaces.

## Workspace design

The owner extended the public direction to the whole app. Shared controls and surfaces carry that direction into task-focused screens. Georgia is reserved for page headings; controls, data, labels, and navigation use the existing sans-serif stack. Cream and navy remain the foundation. Saffron identifies primary actions and the current destination. Status colors only communicate existing record states.

Navigation groups match event work: overview, volunteers, children, event operations, and outputs. Groups can collapse to reduce scanning effort. The sidebar and command search share one role-specific destination registry. The active item has weight and a square marker as well as color. Below 1160px, a named menu trigger opens a focus-managed drawer. Each workspace has a skip link and a support destination.

Volunteer rosters use identity-first tables on desktop and single-column records on phones, retaining status and primary actions. Other wide tables use a keyboard-focusable horizontal scroll region. Buttons, selects, checkboxes, switches, and tabs have at least 44px targets. Forms use visible labels, named field groups, and readable input text. Volunteer dialogs retain visible footer actions while scrolling. Empty states, loading states, and persistent retry feedback reflect actual request results. Roster filters are represented in the URL; selection scope is explicit.

The dashboard emphasizes pending approvals, approved volunteers, and children checked in. Metrics link to the corresponding records, with supporting event totals and activity below. Decorative trend claims and ambient glows are removed. Reports use compact export rows. Phone enrollment switches between available and enrolled records. Print settings collapse on smaller screens; fit-width and fit-page controls change preview scale while retaining physical badge dimensions.

Print artwork is a separate visual context. ID dimensions, QR values, badge artwork, pagination, PDF layouts, and print handlers retain their existing behavior. Authentication, authorization, business server actions, import/export formats, synchronization protocols, and registration rules are outside the design change. UI state and presentation may change to support filters, retry feedback, accessibility, and responsive layouts.
