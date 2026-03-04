"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import {
  getAdminOverview,
  getAdminAppointments,
  setAppointmentAttendance,
  setAppointmentPayment,
  getServices,
  getStaff,
  createAdminAppointment,
} from "@/lib/api";

type AdminAppointment = {
  _id: string;
  startAt: string;
  durationMinutes: number;
  priceEur: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  amountPaidEur?: number;
  customer: { firstName: string; lastName: string; email: string; phone?: string };
  staffId?: { firstName: string; lastName: string };
  serviceId?: { name: string };
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [overview, setOverview] = useState<{
    todayAppointments: number;
    attendedCount: number;
    paidCount: number;
    todayRevenueEur: number;
  } | null>(null);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [services, setServices] = useState<{ _id: string; name: string; durationMinutes: number; priceEur: number }[]>([]);
  const [staff, setStaff] = useState<{ _id: string; firstName: string; lastName: string; serviceIds: string[] }[]>([]);
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().slice(0, 10));
  const [staffFilter, setStaffFilter] = useState<string>("alle");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    serviceId: "",
    staffId: "",
    date: new Date().toISOString().slice(0, 10),
    time: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    note: "",
  });

  const isAllowed = useMemo(
    () => user?.role === "admin" || user?.role === "staff",
    [user]
  );

  async function refreshData() {
    if (!isAllowed) return;
    setError("");
    try {
      const [o, a] = await Promise.all([
        getAdminOverview(),
        getAdminAppointments({ from: dateFilter, to: dateFilter }),
      ]);
      setOverview(o);
      setAppointments(a);
    } catch (e: unknown) {
      setError((e as Error).message || "CMS Daten konnten nicht geladen werden.");
    }
  }

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllowed, dateFilter]);

  useEffect(() => {
    if (!isAllowed) return;
    getServices()
      .then((s) => setServices(s))
      .catch(() => {});
    getStaff()
      .then((st) =>
        setStaff(
          st.map((x: any) => ({
            _id: x._id,
            firstName: x.firstName,
            lastName: x.lastName,
            serviceIds: (x.serviceIds || []).map((id: any) => id.toString()),
          }))
        )
      )
      .catch(() => {});
  }, [isAllowed]);

  async function markAttended(appointmentId: string, attended: boolean) {
    setBusyId(appointmentId);
    setError("");
    try {
      await setAppointmentAttendance(appointmentId, attended);
      await refreshData();
    } catch (e: unknown) {
      setError((e as Error).message || "Status konnte nicht gesetzt werden.");
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(appointmentId: string, amountPaidEur: number, paymentMethod: "cash" | "card") {
    setBusyId(appointmentId);
    setError("");
    try {
      await setAppointmentPayment(appointmentId, {
        paid: true,
        paymentMethod,
        amountPaidEur,
      });
      await refreshData();
    } catch (e: unknown) {
      setError((e as Error).message || "Zahlung konnte nicht verbucht werden.");
    } finally {
      setBusyId(null);
    }
  }

  async function createNewAppointment() {
    if (!createForm.serviceId || !createForm.staffId || !createForm.date || !createForm.time) {
      setError("Bitte Leistung, Mitarbeiter, Datum und Uhrzeit auswählen.");
      return;
    }
    if (!createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.email.trim()) {
      setError("Bitte Kundendaten (Name und E-Mail) ausfüllen.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const startLocal = new Date(`${createForm.date}T${createForm.time}:00`);
      await createAdminAppointment({
        serviceId: createForm.serviceId,
        staffId: createForm.staffId,
        startAt: startLocal.toISOString(),
        customer: {
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone.trim() || undefined,
          note: createForm.note.trim() || undefined,
        },
      });
      await refreshData();
      setCreateForm((f) => ({ ...f, time: "", firstName: "", lastName: "", email: "", phone: "", note: "" }));
    } catch (e: unknown) {
      setError((e as Error).message || "Termin konnte nicht erstellt werden.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-[#2D2D2D]/70">Lade CMS…</p>
      </main>
    );
  }

  if (!isAllowed) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="font-display text-3xl text-[#2D2D2D]">Admin CMS</h1>
        <p className="mt-4 text-[#2D2D2D]/80">
          Kein Zugriff. Diese Seite ist nur für Inhaber/Team.
        </p>
      </main>
    );
  }

  const visibleAppointments =
    staffFilter === "alle"
      ? appointments
      : appointments.filter(
          (a) =>
            a.staffId &&
            `${a.staffId.firstName} ${a.staffId.lastName}`.toLowerCase() ===
              staffFilter.toLowerCase()
        );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-4xl font-medium text-[#2D2D2D]">CMS</h1>
      <p className="mt-2 text-[#2D2D2D]/80">
        Tagesübersicht, Zahlung und Umsatzerfassung
      </p>

      {error && (
        <div className="mt-6 rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">{error}</div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
          <p className="text-sm text-[#2D2D2D]/70">Termine heute</p>
          <p className="mt-1 text-2xl font-semibold">{overview?.todayAppointments ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
          <p className="text-sm text-[#2D2D2D]/70">Wahrgenommen</p>
          <p className="mt-1 text-2xl font-semibold">{overview?.attendedCount ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
          <p className="text-sm text-[#2D2D2D]/70">Bezahlt</p>
          <p className="mt-1 text-2xl font-semibold">{overview?.paidCount ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
          <p className="text-sm text-[#2D2D2D]/70">Umsatz heute</p>
          <p className="mt-1 text-2xl font-semibold">
            {typeof overview?.todayRevenueEur === "number" ? `${overview.todayRevenueEur.toFixed(2)} €` : "-"}
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-[#E8E4DF] bg-white p-6">
        <h2 className="font-display text-2xl font-medium text-[#2D2D2D]">
          Neuen Termin anlegen
        </h2>
       
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">Leistung</label>
            <select
              value={createForm.serviceId}
              onChange={(e) => setCreateForm({ ...createForm, serviceId: e.target.value, staffId: "" })}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
            >
              <option value="">Auswählen…</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.durationMinutes} min · {s.priceEur} €)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">Mitarbeiter</label>
            <select
              value={createForm.staffId}
              onChange={(e) => setCreateForm({ ...createForm, staffId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
              disabled={!createForm.serviceId}
            >
              <option value="">Auswählen…</option>
              {staff
                .filter((st) => st.serviceIds.includes(createForm.serviceId))
                .map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.firstName} {st.lastName}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">Datum</label>
            <input
              type="date"
              value={createForm.date}
              onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">Uhrzeit</label>
            <input
              type="time"
              value={createForm.time}
              onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">Kunde Vorname</label>
            <input
              type="text"
              value={createForm.firstName}
              onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">Kunde Nachname</label>
            <input
              type="text"
              value={createForm.lastName}
              onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">E-Mail</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">Telefon (optional)</label>
            <input
              type="tel"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#2D2D2D]">Notiz (optional)</label>
          <textarea
            value={createForm.note}
            onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={createNewAppointment}
            disabled={creating}
            className="rounded-full bg-[#4A5D4A] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#3A4A3A] disabled:opacity-50"
          >
            {creating ? "Termin wird angelegt…" : "Termin speichern"}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[#2D2D2D]">Datum</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-[#E8E4DF] px-3 py-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#2D2D2D]">Mitarbeiter</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
            >
              <option value="alle">Alle</option>
              {Array.from(
                new Map(
                  appointments
                    .filter((a) => a.staffId)
                    .map((a) => [a.staffId!.firstName + a.staffId!.lastName, a.staffId])
                ).values()
              ).map((s) => (
                <option
                  key={`${s!.firstName}-${s!.lastName}`}
                  value={`${s!.firstName} ${s!.lastName}`}
                >
                  {s!.firstName} {s!.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {visibleAppointments.map((a) => (
            <div key={a._id} className="rounded-xl border border-[#E8E4DF] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[#2D2D2D]">
                    {new Date(a.startAt).toLocaleString("de-DE", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/Berlin",
                    })}
                  </p>
                  <p className="text-sm text-[#2D2D2D]/80">
                    {a.customer.firstName} {a.customer.lastName} • {a.serviceId?.name} •{" "}
                    {a.staffId ? `${a.staffId.firstName} ${a.staffId.lastName}` : "Team"}
                  </p>
                  <p className="text-sm text-[#2D2D2D]/70">
                    Status: {a.status} • Zahlung: {a.paymentStatus}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={busyId === a._id || a.status === "attended" || a.status === "completed"}
                    onClick={() => markAttended(a._id, true)}
                    className="rounded-full border border-[#4A5D4A] px-4 py-2 text-sm text-[#4A5D4A] hover:bg-[#4A5D4A]/10 disabled:opacity-50"
                  >
                    Wahrgenommen
                  </button>
                  <button
                    disabled={busyId === a._id || a.paymentStatus === "paid"}
                    onClick={() => markPaid(a._id, a.amountPaidEur ?? a.priceEur, "card")}
                    className="rounded-full bg-[#4A5D4A] px-4 py-2 text-sm text-white hover:bg-[#3A4A3A] disabled:opacity-50"
                  >
                    Bezahlt (Karte)
                  </button>
                  <button
                    disabled={busyId === a._id || a.paymentStatus === "paid"}
                    onClick={() => markPaid(a._id, a.amountPaidEur ?? a.priceEur, "cash")}
                    className="rounded-full bg-[#2D2D2D] px-4 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
                  >
                    Bezahlt (Bar)
                  </button>
                </div>
              </div>
            </div>
          ))}
          {visibleAppointments.length === 0 && (
            <p className="rounded-xl border border-[#E8E4DF] bg-white p-6 text-[#2D2D2D]/70">
              Keine Termine für dieses Datum.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
