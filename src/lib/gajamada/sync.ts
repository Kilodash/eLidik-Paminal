import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createGajamadaClient } from './client';
import { normalizeCategoryName } from './mapper';
import type { GajamadaFetchParams, GajamadaReport } from './types';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err)
    return (err as { message: string }).message;
  return String(err);
}

async function getTenantVariables(tenantId: string): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tenant_variables')
    .select('key, value')
    .eq('tenant_id', tenantId);

  if (error) throw error;

  const vars: Record<string, string> = {};
  for (const row of data || []) {
    if (row.key && row.value !== null && row.value !== undefined) {
      vars[row.key] = row.value;
    }
  }
  return vars;
}

function getFetchParams(vars: Record<string, string>): GajamadaFetchParams {
  const statusExcludeRaw = vars['gajamada_status_exclude'] || '[]';
  let statusExclude: string[] = [];
  try {
    statusExclude = JSON.parse(statusExcludeRaw);
  } catch {
    statusExclude = [];
  }

  // Fallback: kalau gajamada_disposisi_polda kosong, derive dari nama_polda
  let disposisiPolda = vars['gajamada_disposisi_polda'] || '';
  if (!disposisiPolda && vars['nama_polda']) {
    disposisiPolda = 'POLDA ' + vars['nama_polda'].replace(/^Polda\s+/i, '').toUpperCase();
  }

  return {
    baseUrl: process.env.GAJAMADA_BASE_URL || '',
    connectionId: vars['gajamada_connection_id'] || '',
    database: vars['gajamada_database'] || 'divpropam',
    table: vars['gajamada_table'] || 'gold.report',
    dashboardId: vars['gajamada_dashboard_id'] || '',
    menuId: vars['gajamada_menu_id'] || '',
    widgetId: vars['gajamada_widget_id'] || '',
    mdmId: vars['gajamada_mdm_id'] || '',
    userId: vars['gajamada_user_id'] || '',
    domain: vars['gajamada_domain'] || 'gajamada-propam.polri.go.id',
    disposisiPolda,
    statusExclude,
    size: 100,
  };
}

function mapStatus(statusLabel: string | null): string {
  if (!statusLabel) return 'diterima';
  const s = statusLabel.toLowerCase();
  if (s.includes('terbukti')) return 'terbukti';
  if (s.includes('tidak terbukti')) return 'tidak_terbukti';
  if (s.includes('perdamaian')) return 'perdamaian';
  if (s.includes('tolak') || s.includes('batal')) return 'dibatalkan';
  if (s.includes('diterima')) return 'diterima';
  return 'diterima';
}

