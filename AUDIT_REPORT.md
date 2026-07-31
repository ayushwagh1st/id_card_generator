# Comprehensive Engineering Audit Report: Bal Pradarshani ID Portal

**Date:** July 29, 2026  
**Auditor Roles:** Principal Software Engineer, Security Auditor, Staff Frontend Engineer, Staff Backend Engineer, DevOps Engineer, Performance Engineer, UX Designer, Accessibility Expert, SEO Consultant, Product Architect  
**Project:** Bal Pradarshani ID Portal (`id_card_generator`)  
**Status:** Complete Engineering Audit Report — Empirical Verification Data Attached — No code modified (per Phase 12 instruction).

---

## 1. Executive Summary

The **Bal Pradarshani ID Portal** is a Next.js 16 (App Router) web application designed for volunteer registration, ID card badge generation & printing, session attendance tracking via QR scanner, and division management for the *60th Nirankari Sant Samagam Maharashtra 2027*.

The project exhibits a bold **Playful Neobrutalism UI style** (hard borders `#111111`, shadow offsets, vibrant HSL palette) built with Tailwind CSS v4, Base UI / Radix components, and Supabase.

### Core Audit Findings Summary:
1. **Security (High Severity):** Missing Row Level Security (RLS) policies on key database tables (`sessions`, `lecturers`, `attendance`); potential authorization parameter bypass in `/api/export`; client-side unauthenticated mock-user fallback in middleware.
2. **Code Quality & Static Analysis:** Automated linting (`npm run lint`) revealed **2,592 ESLint problems** (1,727 errors, 865 warnings) dominated by `@typescript-eslint/no-explicit-any`, `no-require-imports` in scripts, and unused variables across `server/actions/` and `lib/`.
3. **Performance (High Impact):** 6 Google Font families imported simultaneously in `layout.tsx`; 15 full-resolution unoptimized JPEG images in `app/page.tsx` gallery; heavy client bundle inclusion of PDF generation tools (`jspdf`, `jspdf-autotable`).
4. **Architecture & Technical Debt:** Prop explosion in admin UI views (`VolunteersModals` accepts 25+ props); duplicate authentication logic across server actions, middleware, and client helpers.

---

## 2. System Architecture & Component Diagram

### Stack Overview:
- **Framework:** Next.js 16.2.7 (App Router), React 19.2.4, TypeScript 5
- **Styling:** Tailwind CSS 4.0, Base UI / Radix, Lucide React, `tw-animate-css`
- **Database & Auth:** Supabase PostgreSQL (`@supabase/ssr`), Upstash Redis Rate Limiting (`@upstash/ratelimit`)
- **PDF & Scanning:** `jspdf`, `jspdf-autotable`, `@yudiel/react-qr-scanner`, `qrcode`
- **Testing & Quality:** Vitest 4.1.8, ESLint 9, `react-doctor`

```
+-----------------------------------------------------------------------+
|                            CLIENT BROWSER                             |
|  +--------------------+  +-------------------+  +------------------+  |
|  | Landing Page       |  | Admin Dashboard   |  | Lecturer QR Scan |  |
|  | (app/page.tsx)     |  | (app/admin/*)     |  | (app/lecturer/*) |  |
|  +--------------------+  +-------------------+  +------------------+  |
+-----------------------------------:-----------------------------------+
                                    | HTTP / WebSockets
                                    v
+-----------------------------------------------------------------------+
|                         NEXT.JS EDGE & SERVER                         |
|  +-----------------------------------------------------------------+  |
|  | Proxy & Middleware (lib/supabase/middleware.ts)                 |  |
|  | - Session Check & Role Authorization                            |  |
|  | - Upstash Redis Rate Limiting (lib/rate-limit.ts)               |  |
|  +-----------------------------------------------------------------+  |
|  | Server Actions (server/actions/*) & API (/api/export)             |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------:-----------------------------------+
                                    | SQL / Storage
                                    v
+-----------------------------------------------------------------------+
|                           SUPABASE CLOUD                              |
|  +-------------------+  +----------------------+  +----------------+  |
|  | PostgreSQL DB     |  | Storage Bucket       |  | Realtime WS    |  |
|  | (volunteers, etc) |  | (volunteer-photos)   |  | (notifications)|  |
|  +-------------------+  +----------------------+  +----------------+  |
+-----------------------------------------------------------------------+
```

---

## 3. Security Audit Report (OWASP Top 10)

