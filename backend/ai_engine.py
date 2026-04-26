import os
import json
import google.generativeai as genai
from typing import Dict, Any

class AIEngine:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    async def analyze_dumas(self, keterangan: str) -> Dict[str, Any]:
        """
        Extract SIADIDEMENBABI context from Dumas keterangan.
        """
        if not self.model:
            return {
                "error": "GEMINI_API_KEY not configured",
                "siapa": "-", "apa": "-", "dimana": "-", 
                "dengan_apa": "-", "menggunakan_apa": "-", 
                "bagaimana": "-", "bilamana": "-"
            }

        prompt = f"""
        Tugas Anda adalah menganalisis teks pengaduan masyarakat (Dumas) Kepolisian dan mengekstrak informasi berdasarkan unsur SIADIDEMENBABI.
        
        SIADIDEMENBABI terdiri dari:
        1. Siapa: Subjek atau pelaku (terlapor) dan korban.
        2. Apa: Peristiwa atau dugaan pelanggaran yang terjadi.
        3. Dimana: Lokasi kejadian.
        4. Dengan apa: Alat atau sarana yang digunakan (jika ada).
        5. Menggunakan apa: Cara atau modus operandi (jika ada).
        6. Bagaimana: Kronologi singkat kejadian.
        7. Bilamana: Waktu kejadian.

        Teks Pengaduan:
        "{keterangan}"

        Berikan jawaban dalam format JSON murni dengan key: 
        "siapa", "apa", "dimana", "dengan_apa", "menggunakan_apa", "bagaimana", "bilamana".
        Jika informasi tidak ditemukan, isi dengan "-".
        """

        try:
            response = self.model.generate_content(prompt)
            # Find JSON in response text
            text = response.text
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                json_str = text[start:end]
                return json.loads(json_str)
            return {"error": "Failed to parse AI response"}
        except Exception as e:
            return {"error": str(e)}

ai_engine = AIEngine()
