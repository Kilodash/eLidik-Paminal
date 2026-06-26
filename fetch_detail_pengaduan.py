import requests
import json
import sys

def fetch_detail_pengaduan(report_id):
    url = "https://gajamada-propam.polri.go.id/report/laporan-pengaduan"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    payload = {
        "connectionId": "245b8fd7c4a763019d5172fad5ec0086",
        "database": "divpropam",
        "filters": [
            {
                "field": "id",
                "fieldType": "string",
                "field_type_origin": "",
                "operator": "=",
                "value": [report_id]
            }
        ],
        "metaData": {
            "widgetId": "8533ca87b75e04b1f39d19d98dabc0ef",
            "menuId": "ce64015a07578d9195a0e589de1108c8"
        },
        "order": "desc",
        "orderBy": "created_date",
        "page": 1,
        "size": 1,
        "table": "gold.report"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Data detail untuk ID {report_id} berhasil diambil.")
        
        filename = f'detail_pengaduan_{report_id}.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Data disimpan di {filename}")
            
    except requests.exceptions.RequestException as e:
        print(f"Error saat mengambil data detail: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        report_id = sys.argv[1]
    else:
        # Contoh ID default dari data
        report_id = "2026062400064"
        print(f"ID tidak diberikan. Menggunakan ID contoh: {report_id}")
        
    fetch_detail_pengaduan(report_id)
