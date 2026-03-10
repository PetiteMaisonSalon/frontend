"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import {
  getAdminAppointments,
  setAppointmentAttendance,
  setAppointmentPayment,
  getServices,
  getStaff,
  createAdminAppointment,
  getAdminBlockedSlots,
  createAdminBlockedSlot,
  deleteAdminBlockedSlot,
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
  staffId?: { _id?: string; firstName: string; lastName: string };
  serviceId?: { name: string };
};

type AdminBlockedSlot = {
  _id: string;
  startAt: string;
  endAt: string;
  reason?: string;
  staffId?: { _id?: string; firstName?: string };
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<AdminBlockedSlot[]>([]);
  const [services, setServices] = useState<{ _id: string; name: string; durationMinutes: number; priceEur: number }[]>([]);
  const [staff, setStaff] = useState<{ _id: string; firstName: string; lastName: string; serviceIds: string[] }[]>([]);
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().slice(0, 10));
  const [staffFilter, setStaffFilter] = useState<string>("alle");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingBlockedId, setDeletingBlockedId] = useState<string | null>(null);
  const [dragSelection, setDragSelection] = useState<{
    staffId: string;
    startMinute: number;
    endMinute: number;
  } | null>(null);
  const [blockEditor, setBlockEditor] = useState<{
    staffId: string;
    fromMinute: number;
    toMinute: number;
    reason: string;
  } | null>(null);
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

  const parseDateInput = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  };
  const formatDateInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };
  const startOfWeekMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0..6
    const diff = day === 0 ? -6 : 1 - day; // Monday as start
    d.setDate(d.getDate() + diff);
    return d;
  };
  const endOfWeekSunday = (date: Date) => addDays(startOfWeekMonday(date), 6);

  const selectedDateObj = parseDateInput(dateFilter);
  const rangeFrom = viewMode === "day" ? dateFilter : formatDateInput(startOfWeekMonday(selectedDateObj));
  const rangeTo = viewMode === "day" ? dateFilter : formatDateInput(endOfWeekSunday(selectedDateObj));

  const CALENDAR_START_HOUR = 8;
  const CALENDAR_END_HOUR = 20;
  const CALENDAR_STEP_MINUTES = 30;
  const CALENDAR_ROW_HEIGHT = 36;
  const dayStartMinute = CALENDAR_START_HOUR * 60;
  const dayEndMinute = CALENDAR_END_HOUR * 60;

  const calendarRows = Array.from(
    { length: (dayEndMinute - dayStartMinute) / CALENDAR_STEP_MINUTES },
    (_, i) => dayStartMinute + i * CALENDAR_STEP_MINUTES
  );

  async function refreshData() {
    if (!isAllowed) return;
    setError("");
    try {
      const a = await getAdminAppointments({ from: rangeFrom, to: rangeTo });
      setAppointments(a);
      const blocks = await getAdminBlockedSlots({
        from: rangeFrom,
        to: rangeTo,
      });
      setBlockedSlots(Array.isArray(blocks) ? blocks : []);
    } catch (e: unknown) {
      setError((e as Error).message || "CMS Daten konnten nicht geladen werden.");
    }
  }

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllowed, dateFilter, viewMode]);

  useEffect(() => {
    if (!isAllowed) return;
    const id = setInterval(() => {
      refreshData();
    }, 30000); // alle 30 Sekunden aktualisieren
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllowed, dateFilter, viewMode]);

  useEffect(() => {
    if (!isAllowed) return;
    getServices()
      .then((s) => setServices(s))
      .catch(() => {});
    getStaff()
      .then((st) =>
        setStaff(
          st.map((x: {
            _id: string;
            firstName: string;
            lastName: string;
            serviceIds?: Array<string | { _id?: string }>;
          }) => ({
            _id: x._id,
            firstName: x.firstName,
            lastName: x.lastName,
            serviceIds: (x.serviceIds || []).map((id) =>
              typeof id === "string" ? id : String(id?._id || "")
            ),
          }))
        )
      )
      .catch(() => {});
  }, [isAllowed]);

  useEffect(() => {
    if (!dragSelection) return;
    const handleMouseUp = () => {
      setDragSelection((current) => {
        if (!current) return null;
        const fromMinute = Math.min(current.startMinute, current.endMinute);
        const toMinute = Math.max(current.startMinute, current.endMinute) + CALENDAR_STEP_MINUTES;
        setBlockEditor({
          staffId: current.staffId,
          fromMinute,
          toMinute,
          reason: "Abwesenheit",
        });
        return null;
      });
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [dragSelection, CALENDAR_STEP_MINUTES]);

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

  async function createBlockedFromCalendar(
    staffId: string,
    fromMinute: number,
    toMinute: number,
    reason: string
  ) {
    setCreating(true);
    setError("");
    try {
      const start = new Date(`${dateFilter}T00:00:00`);
      start.setHours(0, fromMinute, 0, 0);
      const end = new Date(`${dateFilter}T00:00:00`);
      end.setHours(0, toMinute, 0, 0);
      await createAdminBlockedSlot({
        staffId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        reason,
      });
      setBlockEditor(null);
      await refreshData();
    } catch (e: unknown) {
      setError((e as Error).message || "Abwesenheit konnte nicht gespeichert werden.");
    } finally {
      setCreating(false);
    }
  }

  async function removeBlockedSlot(blockedSlotId: string) {
    setDeletingBlockedId(blockedSlotId);
    setError("");
    try {
      await deleteAdminBlockedSlot(blockedSlotId);
      await refreshData();
    } catch (e: unknown) {
      setError((e as Error).message || "Abwesenheit konnte nicht gelöscht werden.");
    } finally {
      setDeletingBlockedId(null);
    }
  }

  function exportAppointmentsCsv() {
    if (visibleAppointments.length === 0) return;
    const header = [
      "Datum",
      "Uhrzeit",
      "Mitarbeiter",
      "Kunde",
      "E-Mail",
      "Telefon",
      "Leistung",
      "Status",
      "Zahlung",
      "Betrag",
    ];
    const rows = visibleAppointments.map((a) => {
      const d = new Date(a.startAt);
      const date = d.toLocaleDateString("de-DE");
      const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      const staffName = a.staffId ? `${a.staffId.firstName}` : "";
      const customerName = `${a.customer.firstName} ${a.customer.lastName}`;
      const email = a.customer.email;
      const phone = a.customer.phone || "";
      const serviceName = a.serviceId?.name || "";
      const status = a.status;
      const payment = a.paymentStatus;
      const amount = a.amountPaidEur ?? a.priceEur ?? "";
      return [date, time, staffName, customerName, email, phone, serviceName, status, payment, amount];
    });
    const csv = [header, ...rows]
      .map((cols) =>
        cols
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");
    if (typeof window === "undefined") return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uebersicht.csv";
    a.click();
    URL.revokeObjectURL(url);
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
          (a) => a.staffId?._id && String(a.staffId._id) === staffFilter
        );
  const calendarAppointments = visibleAppointments.filter((a) => a.status !== "cancelled");

  const kpiAppointmentsCount = visibleAppointments.length;
  const kpiAttendedCount = visibleAppointments.filter((a) =>
    ["attended", "completed"].includes(a.status)
  ).length;
  const kpiPaidCount = visibleAppointments.filter((a) => a.paymentStatus === "paid").length;
  const kpiRevenue = visibleAppointments.reduce((sum, a) => {
    if (a.paymentStatus !== "paid") return sum;
    return sum + Number(a.amountPaidEur ?? a.priceEur ?? 0);
  }, 0);

  const calendarStaff = staff;
  const weeklyGroups = (() => {
    const grouped: Record<string, AdminAppointment[]> = {};
    calendarAppointments.forEach((a) => {
      const key = new Date(a.startAt).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    });
    return Object.entries(grouped);
  })();

  const minuteLabel = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const clampMinute = (minutes: number) =>
    Math.min(dayEndMinute, Math.max(dayStartMinute, minutes));

  const minuteToTimeInput = (minutes: number) => minuteLabel(clampMinute(minutes));

  const timeInputToMinute = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return dayStartMinute;
    return clampMinute(h * 60 + m);
  };

  const getMinuteOfDay = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.getHours() * 60 + d.getMinutes();
  };

  const topFromMinute = (minute: number) =>
    ((minute - dayStartMinute) / CALENDAR_STEP_MINUTES) * CALENDAR_ROW_HEIGHT;

  const heightFromDuration = (duration: number) =>
    Math.max((duration / CALENDAR_STEP_MINUTES) * CALENDAR_ROW_HEIGHT, CALENDAR_ROW_HEIGHT / 2);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-4xl font-medium text-[#2D2D2D]">CMS</h1>
      <p className="mt-2 text-[#2D2D2D]/80">
        Tagesübersicht, Zahlung und Umsatzerfassung
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-full bg-[#4A5D4A] px-5 py-2 text-sm font-medium text-white hover:bg-[#3A4A3A]"
        >
          Neuen Termin eintragen
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">{error}</div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
          <p className="text-sm text-[#2D2D2D]/70">Termine heute</p>
          <p className="mt-1 text-2xl font-semibold">{kpiAppointmentsCount}</p>
        </div>
        <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
          <p className="text-sm text-[#2D2D2D]/70">Wahrgenommen</p>
          <p className="mt-1 text-2xl font-semibold">{kpiAttendedCount}</p>
        </div>
        <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
          <p className="text-sm text-[#2D2D2D]/70">Bezahlt</p>
          <p className="mt-1 text-2xl font-semibold">{kpiPaidCount}</p>
        </div>
        <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
          <p className="text-sm text-[#2D2D2D]/70">Umsatz heute</p>
          <p className="mt-1 text-2xl font-semibold">
            {`${kpiRevenue.toFixed(2)} €`}
          </p>
        </div>
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-medium text-[#2D2D2D]">
                Neuen Termin anlegen
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-sm text-[#2D2D2D]/70 hover:text-[#2D2D2D]"
              >
                Schließen
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D]">Leistung</label>
                <select
                  value={createForm.serviceId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, serviceId: e.target.value, staffId: "" })
                  }
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
                >
                  <option value="">Auswählen…</option>
                  {staff.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.firstName}
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
                  onChange={(e) =>
                    setCreateForm({ ...createForm, firstName: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D]">Kunde Nachname</label>
                <input
                  type="text"
                  value={createForm.lastName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, lastName: e.target.value })
                  }
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
                <label className="block text-sm font-medium text-[#2D2D2D]">
                  Telefon (optional)
                </label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#2D2D2D]">
                Notiz (optional)
              </label>
              <textarea
                value={createForm.note}
                onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full border border-[#E8E4DF] px-5 py-2 text-sm font-medium text-[#2D2D2D]"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={async () => {
                  await createNewAppointment();
                  if (!error) setShowCreateModal(false);
                }}
                disabled={creating}
                className="rounded-full bg-[#4A5D4A] px-6 py-2 text-sm font-medium text-white hover:bg-[#3A4A3A] disabled:opacity-50"
              >
                {creating ? "Wird angelegt…" : "Termin speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[#E8E4DF] bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                viewMode === "day" ? "bg-[#4A5D4A] text-white" : "text-[#2D2D2D]"
              }`}
            >
              Tagesansicht
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                viewMode === "week" ? "bg-[#4A5D4A] text-white" : "text-[#2D2D2D]"
              }`}
            >
              Wochenansicht
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[#2D2D2D]">Datum</label>
            <button
              type="button"
              onClick={() =>
                setDateFilter((prev) =>
                  formatDateInput(addDays(parseDateInput(prev), viewMode === "day" ? -1 : -7))
                )
              }
              className="rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-sm"
              aria-label={viewMode === "day" ? "Vortag" : "Vorwoche"}
            >
              ←
            </button>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-[#E8E4DF] px-3 py-2"
            />
            <button
              type="button"
              onClick={() =>
                setDateFilter((prev) =>
                  formatDateInput(addDays(parseDateInput(prev), viewMode === "day" ? 1 : 7))
                )
              }
              className="rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-sm"
              aria-label={viewMode === "day" ? "Nächster Tag" : "Nächste Woche"}
            >
              →
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#2D2D2D]">Mitarbeiter</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
            >
              <option value="alle">Alle</option>
              {staff.map((s) => (
                <option
                  key={s._id}
                  value={s._id}
                >
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={exportAppointmentsCsv}
            className="ml-auto rounded-full border border-[#E8E4DF] px-4 py-2 text-sm font-medium text-[#2D2D2D] hover:bg-[#F5F2ED]"
          >
            CSV exportieren
          </button>
        </div>

        {viewMode === "day" ? (
        <div className="overflow-x-auto rounded-2xl border border-[#E8E4DF] bg-white">
          <div
            className="grid min-w-[900px]"
            style={{
              gridTemplateColumns: `70px repeat(${Math.max(calendarStaff.length, 1)}, minmax(160px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-10 border-r border-[#E8E4DF] bg-[#F8F7F4]" />
            {calendarStaff.map((s) => (
              <div key={s._id} className="border-r border-[#E8E4DF] bg-[#F8F7F4] p-2 text-center text-sm font-medium text-[#2D2D2D]">
                {s.firstName} {s.lastName}
              </div>
            ))}

            <div className="relative border-r border-[#E8E4DF]">
              {calendarRows.map((m) => (
                <div
                  key={m}
                  className="border-t border-[#E8E4DF] px-2 pt-1 text-xs text-[#2D2D2D]/60"
                  style={{ height: `${CALENDAR_ROW_HEIGHT}px` }}
                >
                  {minuteLabel(m)}
                </div>
              ))}
            </div>

            {calendarStaff.map((s) => {
              const staffAppointments = calendarAppointments.filter(
                (a) => a.staffId?._id && String(a.staffId._id) === String(s._id)
              );
              const staffBlocks = blockedSlots.filter(
                (b) => b.staffId?._id && String(b.staffId._id) === String(s._id)
              );

              return (
                <div key={s._id} className="relative border-r border-[#E8E4DF]">
                  {calendarRows.map((m) => (
                    <div
                      key={`${s._id}-${m}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDragSelection({
                          staffId: s._id,
                          startMinute: m,
                          endMinute: m,
                        });
                      }}
                      onMouseEnter={(e) => {
                        if (e.buttons !== 1) return;
                        setDragSelection((current) =>
                          current && current.staffId === s._id
                            ? { ...current, endMinute: m }
                            : current
                        );
                      }}
                      onMouseUp={() => {
                        setDragSelection((current) => {
                          if (!current || current.staffId !== s._id) return null;
                          const fromMinute = Math.min(current.startMinute, current.endMinute);
                          const toMinute = Math.max(current.startMinute, current.endMinute) + CALENDAR_STEP_MINUTES;
                          setBlockEditor({
                            staffId: current.staffId,
                            fromMinute,
                            toMinute,
                            reason: "Abwesenheit",
                          });
                          return null;
                        });
                      }}
                      className="block w-full cursor-crosshair select-none border-t border-[#E8E4DF] text-left transition hover:bg-[#4A5D4A]/5"
                      style={{ height: `${CALENDAR_ROW_HEIGHT}px` }}
                      aria-label={`Abwesenheit für ${s.firstName} um ${minuteLabel(m)} eintragen`}
                    />
                  ))}

                  {dragSelection && dragSelection.staffId === s._id && (
                    <div
                      className="pointer-events-none absolute left-1 right-1 rounded-md border border-[#7B8F7B] bg-[#4A5D4A]/20"
                      style={{
                        top: `${topFromMinute(Math.min(dragSelection.startMinute, dragSelection.endMinute))}px`,
                        height: `${heightFromDuration(
                          Math.abs(dragSelection.endMinute - dragSelection.startMinute) + CALENDAR_STEP_MINUTES
                        )}px`,
                      }}
                    />
                  )}

                  {staffAppointments.map((a) => {
                    const startMin = getMinuteOfDay(a.startAt);
                    if (startMin >= dayEndMinute || startMin < dayStartMinute) return null;
                    const top = topFromMinute(startMin);
                    const height = heightFromDuration(a.durationMinutes || 30);
                    return (
                      <div
                        key={a._id}
                        className="absolute left-1 right-1 rounded-md border border-[#4A5D4A]/30 bg-[#4A5D4A]/15 p-1 text-[11px] text-[#2D2D2D]"
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${a.customer.firstName} ${a.customer.lastName}`}
                      >
                        <div className="truncate font-medium">
                          {minuteLabel(startMin)} {a.customer.firstName}
                        </div>
                        <div className="truncate opacity-80">{a.serviceId?.name || "Termin"}</div>
                      </div>
                    );
                  })}

                  {staffBlocks.map((b) => {
                    const startMin = getMinuteOfDay(b.startAt);
                    const endMin = getMinuteOfDay(b.endAt);
                    if (startMin >= dayEndMinute || endMin <= dayStartMinute) return null;
                    const clampedStart = Math.max(startMin, dayStartMinute);
                    const clampedEnd = Math.min(endMin, dayEndMinute);
                    const top = topFromMinute(clampedStart);
                    const height = heightFromDuration(Math.max(clampedEnd - clampedStart, 15));
                    return (
                      <div
                        key={b._id}
                        className="absolute left-1 right-1 rounded-md border border-[#D4A5A5]/40 bg-[#D4A5A5]/35 p-1 text-[11px] text-[#5C4033]"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="truncate font-medium">{b.reason || "Abwesenheit"}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBlockedSlot(b._id);
                            }}
                            disabled={deletingBlockedId === b._id}
                            className="rounded px-1 text-[10px] hover:bg-[#D4A5A5]/40 disabled:opacity-50"
                          >
                            x
                          </button>
                        </div>
                        <div>{minuteLabel(clampedStart)} - {minuteLabel(clampedEnd)}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        ) : (
          <div className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
            {weeklyGroups.length === 0 ? (
              <p className="text-[#2D2D2D]/70">Keine Termine in dieser Woche.</p>
            ) : (
              <div className="space-y-5">
                {weeklyGroups.map(([day, dayAppointments]) => (
                  <div key={day}>
                    <h3 className="text-sm font-semibold text-[#2D2D2D]">{day}</h3>
                    <div className="mt-2 space-y-2">
                      {dayAppointments.map((a) => (
                        <div key={a._id} className="rounded-lg border border-[#E8E4DF] p-3">
                          <p className="font-medium text-[#2D2D2D]">
                            {new Date(a.startAt).toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            • {a.customer.firstName} {a.customer.lastName}
                          </p>
                          <p className="text-sm text-[#2D2D2D]/75">
                            {a.serviceId?.name || "Leistung"} • {a.staffId?.firstName || "Team"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 m-5">
          {visibleAppointments.map((a) => (
            <div
              key={a._id}
              className={`rounded-xl border p-4 ${
                a.status === "cancelled"
                  ? "border-[#D4A5A5]/60 bg-[#D4A5A5]/18"
                  : "border-[#E8E4DF] bg-white"
              }`}
            >
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
                    {a.staffId ? `${a.staffId.firstName}` : "Team"}
                  </p>
                  <p className="text-sm text-[#2D2D2D]/70">
                    Status: {a.status} • Zahlung: {a.paymentStatus}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={
                      busyId === a._id ||
                      a.status === "attended" ||
                      a.status === "completed" ||
                      a.status === "cancelled"
                    }
                    onClick={() => markAttended(a._id, true)}
                    className="rounded-full border border-[#4A5D4A] px-4 py-2 text-sm text-[#4A5D4A] hover:bg-[#4A5D4A]/10 disabled:opacity-50"
                  >
                    Wahrgenommen
                  </button>
                  <button
                    disabled={
                      busyId === a._id ||
                      a.paymentStatus === "paid" ||
                      a.status === "cancelled"
                    }
                    onClick={() => markPaid(a._id, a.amountPaidEur ?? a.priceEur, "card")}
                    className="rounded-full bg-[#4A5D4A] px-4 py-2 text-sm text-white hover:bg-[#3A4A3A] disabled:opacity-50"
                  >
                    Bezahlt (Karte)
                  </button>
                  <button
                    disabled={
                      busyId === a._id ||
                      a.paymentStatus === "paid" ||
                      a.status === "cancelled"
                    }
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

      {blockEditor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-medium text-[#2D2D2D]">Abwesenheit eintragen</h3>
              <button
                type="button"
                onClick={() => setBlockEditor(null)}
                className="text-sm text-[#2D2D2D]/70 hover:text-[#2D2D2D]"
              >
                Schließen
              </button>
            </div>
            <p className="mt-2 text-sm text-[#2D2D2D]/75">
              {staff.find((s) => s._id === blockEditor.staffId)?.firstName || "Mitarbeiter"} am{" "}
              {new Date(`${dateFilter}T12:00:00`).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D]">Von</label>
                <input
                  type="time"
                  step={300}
                  value={minuteToTimeInput(blockEditor.fromMinute)}
                  onChange={(e) =>
                    setBlockEditor((current) =>
                      current
                        ? {
                            ...current,
                            fromMinute: timeInputToMinute(e.target.value),
                          }
                        : current
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D]">Bis</label>
                <input
                  type="time"
                  step={300}
                  value={minuteToTimeInput(blockEditor.toMinute)}
                  onChange={(e) =>
                    setBlockEditor((current) =>
                      current
                        ? {
                            ...current,
                            toMinute: timeInputToMinute(e.target.value),
                          }
                        : current
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#2D2D2D]">Grund</label>
              <input
                type="text"
                value={blockEditor.reason}
                onChange={(e) =>
                  setBlockEditor((current) =>
                    current
                      ? {
                          ...current,
                          reason: e.target.value,
                        }
                      : current
                  )
                }
                placeholder="z.B. Urlaub, Pause, Arzttermin"
                className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockEditor(null)}
                className="rounded-full border border-[#E8E4DF] px-5 py-2 text-sm font-medium text-[#2D2D2D]"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => {
                  const fromMinute = clampMinute(blockEditor.fromMinute);
                  const toMinute = clampMinute(blockEditor.toMinute);
                  if (toMinute <= fromMinute) {
                    setError("Endzeit muss nach der Startzeit liegen.");
                    return;
                  }
                  createBlockedFromCalendar(
                    blockEditor.staffId,
                    fromMinute,
                    toMinute,
                    blockEditor.reason.trim() || "Abwesenheit"
                  );
                }}
                className="rounded-full bg-[#4A5D4A] px-6 py-2 text-sm font-medium text-white hover:bg-[#3A4A3A] disabled:opacity-50"
              >
                {creating ? "Speichern…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