function epochToDate(ts: number | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

export interface SyncResult {
  success: true;
  count: number;
  skipped: number;
  insertedIds: string[];
}

export async function syncGajamadaIntake({
  tenantId,
  createdBy,
}: {
  tenantId: string;
  createdBy: string;
}): Promise<SyncResult | { success: false; error: string }> {
  try {
    const admin = createAdminClient();
    const vars = await getTenantVariables(tenantId);

    const client = createGajamadaClient();
    await client.login();

    const params = getFetchParams(vars);

    // Existing gajamada_ids as set for fast lookup and early stop
    const { data: existingIds } = await admin
      .from('pengaduan')
      .select('gajamada_id')
      .eq('tenant_id', tenantId)
      .not('gajamada_id', 'is', null)
      .limit(100000);

    const existingSet = new Set(
      (existingIds || []).map((r) => r.gajamada_id).filter(Boolean) as string[],
    );

    const reports: GajamadaReport[] = [];
    let stopEarly = false;

    for (let page = 1; !stopEarly; page++) {
      const pageResult = await client.fetchReportsPage({ ...params, page });

      const allExists = pageResult.data.every((r) => existingSet.has(r.id));
      if (allExists) {
        // This page and all subsequent pages already synced
        break;
      }

      const newReports = pageResult.data.filter((r) => !existingSet.has(r.id));
      reports.push(...newReports);

      if (page >= pageResult.metaData.pagination.totalPages) {
        stopEarly = true;
      }
    }

    // Dedup reports by gajamada_id (guard against duplicates within batch)
    const seenIds = new Set<string>();
    const uniqueReports = reports.filter((r) => {
      if (seenIds.has(r.id)) return false;
      seenIds.add(r.id);
      return true;
    });

    if (uniqueReports.length === 0) {
      return { success: true, count: 0, skipped: existingSet.size, insertedIds: [] };
    }

    // Collect all new gajamada_ids for the final skip count
    const newIds = uniqueReports.map((r) => r.id);

    // Build klasifikasi lookup: normalize category -> id
    const categories = [
      ...new Set(uniqueReports.map((r) => r.category).filter(Boolean)),
    ] as string[];
    const normalizedKats = categories.map((c) => ({
      original: c,
      normalized: normalizeCategoryName(c),
      kode: normalizeCategoryName(c)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_'),
    }));

    // Batch upsert klasifikasi: get existing + create missing in one batch
    const katKodes = normalizedKats.map((k) => k.kode);
    const { data: existingKats } = await admin
      .from('klasifikasi')
      .select('kode')
      .eq('tenant_id', tenantId)
      .in('kode', katKodes);

    const existingKodeSet = new Set((existingKats || []).map((r) => r.kode));
    const newKats = normalizedKats.filter((k) => !existingKodeSet.has(k.kode));

    if (newKats.length > 0) {
      await admin
        .from('klasifikasi')
        .insert(newKats.map((k) => ({ tenant_id: tenantId, kode: k.kode, nama: k.normalized })));
    }

    // Reload klasifikasi map
    const { data: klasifikasiRows } = await admin
      .from('klasifikasi')
      .select('id, kode')
      .eq('tenant_id', tenantId);

    const klasifikasiMap = new Map<string, string>();
    for (const k of klasifikasiRows || []) {
      if (k.kode) klasifikasiMap.set((k.kode || '').toUpperCase(), k.id);
    }

    // Batch insert pengaduan
    const pengaduanRows = uniqueReports.map((r) => {
      const katKode = normalizeCategoryName(r.category)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_');
      return {
        tenant_id: tenantId,
        gajamada_id: r.id,
        gajamada_p_id: r.p_id,
        gajamada_status: r.status_label,
        gajamada_synced_at: new Date().toISOString(),
        nomor_register: r.id,
        nomor_surat: r.id,
        jenis: 'Pengaduan Cepat Propam',
        tgl_pengaduan: epochToDate(r.created_date),
        tgl_surat: epochToDate(r.created_date),
        tgl_kejadian: epochToDate(r['5w1h_when']),
        pelapor_nama: r.pengirim?.trim() || null,
        pelapor_kontak: r.phone_no?.trim() || null,
        pelapor_email: r.email?.trim() || null,
        pelapor_nik: r.reporter_nik?.trim() || null,
        pelapor_total_report: Number(r.total_report) || 0,
        kronologi_lengkap: r.content?.trim() || null,
        kronologi: (r.content?.trim() || null)?.substring(0, 5000),
        status: mapStatus(r.status_label),
        klasifikasi_id: klasifikasiMap.get(katKode) || null,
        created_by: createdBy,
        ai_processed: false,
      };
    });

    const { error: insertError } = await admin
      .from('pengaduan')
      .upsert(pengaduanRows, { onConflict: 'gajamada_id', ignoreDuplicates: true });
    if (insertError) throw insertError;

    // Reload inserted IDs
    const { data: insertedRows } = await admin
      .from('pengaduan')
      .select('id, gajamada_id')
      .eq('tenant_id', tenantId)
      .in('gajamada_id', newIds as string[]);

    const idMap = new Map<string, string>();
    for (const row of insertedRows || []) {
      if (row.gajamada_id) idMap.set(row.gajamada_id, row.id);
    }

    // Batch insert terlapor
    const terlaporRows = uniqueReports.map((r) => {
      const nama = r.prepetrator_name?.trim() || 'Anggota Polri (identitas belum dikenali)';
      return {
        tenant_id: tenantId,
        nama,
        status_identitas: r.prepetrator_name ? 'diketahui' : 'tidak_diketahui',
      };
    });

    const { data: insertedTerlaporRows, error: terlaporInsertError } = await admin
      .from('terlapor')
      .insert(terlaporRows)
      .select('id, nama');

    if (terlaporInsertError) throw terlaporInsertError;

    const insertedTerlapor = (insertedTerlaporRows || []).map((t, i) => ({ ...t, _idx: i }));

    // Batch insert pengaduan_terlapor link
    const linkRows = uniqueReports
      .map((r, i) => {
        const pengaduanId = idMap.get(r.id);
        const terlaporEntry = insertedTerlapor[i];
        if (pengaduanId && terlaporEntry?.id) {
          return { pengaduan_id: pengaduanId, terlapor_id: terlaporEntry.id };
        }
        return null;
      })
      .filter(Boolean) as { pengaduan_id: string; terlapor_id: string }[];

    if (linkRows.length > 0) {
      await admin.from('pengaduan_terlapor').insert(linkRows);
    }

    // Batch audit logs
    const auditRows = insertedRows
      ?.map((row) => ({
        tenant_id: tenantId,
        user_id: createdBy,
        action: 'INSERT',
        entity_type: 'pengaduan',
        entity_id: row.id,
        summary: `Sinkron Gajamada: ${row.gajamada_id}`,
      }))
      .filter(Boolean);

    if (auditRows?.length) {
      await admin.from('audit_logs').insert(auditRows);
    }

    return {
      success: true,
      count: uniqueReports.length,
      skipped: existingSet.size,
      insertedIds: insertedRows?.map((r) => r.id) || [],
    };
  } catch (err: unknown) {
    console.error('syncGajamadaIntake error:', err);
    return { success: false, error: getErrorMessage(err) || 'Gagal sinkron Gajamada' };
  }
}
