import {
  mockDashboard,
  mockDayDetail,
  mockEntryDetail,
  mockInsightOverview,
  mockTableRowDetail,
  mockTableRows,
  mockTableTemplates,
} from "@/lib/mock";
import { ENDPOINTS } from "@/lib/api-endpoints";
import type {
  DashboardData,
  DayDetail,
  InsightDraft,
  InsightOverview,
  JournalEntryDetail,
  Revision,
  TableTemplate,
  TableRowDetail,
  TableRowFieldValue,
  TableRowListItem,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const TOKEN_STORAGE_KEY = "liubai-access-token";

type RegisterPayload = {
  email: string;
  display_name: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RequestPasswordResetPayload = {
  email: string;
};

type RequestPasswordResetResult = {
  message: string;
  reset_token?: string | null;
};

type ConfirmPasswordResetPayload = {
  token: string;
  new_password: string;
};

type CurrentUser = {
  id: string;
  email: string;
  display_name: string;
};

type EntryPayload = {
  title: string;
  content: string;
  emotion_key: string;
  weather_key?: string | null;
  tags: string[];
  source_page: string;
};

type EntryUpdatePayload = Partial<EntryPayload>;

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = "请求失败";
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        detail = payload.detail;
      }
    } catch {}
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

function requireApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("未配置 NEXT_PUBLIC_API_BASE_URL");
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!API_BASE_URL) {
    return mockDashboard;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.dashboard.demo}`, { next: { revalidate: 0 } });
    if (!response.ok) {
      return mockDashboard;
    }
    return (await response.json()) as DashboardData;
  } catch {
    return mockDashboard;
  }
}

export async function registerUser(payload: RegisterPayload): Promise<string> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.register}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ access_token: string }>(response);
  return data.access_token;
}

export async function loginUser(payload: LoginPayload): Promise<string> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.login}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ access_token: string }>(response);
  return data.access_token;
}

export async function requestPasswordReset(payload: RequestPasswordResetPayload): Promise<RequestPasswordResetResult> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.requestPasswordReset}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<RequestPasswordResetResult>(response);
}

export async function confirmPasswordReset(payload: ConfirmPasswordResetPayload): Promise<string> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.confirmPasswordReset}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ message: string }>(response);
  return data.message;
}

export async function fetchCurrentUser(token: string): Promise<CurrentUser> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.me}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseResponse<CurrentUser>(response);
}

export async function fetchDashboard(token: string): Promise<DashboardData> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.dashboard.real}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseResponse<DashboardData>(response);
}

export async function createEntry(token: string, payload: EntryPayload): Promise<JournalEntryDetail> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.entries.create}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<JournalEntryDetail>(response);
}

export async function fetchEntryDetail(token: string, entryId: string): Promise<JournalEntryDetail> {
  if (!API_BASE_URL) {
    return { ...mockEntryDetail, id: entryId };
  }
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.entries.detail(entryId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseResponse<JournalEntryDetail>(response);
}

export async function updateEntry(
  token: string,
  entryId: string,
  payload: EntryUpdatePayload,
): Promise<JournalEntryDetail> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.entries.update(entryId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<JournalEntryDetail>(response);
}

export async function deleteEntry(token: string, entryId: string): Promise<void> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.entries.delete(entryId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseResponse(response);
}

export async function fetchDayDetail(token: string, date: string): Promise<DayDetail> {
  if (!API_BASE_URL) {
    return { ...mockDayDetail, date };
  }
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.days.detail(date)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseResponse<DayDetail>(response);
}

export async function fetchInsightsOverview(token: string): Promise<InsightOverview> {
  if (!API_BASE_URL) {
    return mockInsightOverview;
  }
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.insights.overview}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseResponse<InsightOverview>(response);
}

export async function regenerateInsightsOverview(token: string): Promise<InsightOverview> {
  if (!API_BASE_URL) {
    return mockInsightOverview;
  }
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.insights.regenerateOverview}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseResponse<InsightOverview>(response);
}

export async function fetchTableTemplates(token?: string): Promise<TableTemplate[]> {
  if (!API_BASE_URL) {
    return mockTableTemplates;
  }
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.table.templates}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  return parseResponse<TableTemplate[]>(response);
}

export async function fetchTableRows(token: string, templateKey?: string): Promise<TableRowListItem[]> {
  if (!API_BASE_URL) {
    return templateKey ? mockTableRows.filter((row) => row.template_key === templateKey) : mockTableRows;
  }
  const query = templateKey ? `?template_key=${encodeURIComponent(templateKey)}` : "";
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.table.rows}${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseResponse<TableRowListItem[]>(response);
}

export async function createTableRow(
  token: string,
  payload: { template_key: string; title: string; status?: string; fields: TableRowFieldValue[] },
): Promise<TableRowDetail> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.table.rowCreate}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<TableRowDetail>(response);
}

export async function updateTableRow(
  token: string,
  rowId: string,
  payload: { title?: string; status?: string; fields?: TableRowFieldValue[] },
): Promise<TableRowDetail> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.table.rowUpdate(rowId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<TableRowDetail>(response);
}

export async function fetchTableRowDetail(token: string, rowId: string): Promise<TableRowDetail> {
  if (!API_BASE_URL) {
    return { ...mockTableRowDetail, id: rowId };
  }
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.table.rowDetail(rowId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseResponse<TableRowDetail>(response);
}

export async function regenerateAiDraft(token: string, entryId: string): Promise<InsightDraft> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.entries.aiDraftRegenerate(entryId)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<InsightDraft>(response);
}

export async function previewTableAiDraft(
  token: string,
  templateKey: string,
  freeText: string,
): Promise<Record<string, string>> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.table.rowAiDraft}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ template_key: templateKey, free_text: freeText }),
  });
  return parseResponse<Record<string, string>>(response);
}

export async function saveRevision(token: string, entryId: string, content: string): Promise<Revision> {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.entries.revision(entryId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  return parseResponse<Revision>(response);
}
