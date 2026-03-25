# plan.md — Simondu Web (Simondu Monitoring Dumas)

## 1) Objectives
- Deliver a working V1 that covers the full operational flow: **registrasi Dumas → disposisi ke Unit → input Tindak Lanjut → ajukan verifikasi → Pimpinan setujui/revisi → notifikasi realtime → cetak dokumen**.
- Use **React (Vercel)** + **FastAPI** + **Supabase Postgres (pooler)** with **soft delete** + role-based access (**superadmin/admin/unit/pimpinan**).
- Provide **dummy seed data + 9 default users** (password: `simondu123`) and baseline settings master data.
- Keep UI **mobile-first** with Police theme (Navy/Gold), **Shadcn UI**, **Tailwind**, **Framer Motion**, skeleton loading, and accessible touch targets.
- Ensure **performance and reliability**: connection pooling, consolidated dashboard API, robust validation, and predictable deployment.

## 2) Implementation Steps (Phased)

### Phase 1 — Core POC (isolation, must pass before building full app)
Focus: prove the hardest integration chain works end-to-end: **FastAPI ↔ Supabase Postgres (pooler) + JWT RBAC + notification insert + docx generation**.

**Status: ✅ COMPLETE**
- Supabase Postgres connectivity confirmed via **pooler URL**.
- DB schema created (users/settings/dumas/tindak_lanjut/tim_lidik/penyelesaian/notifications) + indexes + RLS allow-all (API-level auth).
- Seed data created: **9 users** + settings dummy data.
- JWT auth implemented (login/me) + RBAC guards.
- Core workflow endpoints implemented:
  - Dumas CRUD + merge + soft delete + archive restore/permanent delete
  - Tindak lanjut CRUD + submit → approval (setujui/revisi)
  - Notifications CRUD (unread count, mark read)
  - Dashboard endpoints + SLA warning + chart data
  - Auto-numbering + Roman month
  - .docx generation endpoints (placeholder format)
- **POC test script: 74/74 tests passed**.

**Deliverable**: green POC scripts + stable FastAPI core endpoints.

---

### Phase 2 — V1 App Development (MVP UI + API)
Build the app around the proven core flow. Keep UI mobile-first, Navy/Gold theme, Framer Motion transitions.

**Status: ✅ COMPLETE**

**Implemented pages (React + React Router):**
1. **Login Page** (Navy police theme)
2. **Dashboard**: stats cards + Recharts bar chart + SLA monitoring table
3. **Dumas List**: search/filter, desktop table + mobile card view
4. **Dumas Create**: dynamic dropdowns from settings (satker/jenis/wujud) + unit assignment
5. **Dumas Detail**: tabs (Informasi / Tindak Lanjut / Penyelesaian)
6. **Approval Inbox** (Pimpinan): approve/revise with notes
7. **Settings** (Superadmin): manage satker/jenis/wujud/daftar anggota/format surat
8. **Archive/Trash** (Superadmin): restore + permanent delete

**Implemented app shell:**
- Desktop: Sidebar navigation
- Mobile: Bottom navigation + Drawer menu
- Header: notification bell
- Skeleton loaders + toasts

**Realtime Notifications:**
- Supabase JS client subscription to `notifications` INSERT
- UI: badge + toast + mark-as-read

**Backend improvements added during Phase 2:**
- Connection pooling (ThreadedConnectionPool)
- Dashboard performance optimization:
  - Consolidated stats query
  - Added combined endpoint (renamed to avoid ingress conflict): `/api/dashboard/combined`

**Testing result:**
- E2E + API testing achieved **~92% overall pass rate**
  - Backend: **94%**
  - Frontend: **90%**
- Remaining issues are mostly cosmetic / automation-specific.

**Deliverable**: fully navigable working V1 UI + integrated API.

---

### Phase 3 — Polish + Production Features (templates, UX hardening, admin tools)

**Goal**: finalize production readiness and align with real operational workflows and document formats.

