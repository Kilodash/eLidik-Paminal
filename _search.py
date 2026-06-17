with open(r'C:\Users\ACER\Downloads\eLidikPaminal\_perkap2023_clean.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()
keywords = ['NOTA DINAS', 'SURAT DINAS', 'BERITA ACARA', 'SURAT PERINTAH', 
            'LAPORAN HASIL', 'BAB III', 'BAGIAN KEEMPAT', 'BAGIAN KELIMA',
            'SUSUNAN', 'KEPALA NASKAH', 'KOP NASKAH', 'TAJUK']
for i, l in enumerate(lines):
    l = l.strip()
    if l:
        for kw in keywords:
            if kw in l.upper():
                print(f'L{i}: {l[:180]}')
                break
