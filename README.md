# eLidik Paminal

Sistem digitalisasi lidik paminal Polri.

## Stack
- Next.js 16 + React 19 + TypeScript
- Supabase (Postgres + Auth + Storage + RLS)
- Ant Design 6 + shadcn/ui + Tailwind 4
- TipTap (rich editor), docxtemplater/pdf-lib (docx/pdf)
- Recharts, Zustand

## Setup lokal
```bash
npm install
cp .env.local.example .env.local   # isi kredensial Supabase
npm run dev                        # http://localhost:4000
```

## Scripts
| Command          | Fungsi                                |
|------------------|---------------------------------------|
| `npm run dev`    | Dev server (port 4000)                |
| `npm run build`  | Production build                      |
| `npm run start`  | Jalankan production build             |
| `npm run lint`   | ESLint check                          |
| `npm run format` | Prettier write                        |
| `npm run check`  | Lint + format check (CI parity)       |

## Struktur
```
src/          App routes, components, lib, hooks
supabase/     SQL migrations (urut = urutan eksekusi)
docs/         SOP, aturan, referensi
frontend/     Aset frontend tambahan
scripts/      Utilitas build/seed
```

## CI
- PR/push → lint + typecheck + build
- `supabase/**` berubah → SQL lint via Supabase CLI
- Dependabot auto-update mingguan (Senin 08:00 WIB)

## MCP (opsional)
Konfigurasi di `.vscode/mcp.json`:
- `supabase` — query DB, jalankan migrasi
- `github` — kelola PR/issue
- `filesystem` — akses `supabase/` & `docs/`

Butuh env: `SUPABASE_ACCESS_TOKEN`, `GITHUB_TOKEN`.
