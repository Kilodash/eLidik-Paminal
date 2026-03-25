import os
import json
import uuid
from datetime import datetime, timedelta, date
from typing import Optional, List
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
import bcrypt
import jwt
from fastapi import FastAPI, HTTPException, Depends, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv
from io import BytesIO

load_dotenv()

app = FastAPI(title="Simondu Web API", version="1.0.0")

# CORS
cors_origins = os.environ.get("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
DATABASE_URL = os.environ.get("DATABASE_URL")
JWT_SECRET = os.environ.get("JWT_SECRET", "simondu-web-secret-key-2024-polda-jabar")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.environ.get("JWT_EXPIRATION_MINUTES", "480"))

# ==================== DB HELPERS ====================

from psycopg2 import pool as pg_pool

# Connection pool
db_pool = None

def init_pool():
    global db_pool
    if db_pool is None:
        db_pool = pg_pool.ThreadedConnectionPool(1, 10, DATABASE_URL)
    return db_pool

def get_db():
    p = init_pool()
    conn = p.getconn()
    conn.autocommit = False
    return conn

def release_db(conn):
    p = init_pool()
    p.putconn(conn)

def serialize_row(row, columns):
    """Convert a database row to a dict with proper JSON serialization"""
    if row is None:
        return None
    result = {}
    for i, col in enumerate(columns):
        val = row[i]
        if isinstance(val, (datetime, date)):
            result[col] = val.isoformat()
        elif isinstance(val, uuid.UUID):
            result[col] = str(val)
        else:
            result[col] = val
    return result