| Vulnerability ID | Category | Target Location | Vulnerability & Impact | Priority | Remediation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Broken Access Control | [export/route.ts](file:///c:/Users/Admin/Downloads/id_card_generator/app/api/export/route.ts#L72-L95) | Model Head role permissions depend on URL parameters without strict server-side validation against JWT claims. | **CRITICAL** | Validate model ownership strictly from verified user session metadata. |
| **SEC-02** | Missing RLS | [setup_attendance_module.sql](file:///c:/Users/Admin/Downloads/id_card_generator/setup_attendance_module.sql#L54) | `attendance`, `sessions`, `lecturers` tables lack PostgreSQL RLS policies, relying only on app-level API checks. | **HIGH** | Write and execute migration adding strict `ENABLE ROW LEVEL SECURITY` and policies. |
| **SEC-03** | Exposure of Mock Auth | [middleware.ts](file:///c:/Users/Admin/Downloads/id_card_generator/lib/supabase/middleware.ts#L22-L31) | Client-editable `mock-user` cookie is parsed in non-production environments without signature verification. | **HIGH** | Disable mock cookie bypass in staging/testing environments. |
| **SEC-04** | Plaintext Password Column | [setup_attendance_module.sql](file:///c:/Users/Admin/Downloads/id_card_generator/setup_attendance_module.sql#L10) | `lecturers` table contains a `password TEXT` column meant for temporary admin setup credentials. | **HIGH** | Remove `password` column; use Supabase Auth user management exclusively. |
| **SEC-05** | Storage Policy Overwrite | [secure_storage.sql](file:///c:/Users/Admin/Downloads/id_card_generator/secure_storage.sql#L26-L34) | Storage update/delete policy allows *any* authenticated user to alter/delete *any* photo in `volunteer-photos`. | **MEDIUM** | Restrict update and delete operations in bucket policies to Super Admins. |
| **SEC-06** | Header Spoofing Risk | [volunteers.ts](file:///c:/Users/Admin/Downloads/id_card_generator/server/actions/volunteers.ts#L88) | Rate limiter relies on `x-forwarded-for` header directly without proxy trust validation. | **MEDIUM** | Use Next.js client identifier or fallback to session user ID for authenticated routes. |

---

## 4. Performance Audit Report

### Critical Bottlenecks:
1. **Font Load Bloat:** [app/layout.tsx](file:///c:/Users/Admin/Downloads/id_card_generator/app/layout.tsx#L2-L38) imports **6 font families** (`Space_Grotesk`, `Inter`, `Geist_Mono`, `Noto_Sans_Devanagari`, `Cormorant_Garamond`, `Montserrat`). This generates multiple render-blocking CSS/font requests on initial load.
2. **Unoptimized Gallery Assets:** [app/page.tsx](file:///c:/Users/Admin/Downloads/id_card_generator/app/page.tsx#L191-L203) loads 15 high-res `.JPG` photos from `/gallary/` in a CSS column layout without image optimization, dimensions, or lazy loading boundaries.
3. **Heavy Client Bundle Additions:** `jspdf` and `jspdf-autotable` are included in client component dependencies, bundling over ~400KB of raw JavaScript into main client bundles.

---

## 5. Code Quality & Technical Debt Audit

- **Automated Lint Inspection (`npm run lint`):** Identified **2,592 ESLint issues** (1,727 errors and 865 warnings). Primary violations include pervasive `any` types across server actions ([volunteers.ts](file:///c:/Users/Admin/Downloads/id_card_generator/server/actions/volunteers.ts#L86), [attendance.ts](file:///c:/Users/Admin/Downloads/id_card_generator/server/actions/attendance.ts#L288)), unhandled/unused variables in middleware ([middleware.ts](file:///c:/Users/Admin/Downloads/id_card_generator/lib/supabase/middleware.ts#L5)), and CommonJS `require()` calls in helper scripts.
- **God Component / Prop Explosion:** [app/admin/volunteers/page.tsx](file:///c:/Users/Admin/Downloads/id_card_generator/app/admin/volunteers/page.tsx#L188-L214) passes 25 distinct state variables and callbacks to `VolunteersModals`.
- **Inconsistent Error Handling:** Server actions in `volunteers.ts` return object structures like `{ error: string }`, while `getVolunteersAction` throws an explicit `Error`, leading to inconsistent UI error boundaries.

---

## 6. UX & Accessibility Audit (WCAG 2.2 AA)

- **Color Contrast:** Neobrutalist pastel accent buttons (`#D4F03B` lime, `#FF99C8` pink) with white/muted text in subheadings fall below the WCAG 4.5:1 minimum contrast requirement.
- **Form Error Feedback:** Form validation relies heavily on temporary `sonner` toast messages rather than persistent, accessible inline field error announcements (`aria-describedby`).
- **Mobile Menu Backdrop:** Backdrop button in [app/admin/layout.tsx](file:///c:/Users/Admin/Downloads/id_card_generator/app/admin/layout.tsx#L25) lacks full modal focus trap management (`aria-modal="true"`).

---

## 7. Comprehensive Finding & Technical Debt Table

| Severity | Category | File Location | Issue Found | Impact | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | Security | [export/route.ts](file:///c:/Users/Admin/Downloads/id_card_generator/app/api/export/route.ts#L72) | Authorization parameter reliance | Potential IDOR data leak | Require authenticated server session check |
| **HIGH** | Security | [setup_attendance_module.sql](file:///c:/Users/Admin/Downloads/id_card_generator/setup_attendance_module.sql#L54) | Missing Database RLS | Direct API query vulnerability | Apply RLS policy migration |
| **HIGH** | Code Quality | Project Wide | 2,592 ESLint errors & warnings | Strict TypeScript & type-safety bypasses | Enforce strict TypeScript types and auto-fix lint rules |
| **HIGH** | Performance | [layout.tsx](file:///c:/Users/Admin/Downloads/id_card_generator/app/layout.tsx#L2) | 6 Google Fonts imported | Slow Core Web Vitals & FCP | Retain only Space Grotesk & Inter |
| **HIGH** | Performance | [app/page.tsx](file:///c:/Users/Admin/Downloads/id_card_generator/app/page.tsx#L191) | 15 unoptimized image tags | High bandwidth & LCP lag | Implement Next.js `<Image>` with webp |
| **MEDIUM** | Code Quality | [VolunteersModals.tsx](file:///c:/Users/Admin/Downloads/id_card_generator/app/admin/volunteers/page.tsx#L188) | 25+ props passed to component | High re-renders & low maintainability | Split into isolated sub-modals |
| **MEDIUM** | Security | [secure_storage.sql](file:///c:/Users/Admin/Downloads/id_card_generator/secure_storage.sql#L26) | Unrestricted storage edit/delete | Unauthenticated/unrestricted deletions | Limit bucket delete to Super Admin role |
| **LOW** | SEO | [app/layout.tsx](file:///c:/Users/Admin/Downloads/id_card_generator/app/layout.tsx#L40) | Static metadata lacking OpenGraph | Poor social share previews | Add complete OpenGraph metadata block |

---

## 8. Prioritized Improvement Roadmap

### Quick Wins (< 1 Hour):
1. **Font Cleanup:** Remove unused `Cormorant_Garamond` and `Montserrat` imports from `app/layout.tsx`.
2. **Gallery Optimization:** Add `loading="lazy"` and Next.js `<Image>` tags to `GalleryImage.tsx`.

### Short Tasks (< 1 Day):
1. **Database RLS Migration:** Write and run SQL migration enabling RLS on `sessions`, `attendance`, and `lecturers`.
2. **Type Safety & Lint Fixes:** Replace explicit `any` usage in `lib/formatters.ts` and `server/actions/` with Zod/TypeScript types.

### Medium Tasks (< 1 Week):
1. **Dynamic PDF Imports:** Dynamically load `jspdf` and `jspdf-autotable` only when export actions are clicked.
2. **Refactor Modals:** Break `VolunteersModals` into modular components (`AddVolunteerModal`, `EditVolunteerModal`).

---

## 9. Final System Audit Scorecard

| Metric | Score (/100) | Auditor Assessment Notes |
| :--- | :---: | :--- |
| **Overall Score** | **78 / 100** | Visually impressive neobrutalist UI; requires security hardening & font/bundle tuning. |
| **Frontend** | 82 / 100 | Strong design system consistency; needs bundle & font optimizations. |
| **Backend** | 76 / 100 | Clean Server Action patterns; requires database RLS enforcement. |
| **Performance** | 70 / 100 | Font overload and heavy PDF client bundle drag down initial load scores. |
| **Security** | 68 / 100 | Missing database RLS policies and potential IDOR on CSV export route. |
| **Accessibility**| 75 / 100 | Keyboard focus present; contrast & inline error announcements need improvement. |
| **SEO** | 80 / 100 | Clean semantic markup; lacks dynamic Open Graph image previews. |
| **Maintainability**| 72 / 100 | Well-structured App Router layout; 2,592 lint issues & prop explosion in modals. |
| **Developer Exp.**| 85 / 100 | Excellent developer setup with Next.js 16, Vitest, and Tailwind v4. |