**User stories**
1. As a superadmin, I want to use **real document templates** (UUK/Sprin/SP2HP2) so exported documents match official formats.
2. As an admin, I want **Merge Dumas UI** (parent-child) so duplicates are tracked and visible in the UI.
3. As a superadmin, I want **User management UI** (create/edit/disable/reset password) so accounts can be maintained without DB access.
4. As users, I want **better form UX** (combobox search, validation hints, consistent required markers) so data entry is faster and fewer errors.
5. As ops, I want **performance and stability polishing** (fewer API calls, caching settings, retry strategy) so mobile usage is smooth.

**Steps**
- Document templates (high priority):
  - Integrate user-provided templates (docx) and map placeholder keys → data fields.
  - Add endpoint(s) that load templates from filesystem or object storage and perform variable replacement.
  - Add template versioning strategy (optional): template per doc_type in Supabase Storage.
- Merge Dumas UI:
  - Add UI selection (multi-select) on Dumas list/detail.
  - Visualize parent-child relationships in detail view.
- User management:
  - Add users page (superadmin only) with CRUD and role/unit assignment.
  - Add reset password flow (admin action) and soft-disable users.
- UI polish:
  - Resolve minor automation overlay issues on Select dropdowns (improve z-index/portal layering).
  - Improve loading states per section + empty states.
  - Add mobile spacing/touch target review across forms.
- Backend hardening:
  - Standardize status codes (create endpoints return 201) and response shapes.
  - Add idempotency safety for approval endpoints (prevent double click duplicates).
  - Tighten unit scoping for Dumas/Tindak Lanjut queries.

**Checkpoint testing (end of phase)**
- Full E2E:
  - Create Dumas → assign → unit update TL → submit → pimpinan revise → unit update → resubmit → approve → notifications.
  - Generate docx from real templates for UUK/Sprin/SP2HP2.
  - Merge Dumas UI verified.
  - User management flows verified.

---

### Phase 4 — Deployment Hardening (Vercel + backend hosting) + Security

**Goal**: deploy reliably and secure the system for operational use.

**User stories**
1. As a user, I want stable sessions and secure token handling so access is reliable.
2. As a superadmin, I want strict RBAC + least privilege so data access is controlled.
3. As ops, I want a clean deployment pipeline so releases are predictable.

**Steps**
- Auth security improvements:
  - Consider refresh tokens and rotation (optional).
  - Consider httpOnly cookies strategy (if backend domain allows), otherwise hardened localStorage + short expiry.
- Supabase security:
  - Replace anon allow-all RLS policies with service-role usage from backend (recommended) OR implement proper RLS policies.
- Deployment:
  - Frontend: Vercel (env: `REACT_APP_BACKEND_URL`)
  - Backend: Render/Fly.io/Railway (env: `DATABASE_URL` pooler, `JWT_SECRET`, CORS domains)
- Observability:
  - Structured logging + basic rate limiting
  - Error reporting strategy for production

**Final testing**
- Full role-based E2E with the 9 default accounts + regression on workflow + realtime + docx.

## 3) Next Actions
1. **Receive document templates** (UUK/Sprin/SP2HP2) + field mapping list (placeholder names) to wire python-docx properly.
2. Confirm backend hosting choice (Render/Fly.io/Railway) and expected domain(s) for CORS.
3. Decide document template storage approach:
   - a) committed in repo (fastest)
   - b) Supabase Storage (recommended for updates without redeploy)
4. Proceed with Phase 3: merge UI, user management, template-based docx, final UX polish.

## 4) Success Criteria
- Core flow works end-to-end: Dumas created → assigned → tindak lanjut submitted → approved/revised with notes.
- Notifications arrive in realtime (badge + toast) for the correct target user/role.
- Soft delete enforced across queries; archive/trash behaves correctly.
- Auto-numbering matches settings format incl roman month.
- .docx exports download successfully and populate fields from **official templates**.
- Deployed frontend on Vercel + stable backend URL; all 9 default accounts can log in and operate per role.