def query_all(sql, params=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        cur.close()
        return [serialize_row(r, columns) for r in rows]
    finally:
        release_db(conn)

def query_one(sql, params=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        if cur.description is None:
            cur.close()
            return None
        columns = [desc[0] for desc in cur.description]
        row = cur.fetchone()
        cur.close()
        return serialize_row(row, columns) if row else None
    finally:
        release_db(conn)

def execute(sql, params=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        conn.commit()
        if cur.description:
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            cur.close()
            return serialize_row(row, columns) if row else None
        cur.close()
        return None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        release_db(conn)

# ==================== AUTH ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str, email: str, name: str, unit_name: str = None) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "name": name,
        "unit_name": unit_name,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token tidak ditemukan")
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token sudah expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

def require_role(*roles):
    def checker(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Akses ditolak")
        return user
    return checker

# ==================== PYDANTIC MODELS ====================

class LoginRequest(BaseModel):
    email: str
    password: str

class DumasCreate(BaseModel):
    no_dumas: Optional[str] = None
    tgl_dumas: Optional[str] = None
    pelapor: Optional[str] = None
    terlapor: Optional[str] = None
    satker: Optional[str] = None
    wujud_perbuatan: Optional[str] = None
    jenis_dumas: Optional[str] = None
    keterangan: Optional[str] = None
    disposisi_kabid: Optional[str] = None
    disposisi_kasubbid: Optional[str] = None
    unit_id: Optional[str] = None
    status: Optional[str] = "dalam_proses"
    parent_dumas_id: Optional[str] = None

class DumasUpdate(BaseModel):
    no_dumas: Optional[str] = None
    tgl_dumas: Optional[str] = None
    pelapor: Optional[str] = None
    terlapor: Optional[str] = None
    satker: Optional[str] = None
    wujud_perbuatan: Optional[str] = None
    jenis_dumas: Optional[str] = None
    keterangan: Optional[str] = None
    disposisi_kabid: Optional[str] = None
    disposisi_kasubbid: Optional[str] = None
    unit_id: Optional[str] = None
    status: Optional[str] = None
    parent_dumas_id: Optional[str] = None

class TindakLanjutCreate(BaseModel):
    dumas_id: str
    tgl_uuk: Optional[str] = None
    tgl_sprin_lidik: Optional[str] = None
    no_sprin: Optional[str] = None
    tgl_gelar: Optional[str] = None
    tgl_lhp: Optional[str] = None
    no_lhp: Optional[str] = None
    hasil_lidik: Optional[str] = None
    tgl_nodin: Optional[str] = None
    no_nodin: Optional[str] = None
    no_berkas: Optional[str] = None
    tgl_sp2hp2: Optional[str] = None
    no_sp2hp2: Optional[str] = None
    tgl_ke_ankum: Optional[str] = None
    tgl_ke_mabes: Optional[str] = None
    no_mabes: Optional[str] = None
    tgl_st_arahan: Optional[str] = None

class TindakLanjutUpdate(BaseModel):
    tgl_uuk: Optional[str] = None
    tgl_sprin_lidik: Optional[str] = None
    no_sprin: Optional[str] = None
    tgl_gelar: Optional[str] = None
    tgl_lhp: Optional[str] = None
    no_lhp: Optional[str] = None
    hasil_lidik: Optional[str] = None
    tgl_nodin: Optional[str] = None
    no_nodin: Optional[str] = None
    no_berkas: Optional[str] = None
    tgl_sp2hp2: Optional[str] = None
    no_sp2hp2: Optional[str] = None
    tgl_ke_ankum: Optional[str] = None
    tgl_ke_mabes: Optional[str] = None
    no_mabes: Optional[str] = None
    tgl_st_arahan: Optional[str] = None

class ApprovalAction(BaseModel):
    action: str  # "setujui" or "revisi"
    catatan_revisi: Optional[str] = None

class PenyelesaianCreate(BaseModel):
    dumas_id: str
    jenis: str  # pelimpahan or henti_lidik
    tanggal: Optional[str] = None
    nomor: Optional[str] = None

class TimLidikCreate(BaseModel):
    dumas_id: str
    anggota_id: str
    no_hp_penyelidik: Optional[str] = None

class SettingUpdate(BaseModel):
    value: list | dict

class MergeDumas(BaseModel):
    child_dumas_ids: List[str]
    parent_dumas_id: str

# ==================== AUTO NUMBERING ====================

ROMAN_MONTHS = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
    7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII"
}

def auto_number(format_template: str, nomor: int, tanggal: date = None, unit: str = None):
    if tanggal is None:
        tanggal = date.today()
    bulan_romawi = ROMAN_MONTHS.get(tanggal.month, "I")
    tahun = str(tanggal.year)
    result = format_template.replace("{nomor}", str(nomor).zfill(3))
    result = result.replace("{bulan_romawi}", bulan_romawi)
    result = result.replace("{tahun}", tahun)
    result = result.replace("{unit}", unit or "PAMINAL")
    return result

# ==================== ROUTES ====================

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Simondu Web API"}

# --- AUTH ---
@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = query_one(
        "SELECT * FROM users WHERE email = %s AND deleted_at IS NULL",
        (req.email,)
    )
    if not user:
        raise HTTPException(status_code=401, detail="Email atau password salah")
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    token = create_token(user["id"], user["role"], user["email"], user["name"], user.get("unit_name"))
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "unit_name": user.get("unit_name")
        }
    }

@app.get("/api/auth/me")
def get_me(user=Depends(get_current_user)):
    db_user = query_one("SELECT id, email, name, role, unit_name FROM users WHERE id = %s::uuid", (user["sub"],))
    if not db_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return db_user

# --- USERS ---
@app.get("/api/users")
def list_users(user=Depends(get_current_user)):
    return query_all("SELECT id, email, name, role, unit_name, created_at FROM users WHERE deleted_at IS NULL ORDER BY name")

@app.get("/api/users/units")
def list_unit_users(user=Depends(get_current_user)):
    return query_all("SELECT id, email, name, role, unit_name FROM users WHERE role = 'unit' AND deleted_at IS NULL ORDER BY name")

# --- SETTINGS ---
@app.get("/api/settings")
def list_settings(user=Depends(get_current_user)):
    return query_all("SELECT * FROM settings ORDER BY type")

@app.get("/api/settings/{setting_type}")
def get_setting(setting_type: str, user=Depends(get_current_user)):
    setting = query_one("SELECT * FROM settings WHERE type = %s", (setting_type,))
    if not setting:
        raise HTTPException(status_code=404, detail="Setting tidak ditemukan")
    return setting

@app.put("/api/settings/{setting_type}")
def update_setting(setting_type: str, req: SettingUpdate, user=Depends(require_role("superadmin"))):
    result = execute(
        "UPDATE settings SET value = %s::jsonb, updated_at = NOW() WHERE type = %s RETURNING *",
        (json.dumps(req.value), setting_type)
    )
    if not result:
        raise HTTPException(status_code=404, detail="Setting tidak ditemukan")
    return result

# --- DUMAS ---
@app.get("/api/dumas")
def list_dumas(
    status: Optional[str] = None,
    unit_id: Optional[str] = None,
    include_deleted: bool = False,
    user=Depends(get_current_user)
):
    sql = "SELECT d.*, u.name as unit_name FROM dumas d LEFT JOIN users u ON d.unit_id = u.id"
    conditions = []
    params = []
    
    if not include_deleted:
        conditions.append("d.deleted_at IS NULL")
    
    # Unit users can only see their own data
    if user["role"] == "unit":
        conditions.append("d.unit_id = %s::uuid")
        params.append(user["sub"])
    elif unit_id:
        conditions.append("d.unit_id = %s::uuid")
        params.append(unit_id)
    
    if status:
        conditions.append("d.status = %s")
        params.append(status)
    
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    
    sql += " ORDER BY d.created_at DESC"
    return query_all(sql, tuple(params))

@app.post("/api/dumas")
def create_dumas(req: DumasCreate, user=Depends(require_role("admin", "superadmin"))):
    result = execute(
        """INSERT INTO dumas (no_dumas, tgl_dumas, pelapor, terlapor, satker, wujud_perbuatan,
           jenis_dumas, keterangan, disposisi_kabid, disposisi_kasubbid, unit_id, status, parent_dumas_id)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING *""",
        (req.no_dumas, req.tgl_dumas, req.pelapor, req.terlapor, req.satker,
         req.wujud_perbuatan, req.jenis_dumas, req.keterangan,
         req.disposisi_kabid, req.disposisi_kasubbid,
         req.unit_id if req.unit_id else None,
         req.status or "dalam_proses",
         req.parent_dumas_id if req.parent_dumas_id else None)
    )
    return Response(content=json.dumps(result, default=str), status_code=201, media_type="application/json")

@app.get("/api/dumas/{dumas_id}")
def get_dumas(dumas_id: str, user=Depends(get_current_user)):
    dumas = query_one(
        """SELECT d.*, u.name as unit_name FROM dumas d 
           LEFT JOIN users u ON d.unit_id = u.id 
           WHERE d.id = %s::uuid AND d.deleted_at IS NULL""",
        (dumas_id,)
    )
    if not dumas:
        raise HTTPException(status_code=404, detail="Dumas tidak ditemukan")
    return dumas

@app.put("/api/dumas/{dumas_id}")
def update_dumas(dumas_id: str, req: DumasUpdate, user=Depends(get_current_user)):
    updates = []
    params = []
    data = req.dict(exclude_unset=True, exclude_none=True)
    
    for key, value in data.items():
        if key == "unit_id":
            updates.append(f"{key} = %s::uuid")
        elif key == "parent_dumas_id":
            updates.append(f"{key} = %s::uuid")
        else:
            updates.append(f"{key} = %s")
        params.append(value)
    
    if not updates:
        raise HTTPException(status_code=400, detail="Tidak ada data yang diupdate")
    
    updates.append("updated_at = NOW()")
    params.append(dumas_id)
    
    sql = f"UPDATE dumas SET {', '.join(updates)} WHERE id = %s::uuid AND deleted_at IS NULL RETURNING *"
    result = execute(sql, tuple(params))
    if not result:
        raise HTTPException(status_code=404, detail="Dumas tidak ditemukan")
    return result

@app.delete("/api/dumas/{dumas_id}")
def soft_delete_dumas(dumas_id: str, user=Depends(require_role("admin", "superadmin"))):
    result = execute(
        "UPDATE dumas SET deleted_at = NOW() WHERE id = %s::uuid AND deleted_at IS NULL RETURNING id",
        (dumas_id,)
    )
    if not result:
        raise HTTPException(status_code=404, detail="Dumas tidak ditemukan")
    return {"message": "Dumas berhasil dihapus (soft delete)", "id": result["id"]}

# --- MERGE DUMAS ---
@app.post("/api/dumas/merge")
def merge_dumas(req: MergeDumas, user=Depends(require_role("admin", "superadmin"))):
    conn = get_db()
    try:
        cur = conn.cursor()
        for child_id in req.child_dumas_ids:
            cur.execute(
                "UPDATE dumas SET parent_dumas_id = %s::uuid, updated_at = NOW() WHERE id = %s::uuid",
                (req.parent_dumas_id, child_id)
            )
        conn.commit()
        cur.close()
        return {"message": f"{len(req.child_dumas_ids)} dumas berhasil di-merge"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_db(conn)

# --- ARCHIVE / TRASH (Superadmin) ---
@app.get("/api/archive/dumas")
def list_archived_dumas(user=Depends(require_role("superadmin"))):
    return query_all(
        "SELECT d.*, u.name as unit_name FROM dumas d LEFT JOIN users u ON d.unit_id = u.id WHERE d.deleted_at IS NOT NULL ORDER BY d.deleted_at DESC"
    )

@app.post("/api/archive/dumas/{dumas_id}/restore")
def restore_dumas(dumas_id: str, user=Depends(require_role("superadmin"))):
    result = execute(
        "UPDATE dumas SET deleted_at = NULL WHERE id = %s::uuid AND deleted_at IS NOT NULL RETURNING id",
        (dumas_id,)
    )
    if not result:
        raise HTTPException(status_code=404, detail="Dumas arsip tidak ditemukan")
    return {"message": "Dumas berhasil di-restore"}

@app.delete("/api/archive/dumas/{dumas_id}/permanent")
def permanent_delete_dumas(dumas_id: str, user=Depends(require_role("superadmin"))):
    conn = get_db()
    try:
        cur = conn.cursor()
        # Delete related data first
        cur.execute("DELETE FROM tim_lidik WHERE dumas_id = %s::uuid", (dumas_id,))
        cur.execute("DELETE FROM penyelesaian WHERE dumas_id = %s::uuid", (dumas_id,))
        cur.execute("DELETE FROM tindak_lanjut WHERE dumas_id = %s::uuid", (dumas_id,))
        cur.execute("UPDATE dumas SET parent_dumas_id = NULL WHERE parent_dumas_id = %s::uuid", (dumas_id,))
        cur.execute("DELETE FROM dumas WHERE id = %s::uuid", (dumas_id,))
        conn.commit()
        cur.close()
        return {"message": "Dumas berhasil dihapus permanen"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_db(conn)

# --- TINDAK LANJUT ---
@app.get("/api/tindak-lanjut")
def list_tindak_lanjut(dumas_id: Optional[str] = None, user=Depends(get_current_user)):
    if dumas_id:
        return query_all(
            "SELECT * FROM tindak_lanjut WHERE dumas_id = %s::uuid AND deleted_at IS NULL ORDER BY created_at DESC",
            (dumas_id,)
        )
    return query_all("SELECT * FROM tindak_lanjut WHERE deleted_at IS NULL ORDER BY created_at DESC")

@app.post("/api/tindak-lanjut")
def create_tindak_lanjut(req: TindakLanjutCreate, user=Depends(get_current_user)):
    result = execute(
        """INSERT INTO tindak_lanjut (dumas_id, tgl_uuk, tgl_sprin_lidik, no_sprin, tgl_gelar,
           tgl_lhp, no_lhp, hasil_lidik, tgl_nodin, no_nodin, no_berkas, tgl_sp2hp2, no_sp2hp2,
           tgl_ke_ankum, tgl_ke_mabes, no_mabes, tgl_st_arahan)
           VALUES (%s::uuid, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING *""",
        (req.dumas_id, req.tgl_uuk, req.tgl_sprin_lidik, req.no_sprin, req.tgl_gelar,
         req.tgl_lhp, req.no_lhp, req.hasil_lidik, req.tgl_nodin, req.no_nodin,
         req.no_berkas, req.tgl_sp2hp2, req.no_sp2hp2, req.tgl_ke_ankum,
         req.tgl_ke_mabes, req.no_mabes, req.tgl_st_arahan)
    )
    return result

@app.put("/api/tindak-lanjut/{tl_id}")
def update_tindak_lanjut(tl_id: str, req: TindakLanjutUpdate, user=Depends(get_current_user)):
    # Check if locked (menunggu_verifikasi or disetujui)
    existing = query_one("SELECT status_verifikasi FROM tindak_lanjut WHERE id = %s::uuid", (tl_id,))
    if existing and existing["status_verifikasi"] in ["menunggu_verifikasi", "disetujui"]:
        raise HTTPException(status_code=400, detail="Tindak lanjut sedang dalam verifikasi atau sudah disetujui")
    
    updates = []
    params = []
    data = req.dict(exclude_unset=True, exclude_none=True)
    
    for key, value in data.items():
        updates.append(f"{key} = %s")
        params.append(value)
    
    if not updates:
        raise HTTPException(status_code=400, detail="Tidak ada data yang diupdate")
    
    updates.append("updated_at = NOW()")
    params.append(tl_id)
    
    sql = f"UPDATE tindak_lanjut SET {', '.join(updates)} WHERE id = %s::uuid RETURNING *"
    result = execute(sql, tuple(params))
    return result

@app.get("/api/tindak-lanjut/{tl_id}")
def get_tindak_lanjut(tl_id: str, user=Depends(get_current_user)):
    tl = query_one("SELECT * FROM tindak_lanjut WHERE id = %s::uuid AND deleted_at IS NULL", (tl_id,))
    if not tl:
        raise HTTPException(status_code=404, detail="Tindak lanjut tidak ditemukan")
    return tl

# --- APPROVAL WORKFLOW ---
@app.post("/api/tindak-lanjut/{tl_id}/submit")
def submit_for_verification(tl_id: str, user=Depends(get_current_user)):
    """Unit submits tindak lanjut for pimpinan verification"""
    existing = query_one("SELECT * FROM tindak_lanjut WHERE id = %s::uuid", (tl_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Tindak lanjut tidak ditemukan")
    if existing["status_verifikasi"] not in ["draft", "revisi"]:
        raise HTTPException(status_code=400, detail="Hanya draft atau revisi yang bisa diajukan")
    
    result = execute(
        "UPDATE tindak_lanjut SET status_verifikasi = 'menunggu_verifikasi', updated_at = NOW() WHERE id = %s::uuid RETURNING *",
        (tl_id,)
    )
    
    # Create notification for pimpinan
    dumas = query_one("SELECT no_dumas FROM dumas WHERE id = %s::uuid", (existing["dumas_id"],))
    no_dumas = dumas["no_dumas"] if dumas else "Unknown"
    
    execute(
        """INSERT INTO notifications (target_role, title, message, action_url)
           VALUES ('pimpinan', %s, %s, %s)""",
        (
            f"Verifikasi Tindak Lanjut - {no_dumas}",
            f"Tindak lanjut untuk Dumas {no_dumas} membutuhkan persetujuan Anda",
            f"/approval/{tl_id}"
        )
    )
    
    return result

@app.post("/api/tindak-lanjut/{tl_id}/approve")
def approve_tindak_lanjut(tl_id: str, req: ApprovalAction, user=Depends(require_role("pimpinan", "superadmin"))):
    """Pimpinan approves or requests revision"""
    existing = query_one("SELECT * FROM tindak_lanjut WHERE id = %s::uuid", (tl_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Tindak lanjut tidak ditemukan")
    if existing["status_verifikasi"] != "menunggu_verifikasi":
        raise HTTPException(status_code=400, detail="Status tidak valid untuk approval")
    
    dumas = query_one("SELECT no_dumas, unit_id FROM dumas WHERE id = %s::uuid", (existing["dumas_id"],))
    no_dumas = dumas["no_dumas"] if dumas else "Unknown"
    
    if req.action == "setujui":
        result = execute(
            "UPDATE tindak_lanjut SET status_verifikasi = 'disetujui', updated_at = NOW() WHERE id = %s::uuid RETURNING *",
            (tl_id,)
        )
        # Notify unit
        if dumas and dumas.get("unit_id"):
            execute(
                """INSERT INTO notifications (target_user_id, title, message, action_url)
                   VALUES (%s::uuid, %s, %s, %s)""",
                (
                    dumas["unit_id"],
                    f"Tindak Lanjut Disetujui - {no_dumas}",
                    f"Tindak lanjut untuk Dumas {no_dumas} telah disetujui oleh Pimpinan",
                    f"/dumas/{existing['dumas_id']}"
                )
            )
    elif req.action == "revisi":
        result = execute(
            "UPDATE tindak_lanjut SET status_verifikasi = 'revisi', catatan_revisi = %s, updated_at = NOW() WHERE id = %s::uuid RETURNING *",
            (req.catatan_revisi, tl_id)
        )
        # Notify unit
        if dumas and dumas.get("unit_id"):
            execute(
                """INSERT INTO notifications (target_user_id, title, message, action_url)
                   VALUES (%s::uuid, %s, %s, %s)""",
                (
                    dumas["unit_id"],
                    f"Revisi Tindak Lanjut - {no_dumas}",
                    f"Tindak lanjut Dumas {no_dumas} perlu direvisi: {req.catatan_revisi}",
                    f"/dumas/{existing['dumas_id']}"
                )
            )
    else:
        raise HTTPException(status_code=400, detail="Action harus 'setujui' atau 'revisi'")
    
    return result

# --- APPROVAL INBOX ---
@app.get("/api/approval/inbox")
def approval_inbox(user=Depends(require_role("pimpinan", "superadmin"))):
    """Get tindak lanjut pending approval with dumas details"""
    return query_all(
        """SELECT tl.*, d.no_dumas, d.pelapor, d.terlapor, d.satker, d.jenis_dumas, u.name as unit_name
           FROM tindak_lanjut tl
           JOIN dumas d ON tl.dumas_id = d.id
           LEFT JOIN users u ON d.unit_id = u.id
           WHERE tl.status_verifikasi = 'menunggu_verifikasi' AND tl.deleted_at IS NULL
           ORDER BY tl.updated_at DESC"""
    )

# --- TIM LIDIK ---
@app.post("/api/tim-lidik")
def create_tim_lidik(req: TimLidikCreate, user=Depends(get_current_user)):
    result = execute(
        "INSERT INTO tim_lidik (dumas_id, anggota_id, no_hp_penyelidik) VALUES (%s::uuid, %s::uuid, %s) RETURNING *",
        (req.dumas_id, req.anggota_id, req.no_hp_penyelidik)
    )
    return result

@app.get("/api/tim-lidik/{dumas_id}")
def get_tim_lidik(dumas_id: str, user=Depends(get_current_user)):
    return query_all(
        """SELECT tl.*, u.name as anggota_name, u.unit_name 
           FROM tim_lidik tl LEFT JOIN users u ON tl.anggota_id = u.id 
           WHERE tl.dumas_id = %s::uuid""",
        (dumas_id,)
    )

@app.delete("/api/tim-lidik/{tl_id}")
def delete_tim_lidik(tl_id: str, user=Depends(get_current_user)):
    execute("DELETE FROM tim_lidik WHERE id = %s::uuid", (tl_id,))
    return {"message": "Anggota tim lidik berhasil dihapus"}

# --- PENYELESAIAN ---
@app.post("/api/penyelesaian")
def create_penyelesaian(req: PenyelesaianCreate, user=Depends(get_current_user)):
    result = execute(
        "INSERT INTO penyelesaian (dumas_id, jenis, tanggal, nomor) VALUES (%s::uuid, %s, %s, %s) RETURNING *",
        (req.dumas_id, req.jenis, req.tanggal, req.nomor)
    )
    return result

@app.get("/api/penyelesaian/{dumas_id}")
def get_penyelesaian(dumas_id: str, user=Depends(get_current_user)):
    return query_all("SELECT * FROM penyelesaian WHERE dumas_id = %s::uuid ORDER BY created_at", (dumas_id,))

# --- NOTIFICATIONS ---
@app.get("/api/notifications")
def list_notifications(user=Depends(get_current_user)):
    return query_all(
        """SELECT * FROM notifications 
           WHERE (target_user_id = %s::uuid OR target_role = %s) 
           ORDER BY created_at DESC LIMIT 50""",
        (user["sub"], user["role"])
    )

@app.get("/api/notifications/unread-count")
def unread_count(user=Depends(get_current_user)):
    result = query_one(
        """SELECT COUNT(*) as count FROM notifications 
           WHERE (target_user_id = %s::uuid OR target_role = %s) AND is_read = FALSE""",
        (user["sub"], user["role"])
    )
    return {"count": result["count"] if result else 0}

@app.put("/api/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str, user=Depends(get_current_user)):
    execute("UPDATE notifications SET is_read = TRUE WHERE id = %s::uuid", (notif_id,))
    return {"message": "Notifikasi ditandai telah dibaca"}

@app.put("/api/notifications/read-all")
def mark_all_notifications_read(user=Depends(get_current_user)):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE notifications SET is_read = TRUE WHERE (target_user_id = %s::uuid OR target_role = %s) AND is_read = FALSE",
            (user["sub"], user["role"])
        )
        conn.commit()
        cur.close()
        return {"message": "Semua notifikasi ditandai telah dibaca"}
    finally:
        release_db(conn)

# --- DASHBOARD STATS ---
@app.get("/api/dashboard/stats")
def dashboard_stats(user=Depends(get_current_user)):
    conn = get_db()
    try:
        cur = conn.cursor()
        # All stats in one query
        cur.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE deleted_at IS NULL) as total,
                COUNT(*) FILTER (WHERE status = 'dalam_proses' AND deleted_at IS NULL) as dalam_proses,
                COUNT(*) FILTER (WHERE status = 'terbukti' AND deleted_at IS NULL) as terbukti,
                COUNT(*) FILTER (WHERE status = 'tidak_terbukti' AND deleted_at IS NULL) as tidak_terbukti
            FROM dumas
        """)
        cols = [d[0] for d in cur.description]
        row = cur.fetchone()
        stats = serialize_row(row, cols) if row else {}
        
        cur.execute("SELECT COUNT(*) as count FROM tindak_lanjut WHERE status_verifikasi = 'menunggu_verifikasi' AND deleted_at IS NULL")
        tl_row = cur.fetchone()
        
        cur.close()
        return {
            "total": stats.get("total", 0),
            "dalam_proses": stats.get("dalam_proses", 0),
            "terbukti": stats.get("terbukti", 0),
            "tidak_terbukti": stats.get("tidak_terbukti", 0),
            "menunggu_verifikasi": tl_row[0] if tl_row else 0
        }
    finally:
        release_db(conn)

@app.get("/api/dashboard/combined")
def dashboard_all(user=Depends(get_current_user)):
    """Combined dashboard endpoint - returns stats, sla, and chart data in one call"""
    conn = get_db()
    try:
        cur = conn.cursor()
        
        # Stats
        cur.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE deleted_at IS NULL) as total,
                COUNT(*) FILTER (WHERE status = 'dalam_proses' AND deleted_at IS NULL) as dalam_proses,
                COUNT(*) FILTER (WHERE status = 'terbukti' AND deleted_at IS NULL) as terbukti,
                COUNT(*) FILTER (WHERE status = 'tidak_terbukti' AND deleted_at IS NULL) as tidak_terbukti
            FROM dumas
        """)
        cols = [d[0] for d in cur.description]
        stats_row = cur.fetchone()
        stats = serialize_row(stats_row, cols) if stats_row else {}
        
        cur.execute("SELECT COUNT(*) FROM tindak_lanjut WHERE status_verifikasi = 'menunggu_verifikasi' AND deleted_at IS NULL")
        tl_count = cur.fetchone()[0]
        
        # SLA Warning
        cur.execute("""
            SELECT d.id, d.no_dumas, d.pelapor, d.terlapor, d.satker, d.status, d.created_at,
                u.name as unit_name,
                EXTRACT(DAY FROM NOW() - d.created_at)::int as days_elapsed,
                CASE 
                    WHEN EXTRACT(DAY FROM NOW() - d.created_at) > 30 THEN 'merah'
                    WHEN EXTRACT(DAY FROM NOW() - d.created_at) > 14 THEN 'kuning'
                    ELSE 'hijau'
                END as sla_status
            FROM dumas d LEFT JOIN users u ON d.unit_id = u.id
            WHERE d.status = 'dalam_proses' AND d.deleted_at IS NULL
            ORDER BY d.created_at ASC
        """)
        sla_cols = [d[0] for d in cur.description]
        sla_rows = cur.fetchall()
        sla_data = [serialize_row(r, sla_cols) for r in sla_rows]
        
        # Chart Data
        cur.execute("""
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'dalam_proses') as dalam_proses,
                COUNT(*) FILTER (WHERE status = 'terbukti') as terbukti,
                COUNT(*) FILTER (WHERE status = 'tidak_terbukti') as tidak_terbukti
            FROM dumas WHERE deleted_at IS NULL
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY month DESC LIMIT 12
        """)
        chart_cols = [d[0] for d in cur.description]
        chart_rows = cur.fetchall()
        chart_data = [serialize_row(r, chart_cols) for r in chart_rows]
        
        cur.close()
        
        return {
            "stats": {
                "total": stats.get("total", 0),
                "dalam_proses": stats.get("dalam_proses", 0),
                "terbukti": stats.get("terbukti", 0),
                "tidak_terbukti": stats.get("tidak_terbukti", 0),
                "menunggu_verifikasi": tl_count or 0,
            },
            "sla_data": sla_data,
            "chart_data": chart_data,
        }
    finally:
        release_db(conn)

@app.get("/api/dashboard/sla-warning")
def sla_warning(user=Depends(get_current_user)):
    """Get dumas cases with SLA warnings (based on days since creation)"""
    return query_all(
        """SELECT d.*, u.name as unit_name,
              EXTRACT(DAY FROM NOW() - d.created_at)::int as days_elapsed,
              CASE 
                WHEN EXTRACT(DAY FROM NOW() - d.created_at) > 30 THEN 'merah'
                WHEN EXTRACT(DAY FROM NOW() - d.created_at) > 14 THEN 'kuning'
                ELSE 'hijau'
              END as sla_status
           FROM dumas d
           LEFT JOIN users u ON d.unit_id = u.id
           WHERE d.status = 'dalam_proses' AND d.deleted_at IS NULL
           ORDER BY d.created_at ASC"""
    )

@app.get("/api/dashboard/chart-data")
def chart_data(user=Depends(get_current_user)):
    """Get monthly dumas counts for charting"""
    return query_all(
        """SELECT 
              TO_CHAR(created_at, 'YYYY-MM') as month,
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE status = 'dalam_proses') as dalam_proses,
              COUNT(*) FILTER (WHERE status = 'terbukti') as terbukti,
              COUNT(*) FILTER (WHERE status = 'tidak_terbukti') as tidak_terbukti
           FROM dumas WHERE deleted_at IS NULL
           GROUP BY TO_CHAR(created_at, 'YYYY-MM')
           ORDER BY month DESC LIMIT 12"""
    )

# --- AUTO NUMBER ---
@app.get("/api/auto-number/{doc_type}")
def get_auto_number(doc_type: str, tanggal: Optional[str] = None, unit: Optional[str] = None, user=Depends(get_current_user)):
    setting = query_one("SELECT value FROM settings WHERE type = 'format_nomor_surat'")
    if not setting or not setting.get("value"):
        raise HTTPException(status_code=404, detail="Format nomor surat belum dikonfigurasi")
    
    formats = setting["value"]
    if doc_type not in formats:
        raise HTTPException(status_code=400, detail=f"Tipe dokumen '{doc_type}' tidak ditemukan")
    
    # Count existing documents of this type for auto-increment
    tgl = datetime.strptime(tanggal, "%Y-%m-%d").date() if tanggal else date.today()
    year = tgl.year
    
    count_result = query_one(
        "SELECT COUNT(*) as count FROM dumas WHERE EXTRACT(YEAR FROM created_at) = %s AND deleted_at IS NULL",
        (year,)
    )
    next_number = (count_result["count"] if count_result else 0) + 1
    
    number = auto_number(formats[doc_type], next_number, tgl, unit)
    return {"number": number, "format": formats[doc_type]}

# --- DOCUMENT GENERATION ---
@app.get("/api/documents/{doc_type}/{dumas_id}")
def generate_document(doc_type: str, dumas_id: str, token: Optional[str] = None, user=Depends(get_current_user)):
    """Generate .docx document for UUK, Sprin, SP2HP2, etc."""
    from docx import Document
    from docx.shared import Pt, Inches, Cm
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    
    dumas = query_one(
        """SELECT d.*, u.name as unit_name FROM dumas d 
           LEFT JOIN users u ON d.unit_id = u.id WHERE d.id = %s::uuid""",
        (dumas_id,)
    )
    if not dumas:
        raise HTTPException(status_code=404, detail="Dumas tidak ditemukan")
    
    tl = query_one("SELECT * FROM tindak_lanjut WHERE dumas_id = %s::uuid ORDER BY created_at DESC LIMIT 1", (dumas_id,))
    
    doc = Document()
    
    # Set default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    
    if doc_type == "uuk":
        # Header
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("KEPOLISIAN NEGARA REPUBLIK INDONESIA\nDAERAH JAWA BARAT\nBIDANG PROFESI DAN PENGAMANAN")
        run.bold = True
        run.font.size = Pt(14)
        
        doc.add_paragraph()
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("URAIAN UNSUR KEGIATAN (UUK)")
        run.bold = True
        run.font.size = Pt(14)
        
        doc.add_paragraph()
        doc.add_paragraph(f"Nomor Dumas     : {dumas.get('no_dumas', '-')}")
        doc.add_paragraph(f"Tanggal Dumas   : {dumas.get('tgl_dumas', '-')}")
        doc.add_paragraph(f"Pelapor         : {dumas.get('pelapor', '-')}")
        doc.add_paragraph(f"Terlapor        : {dumas.get('terlapor', '-')}")
        doc.add_paragraph(f"Satker          : {dumas.get('satker', '-')}")
        doc.add_paragraph(f"Jenis Dumas     : {dumas.get('jenis_dumas', '-')}")
        doc.add_paragraph(f"Wujud Perbuatan : {dumas.get('wujud_perbuatan', '-')}")
        doc.add_paragraph(f"Keterangan      : {dumas.get('keterangan', '-')}")
        
        if tl and tl.get("tgl_uuk"):
            doc.add_paragraph(f"Tanggal UUK     : {tl['tgl_uuk']}")
        
    elif doc_type == "sprin":
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("KEPOLISIAN NEGARA REPUBLIK INDONESIA\nDAERAH JAWA BARAT\nBIDANG PROFESI DAN PENGAMANAN")
        run.bold = True
        run.font.size = Pt(14)
        
        doc.add_paragraph()
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("SURAT PERINTAH PENYELIDIKAN")
        run.bold = True
        run.font.size = Pt(14)
        
        if tl and tl.get("no_sprin"):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run(f"Nomor: {tl['no_sprin']}")
        
        doc.add_paragraph()
        doc.add_paragraph(f"Berdasarkan pengaduan masyarakat yang diterima dengan:")
        doc.add_paragraph(f"Nomor Dumas     : {dumas.get('no_dumas', '-')}")
        doc.add_paragraph(f"Pelapor         : {dumas.get('pelapor', '-')}")
        doc.add_paragraph(f"Terlapor        : {dumas.get('terlapor', '-')}")
        doc.add_paragraph(f"Satker          : {dumas.get('satker', '-')}")
        
    elif doc_type == "sp2hp2":
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("KEPOLISIAN NEGARA REPUBLIK INDONESIA\nDAERAH JAWA BARAT\nBIDANG PROFESI DAN PENGAMANAN")
        run.bold = True
        run.font.size = Pt(14)
        
        doc.add_paragraph()
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("SURAT PEMBERITAHUAN PERKEMBANGAN\nHASIL PENYELIDIKAN (SP2HP2)")
        run.bold = True
        run.font.size = Pt(14)
        
        if tl and tl.get("no_sp2hp2"):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run(f"Nomor: {tl['no_sp2hp2']}")
        
        doc.add_paragraph()
        doc.add_paragraph(f"Nomor Dumas     : {dumas.get('no_dumas', '-')}")
        doc.add_paragraph(f"Pelapor         : {dumas.get('pelapor', '-')}")
        doc.add_paragraph(f"Terlapor        : {dumas.get('terlapor', '-')}")
        doc.add_paragraph(f"Hasil Lidik     : {tl.get('hasil_lidik', '-') if tl else '-'}")
        
    else:
        raise HTTPException(status_code=400, detail=f"Tipe dokumen '{doc_type}' tidak didukung")
    
    # Save to buffer
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    filename = f"{doc_type}_{dumas.get('no_dumas', 'document').replace('/', '_')}.docx"
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
