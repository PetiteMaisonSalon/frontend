const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("pm_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type FetchAPIOptions = RequestInit & { skipAuth?: boolean };

async function fetchAPI(endpoint: string, options?: FetchAPIOptions) {
  const authHeaders = options?.skipAuth ? {} : getAuthHeaders();
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options?.headers as Record<string, string>),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Fehler");
  return data;
}

export async function login(email: string, password: string) {
  const data = await fetchAPI("/api/auth/login", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  });
  if (data.token && typeof window !== "undefined") {
    localStorage.setItem("pm_token", data.token);
  }
  return data;
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  return fetchAPI("/api/auth/register", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify(data),
  });
}

export async function verifyEmail(token: string) {
  return fetchAPI("/api/auth/verify-email", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ token }),
  });
}

export async function getMe() {
  return fetchAPI("/api/auth/me");
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("pm_token");
  }
}

export async function getServices(category?: string) {
  const q = category ? `?category=${category}` : "";
  return fetchAPI(`/api/services${q}`);
}

export async function getStaff() {
  return fetchAPI("/api/staff");
}

export async function getAvailableDays(serviceId: string, from?: string) {
  const params = new URLSearchParams({ serviceId });
  if (from) params.set("from", from);
  return fetchAPI(`/api/availability/days?${params}`);
}

export async function getAvailableSlots(date: string, serviceId: string, staffId?: string) {
  const params = new URLSearchParams({ date, serviceId });
  if (staffId) params.set("staffId", staffId);
  return fetchAPI(`/api/availability/slots?${params}`);
}

export async function createAppointment(data: {
  serviceId: string;
  staffId: string;
  startAt: string;
  customer: { firstName: string; lastName: string; email: string; phone?: string; note?: string };
}) {
  return fetchAPI("/api/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function addToWaitlist(data: {
  serviceId: string;
  staffId?: string;
  preferredDates?: string[];
  customer: { firstName: string; lastName: string; email: string; phone?: string };
}) {
  return fetchAPI("/api/waitlist", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAppointmentByToken(token: string) {
  return fetchAPI(`/api/appointments/by-token/${token}`);
}

export async function cancelAppointment(token: string) {
  return fetchAPI(`/api/appointments/cancel/${token}`, { method: "POST" });
}

// --- Admin / CMS ---
export async function getAdminOverview() {
  return fetchAPI("/api/admin/overview");
}

export async function getAdminAppointments(params?: {
  from?: string;
  to?: string;
  status?: string;
  paymentStatus?: string;
}) {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.status) query.set("status", params.status);
  if (params?.paymentStatus) query.set("paymentStatus", params.paymentStatus);
  const q = query.toString();
  return fetchAPI(`/api/admin/appointments${q ? `?${q}` : ""}`);
}

export async function setAppointmentAttendance(appointmentId: string, attended: boolean) {
  return fetchAPI(`/api/admin/appointments/${appointmentId}/attendance`, {
    method: "PATCH",
    body: JSON.stringify({ attended }),
  });
}

export async function setAppointmentPayment(
  appointmentId: string,
  payload: { paid: boolean; paymentMethod?: "cash" | "card" | "bank_transfer" | "other"; amountPaidEur?: number }
) {
  return fetchAPI(`/api/admin/appointments/${appointmentId}/payment`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getRevenueEntries(params?: { from?: string; to?: string; exported?: boolean }) {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (typeof params?.exported === "boolean") query.set("exported", String(params.exported));
  const q = query.toString();
  return fetchAPI(`/api/admin/revenue${q ? `?${q}` : ""}`);
}

export async function markRevenueExported(entryId: string) {
  return fetchAPI(`/api/admin/revenue/${entryId}/exported`, {
    method: "PATCH",
  });
}
