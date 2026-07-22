"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { DatePicker } from "@/components/DatePicker";
import { TimePicker } from "@/components/TimePicker";
import { CustomSelect } from "@/components/CustomSelect";
import {
  getAdminAppointments,
  setAppointmentAttendance,
  setAppointmentPayment,
  getStaff,
  createAdminAppointment,
  getAdminBlockedSlots,
  createAdminBlockedSlot,
  deleteAdminBlockedSlot,
  getAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
} from "@/lib/api";

type AdminAppointment = {
  _id: string;
  startAt: string;
  endAt?: string;
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
type ServiceCategory = "women" | "men" | "unisex";
type AdminService = {
  _id: string;
  name: string;
  description?: string;
  category: ServiceCategory;
  durationMinutes: number;
  priceEur: number;
  bufferMinutes?: number;
  displaySection?: string;
  displayOrder?: number;
  groupKey?: string;
  groupDurationLabel?: string;
  ctaType?: "select" | "call";
};
type AdminSectionId = "kalender" | "termine" | "leistungen" | "umsatz" | "kunden";
const OPEN_ADMIN_CREATE_EVENT = "admin:create-appointment";
/** gesetzt von Header, wenn „Neuen Termin“ außerhalb von /admin geklickt wird */
const ADMIN_PENDING_CREATE_KEY = "pm_admin_pending_create";
const SERVICE_GROUPS = [
  {
    id: "women-cut-styling",
    label: "Damen - Haarschnitte & Stylings",
    matcher: (s: AdminService) =>
      s.category === "women" &&
      (s.displaySection || "").toUpperCase() === "SCHNITT & STYLING",
  },
  {
    id: "women-color-styling",
    label: "Damen - Colorationen & Styling",
    matcher: (s: AdminService) =>
      s.category === "women" &&
      (s.displaySection || "").toUpperCase() === "COLORATIONEN (INKL. STYLING)",
  },
  {
    id: "men-cut-styling",
    label: "Herren - Haarschnitte & Stylings",
    matcher: (s: AdminService) => s.category === "men",
  },
] as const;
type ServiceGroupId = (typeof SERVICE_GROUPS)[number]["id"] | "other";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [activeSection, setActiveSection] = useState<AdminSectionId>("kalender");
  const [nowClock, setNowClock] = useState(() => new Date());
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<AdminBlockedSlot[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [activeServiceGroupId, setActiveServiceGroupId] = useState<ServiceGroupId>(SERVICE_GROUPS[0].id);
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [serviceEditorMode, setServiceEditorMode] = useState<"create" | "edit">("create");
  const [serviceEditorId, setServiceEditorId] = useState<string | null>(null);
  const [serviceEditorForm, setServiceEditorForm] = useState({
    name: "",
    description: "",
    category: "women" as ServiceCategory,
    durationMinutes: "60",
    priceEur: "0",
    bufferMinutes: "0",
    displaySection: "",
    displayOrder: "1000",
    groupKey: "",
    groupDurationLabel: "",
    ctaType: "select" as "select" | "call",
  });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceDeletingId, setServiceDeletingId] = useState<string | null>(null);
  const [serviceDeleteTarget, setServiceDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
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
    allDay: boolean;
  } | null>(null);
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
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
  const canManageServices = user?.role === "admin";

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

  async function loadServices() {
    setServicesLoading(true);
    try {
      const data = await getAdminServices();
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }

  function openCreateServiceEditor() {
    const defaultCategory: ServiceCategory = activeServiceGroupId === "men-cut-styling" ? "men" : "women";
    setServiceEditorMode("create");
    setServiceEditorId(null);
    setServiceEditorForm({
      name: "",
      description: "",
      category: defaultCategory,
      durationMinutes: "60",
      priceEur: "0",
      bufferMinutes: "0",
      displaySection:
        defaultCategory === "women" ? "SCHNITT & STYLING" : "",
      displayOrder: "1000",
      groupKey: "",
      groupDurationLabel: "",
      ctaType: "select",
    });
    setShowServiceEditor(true);
  }

  function openEditServiceEditor(service: AdminService) {
    setServiceEditorMode("edit");
    setServiceEditorId(service._id);
    setServiceEditorForm({
      name: service.name || "",
      description: service.description || "",
      category: service.category,
      durationMinutes: String(service.durationMinutes ?? 60),
      priceEur: String(service.priceEur ?? 0),
      bufferMinutes: String(service.bufferMinutes ?? 0),
      displaySection: service.displaySection || "",
      displayOrder: String(service.displayOrder ?? 1000),
      groupKey: service.groupKey || "",
      groupDurationLabel: service.groupDurationLabel || "",
      ctaType: service.ctaType || "select",
    });
    setShowServiceEditor(true);
  }

  async function saveServiceEditor() {
    const name = serviceEditorForm.name.trim();
    const durationMinutes = Number(serviceEditorForm.durationMinutes);
    const priceEur = Number(serviceEditorForm.priceEur);
    const bufferMinutes = Number(serviceEditorForm.bufferMinutes || "0");
    const displayOrder = Number(serviceEditorForm.displayOrder || "1000");
    if (!name) {
      setError("Bitte einen Namen für die Leistung eingeben.");
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError("Die Dauer muss größer als 0 sein.");
      return;
    }
    if (!Number.isFinite(priceEur) || priceEur < 0) {
      setError("Der Preis muss 0 oder größer sein.");
      return;
    }
    if (!Number.isFinite(bufferMinutes) || bufferMinutes < 0) {
      setError("Der Puffer muss 0 oder größer sein.");
      return;
    }
    if (!Number.isFinite(displayOrder)) {
      setError("Die Reihenfolge muss eine gültige Zahl sein.");
      return;
    }

    const payload = {
      name,
      description: serviceEditorForm.description.trim() || undefined,
      category: serviceEditorForm.category,
      durationMinutes: Math.round(durationMinutes),
      priceEur: Number(priceEur.toFixed(2)),
      bufferMinutes: Math.round(bufferMinutes),
      displaySection: serviceEditorForm.displaySection.trim() || undefined,
      displayOrder: Math.round(displayOrder),
      groupKey: serviceEditorForm.groupKey.trim() || undefined,
      groupDurationLabel: serviceEditorForm.groupDurationLabel.trim() || undefined,
      ctaType: serviceEditorForm.ctaType,
    };

    setServiceSaving(true);
    setError("");
    try {
      if (serviceEditorMode === "create") {
        await createAdminService(payload);
      } else if (serviceEditorId) {
        await updateAdminService(serviceEditorId, payload);
      }
      await loadServices();
      setShowServiceEditor(false);
      setServiceEditorId(null);
    } catch (e: unknown) {
      setError((e as Error).message || "Leistung konnte nicht gespeichert werden.");
    } finally {
      setServiceSaving(false);
    }
  }

  async function removeService(serviceId: string) {
    setServiceDeletingId(serviceId);
    setError("");
    try {
      await deleteAdminService(serviceId);
      await loadServices();
      setServiceDeleteTarget(null);
    } catch (e: unknown) {
      setError((e as Error).message || "Leistung konnte nicht gelöscht werden.");
    } finally {
      setServiceDeletingId(null);
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
    const id = setInterval(() => {
      setNowClock(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const openCreateModal = () => setShowCreateModal(true);
    if (typeof window === "undefined") return;
    window.addEventListener(OPEN_ADMIN_CREATE_EVENT, openCreateModal);
    return () => window.removeEventListener(OPEN_ADMIN_CREATE_EVENT, openCreateModal);
  }, []);

  useEffect(() => {
    if (!isAllowed || typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(ADMIN_PENDING_CREATE_KEY) === "1") {
        sessionStorage.removeItem(ADMIN_PENDING_CREATE_KEY);
        setShowCreateModal(true);
      }
    } catch {
      /* ignore */
    }
  }, [isAllowed]);

  useEffect(() => {
    if (!isAllowed) return;
    loadServices();
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
          allDay: false,
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
        <p className="text-[#1C1612]/70">Lade CMS…</p>
      </main>
    );
  }

  if (!isAllowed) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="text-h2 text-[#1C1612]">Admin CMS</h1>
        <p className="mt-4 text-[#1C1612]/80">
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

  const normalizeReason = (value: string) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const isVacationReason = (reason?: string) => normalizeReason(reason || "").includes("urlaub");
  const toTimeLabel = (date: Date) =>
    date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const getAppointmentEnd = (appointment: AdminAppointment) => {
    if (appointment.endAt) return new Date(appointment.endAt);
    const start = new Date(appointment.startAt);
    return new Date(start.getTime() + Math.max(appointment.durationMinutes || 30, 15) * 60000);
  };
  const appointmentRangeLabel = (appointment: AdminAppointment) =>
    `${toTimeLabel(new Date(appointment.startAt))} - ${toTimeLabel(getAppointmentEnd(appointment))}`;
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h} Std. ${m} Min.`;
    if (h > 0) return `${h} Std.`;
    return `${m} Min.`;
  };
  const serviceCategoryLabel: Record<ServiceCategory, string> = {
    women: "Damen",
    men: "Herren",
    unisex: "Unisex",
  };
  const servicesByGroup = (() => {
    const grouped: Record<string, AdminService[]> = {};
    const assigned = new Set<string>();
    SERVICE_GROUPS.forEach((group) => {
      const rows = services
        .filter(group.matcher)
        .sort(
          (a, b) =>
            (a.displayOrder ?? 1000) - (b.displayOrder ?? 1000) ||
            a.name.localeCompare(b.name, "de")
        );
      grouped[group.id] = rows;
      rows.forEach((row) => assigned.add(row._id));
    });
    const uncategorized = services
      .filter((service) => !assigned.has(service._id))
      .sort(
        (a, b) =>
          (a.displayOrder ?? 1000) - (b.displayOrder ?? 1000) ||
          a.name.localeCompare(b.name, "de")
      );
    if (uncategorized.length > 0) grouped.other = uncategorized;
    return grouped;
  })();
  const serviceGroupStats = (() => {
    const stats: Array<{ id: ServiceGroupId; label: string; count: number }> = SERVICE_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      count: servicesByGroup[group.id]?.length || 0,
    })).filter((group) => group.count > 0);
    if ((servicesByGroup.other || []).length > 0) {
      stats.push({
        id: "other",
        label: "Weitere Leistungen",
        count: servicesByGroup.other.length,
      });
    }
    return stats;
  })();
  const effectiveActiveServiceGroupId = serviceGroupStats.some(
    (group) => group.id === activeServiceGroupId
  )
    ? activeServiceGroupId
    : (serviceGroupStats[0]?.id || activeServiceGroupId);
  const visibleServiceRows = servicesByGroup[effectiveActiveServiceGroupId] || [];
  const sidebarItems: Array<{ id: AdminSectionId; label: string }> = [
    { id: "kalender", label: "Kalender" },
    { id: "termine", label: "Termine" },
    { id: "leistungen", label: "Leistungen" },
    { id: "umsatz", label: "Umsatz" },
  ];
  const sidebarIcon = (id: AdminSectionId) => {
    if (id === "kalender") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M8 3.8v3.3M16 3.8v3.3M3.5 9.5h17" />
        </svg>
      );
    }
    if (id === "leistungen") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15" />
          <circle cx="7" cy="7.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="7" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="7" cy="16.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    }
    if (id === "termine") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <path d="M8 7.5h8M8 11.5h8M8 15.5h5" />
        </svg>
      );
    }
    if (id === "umsatz") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 18.5h14M7.5 18.5V13m4.5 5.5V9.5m4.5 9V6.5" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="9" r="3" />
        <path d="M3.8 18.5a5.2 5.2 0 0 1 10.4 0M16.5 8.2a2.4 2.4 0 1 1 0 4.8M15.2 18.5a4.1 4.1 0 0 1 4.8-3.8" />
      </svg>
    );
  };

  const getMinuteOfDay = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.getHours() * 60 + d.getMinutes();
  };

  const topFromMinute = (minute: number) =>
    ((minute - dayStartMinute) / CALENDAR_STEP_MINUTES) * CALENDAR_ROW_HEIGHT;

  const heightFromDuration = (duration: number) =>
    Math.max((duration / CALENDAR_STEP_MINUTES) * CALENDAR_ROW_HEIGHT, CALENDAR_ROW_HEIGHT / 2);

  const nowTimeLabel = nowClock.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const nowDateLabel = nowClock.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const sidebarMonthStart = new Date(
    selectedDateObj.getFullYear(),
    selectedDateObj.getMonth(),
    1
  );
  const sidebarMonthLabel = sidebarMonthStart.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
  const sidebarWeekdayLabels = ["M", "D", "M", "D", "F", "S", "S"];
  const sidebarStartOffset = (sidebarMonthStart.getDay() + 6) % 7;
  const sidebarDaysInCurrent = new Date(
    selectedDateObj.getFullYear(),
    selectedDateObj.getMonth() + 1,
    0
  ).getDate();
  const sidebarDaysInPrev = new Date(
    selectedDateObj.getFullYear(),
    selectedDateObj.getMonth(),
    0
  ).getDate();
  const sidebarCells = Array.from({ length: 42 }, (_, idx) => {
    const dayIndex = idx - sidebarStartOffset + 1;
    if (dayIndex <= 0) {
      return {
        date: new Date(
          selectedDateObj.getFullYear(),
          selectedDateObj.getMonth() - 1,
          sidebarDaysInPrev + dayIndex
        ),
        isCurrentMonth: false,
      };
    }
    if (dayIndex > sidebarDaysInCurrent) {
      return {
        date: new Date(
          selectedDateObj.getFullYear(),
          selectedDateObj.getMonth() + 1,
          dayIndex - sidebarDaysInCurrent
        ),
        isCurrentMonth: false,
      };
    }
    return {
      date: new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), dayIndex),
      isCurrentMonth: true,
    };
  });

  return (
    <main className="mx-auto max-w-[1450px] px-3 py-4 md:px-6 md:py-6">
      {error && (
        <div className="mt-4 rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">{error}</div>
      )}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="h-fit self-start rounded-2xl border border-[#E8E4DF] bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setDashboardExpanded((e) => !e)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#E8E4DF] px-3 py-2 text-left text-sm font-medium text-[#1C1612] transition hover:bg-[#F5F2ED]"
          >
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4.5 13.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 4.5h6v6h-6zM13.5 13.5h6v6h-6z" />
              </svg>
              Dashboard
            </span>
            <span className={`shrink-0 text-[#1C1612]/50 transition-transform ${dashboardExpanded ? "rotate-180" : ""}`} aria-hidden>▼</span>
          </button>
          {dashboardExpanded && (
          <>
          <p className="mt-3 px-1 text-xs font-medium uppercase tracking-wide text-[#1C1612]/55">
            Kategorie
          </p>
          <div className="mt-3 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeSection === item.id
                    ? "bg-[#4A5D4A]/10 font-medium text-[#4A5D4A]"
                    : "text-[#1C1612]/90 hover:bg-[#F5F2ED]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {sidebarIcon(item.id)}
                  <span>{item.label}</span>
                </span>
                <span aria-hidden>›</span>
              </button>
            ))}
          </div>

          <div className="mt-6 hidden border-t border-[#E8E4DF] pt-5 text-center md:block">
            <p className="text-6xl font-light leading-none text-[#1C1612]">{nowTimeLabel}</p>
            <p className="mt-2 text-[#1C1612]/85">{nowDateLabel}</p>
          </div>

          <div className="mt-6 hidden rounded-xl border border-[#E8E4DF] p-3 md:block">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setDateFilter((prev) =>
                    formatDateInput(
                      new Date(
                        parseDateInput(prev).getFullYear(),
                        parseDateInput(prev).getMonth() - 1,
                        Math.min(parseDateInput(prev).getDate(), 28)
                      )
                    )
                  )
                }
                className="rounded-md px-2 py-1 text-[#1C1612]/70 hover:bg-[#F5F2ED]"
                aria-label="Vorheriger Monat"
              >
                ‹
              </button>
              <p className="text-sm font-medium capitalize text-[#1C1612]">{sidebarMonthLabel}</p>
              <button
                type="button"
                onClick={() =>
                  setDateFilter((prev) =>
                    formatDateInput(
                      new Date(
                        parseDateInput(prev).getFullYear(),
                        parseDateInput(prev).getMonth() + 1,
                        Math.min(parseDateInput(prev).getDate(), 28)
                      )
                    )
                  )
                }
                className="rounded-md px-2 py-1 text-[#1C1612]/70 hover:bg-[#F5F2ED]"
                aria-label="Nächster Monat"
              >
                ›
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-[#1C1612]/45">
              {sidebarWeekdayLabels.map((label, idx) => (
                <span key={`${label}-${idx}`}>{label}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
              {sidebarCells.map(({ date, isCurrentMonth }, idx) => {
                const value = formatDateInput(date);
                const isSelected = value === dateFilter;
                const isToday = value === formatDateInput(new Date());
                return (
                  <button
                    key={`${value}-${idx}`}
                    type="button"
                    onClick={() => setDateFilter(value)}
                    className={`h-7 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1 ${
                      isSelected
                        ? "bg-[#4A5D4A] text-white"
                        : isToday
                          ? "border border-[#4A5D4A]/40 text-[#4A5D4A]"
                          : isCurrentMonth
                            ? "text-[#1C1612]"
                            : "text-[#1C1612]/35"
                    } hover:bg-[#4A5D4A]/10`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          </>
          )}
        </aside>

        <section className="min-w-0 space-y-4">
          {activeSection === "kalender" && (
            <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E8E4DF] bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 rounded-full border border-[#E8E4DF] bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                viewMode === "day" ? "bg-[#4A5D4A] text-white" : "text-[#1C1612]"
              }`}
            >
              Tagesansicht
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                viewMode === "week" ? "bg-[#4A5D4A] text-white" : "text-[#1C1612]"
              }`}
            >
              Wochenansicht
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[#1C1612]">Datum</label>
            <button
              type="button"
              onClick={() =>
                setDateFilter((prev) =>
                  formatDateInput(addDays(parseDateInput(prev), viewMode === "day" ? -1 : -7))
                )
              }
              className="rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1"
              aria-label={viewMode === "day" ? "Vortag" : "Vorwoche"}
            >
              ←
            </button>
            <DatePicker
              value={dateFilter}
              onChange={(v) => setDateFilter(v || formatDateInput(new Date()))}
            />
            <button
              type="button"
              onClick={() =>
                setDateFilter((prev) =>
                  formatDateInput(addDays(parseDateInput(prev), viewMode === "day" ? 1 : 7))
                )
              }
              className="rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1"
              aria-label={viewMode === "day" ? "Nächster Tag" : "Nächste Woche"}
            >
              →
            </button>
          </div>
          <div className="flex min-w-[160px] items-center gap-2">
            <span className="text-sm font-medium text-[#1C1612]">Mitarbeiter</span>
            <CustomSelect
              value={staffFilter}
              onChange={setStaffFilter}
              options={[
                { value: "alle", label: "Alle" },
                ...staff.map((s) => ({
                  value: s._id,
                  label: `${s.firstName}`,
                })),
              ]}
              placeholder="Alle"
              clearable={false}
              className="flex-1 rounded-lg px-4 py-2.5"
            />
          </div>
          <div className="ml-auto hidden md:block">
            <button
              type="button"
              onClick={exportAppointmentsCsv}
              className="rounded-full border border-[#E8E4DF] px-4 py-2 text-sm font-medium text-[#1C1612] hover:bg-[#F5F2ED]"
            >
              CSV exportieren
            </button>
          </div>
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
              <div key={s._id} className="border-r border-[#E8E4DF] bg-[#F8F7F4] p-2 text-center text-sm font-medium text-[#1C1612]">
                {s.firstName} {s.lastName}
              </div>
            ))}

            <div className="relative border-r border-[#E8E4DF]">
              {calendarRows.map((m) => (
                <div
                  key={m}
                  className="border-t border-[#E8E4DF] px-2 pt-1 text-xs text-[#1C1612]/60"
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
                            allDay: false,
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
                    const endMin = Math.min(
                      startMin + Math.max(a.durationMinutes || 30, 15),
                      dayEndMinute
                    );
                    const top = topFromMinute(startMin);
                    const height = heightFromDuration(a.durationMinutes || 30);
                    return (
                      <div
                        key={a._id}
                        className="absolute left-1 right-1 rounded-md border border-[#4A5D4A]/30 bg-[#4A5D4A]/15 p-1 text-[11px] text-[#1C1612]"
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${a.customer.firstName} ${a.customer.lastName}`}
                      >
                        <div className="truncate font-medium">{minuteLabel(startMin)} - {minuteLabel(endMin)}</div>
                        <div className="truncate">{a.customer.firstName} {a.customer.lastName}</div>
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
                    const isVacation = isVacationReason(b.reason);
                    return (
                      <div
                        key={b._id}
                        className={`absolute left-1 right-1 rounded-md border p-1 text-[11px] ${
                          isVacation
                            ? "border-[#5B8FD6]/45 bg-[#5B8FD6]/28 text-[#1F3D68]"
                            : "border-[#D4A5A5]/40 bg-[#D4A5A5]/35 text-[#5C4033]"
                        }`}
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
                            className={`rounded px-1 text-[10px] disabled:opacity-50 ${
                              isVacation ? "hover:bg-[#5B8FD6]/35" : "hover:bg-[#D4A5A5]/40"
                            }`}
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
              <p className="text-[#1C1612]/70">Keine Termine in dieser Woche.</p>
            ) : (
              <div className="space-y-5">
                {weeklyGroups.map(([day, dayAppointments]) => (
                  <div key={day}>
                    <h3 className="text-sm font-semibold text-[#1C1612]">{day}</h3>
                    <div className="mt-2 space-y-2">
                      {dayAppointments.map((a) => (
                        <div key={a._id} className="rounded-lg border border-[#E8E4DF] p-3">
                          <p className="font-medium text-[#1C1612]">
                            {appointmentRangeLabel(a)} • {a.customer.firstName} {a.customer.lastName}
                          </p>
                          <p className="text-sm text-[#1C1612]/75">
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
      </section>
          )}

          {activeSection === "termine" && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E8E4DF] bg-white p-3 shadow-sm">
                <p className="mr-2 text-sm font-semibold uppercase tracking-wide text-[#1C1612]/70">
                  Termine & Zahlungen
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-[#1C1612]">Datum</label>
                  <button
                    type="button"
                    onClick={() =>
                      setDateFilter((prev) => formatDateInput(addDays(parseDateInput(prev), -1)))
                    }
                    className="rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1"
                    aria-label="Vortag"
                  >
                    ←
                  </button>
                  <DatePicker
                    value={dateFilter}
                    onChange={(v) => setDateFilter(v || formatDateInput(new Date()))}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDateFilter((prev) => formatDateInput(addDays(parseDateInput(prev), 1)))
                    }
                    className="rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1"
                    aria-label="Nächster Tag"
                  >
                    →
                  </button>
                </div>
                <div className="flex min-w-[160px] items-center gap-2">
                  <span className="text-sm font-medium text-[#1C1612]">Mitarbeiter</span>
                  <CustomSelect
                    value={staffFilter}
                    onChange={setStaffFilter}
                    options={[
                      { value: "alle", label: "Alle" },
                      ...staff.map((s) => ({
                        value: s._id,
                        label: `${s.firstName}`,
                      })),
                    ]}
                    placeholder="Alle"
                    clearable={false}
                    className="flex-1 rounded-lg px-4 py-2.5"
                  />
                </div>
                <button
                  type="button"
                  onClick={exportAppointmentsCsv}
                  className="ml-auto hidden rounded-full border border-[#E8E4DF] px-4 py-2 text-sm font-medium text-[#1C1612] hover:bg-[#F5F2ED] md:inline-flex"
                >
                  CSV exportieren
                </button>
              </div>

              <div className="space-y-3 rounded-2xl border border-[#E8E4DF] bg-white p-4">
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
                        <p className="font-medium text-[#1C1612]">
                          {new Date(a.startAt).toLocaleDateString("de-DE", {
                            weekday: "long",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            timeZone: "Europe/Berlin",
                          })}{" "}
                          • {appointmentRangeLabel(a)}
                        </p>
                        <p className="text-sm text-[#1C1612]/80">
                          {a.customer.firstName} {a.customer.lastName} • {a.serviceId?.name} •{" "}
                          {a.staffId ? `${a.staffId.firstName}` : "Team"}
                        </p>
                        <p className="text-sm text-[#1C1612]/70">
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
                          className="rounded-full bg-[#1C1612] px-4 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
                        >
                          Bezahlt (Bar)
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {visibleAppointments.length === 0 && (
                  <p className="rounded-xl border border-[#E8E4DF] bg-white p-6 text-[#1C1612]/70">
                    Keine Termine für dieses Datum.
                  </p>
                )}
              </div>
            </section>
          )}

          {activeSection === "leistungen" && (
            <section className="rounded-2xl border border-[#E8E4DF] bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-h2 text-[#1C1612]">
                    Leistungen verwalten
                  </h3>
                  <p className="text-sm text-[#1C1612]/70">
                    Preise, Dauer und neue Leistungen direkt im CMS bearbeiten.
                  </p>
                </div>
                {canManageServices ? (
                  <button
                    type="button"
                    onClick={openCreateServiceEditor}
                    className="rounded-full bg-[#4A5D4A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3A4A3A]"
                  >
                    Neue Leistung
                  </button>
                ) : (
                  <span className="rounded-full border border-[#E8E4DF] px-4 py-2 text-xs font-medium uppercase tracking-wide text-[#1C1612]/55">
                    Nur Ansicht
                  </span>
                )}
              </div>

              <div className="mt-5 grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="h-fit rounded-xl border border-[#E8E4DF] bg-[#F8F7F4] p-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:block">
                    {serviceGroupStats.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setActiveServiceGroupId(group.id)}
                        className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                          effectiveActiveServiceGroupId === group.id
                            ? "border border-[#4A5D4A]/35 bg-[#4A5D4A]/10 text-[#4A5D4A]"
                            : "border border-[#E8E4DF] bg-white text-[#1C1612]/90 hover:bg-[#F5F2ED]"
                        }`}
                      >
                        {group.label} ({group.count})
                      </button>
                    ))}
                    {serviceGroupStats.length === 0 && (
                      <p className="rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-sm text-[#1C1612]/65">
                        Noch keine Leistungen vorhanden.
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-[#E8E4DF] bg-white">
                  {servicesLoading ? (
                    <div className="p-6 text-sm text-[#1C1612]/70">Leistungen werden geladen…</div>
                  ) : visibleServiceRows.length === 0 ? (
                    <div className="p-6 text-sm text-[#1C1612]/70">
                      Keine Leistungen in dieser Kategorie.
                    </div>
                  ) : (
                    visibleServiceRows.map((service) => (
                      <div
                        key={service._id}
                        className="grid grid-cols-1 items-center gap-3 border-b border-[#E8E4DF] p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#1C1612]">{service.name}</p>
                          <p className="text-sm text-[#1C1612]/70">
                            {formatDuration(service.durationMinutes)}{" "}
                            {service.bufferMinutes ? `· +${service.bufferMinutes} Min. Puffer` : ""} ·{" "}
                            {serviceCategoryLabel[service.category]}
                          </p>
                          <p className="text-xs text-[#1C1612]/55">
                            {service.displaySection || "Ohne Sektion"} · Reihenfolge{" "}
                            {service.displayOrder ?? 1000}
                            {service.groupKey ? ` · Gruppe ${service.groupKey}` : ""}
                            {service.groupDurationLabel
                              ? ` · Gruppen-Dauer ${service.groupDurationLabel}`
                              : ""}
                            {service.ctaType === "call" ? " · CTA Anrufen" : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-[#1C1612] md:text-base">
                          {service.priceEur} €
                        </p>
                        {canManageServices ? (
                          <div className="flex items-center gap-2 md:justify-self-end">
                            <button
                              type="button"
                              onClick={() => openEditServiceEditor(service)}
                              className="rounded-md border border-[#4A5D4A]/45 px-3 py-1.5 text-sm font-medium text-[#4A5D4A] hover:bg-[#4A5D4A]/10"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setServiceDeleteTarget({ id: service._id, name: service.name })
                              }
                              disabled={serviceDeletingId === service._id}
                              className="rounded-md border border-[#D4A5A5]/70 px-3 py-1.5 text-sm font-medium text-[#8A4D53] hover:bg-[#D4A5A5]/20 focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1 disabled:opacity-50"
                            >
                              Löschen
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#1C1612]/55 md:justify-self-end">Nur Ansicht</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {activeSection !== "kalender" &&
            activeSection !== "termine" &&
            activeSection !== "leistungen" && (
            <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6 text-[#1C1612]/75">
              Dieser Bereich wird als Nächstes umgesetzt.
            </div>
          )}
        </section>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-3 py-4 sm:items-center sm:px-4 sm:py-6">
          <div className="w-full max-w-2xl shrink-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-h3 text-[#1C1612] sm:text-2xl">
                Neuen Termin anlegen
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="shrink-0 rounded-lg px-3 py-2 text-sm text-[#1C1612]/70 hover:bg-[#F5F2ED] hover:text-[#1C1612]"
              >
                Schließen
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Leistung</label>
                <CustomSelect
                  value={createForm.serviceId}
                  onChange={(v) =>
                    setCreateForm({ ...createForm, serviceId: v, staffId: "" })
                  }
                  options={services.map((s) => ({
                    value: s._id,
                    label: `${s.name} (${s.durationMinutes} min · ${s.priceEur} €)`,
                  }))}
                  placeholder="Auswählen…"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Mitarbeiter</label>
                <CustomSelect
                  value={createForm.staffId}
                  onChange={(v) => setCreateForm({ ...createForm, staffId: v })}
                  options={staff.map((st) => ({
                    value: st._id,
                    label: `${st.firstName}`,
                  }))}
                  placeholder="Auswählen…"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Datum</label>
                <DatePicker
                  value={createForm.date}
                  onChange={(v) => setCreateForm({ ...createForm, date: v || formatDateInput(new Date()) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Uhrzeit</label>
                <TimePicker
                  value={createForm.time}
                  onChange={(v) => setCreateForm({ ...createForm, time: v })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Kunde Vorname</label>
                <input
                  type="text"
                  value={createForm.firstName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, firstName: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Kunde Nachname</label>
                <input
                  type="text"
                  value={createForm.lastName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, lastName: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">E-Mail</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">
                  Telefon (optional)
                </label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#1C1612]">
                Notiz (optional)
              </label>
              <textarea
                value={createForm.note}
                onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
              />
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-full rounded-full border border-[#E8E4DF] px-5 py-3 text-sm font-medium text-[#1C1612] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1 sm:w-auto sm:py-2"
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
                className="w-full rounded-full bg-[#4A5D4A] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A4A3A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1 disabled:opacity-50 sm:w-auto sm:py-2"
              >
                {creating ? "Wird angelegt…" : "Termin speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {serviceDeleteTarget && (
        <div className="fixed inset-0 z-[64] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-h2 text-[#1C1612]">Leistung löschen?</h3>
            <p className="mt-2 text-sm text-[#1C1612]/75">
              Die Leistung {serviceDeleteTarget.name} wird dauerhaft entfernt. Dieser Schritt kann nicht
              rückgängig gemacht werden.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setServiceDeleteTarget(null)}
                disabled={serviceDeletingId === serviceDeleteTarget.id}
                className="rounded-full border border-[#E8E4DF] px-5 py-2 text-sm font-medium text-[#1C1612] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1 disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => removeService(serviceDeleteTarget.id)}
                disabled={serviceDeletingId === serviceDeleteTarget.id}
                className="rounded-full bg-[#B34A3F] px-6 py-2 text-sm font-medium text-white hover:bg-[#9C3F35] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1 disabled:opacity-50"
              >
                {serviceDeletingId === serviceDeleteTarget.id ? "Löschen…" : "Endgültig löschen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showServiceEditor && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/45 px-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-h2 text-[#1C1612]">
                {serviceEditorMode === "create" ? "Neue Leistung" : "Leistung bearbeiten"}
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceEditor(false)}
                className="text-sm text-[#1C1612]/70 hover:text-[#1C1612]"
              >
                Schließen
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#1C1612]">Name</label>
                <input
                  type="text"
                  value={serviceEditorForm.name}
                  onChange={(e) =>
                    setServiceEditorForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
                  placeholder="z.B. Damen - Haarschnitt & Styling (kurz)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Kategorie</label>
                <CustomSelect
                  value={serviceEditorForm.category}
                  onChange={(v) =>
                    setServiceEditorForm((prev) => ({
                      ...prev,
                      category: v as ServiceCategory,
                    }))
                  }
                  options={[
                    { value: "women", label: "Damen" },
                    { value: "men", label: "Herren" },
                    { value: "unisex", label: "Unisex" },
                  ]}
                  placeholder="Auswählen…"
                  clearable={false}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Dauer (Minuten)</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={serviceEditorForm.durationMinutes}
                  onChange={(e) =>
                    setServiceEditorForm((prev) => ({
                      ...prev,
                      durationMinutes: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Preis (€)</label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={serviceEditorForm.priceEur}
                  onChange={(e) =>
                    setServiceEditorForm((prev) => ({ ...prev, priceEur: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Puffer (Minuten)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={serviceEditorForm.bufferMinutes}
                  onChange={(e) =>
                    setServiceEditorForm((prev) => ({
                      ...prev,
                      bufferMinutes: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Display-Reihenfolge</label>
                <input
                  type="number"
                  step={1}
                  value={serviceEditorForm.displayOrder}
                  onChange={(e) =>
                    setServiceEditorForm((prev) => ({
                      ...prev,
                      displayOrder: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#1C1612]">Display-Sektion (optional)</label>
                <input
                  type="text"
                  value={serviceEditorForm.displaySection}
                  onChange={(e) =>
                    setServiceEditorForm((prev) => ({
                      ...prev,
                      displaySection: e.target.value,
                    }))
                  }
                  placeholder="z.B. SCHNITT & STYLING"
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Group-Key (optional)</label>
                <input
                  type="text"
                  value={serviceEditorForm.groupKey}
                  onChange={(e) =>
                    setServiceEditorForm((prev) => ({ ...prev, groupKey: e.target.value }))
                  }
                  placeholder="z.B. women-foils"
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Gruppen-Dauer (optional)</label>
                <input
                  type="text"
                  value={serviceEditorForm.groupDurationLabel}
                  onChange={(e) =>
                    setServiceEditorForm((prev) => ({
                      ...prev,
                      groupDurationLabel: e.target.value,
                    }))
                  }
                  placeholder="z.B. 2 Std 15 Min"
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#1C1612]">CTA-Typ</label>
                <CustomSelect
                  value={serviceEditorForm.ctaType}
                  onChange={(v) =>
                    setServiceEditorForm((prev) => ({
                      ...prev,
                      ctaType: (v as "select" | "call") || "select",
                    }))
                  }
                  options={[
                    { value: "select", label: "Buchen" },
                    { value: "call", label: "Anrufen" },
                  ]}
                  placeholder="Auswählen…"
                  clearable={false}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#1C1612]">Beschreibung (optional)</label>
                <textarea
                  rows={3}
                  value={serviceEditorForm.description}
                  onChange={(e) =>
                    setServiceEditorForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowServiceEditor(false)}
                className="rounded-full border border-[#E8E4DF] px-5 py-2 text-sm font-medium text-[#1C1612]"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={saveServiceEditor}
                disabled={serviceSaving}
                className="rounded-full bg-[#4A5D4A] px-6 py-2 text-sm font-medium text-white hover:bg-[#3A4A3A] disabled:opacity-50"
              >
                {serviceSaving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {blockEditor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-h3 text-[#1C1612]">Abwesenheit eintragen</h3>
              <button
                type="button"
                onClick={() => setBlockEditor(null)}
                className="text-sm text-[#1C1612]/70 hover:text-[#1C1612]"
              >
                Schließen
              </button>
            </div>
            <p className="mt-2 text-sm text-[#1C1612]/75">
              {staff.find((s) => s._id === blockEditor.staffId)?.firstName || "Mitarbeiter"} am{" "}
              {new Date(`${dateFilter}T12:00:00`).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#1C1612]">
              <input
                type="checkbox"
                checked={blockEditor.allDay}
                onChange={(e) =>
                  setBlockEditor((current) =>
                    current
                      ? {
                          ...current,
                          allDay: e.target.checked,
                          fromMinute: e.target.checked ? dayStartMinute : current.fromMinute,
                          toMinute: e.target.checked ? dayEndMinute : current.toMinute,
                        }
                      : current
                  )
                }
                className="h-4 w-4 rounded border-[#E8E4DF]"
              />
              Ganztägig abwesend
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Von</label>
                <input
                  type="time"
                  step={300}
                  disabled={blockEditor.allDay}
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
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm disabled:bg-[#F5F2ED] disabled:text-[#1C1612]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1612]">Bis</label>
                <input
                  type="time"
                  step={300}
                  disabled={blockEditor.allDay}
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
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm disabled:bg-[#F5F2ED] disabled:text-[#1C1612]/50"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#1C1612]">Grund</label>
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
                className="rounded-full border border-[#E8E4DF] px-5 py-2 text-sm font-medium text-[#1C1612]"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => {
                  const fromMinute = blockEditor.allDay
                    ? dayStartMinute
                    : clampMinute(blockEditor.fromMinute);
                  const toMinute = blockEditor.allDay
                    ? dayEndMinute
                    : clampMinute(blockEditor.toMinute);
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
