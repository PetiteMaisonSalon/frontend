const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers as Record<string, string>) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Fehler");
  return data;
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
