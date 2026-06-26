import requests
import json

def fetch_pengaduan_data():
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
                "field": "status_label",
                "fieldType": "string",
                "field_type_origin": "",
                "operator": "is not one of",
                "value": [""] # Tambahkan value jika ada di request asli
            }
        ],
        "metaData": {
            "widgetId": "8533ca87b75e04b1f39d19d98dabc0ef",
            "menuId": "ce64015a07578d9195a0e589de1108c8"
        },
        "order": "desc",
        "orderBy": "created_date",
        "page": 1,
        "size": 10,
        "table": "gold.report"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        print("Data berhasil diambil. Jumlah data:", len(data.get("data", [])))
        
        with open('data_pengaduan.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print("Data disimpan di data_pengaduan.json")
            
    except requests.exceptions.RequestException as e:
        print(f"Error saat mengambil data: {e}")

if __name__ == "__main__":
    fetch_pengaduan_data()
