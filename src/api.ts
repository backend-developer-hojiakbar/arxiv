/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  mapAuditLog,
  mapCabinet,
  mapCategory,
  mapDocument,
  mapEmployee,
  mapStudent,
  mapUser,
} from "./apiMappers.ts";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://api.arxivfjsti.uz/api/v1";

const ACCESS_TOKEN_KEY = "arxiv_auth_token";
const REFRESH_TOKEN_KEY = "arxiv_refresh_token";

let refreshPromise: Promise<boolean> | null = null;

export function getAuthToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function setAuthToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("arxiv_user");
}

function parseApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    return first.msg || fallback;
  }
  const error = (data as { error?: string }).error;
  if (error) return error;
  return fallback;
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setAuthTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  allowRetry = true
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (
    !headers.has("Content-Type") &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401 && allowRetry && path !== "/auth/login") {
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      return request<T>(path, options, false);
    }
    removeAuthToken();
    throw new Error("Sessiya muddati tugadi. Qayta kiring.");
  }

  if (!response.ok) {
    let errMsg = "Noma'lum xatolik yuz berdi";
    try {
      const data = await response.json();
      errMsg = parseApiError(data, errMsg);
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return (await response.blob()) as T;
  }

  return response.json() as Promise<T>;
}

async function fetchAllDocumentsForStats() {
  const documents: ReturnType<typeof mapDocument>[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const raw = await request<{
      items: Record<string, unknown>[];
      pages: number;
    }>(`/documents?page=${page}&size=100`);
    documents.push(...(raw.items || []).map(mapDocument));
    totalPages = raw.pages || 1;
    page += 1;
  } while (page <= totalPages && page <= 10);

  return documents;
}

