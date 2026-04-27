"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  getServices,
  getStaff,
  getAvailableSlots,
  createAppointment,
  rescheduleAppointment,
  addToWaitlist,
} from "@/lib/api";
import { canStaffDoAllServices } from "@/lib/staffCapabilities";
import Link from "next/link";
import { useAuth } from "./AuthContext";

type Service = { _id: string; name: string; category: string; durationMinutes: number; priceEur: number };
type Staff = { _id: string; firstName: string; lastName: string; serviceIds: { _id: string }[] };
type ServiceGroup = { id: string; label: string; matcher: (s: Service) => boolean };
type GroupedServiceEntry = {
  key: string;
  title: string;
  variants: Service[];
};

const CATEGORIES = [
  { id: "women", label: "Frauen" },
  { id: "men", label: "Männer" },
];

const FALLBACK_SERVICES: Service[] = [
  { _id: "fallback-1", name: "Waschen / Schneiden / Föhnen", category: "men", durationMinutes: 45, priceEur: 45 },
  { _id: "fallback-2", name: "Waschen / Schneiden / Föhnen", category: "women", durationMinutes: 60, priceEur: 55 },
  { _id: "fallback-3", name: "Bartrasur", category: "men", durationMinutes: 20, priceEur: 34 },
  { _id: "fallback-4", name: "Färbung", category: "women", durationMinutes: 90, priceEur: 85 },
  { _id: "fallback-5", name: "Stännen / Highlights", category: "women", durationMinutes: 120, priceEur: 95 },
];

const FALLBACK_STAFF: Staff[] = [
  { _id: "fallback-mehtap", firstName: "Mehtap", lastName: "", serviceIds: FALLBACK_SERVICES.map((s) => ({ _id: s._id })) },
  { _id: "fallback-sevim", firstName: "Sevim", lastName: "", serviceIds: FALLBACK_SERVICES.filter((s) => s.category === "men" || s.name.toLowerCase().includes("färb")).map((s) => ({ _id: s._id })) },
  { _id: "fallback-maria", firstName: "Maria", lastName: "", serviceIds: FALLBACK_SERVICES.filter((s) => s.category === "women").map((s) => ({ _id: s._id })) },
  { _id: "fallback-sarah", firstName: "Sarah", lastName: "", serviceIds: FALLBACK_SERVICES.map((s) => ({ _id: s._id })) },
  { _id: "fallback-masoud", firstName: "Masoud", lastName: "", serviceIds: FALLBACK_SERVICES.map((s) => ({ _id: s._id })) },
  { _id: "fallback-kanj", firstName: "Kanj", lastName: "", serviceIds: FALLBACK_SERVICES.map((s) => ({ _id: s._id })) },
];

type Step = 1 | 2 | 3 | 4 | 5;

const BOOKING_STATE_KEY = "pm_booking_state";

function formatDurationLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} Std. ${m} Min.`;
  if (h > 0) return `${h} Std.`;
  return `${m} Min.`;
}

function baseServiceTitle(name: string) {
  return name.replace(/\s*\([^)]+\)\s*$/, "").trim();
}

function variantLabel(name: string) {
  const match = name.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : "Standard";
}

function toLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BuchungsFlow() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [rescheduleToken, setRescheduleToken] = useState(searchParams.get("rescheduleToken") || "");
  const preselectedServiceIdsParam = searchParams.get("serviceIds") || "";
  const preselectedServiceName = searchParams.get("service") || "";
  const hasBookingQuery =
    searchParams.has("booking") ||
    searchParams.has("serviceIds") ||
    searchParams.has("rescheduleToken");
  const [preselectApplied, setPreselectApplied] = useState(false);
  const [step, setStep] = useState<Step>(hasBookingQuery ? 2 : 1);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [category, setCategory] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [activeServiceGroupId, setActiveServiceGroupId] = useState<string>("");
  const [expandedServiceKeys, setExpandedServiceKeys] = useState<Record<string, boolean>>({});
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [slotFilter, setSlotFilter] = useState<"all" | "morning" | "afternoon">("all");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successType, setSuccessType] = useState<"booked" | "waitlist">("booked");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    note: "",
    privacy: true,
  });

  useEffect(() => {
    if (user && step === 3) {
      setForm((f) => ({
        ...f,
        firstName: f.firstName || user.firstName,
        lastName: f.lastName || user.lastName,
        email: f.email || user.email,
        phone: f.phone || user.phone || "",
      }));
    }
  }, [user, step]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(BOOKING_STATE_KEY) : null;
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if ((s?.services?.length || s?.service) && s?.slot) {
          const restoredServices = s.services || [s.service];
          setSelectedServices(restoredServices);
          if (restoredServices?.[0]?.category) {
            setCategory(restoredServices[0].category);
          }
          setSelectedStaff(s.staff ?? null);
          setSelectedSlot(s.slot);
          if (s.selectedDate) {
            setSelectedDate(s.selectedDate);
          } else if (s.slot?.start) {
            setSelectedDate(toLocalDateInput(new Date(s.slot.start)));
          }
          setRescheduleToken(s.rescheduleToken || "");
          setPreselectApplied(true);
          setStep(3);
        }
        sessionStorage.removeItem(BOOKING_STATE_KEY);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (error && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error]);

  useEffect(() => {
    if (step !== 5 || typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    if (step !== 2 || selectedServices.length === 0 || selectedDate || selectedStaff) return;
    const init = async () => {
      setSelectedDate(todayDate);
      const autoStaff = await autoSelectAvailableStaff(todayDate);
      setSelectedStaff(autoStaff);
      await fetchSlots(todayDate, autoStaff);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedServices.length]);

  useEffect(() => {
    // Falls /buchung?booking=1 ohne vorausgewählte Leistung geöffnet wird,
    // zeigen wir wieder Schritt 1 statt leerem Step-2-Container.
    if (step !== 2 || selectedServices.length > 0) return;
    if (preselectedServiceIdsParam || preselectedServiceName) return;
    if (!hasBookingQuery) return;
    setStep(1);
  }, [
    hasBookingQuery,
    preselectedServiceIdsParam,
    preselectedServiceName,
    selectedServices.length,
    step,
  ]);

  useEffect(() => {
    if (!selectedDate) return;
    const selected = new Date(`${selectedDate}T12:00:00`);
    setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [selectedDate]);

  useEffect(() => {
    getServices()
      .then((data) => {
        setServices(Array.isArray(data) && data.length > 0 ? data : FALLBACK_SERVICES);
      })
      .catch(() => {
        setServices(FALLBACK_SERVICES);
      });
    getStaff()
      .then((data) => {
        setStaff(Array.isArray(data) && data.length > 0 ? data : FALLBACK_STAFF);
      })
      .catch(() => setStaff(FALLBACK_STAFF));
  }, []);

  useEffect(() => {
    if (preselectApplied || services.length === 0) return;

    const parsedIds = preselectedServiceIdsParam
      ? preselectedServiceIdsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    let matchedServices: Service[] = [];
    if (parsedIds.length > 0) {
      matchedServices = services.filter((s) => parsedIds.includes(String(s._id)));
    } else if (preselectedServiceName) {
      const normalizedQuery = preselectedServiceName.toLowerCase().trim();
      const matched = services.find((s) => s.name.toLowerCase().includes(normalizedQuery));
      if (matched) matchedServices = [matched];
    }

    if (matchedServices.length === 0) return;
    setCategory(matchedServices[0].category);
    setSelectedServices(matchedServices);
    setSelectedStaff(null);
    setSelectedSlot(null);
    setSelectedDate("");
    setSlots([]);
    setPreselectApplied(true);
    goToStep(2);
  }, [preselectedServiceIdsParam, preselectedServiceName, preselectApplied, services]);

  const filteredServices = category
    ? services.filter((s) => s.category === category)
    : [];

  const serviceGroups: ServiceGroup[] =
    category === "women"
      ? [
          {
            id: "women-cut-styling",
            label: "Damen - Haarschnitte & Stylings",
            matcher: (s) =>
              s.name.startsWith("Damen -") &&
              !s.name.includes("Coloration") &&
              !s.name.includes("Ansatzfarbe") &&
              !s.name.includes("Foliensträhnen") &&
              !s.name.includes("Balayage") &&
              !s.name.includes("Glossing") &&
              !s.name.includes("Face Frame"),
          },
          {
            id: "women-color-styling",
            label: "Damen - Colorationen & Styling",
            matcher: (s) =>
              !s.name.includes(", Haarschnitt & Styling") &&
              (s.name.includes("Ansatzfarbe") ||
                s.name.includes("Soft Coloration") ||
                s.name.includes("Foliensträhnen") ||
                s.name.includes("Balayage") ||
                s.name.includes("Glossing/Milkshake") ||
                s.name.includes("Face Frame")),
          },
          {
            id: "women-color-cut-style",
            label: "Damen - Colorationen, Waschen, Schneiden & Stylen",
            matcher: (s) => s.name.includes(", Haarschnitt & Styling"),
          },
        ]
      : category === "men"
        ? [
            {
              id: "men-cut-styling",
              label: "Herren - Haarschnitte & Stylings",
              matcher: () => true,
            },
          ]
        : [];

  const groupedById = useMemo(() => {
    const result: Record<string, GroupedServiceEntry[]> = {};
    for (const group of serviceGroups) {
      const groupServices = filteredServices
        .filter(group.matcher)
        .sort((a, b) => a.name.localeCompare(b.name));
      const map = new Map<string, GroupedServiceEntry>();
      groupServices.forEach((service) => {
        const key = baseServiceTitle(service.name);
        if (!map.has(key)) {
          map.set(key, { key, title: key, variants: [] });
        }
        map.get(key)?.variants.push(service);
      });
      result[group.id] = Array.from(map.values()).map((entry) => ({
        ...entry,
        variants: entry.variants.sort((a, b) => a.priceEur - b.priceEur),
      }));
    }
    return result;
  }, [filteredServices, serviceGroups]);

  const activeGroupedServices =
    activeServiceGroupId && groupedById[activeServiceGroupId]
      ? groupedById[activeServiceGroupId]
      : groupedById[serviceGroups[0]?.id] || [];

  useEffect(() => {
    if (!category || serviceGroups.length === 0) return;
    const first = serviceGroups[0].id;
    setActiveServiceGroupId((prev) =>
      prev && serviceGroups.some((g) => g.id === prev) ? prev : first
    );
  }, [category, serviceGroups]);

  const selectedServiceIds = selectedServices.map((s) => s._id);
  const primarySelectedService = selectedServices[0] ?? null;
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.priceEur, 0);
  const bookingRedirect = (() => {
    const params = new URLSearchParams();
    params.set("booking", "1");
    if (selectedServiceIds.length > 0) params.set("serviceIds", selectedServiceIds.join(","));
    if (rescheduleToken) params.set("rescheduleToken", rescheduleToken);
    return `/buchung?${params.toString()}`;
  })();
  const persistBookingState = () => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(
      BOOKING_STATE_KEY,
      JSON.stringify({
        services: selectedServices,
        staff: selectedStaff,
        slot: selectedSlot,
        selectedDate,
        rescheduleToken,
      })
    );
  };

  const availableStaff = selectedServices.length > 0
    ? staff.filter((s) => canStaffDoAllServices(s, selectedServices))
    : [];

  const isFallbackData = selectedServices.some((s) => {
    const id = String(s._id || "");
    return id.startsWith("fallback-") || id.startsWith("offline-");
  });

  const todayDate = toLocalDateInput(new Date());
  const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const monthLabel = calendarMonth.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
    const cells: Array<number | null> = Array.from({ length: mondayBasedOffset }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    return cells;
  }, [calendarMonth]);
  const filteredSlots = useMemo(() => {
    if (slotFilter === "all") return slots;
    return slots.filter((slot) => {
      const hour = new Date(slot.start).getHours();
      return slotFilter === "morning" ? hour < 12 : hour >= 12;
    });
  }, [slots, slotFilter]);

  const generateDemoSlots = (date: string, durationMin: number) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayNum = dayStart.getDay();
    const hours = dayNum === 0 ? null : dayNum === 6 ? { startMin: 9 * 60, endMin: 14 * 60 } : { startMin: 9 * 60, endMin: 20 * 60 };
    if (!hours) return [];
    const slots: { start: string; end: string }[] = [];
    for (let m = hours.startMin; m + durationMin <= hours.endMin; m += 15) {
      const start = new Date(dayStart);
      start.setHours(Math.floor(m / 60), m % 60, 0, 0);
      const end = new Date(start.getTime() + durationMin * 60 * 1000);
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
    return slots;
  };

  const fetchSlots = async (date: string, staffOverride?: Staff | null) => {
    if (selectedServiceIds.length === 0) return;
    setLoading(true);
    setError("");
    try {
      if (isFallbackData) {
        const demoSlots = generateDemoSlots(date, totalDuration);
        setSlots(demoSlots);
      } else {
        const effectiveStaff = staffOverride === undefined ? selectedStaff : staffOverride;
        const data = await getAvailableSlots(
          date,
          selectedServiceIds,
          effectiveStaff?._id
        );
        setSlots(data);
      }
    } catch {
      setError("Verfügbarkeit konnte nicht geladen werden.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const goToStep = (nextStep: Step) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setSelectedServices([]);
    setActiveServiceGroupId("");
    setExpandedServiceKeys({});
    setSelectedStaff(null);
    setSelectedDate("");
    setSlots([]);
    goToStep(1);
  };

  const handleServiceToggle = (s: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((item) => item._id === s._id);
      if (exists) return prev.filter((item) => item._id !== s._id);
      return [...prev, s];
    });
    setSelectedStaff(null);
    setSelectedSlot(null);
    setSlots([]);
    setSelectedDate("");
  };

  const autoSelectAvailableStaff = async (date: string) => {
    if (availableStaff.length === 0) return null;
    if (isFallbackData) return availableStaff[0] || null;
    const checks = await Promise.all(
      availableStaff.map(async (s) => {
        const data = await getAvailableSlots(date, selectedServiceIds, s._id);
        return { staff: s, hasSlots: Array.isArray(data) && data.length > 0, slots: data };
      })
    );
    const firstAvailable = checks.find((c) => c.hasSlots);
    if (!firstAvailable) return null;
    setSlots(firstAvailable.slots);
    return firstAvailable.staff;
  };

  const handleStaffSelect = (s: Staff | null) => {
    setSelectedStaff(s);
    setSelectedSlot(null);
    setSlots([]);
    // UX: direkt heutige Slots laden, wenn möglich
    if (s && selectedServiceIds.length > 0) {
      setSelectedDate(todayDate);
      fetchSlots(todayDate, s);
    }
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlots([]);
    if (!date) return;
    if (!selectedStaff) {
      const autoStaff = await autoSelectAvailableStaff(date);
      setSelectedStaff(autoStaff);
      await fetchSlots(date, autoStaff);
      return;
    }
    await fetchSlots(date, selectedStaff);
  };

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0 || !selectedStaff || !selectedSlot) return;
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Bitte fülle alle Pflichtfelder aus.");
      return;
    }
    if (isFallbackData) {
      setError("Für echte Buchungen muss das Backend laufen. Starte das Backend (npm run dev) und führe den Seed aus (node src/scripts/seed.js).");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setSuccessType("booked");
      const payload = {
        serviceIds: selectedServiceIds,
        staffId: selectedStaff._id,
        startAt: selectedSlot.start,
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          note: form.note.trim() || undefined,
        },
      };
      if (rescheduleToken) {
        await rescheduleAppointment(rescheduleToken, payload);
      } else {
        await createAppointment(payload);
      }
      goToStep(5);
    } catch (e: unknown) {
      const message = (e as Error).message || "Buchung fehlgeschlagen.";
      setError(message);
      if (
        selectedDate &&
        (message.includes("Zeitslot nicht mehr verfügbar") ||
          message.toLowerCase().includes("slot") ||
          message.toLowerCase().includes("verfügbar"))
      ) {
        // Slotliste neu laden, damit belegte Zeiten ausgeblendet werden
        fetchSlots(selectedDate);
        setSelectedSlot(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async () => {
    setSuccessType("waitlist");
    if (selectedServices.length === 0 || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Bitte fülle alle Pflichtfelder aus.");
      return;
    }
    if (isFallbackData) {
      setError("Für die Warteliste muss das Backend laufen.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addToWaitlist({
        serviceId: selectedServiceIds[0],
        staffId: selectedStaff?._id,
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
        },
      });
      goToStep(5);
    } catch (e: unknown) {
      setError((e as Error).message || "Fehler bei der Warteliste.");
    } finally {
      setLoading(false);
    }
  };

  const selectedSlotStart = selectedSlot ? new Date(selectedSlot.start) : null;
  const selectedDateLabelLong = selectedSlotStart
    ? selectedSlotStart.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Noch offen";
  const selectedTimeLabel = selectedSlotStart
    ? selectedSlotStart.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Noch offen";

  if (step === 5) {
    const isBooked = successType === "booked";
    const start = selectedSlot ? new Date(selectedSlot.start) : null;
    const end = selectedSlot ? new Date(selectedSlot.end) : null;
    const dayLabel = start
      ? start
          .toLocaleDateString("de-DE", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
          .replace(",", "")
      : "Termin wird bestätigt";
    const timeLabel =
      start && end
        ? `${start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "Wir melden uns mit einem freien Slot.";
    const formatGoogleDate = (value: Date) =>
      value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const googleCalendarHref =
      start && end
        ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            "Termin bei Petite Maison"
          )}&dates=${formatGoogleDate(start)}/${formatGoogleDate(end)}&details=${encodeURIComponent(
            selectedServices.map((s) => s.name).join(" + ")
          )}&location=${encodeURIComponent("Petite Maison, Arndtstr. 33, 22085 Hamburg")}`
        : null;

    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="relative rounded-2xl border border-[#E8E4DF] bg-white p-5 pt-14 text-center shadow-sm sm:p-8 sm:pt-16">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-[#8ED39A] bg-[#4A5D4A] text-3xl text-white shadow-sm">
              ✓
            </div>
          </div>

          <h2 className="text-h1 text-[#2D2D2D]">
            {isBooked ? "Buchung bestätigt" : "Warteliste bestätigt"}
          </h2>
          <p className="mt-2 text-lg text-[#2D2D2D]/85">
            {isBooked
              ? "Wir freuen uns auf deinen Besuch!"
              : "Du wurdest erfolgreich auf die Warteliste gesetzt."}
          </p>

          <div className="mt-6 rounded-2xl border border-[#E8E4DF] p-5 text-left sm:p-6">
            <div className="text-center">
              <p className="text-5xl font-medium leading-none text-[#2D2D2D]">{dayLabel}</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-2xl text-[#2D2D2D]/90">
                <span aria-hidden>◷</span>
                <span className="text-3xl font-medium">{timeLabel}</span>
              </div>
              {isBooked && googleCalendarHref && (
                <a
                  href={googleCalendarHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-[#4A5D4A] underline-offset-2 hover:underline"
                >
                  Zum Kalender hinzufügen
                </a>
              )}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[#2D2D2D]/70">Ausgewählte Leistungen</p>
                <ul className="mt-2 space-y-1">
                  {selectedServices.map((s) => (
                    <li key={s._id} className="text-xl text-[#2D2D2D]">
                      {s.name} <span className="text-[#2D2D2D]/55">{s.durationMinutes} Min.</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm text-[#2D2D2D]/70">Mitarbeiter</p>
                <p className="mt-2 text-4xl text-[#2D2D2D]">
                  {selectedStaff ? selectedStaff.firstName : "Freier Mitarbeiter"}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#E8E4DF] pt-4 text-[#2D2D2D]/85">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-1 h-5 w-5 shrink-0 text-[#2D2D2D]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <div>
                  <p className="text-lg">Petite Maison</p>
                  <p className="text-lg">Arndtstr. 33</p>
                  <p className="text-lg">22085 Hamburg</p>
                  <a
                    href="https://maps.google.com/?q=Arndtstr.+33,+22085+Hamburg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[#4A5D4A] underline-offset-2 hover:underline"
                  >
                    In Google Maps öffnen
                  </a>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <svg
                  className="h-5 w-5 shrink-0 text-[#2D2D2D]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 012.01 4.18 2 2 0 014 2h3a2 2 0 012 1.72c.12.9.33 1.78.62 2.62a2 2 0 01-.45 2.11L8.1 9.9a16 16 0 006 6l1.45-1.08a2 2 0 012.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0122 16.92z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-2xl text-[#2D2D2D]">+49 176 69150964</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/konto?tab=bookings"
              className="inline-flex items-center justify-center rounded-lg bg-[#4A5D4A] px-6 py-3 text-lg font-medium text-white transition hover:bg-[#3A4A3A]"
            >
              Gehe zu Buchungen
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[#4A5D4A] px-6 py-3 text-lg font-medium text-[#4A5D4A] transition hover:bg-[#4A5D4A]/10"
            >
              Zum Salon
            </Link>
          </div>

          <p className="mt-5 text-sm text-[#2D2D2D]/75">
            {isBooked
              ? "Du erhältst in Kürze eine Bestätigungs-E-Mail. Bitte prüfe auch deinen Spam-Ordner, wenn keine Mail im Posteingang erscheint."
              : "Wir benachrichtigen dich per E-Mail, sobald ein passender Termin verfügbar ist."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {step === 1 && (
        <section className="border-b border-[#E8E4DF] py-12 md:py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h1 className="text-h1 text-[#2D2D2D]">
              Termin buchen
            </h1>
            <p className="mt-4 text-lg text-[#2D2D2D]/85">
              Wähle deine Leistung, einen passenden Termin und bestätige deine Buchung.
            </p>
          </div>
        </section>
      )}
      <section
        className={`mx-auto px-4 py-10 sm:px-6 sm:py-12 ${
          (step === 1 && category) || step === 2 || step === 3 ? "max-w-6xl" : "max-w-2xl"
        }`}
      >
     
      {error && (
        <div className="mb-6 rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">
          {error}
        </div>
      )}

      {/* Step 1: Kategorie & Service */}
      {step === 1 && (
        <div className="space-y-10 pb-24">
          <div>
            <h2 className="text-h3 text-[#2D2D2D]">
              Kategorie
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategorySelect(c.id)}
                  className={`rounded-full px-6 py-3 font-medium transition ${
                    category === c.id
                      ? "bg-[#4A5D4A] text-white"
                      : "border-2 border-[#E8E4DF] text-[#2D2D2D] hover:border-[#4A5D4A]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {category && (
            <div>
              <h2 className="text-h3 text-[#2D2D2D]">
                Leistungen auswählen
              </h2>
              <div className="mt-4 grid items-start gap-4 lg:gap-6 lg:grid-cols-[250px_1fr]">
                <div className="h-fit self-start rounded-xl border border-[#E8E4DF] bg-white p-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:block">
                    {serviceGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setActiveServiceGroupId(group.id)}
                        className={`w-full whitespace-normal break-words rounded-lg px-3 py-3 text-left text-sm font-medium lg:mb-1 ${
                          activeServiceGroupId === group.id
                            ? "border border-[#4A5D4A]/35 bg-[#4A5D4A]/10 text-[#2D2D2D]"
                            : "border border-[#E8E4DF]/60 text-[#2D2D2D]/90 hover:bg-[#F7F7F9]"
                        }`}
                      >
                        {group.label} ({groupedById[group.id]?.length || 0})
                      </button>
                    ))}
                  </div>
                </div>
                <div className="min-w-0 rounded-2xl border border-[#E8E4DF] bg-white">
                    {activeGroupedServices.map((entry) => {
                      const hasVariants = entry.variants.length > 1;
                      const isExpanded = expandedServiceKeys[entry.key] || false;
                      const minPrice = Math.min(...entry.variants.map((v) => v.priceEur));
                      const minDuration = Math.min(...entry.variants.map((v) => v.durationMinutes));
                      const maxDuration = Math.max(...entry.variants.map((v) => v.durationMinutes));
                      return (
                        <div key={entry.key} className="min-w-0 border-b border-[#E8E4DF] p-4 last:border-b-0">
                          <div className="min-w-0 grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                            <div className="min-w-0">
                              <p className="break-words font-medium text-[#2D2D2D]">{entry.title}</p>
                              <p className="mt-1 text-sm text-[#2D2D2D]/70">
                                {minDuration === maxDuration
                                  ? formatDurationLabel(minDuration)
                                  : `${formatDurationLabel(minDuration)} - ${formatDurationLabel(maxDuration)}`}
                              </p>
                            </div>
                            <div className="text-left font-semibold text-[#2D2D2D] md:text-right">
                              {hasVariants ? `ab ${minPrice} €` : `${minPrice} €`}
                            </div>
                            {hasVariants ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedServiceKeys((prev) => ({
                                    ...prev,
                                    [entry.key]: !prev[entry.key],
                                  }))
                                }
                                className="w-full rounded-full border border-[#E8E4DF] px-4 py-2 text-sm font-medium text-[#2D2D2D] hover:bg-[#F5F2ED] md:w-auto lg:justify-self-end"
                              >
                                {isExpanded ? "Varianten ausblenden" : "Varianten anzeigen"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleServiceToggle(entry.variants[0])}
                                className={`w-full rounded border px-4 py-2 text-sm font-medium md:w-auto lg:justify-self-end ${
                                  selectedServices.some((x) => x._id === entry.variants[0]._id)
                                    ? "border-[#4A5D4A] bg-[#4A5D4A] text-white"
                                    : "border-[#D4A5A5] text-[#C2787E]"
                                }`}
                              >
                                {selectedServices.some((x) => x._id === entry.variants[0]._id)
                                  ? "Ausgewählt"
                                  : "Auswählen"}
                              </button>
                            )}
                          </div>
                          {hasVariants && isExpanded && (
                            <div className="mt-3 space-y-2">
                              {entry.variants.map((variant) => (
                                <div
                                  key={variant._id}
                                  className="min-w-0 grid grid-cols-1 items-center gap-3 rounded-lg border border-[#E8E4DF] bg-[#FAF9F7] p-3 md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto]"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-[#2D2D2D]">
                                      {variantLabel(variant.name)}
                                    </p>
                                    <p className="text-sm text-[#2D2D2D]/70">
                                      {formatDurationLabel(variant.durationMinutes)}
                                    </p>
                                  </div>
                                  <div className="text-left font-semibold text-[#2D2D2D] md:text-right">
                                    {variant.priceEur} €
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleServiceToggle(variant)}
                                    className={`w-full rounded border px-4 py-2 text-sm font-medium md:w-auto lg:justify-self-end ${
                                      selectedServices.some((x) => x._id === variant._id)
                                        ? "border-[#4A5D4A] bg-[#4A5D4A] text-white"
                                        : "border-[#D4A5A5] text-[#C2787E]"
                                    }`}
                                  >
                                    {selectedServices.some((x) => x._id === variant._id)
                                      ? "Ausgewählt"
                                      : "Auswählen"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
              {selectedServices.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[#4A5D4A]/35 bg-white/95 p-4 shadow-[0_-12px_30px_rgba(45,45,45,0.14)] backdrop-blur">
                  <div className="mx-auto max-w-6xl">
                    <p className="mb-2 text-sm text-[#2D2D2D]/85">
                      {selectedServices.length} Leistung(en) ausgewählt · {totalDuration} min · {totalPrice} €
                    </p>
                    <button
                      onClick={() => goToStep(2)}
                      className="w-full rounded-full bg-[#4A5D4A] py-3 font-medium text-white transition hover:bg-[#3A4A3A]"
                    >
                      Weiter
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Mitarbeiter & Termin */}
      {step === 2 && primarySelectedService && (
        <div className="overflow-hidden rounded-[26px] border border-[#D5D0C8] bg-[#F1EEE9] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 md:px-7 md:pb-6 md:pt-6">
            <div>
              <h2 className="text-h1 text-[#2D2D2D]">Termin & Stylist</h2>
              <p className="mt-1 text-sm text-[#2D2D2D]/85">
                Wähle deine Stylistin und einen freien Termin.
              </p>
            </div>
            <Link
              href="/buchung"
              prefetch={false}
              className="rounded-md p-1 text-[#2D2D2D]/70 transition hover:bg-black/5 hover:text-[#2D2D2D]"
              aria-label="Flow schließen"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-8 px-5 pb-6 md:px-7 lg:grid-cols-[1fr_1.08fr]">
            <div className="space-y-8">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#2D2D2D]/50">
                  {selectedServices.length} Leistungen ausgewählt
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedServices.map((service) => (
                    <button
                      key={service._id}
                      type="button"
                      onClick={() => handleServiceToggle(service)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#2D2D2D]/45 bg-[#F5F2ED] px-3 py-1.5 text-sm text-[#2D2D2D]"
                    >
                      <span>
                        {baseServiceTitle(service.name)} · {service.priceEur}€
                      </span>
                      <span aria-hidden className="text-[#2D2D2D]/70">×</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#2D2D2D]/50">
                  Mitarbeiter auswählen
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => handleStaffSelect(null)}
                    className="flex w-[72px] flex-col items-center gap-2 text-center"
                  >
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-full border-2 ${
                        !selectedStaff
                          ? "border-[#1F1A17] bg-[#EFECE7]"
                          : "border-[#2D2D2D]/45 bg-transparent"
                      }`}
                    />
                    <span className="text-xs text-[#2D2D2D]">Beliebig</span>
                  </button>
                  {availableStaff.map((s) => {
                    const initials = `${s.firstName?.[0] || ""}${s.lastName?.[0] || ""}`.toUpperCase();
                    return (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => handleStaffSelect(s)}
                        className="flex w-[72px] flex-col items-center gap-2 text-center"
                      >
                        <span
                          className={`grid h-11 w-11 place-items-center rounded-full border text-xs font-medium ${
                            selectedStaff?._id === s._id
                              ? "border-[#1F1A17] bg-[#1F1A17] text-white"
                              : "border-[#2D2D2D]/35 bg-[#EBC8B7] text-[#2D2D2D]"
                          }`}
                        >
                          {initials || "PM"}
                        </span>
                        <span className="text-xs text-[#2D2D2D]">{s.firstName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#2D2D2D]/50">
                Datum & Uhrzeit auswählen
              </p>

              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                      )
                    }
                    className="rounded-md px-2 py-1 text-[#7F7A72] hover:bg-black/5"
                    aria-label="Vorheriger Monat"
                  >
                    ‹
                  </button>
                  <p className="text-xl text-[#2D2D2D] capitalize">{monthLabel}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                      )
                    }
                    className="rounded-md px-2 py-1 text-[#7F7A72] hover:bg-black/5"
                    aria-label="Nächster Monat"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-[#2D2D2D]/75">
                  {weekdayLabels.map((weekday) => (
                    <div key={weekday}>{weekday}</div>
                  ))}
                  {calendarDays.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} />;
                    const date = new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth(),
                      day
                    );
                    const value = toLocalDateInput(date);
                    const isPast = value < todayDate;
                    const isSelected = selectedDate === value;
                    const markerClass = day % 4 === 0 ? "bg-[#CF4D4D]" : "bg-[#2E8C58]";
                    return (
                      <div key={value} className="mx-auto flex h-11 w-9 flex-col items-center justify-center">
                        <button
                          type="button"
                          disabled={isPast}
                          onClick={() => handleDateSelect(value)}
                          className={`grid h-8 w-8 place-items-center rounded-full text-sm transition ${
                            isSelected
                              ? "bg-[#1F1A17] text-white"
                              : isPast
                                ? "cursor-not-allowed text-[#C4BFB8]"
                                : "text-[#2D2D2D] hover:bg-black/5"
                          }`}
                        >
                          {day}
                        </button>
                        {!isPast && (
                          <span className={`mt-1 h-1.5 w-1.5 rounded-full ${markerClass}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSlotFilter("all")}
                  className={`rounded-full border px-4 py-1.5 text-sm ${
                    slotFilter === "all"
                      ? "border-[#1D1D1D] bg-[#1D1D1D] text-white"
                      : "border-[#7D7D7D] bg-transparent text-[#2D2D2D]"
                  }`}
                >
                  Alle
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter("morning")}
                  className={`rounded-full border px-4 py-1.5 text-sm ${
                    slotFilter === "morning"
                      ? "border-[#1D1D1D] bg-[#1D1D1D] text-white"
                      : "border-[#7D7D7D] bg-transparent text-[#2D2D2D]"
                  }`}
                >
                  Vormittags
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter("afternoon")}
                  className={`rounded-full border px-4 py-1.5 text-sm ${
                    slotFilter === "afternoon"
                      ? "border-[#1D1D1D] bg-[#1D1D1D] text-white"
                      : "border-[#7D7D7D] bg-transparent text-[#2D2D2D]"
                  }`}
                >
                  Nachmittags
                </button>
              </div>

              {loading && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#2D2D2D]/70">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2D2D2D]/30 border-t-[#2D2D2D]" />
                  <span>Zeiten werden geladen…</span>
                </div>
              )}

              {filteredSlots.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {filteredSlots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => handleSlotSelect(slot)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        selectedSlot?.start === slot.start
                          ? "border-[#1D1D1D] bg-[#1D1D1D] text-white"
                          : "border-[#D5D0C8] bg-[#ECE9E3] text-[#2D2D2D] hover:bg-[#E4E0DA]"
                      }`}
                    >
                      {new Date(slot.start).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))}
                </div>
              )}

              {slots.length === 0 && !loading && selectedDate && (
                <p className="mt-4 text-sm text-[#2D2D2D]/70">
                  Für dieses Datum sind keine freien Zeiten verfügbar.{" "}
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="underline underline-offset-2"
                  >
                    Zur Warteliste
                  </button>
                  .
                </p>
              )}

              {slots.length > 0 && filteredSlots.length === 0 && !loading && (
                <p className="mt-4 text-sm text-[#2D2D2D]/70">
                  Für diesen Tagesbereich gibt es aktuell keine freien Zeiten.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-[#DDD8D0] bg-[#E7E3DE] px-5 py-3 md:px-7">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="rounded-full border border-[#2D2D2D]/70 bg-transparent py-2.5 text-sm font-medium text-[#2D2D2D]"
              >
                Zurück
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                disabled={!selectedSlot}
                className="rounded-full border border-transparent bg-[#CEC9C2] py-2.5 text-sm font-medium text-[#58534D] transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                Weiter zur Buchung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Kontaktdaten */}
      {step === 3 && primarySelectedService && (
        <div className="overflow-hidden rounded-[26px] border border-[#D5D0C8] bg-[#F1EEE9] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 md:px-7 md:pb-5 md:pt-6">
            <div>
              <h2 className="text-h1 text-[#2D2D2D]">Fast geschafft!</h2>
              <p className="mt-1 text-sm text-[#2D2D2D]/85">
                Kontaktdaten prüfen und Buchung abschließen.
              </p>
            </div>
            <Link
              href="/buchung"
              prefetch={false}
              className="rounded-md p-1 text-[#2D2D2D]/70 transition hover:bg-black/5 hover:text-[#2D2D2D]"
              aria-label="Flow schließen"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          {!authLoading && !user && (
            <div className="px-5 pb-7 md:px-7">
              <div className="rounded-xl border border-[#CFC8BD] bg-[#ECE8E2] p-6 text-center">
                <h3 className="text-h3 text-[#2D2D2D]">Anmeldung erforderlich</h3>
                <p className="mt-2 text-[#2D2D2D]/85">
                  Du kannst nur mit einem bestätigten Konto einen Termin verbindlich buchen.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href={`/login?redirect=${encodeURIComponent(bookingRedirect)}`}
                    onClick={persistBookingState}
                    className="rounded-full bg-[#1F1A17] px-6 py-2.5 text-sm font-medium text-white"
                  >
                    Anmelden
                  </Link>
                  <Link
                    href={`/register?redirect=${encodeURIComponent(bookingRedirect)}`}
                    onClick={persistBookingState}
                    className="rounded-full border border-[#2D2D2D]/70 px-6 py-2.5 text-sm font-medium text-[#2D2D2D]"
                  >
                    Registrieren
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="mt-5 text-sm text-[#2D2D2D]/75 underline underline-offset-2"
                >
                  Zurück zur Terminauswahl
                </button>
              </div>
            </div>
          )}

          {user && (
            <div className="grid gap-8 px-5 pb-7 md:px-7 lg:grid-cols-[1fr_360px]">
              <div className="space-y-8">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#2D2D2D]/45">
                    Kontaktdaten
                  </p>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-[#2D2D2D]/85">Name</label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-[29px] text-[#2D2D2D] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#2D2D2D]/85">Nachname</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-[29px] text-[#2D2D2D] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#2D2D2D]/85">E-Mail</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-[29px] text-[#2D2D2D] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#2D2D2D]/85">Telefon</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-[29px] text-[#2D2D2D] outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-5">
                    <label className="text-sm text-[#2D2D2D]/85">Anmerkung (Optional)</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={3}
                      className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-sm text-[#2D2D2D] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#2D2D2D]/45">
                    Buchungsbedingungen
                  </p>
                  <p className="mt-4 text-[#2D2D2D]/90">
                    Wenn sich deine Pläne ändern, kannst du deinen Termin bis 24 Stunden vorher
                    kostenlos umbuchen oder stornieren.
                  </p>
                  <p className="mt-4 text-[#2D2D2D]/85">
                    Bitte gib uns möglichst früh Bescheid, damit wir den Termin neu vergeben können.
                    Bei kurzfristigen Absagen oder Nichterscheinen behalten wir uns vor, den Termin in
                    Rechnung zu stellen.
                  </p>
                </div>
              </div>

              <aside className="space-y-4">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#2D2D2D]/45">
                  Übersicht
                </p>
                <div className="overflow-hidden rounded-xl border border-[#DBD4CB] bg-[#F7F5F1]">
                  <div className="flex items-center justify-between border-b border-[#DDD7CE] px-4 py-3 text-sm text-[#2D2D2D]">
                    <span>Stylistin</span>
                    <span>{selectedStaff ? selectedStaff.firstName : "Beliebig"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#DDD7CE] px-4 py-3 text-sm text-[#2D2D2D]">
                    <span>Datum</span>
                    <span>{selectedDateLabelLong}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#DDD7CE] px-4 py-3 text-sm text-[#2D2D2D]">
                    <span>Uhrzeit</span>
                    <span>{selectedTimeLabel}</span>
                  </div>
                  {selectedServices.map((s) => (
                    <div key={s._id} className="flex items-center justify-between border-b border-[#DDD7CE] px-4 py-3 text-sm text-[#2D2D2D]">
                      <span>{baseServiceTitle(s.name)}</span>
                      <span>{s.priceEur} €</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 text-[#2D2D2D]">
                    <span className="text-sm">Vor Ort bezahlen</span>
                    <span className="text-[33px] leading-none">{totalPrice} €</span>
                  </div>
                </div>
                <p className="text-sm text-[#2D2D2D]/70">
                  Mit der Bestätigung deiner Buchung stimmst du unseren{" "}
                  <Link href="/datenschutz" className="underline underline-offset-2">
                    Buchungsbedingungen
                  </Link>{" "}
                  zu.
                </p>

                {selectedSlot ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full rounded-full bg-[#1F1A17] py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
                  >
                    {loading ? "Buchen…" : "Termin verbindlich buchen"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleWaitlist}
                    disabled={loading}
                    className="w-full rounded-full border border-[#2D2D2D]/70 bg-transparent py-3 text-sm font-medium text-[#2D2D2D] transition hover:bg-black/5 disabled:opacity-60"
                  >
                    {loading ? "Wird gesendet…" : "Zur Warteliste"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="w-full rounded-full border border-[#2D2D2D]/70 bg-transparent py-3 text-sm font-medium text-[#2D2D2D] transition hover:bg-black/5"
                >
                  Zurück
                </button>
              </aside>
            </div>
          )}
        </div>
      )}
      </section>
    </>
  );
}
