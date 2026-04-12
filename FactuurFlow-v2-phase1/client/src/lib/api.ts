// ── Basis fetch helper ────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).message ?? `HTTP ${res.status}`);
  return data as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Client {
  id: number;
  userId: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  kvk: string | null;
  btw: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  sortOrder: number | null;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Invoice {
  id: number;
  userId: number;
  clientId: number | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  discount: string;
  total: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  clientName?: string | null;
  clientEmail?: string | null;
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  client: Client | null;
}

export interface DashboardStats {
  totalRevenue: number;
  outstanding: number;
  invoiceCount: number;
  clientCount: number;
  monthlyRevenue: { month: string; omzet: number }[];
}

// ── Clients API ───────────────────────────────────────────────────────────────
export const clientsApi = {
  list: () => apiFetch<Client[]>("/api/clients"),

  get: (id: number) => apiFetch<Client>(`/api/clients/${id}`),

  create: (data: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">) =>
    apiFetch<Client>("/api/clients", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: Partial<Client>) =>
    apiFetch<Client>(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/api/clients/${id}`, { method: "DELETE" }),
};

// ── Invoices API ──────────────────────────────────────────────────────────────
export interface CreateInvoicePayload {
  clientId?: number | null;
  invoiceNumber: string;
  status?: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
  taxRate?: number;
  discount?: number;
  items: { description: string; quantity: number; unitPrice: number; sortOrder?: number }[];
}

export const invoicesApi = {
  list: () => apiFetch<Invoice[]>("/api/invoices"),

  get: (id: number) => apiFetch<InvoiceDetail>(`/api/invoices/${id}`),

  create: (data: CreateInvoicePayload) =>
    apiFetch<InvoiceDetail>("/api/invoices", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: Partial<CreateInvoicePayload>) =>
    apiFetch<Invoice>(`/api/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  updateStatus: (id: number, status: InvoiceStatus) =>
    apiFetch<Invoice>(`/api/invoices/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/api/invoices/${id}`, { method: "DELETE" }),
};

// ── Dashboard API ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => apiFetch<DashboardStats>("/api/dashboard/stats"),
};