export async function fetchDocumentPdf(docId: string): Promise<Blob> {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response = await fetch(`${API_BASE}/documents/${docId}/download`, { headers });

  if (response.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const newToken = getAuthToken();
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}/documents/${docId}/download`, { headers });
    }
  }

  if (!response.ok) {
    throw new Error("PDF faylni yuklab bo'lmadi");
  }

  return response.blob();
}

export const api = {
  login: async (username: string, password: string) => {
    const tokens = await request<{
      access_token: string;
      refresh_token: string;
    }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      },
      false
    );

    setAuthTokens(tokens.access_token, tokens.refresh_token);

    const me = await request<Record<string, unknown>>("/auth/me");
    const user = mapUser({ ...me, is_active: true });
    localStorage.setItem("arxiv_user", JSON.stringify(user));

    return { user, token: tokens.access_token };
  },

  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      removeAuthToken();
    }
  },

  getMe: async () => {
    const me = await request<Record<string, unknown>>("/auth/me");
    const user = mapUser({ ...me, is_active: true });
    localStorage.setItem("arxiv_user", JSON.stringify(user));
    return user;
  },

  getStats: async () => {
    const [counters, activities, categoryChart, weeklyStats, cabinetsRaw, allDocs] =
      await Promise.all([
        request<Record<string, number>>("/dashboard/counters"),
        request<Record<string, unknown>[]>("/dashboard/activities"),
        request<Array<{ name: string; count: number }>>("/dashboard/categories-chart"),
        request<Array<{ date: string; count: number }>>("/dashboard/weekly-stats"),
        request<Record<string, unknown>[]>("/cabinets"),
        fetchAllDocumentsForStats(),
      ]);

    const cabinets = cabinetsRaw.map(mapCabinet);
    const totalDocs = counters.total_documents || 0;

    const categoryStats = categoryChart.map((cat) => ({
      id: cat.name,
      name: cat.name,
      count: cat.count,
      percent: totalDocs > 0 ? Math.round((cat.count / totalDocs) * 100) : 0,
    }));

    const cabinetStats = cabinets.map((cab) => {
      const cabDocs = allDocs.filter((d) => d.cabinetId === cab.id);
      const floorDistribution: Record<number, number> = {};
      for (let i = 1; i <= cab.maxFloor; i++) {
        floorDistribution[i] = 0;
      }
      cabDocs.forEach((doc) => {
        if (doc.floor) {
          floorDistribution[doc.floor] = (floorDistribution[doc.floor] || 0) + 1;
        }
      });
      return {
        id: cab.id,
        name: cab.name,
        description: cab.description,
        floorDistribution,
      };
    });

    const songgiYozuvlar = (activities || []).map((item) => ({
      id: item.id,
      receivedAt: item.created_at,
      studentName: item.student_name || "—",
      categoryName: item.group_name ? `Guruh: ${item.group_name}` : "—",
      cabinetName: "—",
      floor: 0,
      status: item.status,
    }));

    const dayNames = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
    const weeklyData = weeklyStats.map((day) => {
      const dateObj = new Date(day.date);
      return {
        date: day.date,
        count: day.count,
        dayName: `${dayNames[dateObj.getDay()]} ${day.date.slice(5)}`,
      };
    });

    return {
      counters: {
        jamiHujjatlar: counters.total_documents ?? 0,
        jamiOquvchilar: counters.total_unique_students ?? 0,
        jamiKategoriyalar: counters.total_categories ?? 0,
        jamiShkaflar: counters.total_cabinets ?? 0,
        bugunQabulQilingan: counters.today_added ?? 0,
        bugunQidiruvlar: counters.today_searches ?? 0,
      },
      categoryStats,
      cabinetStats,
      songgiYozuvlar,
      weeklyData,
    };
  },

  getDocuments: async (params: {
    q?: string;
    categoryId?: string;
    cabinetId?: string;
    floor?: number;
    docDate?: string;
    personType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.q) query.set("query", params.q);
    if (params.categoryId) query.set("category_id", params.categoryId);
    if (params.cabinetId) query.set("cabinet_id", params.cabinetId);
    if (params.floor) query.set("floor", String(params.floor));
    if (params.docDate) query.set("doc_date", params.docDate);
    if (params.personType) query.set("person_type", params.personType);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("size", String(params.limit));

    const raw = await request<{
      items: Record<string, unknown>[];
      total: number;
      page: number;
      size: number;
      pages: number;
    }>(`/documents?${query.toString()}`);

    return {
      documents: (raw.items || []).map(mapDocument),
      total: raw.total,
      page: raw.page,
      size: raw.size,
      pages: raw.pages,
    };
  },

  getDocument: async (id: string) => {
    const raw = await request<Record<string, unknown>>(`/documents/${id}`);
    return mapDocument(raw);
  },

  createDocument: async (data: {
    categoryId: string;
    cabinetId: string;
    floor: number;
    docName: string;
    docDate?: string;
    personType?: string;
    employeeId?: string;
    studentId?: string;
    studentName?: string;
    groupName?: string;
    notes?: string;
    description?: string;
    file?: File | null;
    pdfBase64?: string;
    pdfFilename?: string;
  }) => {
    const form = new FormData();
    form.append("category_id", data.categoryId);
    form.append("cabinet_id", data.cabinetId);
    form.append("floor", String(data.floor));
    form.append("doc_name", data.docName);

    if (data.docDate) form.append("doc_date", data.docDate);
    if (data.personType) form.append("person_type", data.personType);
    if (data.employeeId) form.append("employee_id", data.employeeId);
    if (data.studentId) form.append("student_id", data.studentId);
    if (data.studentName) form.append("student_name", data.studentName);
    if (data.groupName) form.append("group_name", data.groupName);
    if (data.notes) form.append("notes", data.notes);
    if (data.description) form.append("description", data.description);

    if (data.file) {
      form.append("file", data.file);
    } else if (data.pdfBase64) {
      form.append("pdf_base64", data.pdfBase64);
      form.append("pdf_filename", data.pdfFilename || "arxiv_hujjat.pdf");
    }

    const raw = await request<Record<string, unknown>>("/documents", {
      method: "POST",
      body: form,
    });
    return mapDocument(raw);
  },

  updateDocument: async (
    id: string,
    data: {
      categoryId?: string;
      cabinetId?: string;
      floor?: number;
      docName?: string;
      docDate?: string;
      personType?: string;
      employeeId?: string | null;
      studentId?: string | null;
      status?: string;
      notes?: string;
      description?: string;
    }
  ) => {
    const body: Record<string, unknown> = {};
    if (data.categoryId !== undefined) body.category_id = data.categoryId;
    if (data.cabinetId !== undefined) body.cabinet_id = data.cabinetId;
    if (data.floor !== undefined) body.floor = data.floor;
    if (data.docName !== undefined) body.doc_name = data.docName;
    if (data.docDate !== undefined) body.doc_date = data.docDate;
    if (data.personType !== undefined) body.person_type = data.personType;
    if (data.employeeId !== undefined) body.employee_id = data.employeeId;
    if (data.studentId !== undefined) body.student_id = data.studentId;
    if (data.status !== undefined) body.status = data.status;
    if (data.notes !== undefined) body.notes = data.notes;
    if (data.description !== undefined) body.description = data.description;

    const raw = await request<Record<string, unknown>>(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapDocument(raw);
  },

  deleteDocument: (id: string) =>
    request(`/documents/${id}`, { method: "DELETE" }),

  getCategories: async (all = false) => {
    const raw = await request<Record<string, unknown>[]>("/categories");
    const mapped = raw.map(mapCategory);
    return all ? mapped : mapped.filter((c) => c.isActive);
  },

  createCategory: async (name: string, description?: string) => {
    const raw = await request<Record<string, unknown>>("/categories", {
      method: "POST",
      body: JSON.stringify({ name, description: description || null }),
    });
    return mapCategory(raw);
  },

  updateCategory: async (
    id: string,
    name: string,
    description?: string,
    isActive?: boolean
  ) => {
    const raw = await request<Record<string, unknown>>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        description: description || null,
        is_active: isActive,
      }),
    });
    return mapCategory(raw);
  },

  deleteCategory: (id: string) =>
    request(`/categories/${id}`, { method: "DELETE" }),

  getCabinets: async () => {
    const raw = await request<Record<string, unknown>[]>("/cabinets");
    return raw.map(mapCabinet);
  },

  createCabinet: async (
    name: string,
    description?: string,
    maxFloor = 9
  ) => {
    const raw = await request<Record<string, unknown>>("/cabinets", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: description || null,
        max_floor: maxFloor,
      }),
    });
    return mapCabinet(raw);
  },

  updateCabinet: async (
    id: string,
    name: string,
    description?: string,
    maxFloor?: number,
    isActive?: boolean
  ) => {
    const raw = await request<Record<string, unknown>>(`/cabinets/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        description: description || null,
        max_floor: maxFloor,
        is_active: isActive,
      }),
    });
    return mapCabinet(raw);
  },

  deleteCabinet: (id: string) =>
    request(`/cabinets/${id}`, { method: "DELETE" }),

  getUsers: async () => {
    const raw = await request<Record<string, unknown>[]>("/users");
    return raw.map(mapUser);
  },

  createUser: async (userData: {
    username: string;
    password: string;
    fullName: string;
    role: string;
  }) => {
    const raw = await request<Record<string, unknown>>("/users", {
      method: "POST",
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        full_name: userData.fullName,
        role: userData.role,
      }),
    });
    return mapUser(raw);
  },

  updateUser: async (
    id: string,
    userData: {
      fullName?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    }
  ) => {
    const body: Record<string, unknown> = {};
    if (userData.fullName !== undefined) body.full_name = userData.fullName;
    if (userData.role !== undefined) body.role = userData.role;
    if (userData.isActive !== undefined) body.is_active = userData.isActive;
    if (userData.password) body.password = userData.password;

    const raw = await request<Record<string, unknown>>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapUser(raw);
  },

  getAuditLogs: async (page = 1, size = 50) => {
    const raw = await request<{
      items: Record<string, unknown>[];
    }>(`/audit-logs?page=${page}&size=${size}`);
    return (raw.items || []).map(mapAuditLog);
  },

  getStudents: async (query?: string) => {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    const raw = await request<Record<string, unknown>[]>(`/students${q}`);
    return raw.map(mapStudent);
  },

  createStudent: async (data: {
    lastName: string;
    firstName: string;
    middleName?: string;
    studentId?: string;
    groupName?: string;
  }) => {
    const raw = await request<Record<string, unknown>>("/students", {
      method: "POST",
      body: JSON.stringify({
        last_name: data.lastName,
        first_name: data.firstName,
        middle_name: data.middleName || null,
        student_id: data.studentId || null,
        group_name: data.groupName || null,
      }),
    });
    return mapStudent(raw);
  },

  updateStudent: async (
    id: string,
    data: Partial<{
      lastName: string;
      firstName: string;
      middleName: string;
      studentId: string;
      groupName: string;
      isActive: boolean;
    }>
  ) => {
    const body: Record<string, unknown> = {};
    if (data.lastName !== undefined) body.last_name = data.lastName;
    if (data.firstName !== undefined) body.first_name = data.firstName;
    if (data.middleName !== undefined) body.middle_name = data.middleName;
    if (data.studentId !== undefined) body.student_id = data.studentId;
    if (data.groupName !== undefined) body.group_name = data.groupName;
    if (data.isActive !== undefined) body.is_active = data.isActive;

    const raw = await request<Record<string, unknown>>(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapStudent(raw);
  },

  getEmployees: async (query?: string) => {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    const raw = await request<Record<string, unknown>[]>(`/employees${q}`);
    return raw.map(mapEmployee);
  },

  createEmployee: async (data: {
    lastName: string;
    firstName: string;
    middleName?: string;
    employeeId: string;
    department?: string;
    position?: string;
    phone?: string;
  }) => {
    const raw = await request<Record<string, unknown>>("/employees", {
      method: "POST",
      body: JSON.stringify({
        last_name: data.lastName,
        first_name: data.firstName,
        middle_name: data.middleName || null,
        employee_id: data.employeeId,
        department: data.department || null,
        position: data.position || null,
        phone: data.phone || null,
      }),
    });
    return mapEmployee(raw);
  },

  updateEmployee: async (
    id: string,
    data: Partial<{
      lastName: string;
      firstName: string;
      middleName: string;
      employeeId: string;
      department: string;
      position: string;
      phone: string;
      isActive: boolean;
    }>
  ) => {
    const body: Record<string, unknown> = {};
    if (data.lastName !== undefined) body.last_name = data.lastName;
    if (data.firstName !== undefined) body.first_name = data.firstName;
    if (data.middleName !== undefined) body.middle_name = data.middleName;
    if (data.employeeId !== undefined) body.employee_id = data.employeeId;
    if (data.department !== undefined) body.department = data.department;
    if (data.position !== undefined) body.position = data.position;
    if (data.phone !== undefined) body.phone = data.phone;
    if (data.isActive !== undefined) body.is_active = data.isActive;

    const raw = await request<Record<string, unknown>>(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapEmployee(raw);
  },
};
