import requests
import json

def submit_pengaduan_baru():
    # GANTI URL INI DENGAN URL ENDPOINT SUBMIT (Lihat di Network Tab saat submit manual)
    url = "https://gajamada-propam.polri.go.id/API_ENDPOINT_UNTUK_SUBMIT"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        # CATATAN: Mungkin butuh header 'Authorization' atau 'Cookie' dari session aktif
    }
    
    # GANTI PAYLOAD INI SESUAI DENGAN PAYLOAD SAAT SUBMIT MANUAL
    payload = {
        "pengirim": "Nama Anda",
        "reporter_nik": "3200000000000000",
        "phone_no": "628123456789",
        "email": "email@domain.com",
        "prepetrator_name": "Nama Terlapor",
        "category": "Kategori Pelanggaran",
        "5w1h_where": "Lokasi Kejadian",
        "content": "Isi laporan pengaduan..."
        # Tambahkan field lain yang wajib diisi (mandatory)
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        print("Pengaduan berhasil dikirim otomatis!")
        print("Response:", response.json())
        
    except requests.exceptions.RequestException as e:
        print(f"Error saat submit pengaduan: {e}")
        if 'response' in locals() and response is not None:
            print("Detail Error Response:", response.text)

if __name__ == "__main__":
    submit_pengaduan_baru()
