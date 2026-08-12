# Graph Report - C:\Users\Admin\Downloads\id_card_generator  (2026-08-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 593 nodes · 1710 edges · 62 communities (26 shown, 36 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7cbf9e1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- lecturers/page.tsx
- cn
- devDependencies
- client.ts
- compilerOptions
- RegistrationEmail.tsx
- scanner/page.tsx
- components.json
- admin/dashboard/page.tsx
- app/layout.tsx
- dependencies
- manifest.json
- audit_uuids.js
- app/page.tsx
- proxy.ts
- IDCard.tsx
- generate-volunteers.js
- load-test.js
- export/route.ts
- setupTests.ts
- head/volunteers/page.tsx
- class-variance-authority
- clsx
- eslint.config.mjs
- framer-motion
- next
- next.config.ts
- next-themes
- jspdf
- jspdf-autotable
- lucide-react
- papaparse
- qrcode
- react
- react-dom
- @react-email/components
- @react-email/render
- react-image-crop
- react-to-print
- recharts
- shadcn
- sonner
- @supabase/ssr
- @supabase/supabase-js
- tw-animate-css
- @types/qrcode
- @upstash/ratelimit
- @upstash/redis
- @yudiel/react-qr-scanner
- zod
- postcss.config.mjs
- @base-ui/react

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 73 edges
2. `checkAuth()` - 64 edges
3. `cn()` - 64 edges
4. `Button()` - 33 edges
5. `GlassCard()` - 27 edges
6. `Skeleton()` - 20 edges
7. `exportToPDF()` - 18 edges
8. `logActivityAction()` - 18 edges
9. `CardHeader()` - 18 edges
10. `CardTitle()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `AdminDashboard()` --calls--> `getDashboardStatsAction()`  [EXTRACTED]
  app/admin/dashboard/page.tsx → server/actions/dashboard.ts
- `LecturersPage()` --calls--> `exportToPDF()`  [EXTRACTED]
  app/admin/lecturers/page.tsx → lib/pdf.ts
- `createModelHeadAction()` --calls--> `sendRegistrationEmail()`  [EXTRACTED]
  app/admin/models/actions.server.ts → lib/email.ts
- `ModelsPage()` --calls--> `formatHeadLabel()`  [EXTRACTED]
  app/admin/models/page.tsx → lib/formatters.ts
- `ModelsPage()` --calls--> `exportToPDF()`  [EXTRACTED]
  app/admin/models/page.tsx → lib/pdf.ts

## Import Cycles
- None detected.

## Communities (62 total, 36 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.06
Nodes (79): DirectoryPage(), HeadsPage(), LecturersPage(), createModelAction(), createModelHeadAction(), deleteModelAction(), deleteModelHeadAction(), getHeadsDataAction() (+71 more)

### Community 1 - "lecturers/page.tsx"
Cohesion: 0.16
Nodes (34): LecturersTable(), PrintSettings(), PrintSettingsProps, mirrorPageForBack(), PrintCenter(), reports, VolunteersTableProps, HeadReportsPage() (+26 more)

### Community 2 - "cn"
Cohesion: 0.10
Nodes (34): VolunteersFilters(), VolunteersFiltersProps, VolunteersHeader(), VolunteersModals(), VolunteersTable(), VolunteersPage(), AlertDialog(), AlertDialogAction() (+26 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, tailwindcss (+31 more)

### Community 4 - "client.ts"
Cohesion: 0.08
Nodes (20): BulkQRPage(), LiveAttendancePage(), LoginPage(), GlobalNotificationProvider(), CommandItem, CommandPalette(), Header(), HeaderProps (+12 more)

### Community 5 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, gstack, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 6 - "RegistrationEmail.tsx"
Cohesion: 0.08
Nodes (25): card, container, footer, headerDecor, hr, infoBox, infoHr, infoLabel (+17 more)

### Community 7 - "scanner/page.tsx"
Cohesion: 0.12
Nodes (24): LecturerDashboard(), playBeep(), ScannerContent(), handleBulkCheckout(), formatHeadLabel(), formatLecturerLabel(), formatSessionLabel(), FormattableHead (+16 more)

### Community 8 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "admin/dashboard/page.tsx"
Cohesion: 0.24
Nodes (5): AdminDashboard(), VolunteersChart, getHeadDashboardDataAction(), HeadDashboardPage(), QRScannerDialog()

### Community 10 - "app/layout.tsx"
Cohesion: 0.18
Nodes (9): geistMono, inter, metadata, notoDevanagari, spaceGrotesk, viewport, PWAInstaller(), ThemeProvider() (+1 more)

### Community 11 - "dependencies"
Cohesion: 0.22
Nodes (9): browser-image-compression, dependencies, browser-image-compression, qrcode.react, resend, tailwind-merge, qrcode.react, resend (+1 more)

### Community 12 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 13 - "audit_uuids.js"
Cohesion: 0.29
Nodes (5): allFiles, fileTypes, fs, path, targetDirs

### Community 14 - "app/page.tsx"
Cohesion: 0.40
Nodes (3): stats, steps, GalleryImage()

### Community 15 - "proxy.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, proxy()

### Community 22 - "head/volunteers/page.tsx"
Cohesion: 0.16
Nodes (25): generatePassword(), HeadsModals(), HeadsTable(), generatePassword(), LecturersModals(), VolunteersModalsProps, initialState, reducer() (+17 more)

## Knowledge Gaps
- **187 isolated node(s):** `State`, `PDFOptions`, `RateLimitTracker`, `PrintSettingsProps`, `VolunteersModalsProps` (+182 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `createClient` to `admin/dashboard/page.tsx`, `client.ts`, `scanner/page.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `lecturers/page.tsx`, `client.ts`, `head/volunteers/page.tsx`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `checkAuth()` connect `createClient` to `scanner/page.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `State`, `PDFOptions`, `RateLimitTracker` to the rest of the system?**
  _187 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.060835831423029445 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._