"""
Simondu Web - Phase 1 POC Test Script
Tests: DB Connection, Auth, CRUD Dumas, Tindak Lanjut, Approval Workflow, Notifications, Docx
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8001/api"
PASSED = 0
FAILED = 0

def test(name, condition, detail=""):
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  ✅ {name}")
    else:
        FAILED += 1
        print(f"  ❌ {name} - {detail}")
    return condition

def section(name):
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")

# ==========================================
# 1. Health Check
# ==========================================
section("1. Health Check")
r = requests.get(f"{BASE_URL}/health")
test("Health endpoint returns 200", r.status_code == 200, f"Got {r.status_code}")
test("Status is ok", r.json().get("status") == "ok")

# ==========================================
# 2. Auth - Login
# ==========================================
section("2. Authentication")

# Test admin login
r = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@simondu.polri.go.id", "password": "simondu123"})
test("Admin login success", r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")
admin_data = r.json()
admin_token = admin_data.get("token", "")
test("Admin token received", len(admin_token) > 0)
test("Admin role is admin", admin_data.get("user", {}).get("role") == "admin")

# Test unit login
r = requests.post(f"{BASE_URL}/auth/login", json={"email": "unit1@simondu.polri.go.id", "password": "simondu123"})
test("Unit1 login success", r.status_code == 200)
unit1_data = r.json()
unit1_token = unit1_data.get("token", "")
unit1_id = unit1_data.get("user", {}).get("id", "")

# Test pimpinan login
r = requests.post(f"{BASE_URL}/auth/login", json={"email": "kasubbid@simondu.polri.go.id", "password": "simondu123"})
test("Pimpinan login success", r.status_code == 200)
pimpinan_data = r.json()
pimpinan_token = pimpinan_data.get("token", "")

# Test superadmin login
r = requests.post(f"{BASE_URL}/auth/login", json={"email": "superadmin@simondu.polri.go.id", "password": "simondu123"})
test("Superadmin login success", r.status_code == 200)
superadmin_data = r.json()
superadmin_token = superadmin_data.get("token", "")

# Wrong password
r = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@simondu.polri.go.id", "password": "wrong"})
test("Wrong password rejected", r.status_code == 401)

# Get me
r = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
test("Get current user works", r.status_code == 200)
test("Email matches", r.json().get("email") == "admin@simondu.polri.go.id")

# No token
r = requests.get(f"{BASE_URL}/auth/me")
test("No token rejected", r.status_code == 401)

# ==========================================
# 3. Settings
# ==========================================
section("3. Settings")
headers_admin = {"Authorization": f"Bearer {admin_token}"}
headers_unit = {"Authorization": f"Bearer {unit1_token}"}
headers_pimpinan = {"Authorization": f"Bearer {pimpinan_token}"}
headers_superadmin = {"Authorization": f"Bearer {superadmin_token}"}

r = requests.get(f"{BASE_URL}/settings", headers=headers_admin)
test("List settings", r.status_code == 200, f"Got {r.status_code}")
test("5 settings exist", len(r.json()) == 5, f"Got {len(r.json())}")

r = requests.get(f"{BASE_URL}/settings/satker", headers=headers_admin)
test("Get satker setting", r.status_code == 200)
satker_list = r.json().get("value", [])
test("Satker has data", len(satker_list) > 0, f"Got {len(satker_list)}")

r = requests.get(f"{BASE_URL}/settings/jenis_dumas", headers=headers_admin)
test("Get jenis_dumas setting", r.status_code == 200)

r = requests.get(f"{BASE_URL}/settings/format_nomor_surat", headers=headers_admin)
test("Get format_nomor_surat", r.status_code == 200)
test("Format has uuk key", "uuk" in r.json().get("value", {}))

# ==========================================
# 4. Users
# ==========================================
section("4. Users")
r = requests.get(f"{BASE_URL}/users", headers=headers_admin)
test("List users", r.status_code == 200)
test("9 users exist", len(r.json()) == 9, f"Got {len(r.json())}")

r = requests.get(f"{BASE_URL}/users/units", headers=headers_admin)
test("List unit users", r.status_code == 200)
test("6 unit users", len(r.json()) == 6, f"Got {len(r.json())}")

# ==========================================
# 5. CRUD Dumas
# ==========================================
section("5. CRUD Dumas")

# Create dumas
dumas_payload = {
    "no_dumas": "DMS/001/VII/2025",
    "tgl_dumas": "2025-07-01",
    "pelapor": "Budi Setiawan",
    "terlapor": "AIPTU Slamet",
    "satker": "Polresta Bandung",
    "wujud_perbuatan": "Pungutan Liar",
    "jenis_dumas": "Pungli",
    "keterangan": "Pelapor melaporkan adanya pungutan liar oleh terlapor",
    "disposisi_kabid": "Untuk ditindaklanjuti",
    "disposisi_kasubbid": "Segera proses",
    "unit_id": unit1_id
}
r = requests.post(f"{BASE_URL}/dumas", json=dumas_payload, headers=headers_admin)
test("Create dumas", r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")
dumas_id = r.json().get("id", "")
test("Dumas ID received", len(dumas_id) > 0)

# Get dumas
r = requests.get(f"{BASE_URL}/dumas/{dumas_id}", headers=headers_admin)
test("Get dumas by ID", r.status_code == 200)
test("Pelapor matches", r.json().get("pelapor") == "Budi Setiawan")

# Update dumas
r = requests.put(f"{BASE_URL}/dumas/{dumas_id}", json={"keterangan": "Updated keterangan"}, headers=headers_admin)
test("Update dumas", r.status_code == 200)
test("Keterangan updated", r.json().get("keterangan") == "Updated keterangan")

# List dumas
r = requests.get(f"{BASE_URL}/dumas", headers=headers_admin)
test("List dumas (admin)", r.status_code == 200 and len(r.json()) >= 1)

# Unit can only see their dumas
r = requests.get(f"{BASE_URL}/dumas", headers=headers_unit)
test("Unit sees own dumas only", r.status_code == 200 and len(r.json()) >= 1)

# Create 2nd dumas for merge test
dumas2_payload = {**dumas_payload, "no_dumas": "DMS/002/VII/2025", "pelapor": "Andi Cahyadi"}
r = requests.post(f"{BASE_URL}/dumas", json=dumas2_payload, headers=headers_admin)
test("Create 2nd dumas", r.status_code == 200)
dumas2_id = r.json().get("id", "")

# ==========================================
# 6. Merge Dumas
# ==========================================
section("6. Merge Dumas")
r = requests.post(f"{BASE_URL}/dumas/merge", json={
    "parent_dumas_id": dumas_id,
    "child_dumas_ids": [dumas2_id]
}, headers=headers_admin)
test("Merge dumas", r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")

# Verify merge
r = requests.get(f"{BASE_URL}/dumas/{dumas2_id}", headers=headers_admin)
test("Child has parent_dumas_id", r.json().get("parent_dumas_id") == dumas_id)

# ==========================================
# 7. Tindak Lanjut + Approval Workflow
# ==========================================
section("7. Tindak Lanjut + Approval Workflow")

# Create tindak lanjut
tl_payload = {
    "dumas_id": dumas_id,
    "tgl_uuk": "2025-07-02",
    "tgl_sprin_lidik": "2025-07-03",
    "no_sprin": "Sprin/001/VII/2025",
    "tgl_gelar": "2025-07-10",
    "tgl_lhp": "2025-07-15",
    "no_lhp": "LHP/001/VII/2025",
    "hasil_lidik": "Berdasarkan hasil penyelidikan, terlapor terbukti melakukan pungutan liar",
    "tgl_nodin": "2025-07-16",
    "no_nodin": "ND/001/VII/2025"
}
r = requests.post(f"{BASE_URL}/tindak-lanjut", json=tl_payload, headers=headers_unit)
test("Create tindak lanjut", r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")
tl_id = r.json().get("id", "")
test("TL status is draft", r.json().get("status_verifikasi") == "draft")

# Update tindak lanjut
r = requests.put(f"{BASE_URL}/tindak-lanjut/{tl_id}", json={"no_berkas": "BRK/001/2025"}, headers=headers_unit)
test("Update tindak lanjut", r.status_code == 200)

# Submit for verification
r = requests.post(f"{BASE_URL}/tindak-lanjut/{tl_id}/submit", headers=headers_unit)
test("Submit for verification", r.status_code == 200)
test("Status is menunggu_verifikasi", r.json().get("status_verifikasi") == "menunggu_verifikasi")

# Try to update locked TL (should fail)
r = requests.put(f"{BASE_URL}/tindak-lanjut/{tl_id}", json={"no_berkas": "BRK/002/2025"}, headers=headers_unit)
test("Locked TL update rejected", r.status_code == 400)

# Pimpinan revises
r = requests.post(f"{BASE_URL}/tindak-lanjut/{tl_id}/approve", json={
    "action": "revisi",
    "catatan_revisi": "Mohon lengkapi data SP2HP2"
}, headers=headers_pimpinan)
test("Pimpinan revises", r.status_code == 200)
test("Status is revisi", r.json().get("status_verifikasi") == "revisi")
test("Catatan revisi saved", r.json().get("catatan_revisi") == "Mohon lengkapi data SP2HP2")

# Unit updates and resubmits
r = requests.put(f"{BASE_URL}/tindak-lanjut/{tl_id}", json={
    "tgl_sp2hp2": "2025-07-20",
    "no_sp2hp2": "SP2HP2/001/VII/2025"
}, headers=headers_unit)
test("Unit updates revised TL", r.status_code == 200)

r = requests.post(f"{BASE_URL}/tindak-lanjut/{tl_id}/submit", headers=headers_unit)
test("Unit resubmits", r.status_code == 200)

# Pimpinan approves
r = requests.post(f"{BASE_URL}/tindak-lanjut/{tl_id}/approve", json={
    "action": "setujui"
}, headers=headers_pimpinan)
test("Pimpinan approves", r.status_code == 200)
test("Status is disetujui", r.json().get("status_verifikasi") == "disetujui")

# Approval inbox
r = requests.get(f"{BASE_URL}/approval/inbox", headers=headers_pimpinan)
test("Approval inbox accessible", r.status_code == 200)

# ==========================================
# 8. Notifications
# ==========================================
section("8. Notifications")

# Pimpinan should have notifications
r = requests.get(f"{BASE_URL}/notifications", headers=headers_pimpinan)
test("Pimpinan has notifications", r.status_code == 200 and len(r.json()) > 0, f"Count: {len(r.json())}")

# Unit should have notifications (from approve/revise)
r = requests.get(f"{BASE_URL}/notifications", headers=headers_unit)
test("Unit has notifications", r.status_code == 200 and len(r.json()) > 0, f"Count: {len(r.json())}")

# Unread count
r = requests.get(f"{BASE_URL}/notifications/unread-count", headers=headers_pimpinan)
test("Unread count works", r.status_code == 200)
test("Has unread", r.json().get("count", 0) > 0)

# Mark as read
notifs = requests.get(f"{BASE_URL}/notifications", headers=headers_pimpinan).json()
if notifs:
    r = requests.put(f"{BASE_URL}/notifications/{notifs[0]['id']}/read", headers=headers_pimpinan)
    test("Mark notification read", r.status_code == 200)

# Mark all read
r = requests.put(f"{BASE_URL}/notifications/read-all", headers=headers_pimpinan)
test("Mark all read", r.status_code == 200)

# ==========================================
# 9. Dashboard Stats
# ==========================================
section("9. Dashboard Stats")

r = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers_admin)
test("Dashboard stats", r.status_code == 200)
stats = r.json()
test("Total dumas > 0", stats.get("total", 0) > 0)
test("Dalam proses > 0", stats.get("dalam_proses", 0) > 0)

r = requests.get(f"{BASE_URL}/dashboard/sla-warning", headers=headers_admin)
test("SLA warning list", r.status_code == 200)

r = requests.get(f"{BASE_URL}/dashboard/chart-data", headers=headers_admin)
test("Chart data", r.status_code == 200)

# ==========================================
# 10. Auto Numbering
# ==========================================
section("10. Auto Numbering")

r = requests.get(f"{BASE_URL}/auto-number/uuk?tanggal=2025-07-15&unit=PAMINAL", headers=headers_admin)
test("Auto number UUK", r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")
test("Has number field", "number" in r.json(), f"Response: {r.json()}")

r = requests.get(f"{BASE_URL}/auto-number/sprin?tanggal=2025-07-15", headers=headers_admin)
test("Auto number Sprin", r.status_code == 200)

# ==========================================
# 11. Document Generation
# ==========================================
section("11. Document Generation (.docx)")

r = requests.get(f"{BASE_URL}/documents/uuk/{dumas_id}", headers=headers_admin)
test("Generate UUK docx", r.status_code == 200, f"Got {r.status_code}")
test("UUK content type is docx", "wordprocessingml" in r.headers.get("content-type", ""))

r = requests.get(f"{BASE_URL}/documents/sprin/{dumas_id}", headers=headers_admin)
test("Generate Sprin docx", r.status_code == 200)

r = requests.get(f"{BASE_URL}/documents/sp2hp2/{dumas_id}", headers=headers_admin)
test("Generate SP2HP2 docx", r.status_code == 200)

# ==========================================
# 12. Soft Delete & Archive
# ==========================================
section("12. Soft Delete & Archive")

# Soft delete dumas
r = requests.delete(f"{BASE_URL}/dumas/{dumas2_id}", headers=headers_admin)
test("Soft delete dumas", r.status_code == 200)

# Verify it's hidden from normal list
r = requests.get(f"{BASE_URL}/dumas", headers=headers_admin)
dumas_ids = [d["id"] for d in r.json()]
test("Deleted dumas hidden from list", dumas2_id not in dumas_ids)

# Superadmin can see archived
r = requests.get(f"{BASE_URL}/archive/dumas", headers=headers_superadmin)
test("Superadmin sees archive", r.status_code == 200 and len(r.json()) > 0)

# Restore
r = requests.post(f"{BASE_URL}/archive/dumas/{dumas2_id}/restore", headers=headers_superadmin)
test("Restore dumas", r.status_code == 200)

# Verify restored
r = requests.get(f"{BASE_URL}/dumas/{dumas2_id}", headers=headers_admin)
test("Restored dumas accessible", r.status_code == 200)

# ==========================================
# 13. RBAC Tests
# ==========================================
section("13. RBAC (Role-Based Access)")

# Unit can't create dumas
r = requests.post(f"{BASE_URL}/dumas", json=dumas_payload, headers=headers_unit)
test("Unit can't create dumas", r.status_code == 403)

# Unit can't approve
r = requests.post(f"{BASE_URL}/tindak-lanjut/{tl_id}/approve", json={"action": "setujui"}, headers=headers_unit)
test("Unit can't approve", r.status_code == 403)

# Admin can't see archive
r = requests.get(f"{BASE_URL}/archive/dumas", headers=headers_admin)
test("Admin can't see archive", r.status_code == 403)

# ==========================================
# RESULTS
# ==========================================
print(f"\n{'='*60}")
print(f"  RESULTS: {PASSED} passed, {FAILED} failed out of {PASSED+FAILED} tests")
print(f"{'='*60}\n")

if FAILED > 0:
    sys.exit(1)
else:
    print("🎉 ALL POC TESTS PASSED!")
    sys.exit(0)
