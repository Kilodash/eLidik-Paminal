const fs = require('fs');
const lines = fs.readFileSync('src/app/(dashboard)/pengaduan/actions.ts', 'utf8').split('\n');
const newContent = lines.slice(0, 474).join('\n') + `

export async function checkUnsavedPropamDataAction() {
  try {
    const supabase = await createClient()
    const tenantId = await requireTenant()
    
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const url = "https://gajamada-propam.polri.go.id/report/laporan-pengaduan"
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
    const payload = {
      "connectionId": "245b8fd7c4a763019d5172fad5ec0086",
      "database": "divpropam",
      "filters": [
        {
          "field": "status_label",
          "fieldType": "string",
          "field_type_origin": "",
          "operator": "is not one of",
          "value": []
        }
      ],
      "metaData": {
        "widgetId": "8533ca87b75e04b1f39d19d98dabc0ef",
        "menuId": "ce64015a07578d9195a0e589de1108c8"
      },
      "order": "desc",
      "orderBy": "created_date",
      "page": 1,
      "size": 100,
      "table": "gold.report"
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(\`Gagal fetch e-Propam: \${response.statusText}\`)
    }

    const result = await response.json()
    const items = result.data || []
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsavedItems: any[] = []

    for (const item of items) {
      const { data: existing } = await supabase
        .from('pengaduan')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('kronologi', \`%\${item.content.substring(0, 50)}%\`)
        .limit(1)

      if (!existing || existing.length === 0) {
        unsavedItems.push(item)
      }
    }

    return { success: true, data: unsavedItems }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error checking propam data:', error)
    return { error: error.message || 'Gagal mengecek data e-Propam' }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveSinglePropamDataAction(item: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const dataPayload = {
      jenis: "Pengaduan Cepat Propam",
      tgl_pengaduan: new Date(item.created_date).toISOString().split('T')[0],
      pelapor_nama: item.pengirim || "Hamba Allah",
      terlapor_nama: item.prepetrator_name || "Tidak Diketahui",
      satker_dilaporkan: item.disposisi_polda || "POLDA JAWA BARAT",
      keterangan: item.summary || item.type || "",
      kronologi: item.content || "",
      atensi: true,
      created_by: userId,
    }

    await createPengaduan(dataPayload)
    revalidatePath('/pengaduan')

    return { success: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error saving single propam data:', error)
    return { error: error.message || 'Gagal menyimpan data pengaduan' }
  }
}
`;
fs.writeFileSync('src/app/(dashboard)/pengaduan/actions.ts', newContent);
console.log('Fixed actions.ts');
