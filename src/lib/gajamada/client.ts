import makeFetchCookie from 'fetch-cookie';
import type {
  GajamadaClientConfig,
  GajamadaFetchParams,
  GajamadaListResponse,
  GajamadaReport,
  GajamadaActionParams,
  GajamadaActionResponse,
  GajamadaUnitOption,
  GajamadaUnitListResponse,
} from './types';

export class GajamadaClient {
  private fetch: typeof fetch;
  private baseUrl: string;
  private username: string;
  private password: string;
  private loggedIn = false;
  private accessToken: string | null = null;

  constructor(config: GajamadaClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.username = config.username;
    this.password = config.password;
    this.fetch = makeFetchCookie(fetch);
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private defaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      Origin: this.baseUrl,
      Referer: `${this.baseUrl}/`,
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  private extractAccessToken(res: Response): void {
    const setCookie = (
      res.headers as unknown as { getSetCookie?: () => string[] }
    ).getSetCookie?.();
    if (!setCookie) return;
    for (const cookie of setCookie) {
      const match = cookie.match(/token=([^;]+)/);
      if (match?.[1]) {
        this.accessToken = match[1];
        break;
      }
    }
  }

  async login(): Promise<void> {
    const res = await this.fetch(this.url('/api/v1/apps/auth/login'), {
      method: 'POST',
      headers: this.defaultHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        email: this.username.trim(),
        password: this.password,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Gajamada login failed: ${res.status} ${text}`);
    }

    this.extractAccessToken(res);
    this.loggedIn = true;
  }

  private ensureLoggedIn(): void {
    if (!this.loggedIn) {
      throw new Error('Gajamada client not logged in. Call login() first.');
    }
  }

  async fetchReportsPage(params: GajamadaFetchParams): Promise<GajamadaListResponse> {
    this.ensureLoggedIn();

    const {
      connectionId,
      database,
      table,
      dashboardId,
      menuId,
      widgetId,
      mdmId,
      userId,
      domain,
      disposisiPolda,
      statusExclude,
      page = 1,
      size = 10,
    } = params;

    const filters = [
      {
        field: 'status_label',
        fieldType: 'string',
        field_type_origin: '',
        operator: 'is not one of',
        table,
        value: {
          gte: 0,
          is: '',
          isOneOf: statusExclude,
          lte: 0,
        },
      },
      {
        field: 'disposisi_polda',
        fieldType: 'string',
        field_type_origin: '',
        operator: 'is',
        table,
        value: {
          gte: 0,
          lte: 0,
          is: disposisiPolda,
          isOneOf: [],
        },
      },
    ];

    const payload = {
      connectionId,
      table,
      orderBy: 'created_date',
      order: 'desc',
      size,
      database,
      metaData: {
        widgetId,
        menuId,
        dashboardId,
        mdmId,
        userId,
        domain,
      },
      filters,
      page,
    };

    const res = await this.fetch(this.url('/api/v1/apps/data/management/get-all'), {
      method: 'POST',
      headers: this.defaultHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Gajamada fetch failed: ${res.status} ${text}`);
    }

    return (await res.json()) as GajamadaListResponse;
  }

  async fetchAllReports(params: GajamadaFetchParams): Promise<GajamadaReport[]> {
    this.ensureLoggedIn();

    const firstPage = await this.fetchReportsPage({ ...params, page: 1 });
    const totalPages = firstPage.metaData.pagination.totalPages;
    const all = [...firstPage.data];
    console.log(
      `[Gajamada] Page 1/${totalPages}, got ${firstPage.data.length} items, total ${firstPage.metaData.pagination.totalElements}`,
    );

    // Fetch the rest of the pages sequentially to avoid overloading the server
    for (let page = 2; page <= totalPages; page++) {
      const next = await this.fetchReportsPage({ ...params, page });
      all.push(...next.data);
      console.log(`[Gajamada] Page ${page}/${totalPages}, got ${next.data.length} items`);
    }

    console.log(`[Gajamada] Fetched ${all.length} total items`);
    return all;
  }

  async fetchUnitOptions(
    connectionId: string,
    subFunction: string,
    search?: string,
  ): Promise<GajamadaUnitOption[]> {
    this.ensureLoggedIn();

    const filters = [
      {
        field: 'sub_function',
        operator: 'is',
        table: 'dimension.catalog_unit_name',
        fieldType: 'text',
        value: { is: subFunction },
      },
    ];

    const payload: Record<string, unknown> = {
      orderBy: 'unit',
      order: 'asc',
      page: 1,
      size: 1000,
      connectionId,
      table: 'dimension.catalog_unit_name',
      database: 'divpropam',
      filters,
    };

    if (search) {
      payload.search = search;
      payload.search_by = ['unit'];
    }

    const res = await this.fetch(
      this.url('/api/v1/apps/data/management/get-all'),
      {
        method: 'POST',
        headers: this.defaultHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Gajamada fetch unit options failed: ${res.status} ${text}`);
    }

    const result = (await res.json()) as GajamadaUnitListResponse;
    return (result.data || []).filter((o) => o.unit?.trim());
  }

  async terimaDanDistribusikan(
    params: {
      reportId: string;
      unitName: string;
      poldaName: string;
      note: string;
      createdBy: string;
    },
    config: {
      gatewayId: string;
      widgetId: string;
      menuId: string;
      dashboardId: string;
      userId: string;
    },
  ): Promise<GajamadaActionResponse> {
    return this.executeAction(
      {
        reportId: params.reportId,
        status: 'Laporan Diterima',
        casePosition: `${params.unitName} ${params.poldaName}`,
        note: params.note,
        createdBy: params.createdBy,
      },
      config,
    );
  }

  async executeAction(
    params: GajamadaActionParams,
    config: {
      gatewayId: string;
      widgetId: string;
      menuId: string;
      dashboardId: string;
      userId: string;
    },
  ): Promise<GajamadaActionResponse> {
    this.ensureLoggedIn();

    const actionParams: Record<string, string> = {
      report_id: params.reportId,
      note: params.note || '',
      createdBy: params.createdBy,
      status: params.status,
      case_position: params.casePosition,
    };

    if (params.caseHandover) {
      actionParams.case_handover = params.caseHandover;
    }

    const payload = {
      client: 'Propam Polri',
      gatewayId: config.gatewayId,
      params: actionParams,
      body: {},
      headers: {},
      additionalPath: '',
      additionalParams: {},
      additionalFileParams: {},
      tags: ['Propam Polri'],
      createdBy: config.userId,
      startDate: '',
      endDate: '',
      dashboardId: config.dashboardId,
      sessionId: '',
      logging: false,
      appendedLog: false,
      metaData: {
        widgetId: config.widgetId,
        widgetName: 'Widget Aksi',
        menuId: config.menuId,
        menuName: 'Detail Laporan',
        dashboardId: config.dashboardId,
        dashboardName: 'Propam Aduan',
        userId: config.userId,
        domain: '',
      },
    };

    const res = await this.fetch(this.url('/api/v1/apps/api/gateway/execute'), {
      method: 'POST',
      headers: this.defaultHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Gajamada action failed: ${res.status} ${text}`);
    }

    return (await res.json()) as GajamadaActionResponse;
  }
}

export function createGajamadaClient(): GajamadaClient {
  const baseUrl = process.env.GAJAMADA_BASE_URL;
  const username = process.env.GAJAMADA_USERNAME;
  const password = process.env.GAJAMADA_PASSWORD;

  if (!baseUrl || !username || !password) {
    throw new Error('GAJAMADA_BASE_URL, GAJAMADA_USERNAME, and GAJAMADA_PASSWORD must be set');
  }

  return new GajamadaClient({ baseUrl, username, password });
}
