export interface GajamadaReport {
  id: string;
  created_date: number;
  created_date_utc: number;
  p_id: string;
  updated_at: number;
  prepetrator_id: string | null;
  prepetrator_name: string | null;
  type: string | null;
  method: string | null;
  polda: string | null;
  polres: string | null;
  polsek: string | null;
  polda_code: number | null;
  polres_code: number | null;
  polsek_code: number | null;
  disposisi_polda: string | null;
  disposisi_polres: string | null;
  disposisi_polda_code: number | null;
  disposisi_polres_code: number | null;
  disposisi_police_function: string | null;
  disposisi_case_position: string | null;
  category: string | null;
  total_report: number;
  content: string | null;
  '5w1h_when': number | null;
  '5w1h_where': string | null;
  phone_no: string | null;
  summary: string | null;
  pengirim: string | null;
  source: string | null;
  source_alias: string | null;
  reporter_nik: string | null;
  email: string | null;
  status_label: string | null;
}

export interface GajamadaPagination {
  size: number;
  totalElements: number;
  totalPages: number;
  scrollId: string;
}

export interface GajamadaListResponse {
  metaData: {
    pagination: GajamadaPagination;
    status: boolean;
    responseCode: number;
    message: string;
    execution_time: number;
  };
  data: GajamadaReport[];
}

export interface GajamadaFilterValue {
  gte?: number;
  lte?: number;
  is?: string;
  isOneOf?: string[];
}

export interface GajamadaFilter {
  field: string;
  fieldType: string;
  field_type_origin?: string;
  operator: string;
  table: string;
  value: GajamadaFilterValue;
}

export interface GajamadaFetchParams {
  baseUrl: string;
  connectionId: string;
  database: string;
  table: string;
  dashboardId: string;
  menuId: string;
  widgetId: string;
  mdmId: string;
  userId: string;
  domain: string;
  disposisiPolda: string;
  statusExclude: string[];
  page?: number;
  size?: number;
}

export interface GajamadaClientConfig {
  baseUrl: string;
  username: string;
  password: string;
}
