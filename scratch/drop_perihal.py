import pg8000.native

try:
    conn = pg8000.native.Connection(
        host="aws-1-ap-southeast-1.pooler.supabase.com",
        port=5432,
        database="postgres",
        user="postgres.kzekrzdyyhedstoaihlt",
        password="\044\046Kilodash123",
    )
    res = conn.run("SELECT column_name FROM information_schema.columns WHERE table_name='pengaduan_terlapor'")
    print("Columns of 'pengaduan_terlapor':")
    for r in res:
        print(f"  {r[0]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
