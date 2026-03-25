# plan.md — Simondu Web (Simondu Monitoring Dumas)

## 1) Objectives
- Deliver a working MVP for **registrasi Dumas → disposisi ke Unit → input Tindak Lanjut → ajukan verifikasi → pimpinan setujui/revisi → notifikasi realtime**.
- Use **React (Vercel)** + **FastAPI** + **Supabase Postgres** with **soft delete** + role-based access.
- Provide dummy seed data + 9 default users; enable docx generation from templates (placeholder first).

## 2) Implementation Steps (Phased)

### Phase 1 — Core POC (isolation, must pass before building full app)
Focus: prove the hardest integration chain works end-to-end: **FastAPI ↔ Supabase Postgres + JWT RBAC + notification insert + docx generation**.

**User stories**
1. As a developer, I want a script to connect to Supabase Postgres and run migrations so I know the DB is reachable.
2. As a developer, I want to create/login a user and get a JWT so I can validate auth works.
3. As a unit user, I want to create a Tindak Lanjut and submit for verification so I can test workflow transitions.
4. As a pimpinan, I want to approve/revise and see a notification row inserted so I can trust the maker-checker flow.
5. As an admin, I want to generate a .docx from a template with dynamic fields so I know exports will work.

**Steps**
- Web search: best practices for FastAPI JWT (access+refresh), SQLAlchemy+Postgres soft delete patterns, python-docx templating approach.
- Backend-only POC:
  - Minimal FastAPI app with endpoints: `/auth/login`, `/auth/me`, `/dumas`, `/tindak-lanjut`, `/approval/approve`, `/approval/revise`, `/docs/{type}`.
  - Connect to Supabase Postgres using `DATABASE_URL`.
  - Create migrations (Alembic) for tables (incl `deleted_at`).
  - Seed: settings dummy + 9 users (passwords documented in env/seed output).
- Minimal Python test scripts (run locally/CI):
  - `poc_db.py`: connect + insert/select with `deleted_at IS NULL`.
  - `poc_auth.py`: login -> JWT -> call protected route.
  - `poc_workflow.py`: create dumas -> assign unit -> create tindak_lanjut -> submit -> approve/revise -> verify notifications inserted.
  - `poc_docx.py`: generate docx using placeholder template.
- Fix until all scripts pass reliably.

**Deliverable**: green POC scripts + stable FastAPI core endpoints.

---

### Phase 2 — V1 App Development (MVP UI + API, auth deferred until Phase 4)
Build the app around the proven core flow. Keep UI mobile-first, Navy/Gold theme, Framer Motion transitions.

**User stories**
1. As an admin, I want to register Dumas with combo/date/checklist inputs so data entry is fast and consistent.
2. As an admin, I want to dispose/assign a Dumas to a Unit so follow-up ownership is clear.
3. As a unit, I want to fill Tindak Lanjut with date validation so I avoid inconsistent timelines.
4. As a unit, I want to submit for verification and have the form lock so there’s no accidental edits.
5. As a pimpinan, I want to approve/revise with notes and have the maker notified so decisions are actionable.

**Steps**
- Frontend (React + React Router):
  - App shell: glassy header, bottom nav/drawer for mobile; badge for notifications.
  - Pages (MVP): Login placeholder (no auth gating yet), Dumas List + Create, Dumas Detail (assign/merge), Tindak Lanjut Form, Approval Inbox (pimpinan), Notifications.
  - Components: DataTable w/ mobile card view, form controls (Shadcn), skeleton loaders, toast.
  - Validation: React Hook Form + Zod; date chain validation for tindak_lanjut.
- Backend expand:
  - CRUD endpoints for `dumas`, `tindak_lanjut`, `settings` (read), `notifications`.
  - Auto-numbering service (based on settings format + roman month).
  - Soft delete behavior + archive endpoints.
- Realtime notifications:
  - Supabase JS client subscribes to `notifications` insert; filter by `target_user_id` or `target_role`.
  - UI: toast + badge increment + mark-as-read.
- Document generation (MVP): endpoint returns `.docx` download for UUK/Sprin/SP2HP2 using placeholder mapping.

**Checkpoint testing (end of phase)**
- 1 full E2E pass: create Dumas → assign → unit submits tindak lanjut → pimpinan revise → unit resubmit → approve → notifications + docx download.

---

### Phase 3 — Feature Expansion (production-friendly + dashboards + settings)

**User stories**
1. As a superadmin, I want to manage master settings (satker/jenis/wujud/anggota/format surat) so the app matches real ops.
2. As a pimpinan, I want an executive dashboard with SLA color warnings so I can spot overdue cases.
3. As an admin, I want merge Dumas (parent-child) so duplicates are tracked properly.
4. As a superadmin, I want trash/archive views to restore or permanently purge so data lifecycle is controlled.
5. As a unit, I want to attach/update document links (file_dokumen_url) so evidence is centralized.

**Steps**
- Dashboard (Recharts): counts by status, SLA aging buckets; warning list.
- Settings module (CRUD JSONB) + UI editors.
- Merge Dumas UX and backend constraints.
- Archive/trash flows with soft delete filters.
- Tighten permissions matrix per role for each endpoint.

**Checkpoint testing (end of phase)**
- E2E: settings update affects forms + autonumbering; SLA highlights correct; merge works; restore from trash works.

---

### Phase 4 — Authentication + Hardening + Deployment
Implement custom JWT auth end-to-end and lock down all pages and APIs.

**User stories**
1. As a user, I want to login and stay signed in so I can work without repeated logins.
2. As a superadmin, I want strict RBAC so each role only sees permitted data.
3. As an admin, I want audit-friendly timestamps/updated_at consistency so monitoring is reliable.
4. As a pimpinan, I want approval actions to be idempotent so double-click doesn’t duplicate outcomes.
5. As ops, I want simple deployments (Vercel frontend + backend URL) so releases are predictable.

**Steps**
- FastAPI auth:
  - Password hashing (bcrypt/argon2), access+refresh tokens, token rotation optional.
  - Role guards + unit scoping.
- Frontend auth:
  - Login page, protected routes, token storage strategy (httpOnly cookie via backend preferred; fallback: in-memory + refresh).
- Deployment:
  - Frontend to Vercel (env: API base URL, Supabase public keys for realtime only).
  - Backend deploy (Render/Fly.io/Railway) with `DATABASE_URL`, JWT secrets, CORS.
- Observability: structured logs, basic rate limiting, validation errors surfaced nicely.

**Final testing**
- Full role-based E2E with the 9 default accounts + regression on workflow + realtime + docx.

## 3) Next Actions
1. Receive document templates (UUK/Sprin/SP2HP2) + field mapping list (placeholder names) to wire python-docx properly.
2. Confirm backend hosting choice (Render/Fly.io/Railway) and expected domain(s) for CORS.
3. Proceed with Phase 1 POC: set up migrations + seed + POC scripts; report results.

## 4) Success Criteria
- Core flow works end-to-end: Dumas created → assigned → tindak lanjut submitted → approved/revised with notes.
- Notifications arrive in realtime (badge + toast) for the correct target user/role.
- Soft delete enforced across queries; archive/trash behaves correctly.
- Auto-numbering matches settings format incl roman month.
- .docx exports download successfully and populate key fields.
- Deployed frontend on Vercel + stable backend URL; 9 default accounts can log in and operate per role.