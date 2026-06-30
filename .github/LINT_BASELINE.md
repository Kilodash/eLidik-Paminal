# ESLint Baseline

Tanggal: 2026-06-30
Snapshot: 964 errors, 7794 warnings

## Distribusi error (urut prioritas fix)

| Count | Rule | Auto-fixable | Catatan |
|------:|------|:---:|---------|
| 286 | `@typescript-eslint/no-require-imports` | ya (sedang) | `require()` → `import`; banyak di scripts/legacy |
| 200 | `@typescript-eslint/no-this-alias` | tidak | `const self = this` → refactor pakai arrow function atau bind |
| 141 | `@typescript-eslint/ban-ts-comment` | ya | `@ts-ignore` → `@ts-expect-error` + alasan |
| 63  | `@typescript-eslint/no-explicit-any` | tidak | Tambah tipe konkret |
| 47  | `@typescript-eslint/ban-ts-comment` (deskripsi hilang) | ya | Tambah komentar alasan |
| 41  | `@next/next/no-assign-module-variable` | tidak | Tidak assign ke `module` di client component |
| 19  | `no-empty-object-type` | ya | Ganti `{}` dengan `Record<string, unknown>` |
| 16  | `react-hooks/rules-of-hooks` | tidak | Hooks harus dipanggil top-level, bukan dalam callback |
| 16  | `react-hooks/rules-of-hooks` (useScope) | tidak | Sama |
| ~135 | lain-lain | campuran | |

## Strategi fix

1. **Batch 1 — auto-fixable**: jalankan `npx eslint . --fix` (sudah dilakukan, sisanya butuh manual)
2. **Batch 2 — no-this-alias**: refactor 200 occurrences. Pola: ganti `function foo() { var self = this; ... }` jadi `const foo = () => { ... }` atau pakai `bind`
3. **Batch 3 — no-explicit-any**: audit 63 occurrences, ganti tipe
4. **Batch 4 — react-hooks**: audit conditional hooks, fix

## Tracking

Hapus baris ini saat count = 0:

```
CURRENT_ERRORS=964
```

Update via:
```bash
npx eslint . --quiet 2>&1 | Tee-Object -FilePath $env:TEMP\e.txt | Out-Null
(Get-Content $env:TEMP\e.txt | Select-String "error").Count
```
