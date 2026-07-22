"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import Image from "next/image";
import { useAuth } from "./AuthContext";

type Service = { _id: string; name: string; category: string; durationMinutes: number; priceEur: number };
type Staff = { _id: string; firstName: string; lastName: string; serviceIds: { _id: string }[] };

/** Pfade exakt wie Ordner unter public/ (Linux/Produktion unterscheidet Groß-/Kleinschreibung) */
const STAFF_SERVICE_IMAGE_BY_FIRST_NAME: Record<string, string> = {
  mehtap: "/mitarbeiter/mehtap_service.jpg",
  maria: "/mitarbeiter/maria_service.jpg",
  sevim: "/mitarbeiter/sevim_service.jpg",
  masoud: "/mitarbeiter/masoud_service.jpg",
  sarah: "/mitarbeiter/Sarah_service.jpg",
  kanj: "/mitarbeiter/kanj_service.jpg",
};

function staffServiceImageSrc(staff: Pick<Staff, "firstName">): string | null {
  const key = staff.firstName.trim().toLowerCase();
  return STAFF_SERVICE_IMAGE_BY_FIRST_NAME[key] ?? null;
}
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

type Step = 2 | 3 | 5;

const BOOKING_STATE_KEY = "pm_booking_state";

function baseServiceTitle(name: string) {
  return name.replace(/\s*\([^)]+\)\s*$/, "").trim();
}

/** Kurze Buchungsnr. wie „PM-65810“ aus der Mongo-ObjectId */
function bookingRefFromMongoId(id: string): string {
  let n = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) {
    n = (Math.imul(31, n) + s.charCodeAt(i)) >>> 0;
  }
  return `PM-${String(n % 100000).padStart(5, "0")}`;
}

function toLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= items.length) return;
      results[i] = await mapper(items[i], i);
    }
  }

  const n = Math.max(1, Math.min(concurrency, items.length || 1));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

function generateDemoSlotsForDate(date: string, durationMin: number) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayNum = dayStart.getDay();
  const hours =
    dayNum === 0 ? null : dayNum === 6 ? { startMin: 9 * 60, endMin: 14 * 60 } : { startMin: 9 * 60, endMin: 20 * 60 };
  if (!hours) return [];
  const demo: { start: string; end: string }[] = [];
  for (let m = hours.startMin; m + durationMin <= hours.endMin; m += 15) {
    const start = new Date(dayStart);
    start.setHours(Math.floor(m / 60), m % 60, 0, 0);
    const end = new Date(start.getTime() + durationMin * 60 * 1000);
    demo.push({ start: start.toISOString(), end: end.toISOString() });
  }
  return demo;
}

export default function BuchungsFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [rescheduleToken, setRescheduleToken] = useState(searchParams.get("rescheduleToken") || "");
  const preselectedServiceIdsParam = searchParams.get("serviceIds") || "";
  const preselectedServiceName = searchParams.get("service") || "";
  const hasBookingQuery =
    searchParams.has("booking") || searchParams.has("rescheduleToken");
  const [preselectApplied, setPreselectApplied] = useState(false);
  const [step, setStep] = useState<Step>(2);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
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
  /** YYYY-MM-DD → ob an diesem Tag mindestens ein Slot existiert (wie Slotliste / Backend) */
  const [monthDayHasSlots, setMonthDayHasSlots] = useState<Record<string, boolean>>({});
  const [monthMarkersLoading, setMonthMarkersLoading] = useState(false);
  const monthPrefetchGen = useRef(0);
  const [confirmedBookingRef, setConfirmedBookingRef] = useState<string | null>(null);

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
    if (step !== 2 || selectedServices.length > 0) return;
    if (preselectedServiceIdsParam || preselectedServiceName) return;
    if (!hasBookingQuery) return;
    router.replace("/leistungen");
  }, [
    hasBookingQuery,
    preselectedServiceIdsParam,
    preselectedServiceName,
    router,
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
    setSelectedServices(matchedServices);
    setSelectedStaff(null);
    setSelectedSlot(null);
    setSelectedDate("");
    setSlots([]);
    setPreselectApplied(true);
    goToStep(2);
  }, [preselectedServiceIdsParam, preselectedServiceName, preselectApplied, services]);

  const selectedServiceIds = useMemo(
    () => selectedServices.map((s) => s._id),
    [selectedServices]
  );

  const handleBackToLeistungen = () => {
    const qs =
      selectedServiceIds.length > 0
        ? `?serviceIds=${encodeURIComponent(selectedServiceIds.join(","))}`
        : "";
    router.push(`/leistungen${qs}`);
  };

  const leistungenHref =
    selectedServiceIds.length > 0
      ? `/leistungen?serviceIds=${encodeURIComponent(selectedServiceIds.join(","))}`
      : "/leistungen";

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

  const todayDate = useMemo(() => toLocalDateInput(new Date()), []);
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

  useEffect(() => {
    if (step !== 2 || selectedServiceIds.length === 0) {
      setMonthDayHasSlots({});
      setMonthMarkersLoading(false);
      return;
    }

    const gen = monthPrefetchGen.current + 1;
    monthPrefetchGen.current = gen;

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dateStrings: string[] = [];
    for (let d = 1; d <= daysInMonth; d += 1) {
      dateStrings.push(toLocalDateInput(new Date(year, month, d)));
    }

    let cancelled = false;

    const run = async () => {
      setMonthMarkersLoading(true);

      const nextRecord: Record<string, boolean> = {};

      if (isFallbackData) {
        for (const value of dateStrings) {
          if (value < todayDate) {
            nextRecord[value] = false;
            continue;
          }
          const demo = generateDemoSlotsForDate(value, totalDuration);
          nextRecord[value] = demo.length > 0;
        }
      } else {
        const staffId = selectedStaff?._id;
        await mapWithConcurrency(dateStrings, 8, async (value) => {
          if (value < todayDate) return { value, hasSlots: false };
          try {
            const data = await getAvailableSlots(value, selectedServiceIds, staffId);
            return { value, hasSlots: Array.isArray(data) && data.length > 0 };
          } catch {
            return { value, hasSlots: false };
          }
        }).then((rows) => {
          for (const row of rows) {
            nextRecord[row.value] = row.hasSlots;
          }
        });
      }

      if (!cancelled && monthPrefetchGen.current === gen) {
        setMonthDayHasSlots(nextRecord);
        setMonthMarkersLoading(false);
      } else if (!cancelled && monthPrefetchGen.current !== gen) {
        setMonthMarkersLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [step, calendarMonth, selectedServiceIds, selectedStaff?._id, isFallbackData, totalDuration, todayDate]);

  const fetchSlots = async (date: string, staffOverride?: Staff | null) => {
    if (selectedServiceIds.length === 0) return;
    setLoading(true);
    setError("");
    try {
      if (isFallbackData) {
        const demoSlots = generateDemoSlotsForDate(date, totalDuration);
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
      let created: { appointment?: { id?: string } } | undefined;
      if (rescheduleToken) {
        created = await rescheduleAppointment(rescheduleToken, payload);
      } else {
        created = await createAppointment(payload);
      }
      const aptId = created?.appointment?.id;
      setConfirmedBookingRef(aptId ? bookingRefFromMongoId(String(aptId)) : null);
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
      setConfirmedBookingRef(null);
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
    const customerDisplayName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const timeRangeLabel =
      start && end
        ? `${start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString(
            "de-DE",
            { hour: "2-digit", minute: "2-digit" }
          )} Uhr`
        : null;
    const dateSerifLine =
      start &&
      `${start.toLocaleDateString("de-DE", { weekday: "short" })} ${start.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
      })}`;
    const headlineSerif = dateSerifLine || (!isBooked ? "Warteliste bestätigt" : "");
    const formatGoogleDate = (value: Date) =>
      value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const googleCalendarHref =
      isBooked && start && end
        ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            "Termin bei Petite Maison"
          )}&dates=${formatGoogleDate(start)}/${formatGoogleDate(end)}&details=${encodeURIComponent(
            selectedServices.map((s) => s.name).join(" + ")
          )}&location=${encodeURIComponent("Petite Maison, Arndtstr. 33, 22085 Hamburg")}`
        : null;

    return (
      <section className="min-h-screen px-4 py-10 sm:px-6 sm:py-14">
        <div className="relative mx-auto max-w-lg">
          <Link
            href={leistungenHref}
            prefetch={false}
            className="absolute right-0 top-0 z-10 rounded-md p-1.5 text-white/75 transition hover:bg-white/10 hover:text-white md:-right-1 md:-top-1"
            aria-label="Schließen"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
            </svg>
          </Link>

          <div className="relative overflow-hidden rounded-[28px] bg-[#F2F0EB] px-6 pb-8 pt-12 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:px-10 sm:pb-10 sm:pt-14">
            <div className="mx-auto mb-6 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#D8F3E6]">
              <svg className="h-7 w-7 text-[#2E8C58]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 13l4 4 8-10"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {isBooked && timeRangeLabel && (
              <p className="text-center text-[15px] font-medium tracking-tight text-[#1C1612]/90">{timeRangeLabel}</p>
            )}

            {headlineSerif ? (
              <p className="font-display mt-1 text-center text-[2.125rem] leading-[1.1] tracking-[-0.02em] text-[#1C1612] sm:text-[2.5rem]">
                {headlineSerif}
              </p>
            ) : null}

            <p className="mx-auto mt-5 max-w-sm text-center text-[15px] leading-relaxed text-[#1C1612]/85">
              {isBooked
                ? "Termin bestätigt! Du erhältst gleich eine Bestätigung per E-Mail. Wir freuen uns auf dich!"
                : "Du stehst auf unserer Warteliste. Sobald ein Termin frei wird, melden wir uns per E-Mail."}
            </p>

            {isBooked && googleCalendarHref && (
              <div className="mt-6 flex justify-center">
                <a
                  href={googleCalendarHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#1C1612]/25 bg-transparent px-5 py-2.5 text-sm font-medium text-[#1C1612] transition hover:border-[#1C1612]/45 hover:bg-black/[0.03]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
                    <path d="M8 3v4M16 3v4M4 11h16" strokeLinecap="round" />
                  </svg>
                  Zum Kalender hinzufügen
                </a>
              </div>
            )}

            <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              {confirmedBookingRef && (
                <div className="mb-4 flex justify-end">
                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#1C1612]/45">
                      Buchungsnummer
                    </p>
                    <p className="text-sm font-semibold tracking-wide text-[#1C1612]">{confirmedBookingRef}</p>
                  </div>
                </div>
              )}

              <div className="divide-y divide-[#E8E8E6]">
                <div className="flex items-start justify-between gap-6 py-3 first:pt-0">
                  <span className="shrink-0 pt-0.5 text-[13px] text-[#1C1612]/55">Name</span>
                  <span className="text-right text-[15px] font-medium text-[#1C1612]">
                    {customerDisplayName || "—"}
                  </span>
                </div>

                <div className="flex gap-6 py-3">
                  <span className="shrink-0 pt-0.5 text-[13px] text-[#1C1612]/55">Leistungen</span>
                  <div className="min-w-0 flex-1 space-y-1.5 text-right text-[15px] leading-snug text-[#1C1612]">
                    {selectedServices.map((s) => (
                      <p key={s._id}>
                        {baseServiceTitle(s.name)} · {s.priceEur}€
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-6 py-3">
                  <span className="shrink-0 pt-0.5 text-[13px] text-[#1C1612]/55">Stylistin</span>
                  <span className="text-right text-[15px] font-medium text-[#1C1612]">
                    {selectedStaff?.firstName ?? "—"}
                  </span>
                </div>

                {isBooked ? (
                  <div className="flex items-end justify-between gap-4 border-t border-[#1C1612]/12 pt-5">
                    <span className="text-[15px] font-medium text-[#1C1612]">Vor Ort bezahlen</span>
                    <span className="font-display text-[2rem] leading-none tracking-tight text-[#1C1612]">
                      {totalPrice} €
                    </span>
                  </div>
                ) : (
                  <p className="border-t border-[#1C1612]/12 pt-5 text-center text-[13px] text-[#1C1612]/55">
                    Sobald wir dir einen Termin anbieten können, gilt der reguläre Preis – keine Zahlung über die Warteliste.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border-2 border-[#1F1A17] bg-transparent px-6 py-3.5 text-center text-sm font-medium text-[#1F1A17] transition hover:bg-black/[0.04]"
              >
                Zum Salon
              </Link>
              <Link
                href="/konto?tab=bookings"
                className="inline-flex items-center justify-center rounded-full bg-[#1F1A17] px-6 py-3.5 text-center text-sm font-medium text-white transition hover:bg-black"
              >
                Zu meinen Terminen
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className={`mx-auto px-4 py-10 sm:px-6 sm:py-12 ${
          step === 2 || step === 3 ? "max-w-6xl" : "max-w-2xl"
        }`}
      >
     
      {error && (
        <div className="mb-6 rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">
          {error}
        </div>
      )}

      {/* Step 2: Mitarbeiter & Termin */}
      {step === 2 && primarySelectedService && (
        <div className="overflow-hidden rounded-[26px] border border-[#D5D0C8] bg-[#F1EEE9] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 md:px-7 md:pb-6 md:pt-6">
            <div>
              <h2 className="text-h1 text-[#1C1612]">Termin & Stylist</h2>
              <p className="mt-1 text-sm text-[#1C1612]/85">
                Wähle deine Stylistin und einen freien Termin.
              </p>
            </div>
            <Link
              href={leistungenHref}
              prefetch={false}
              className="rounded-md p-1 text-[#1C1612]/70 transition hover:bg-black/5 hover:text-[#1C1612]"
              aria-label="Flow schließen"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round"/>
              </svg>
            </Link>
          </div>

          <div className="grid gap-8 px-5 pb-6 md:px-7 lg:grid-cols-[1fr_1.08fr]">
            <div className="space-y-8">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#1C1612]/50">
                  {selectedServices.length} Leistungen ausgewählt
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedServices.map((service) => (
                    <button
                      key={service._id}
                      type="button"
                      onClick={() => handleServiceToggle(service)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#1C1612]/45 bg-[#F5F2ED] px-3 py-1.5 text-sm text-[#1C1612]"
                    >
                      <span>
                        {baseServiceTitle(service.name)} · {service.priceEur}€
                      </span>
                      <span aria-hidden className="text-[#1C1612]/70">×</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#1C1612]/50">
                  Mitarbeiter auswählen
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  {availableStaff.map((s) => {
                    const initials = `${s.firstName?.[0] || ""}${s.lastName?.[0] || ""}`.toUpperCase();
                    const portraitSrc = staffServiceImageSrc(s);
                    return (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => handleStaffSelect(s)}
                        className="flex w-[72px] flex-col items-center gap-2 text-center"
                      >
                        <span
                          className={`relative grid h-11 w-11 place-items-center overflow-hidden rounded-full border text-xs font-medium ${
                            selectedStaff?._id === s._id
                              ? "border-[#1F1A17] border-3 text-white shadow-lg"
                              : "border-[#1C1612]/35 bg-[#EBC8B7] text-[#1C1612]"
                          }`}
                        >
                          {portraitSrc ? (
                            <Image
                              src={portraitSrc}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : (
                            <span className="relative z-10">{initials || "PM"}</span>
                          )}
                        </span>
                        <span className="text-xs text-[#1C1612]">{s.firstName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#1C1612]/50">
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
                  <p className="text-xl text-[#1C1612] capitalize">{monthLabel}</p>
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

                <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-[#1C1612]/75">
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
                    const showAvailabilityDot =
                      !isPast && selectedServiceIds.length > 0 && !monthMarkersLoading;
                    const hasSlotsForDay = monthDayHasSlots[value];
                    const markerClass =
                      hasSlotsForDay === true ? "bg-[#2E8C58]" : "bg-[#CF4D4D]";
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
                                : "text-[#1C1612] hover:bg-black/5"
                          }`}
                        >
                          {day}
                        </button>
                        {showAvailabilityDot && (
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
                      : "border-[#7D7D7D] bg-transparent text-[#1C1612]"
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
                      : "border-[#7D7D7D] bg-transparent text-[#1C1612]"
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
                      : "border-[#7D7D7D] bg-transparent text-[#1C1612]"
                  }`}
                >
                  Nachmittags
                </button>
              </div>

              {loading && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#1C1612]/70">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1C1612]/30 border-t-[#1C1612]" />
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
                          : "border-[#D5D0C8] bg-[#ECE9E3] text-[#1C1612] hover:bg-[#E4E0DA]"
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
                <p className="mt-4 text-sm text-[#1C1612]/70">
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
                <p className="mt-4 text-sm text-[#1C1612]/70">
                  Für diesen Tagesbereich gibt es aktuell keine freien Zeiten.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-[#DDD8D0] bg-[#E7E3DE] px-5 py-3 md:px-7">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={handleBackToLeistungen}
                className="rounded-full border border-[#1C1612]/70 bg-transparent py-2.5 text-sm font-medium text-[#1C1612]"
              >
                Zurück
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                disabled={!selectedSlot}
                className="rounded-full border border-transparent bg-[#220D01] py-2.5 text-sm font-medium text-[#FFFFFF] transition disabled:cursor-not-allowed disabled:opacity-20"
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
              <h2 className="text-h1 text-[#1C1612]">Fast geschafft!</h2>
              <p className="mt-1 text-sm text-[#1C1612]/85">
                Kontaktdaten prüfen und Buchung abschließen.
              </p>
            </div>
            <Link
              href={leistungenHref}
              prefetch={false}
              className="rounded-md p-1 text-[#1C1612]/70 transition hover:bg-black/5 hover:text-[#1C1612]"
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
                <h3 className="text-h3 text-[#1C1612]">Anmeldung erforderlich</h3>
                <p className="mt-2 text-[#1C1612]/85">
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
                    className="rounded-full border border-[#1C1612]/70 px-6 py-2.5 text-sm font-medium text-[#1C1612]"
                  >
                    Registrieren
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="mt-5 text-sm text-[#1C1612]/75 underline underline-offset-2"
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
                  <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#1C1612]/45">
                    Kontaktdaten
                  </p>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-[#1C1612]/85">Name</label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-[29px] text-[#1C1612] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#1C1612]/85">Nachname</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-[29px] text-[#1C1612] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#1C1612]/85">E-Mail</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-[29px] text-[#1C1612] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#1C1612]/85">Telefon</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-[29px] text-[#1C1612] outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-5">
                    <label className="text-sm text-[#1C1612]/85">Anmerkung (Optional)</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={3}
                      className="mt-2 w-full border-b border-[#7D7870] bg-transparent pb-1.5 text-sm text-[#1C1612] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#1C1612]/45">
                    Buchungsbedingungen
                  </p>
                  <p className="mt-4 text-[#1C1612]/90">
                    Wenn sich deine Pläne ändern, kannst du deinen Termin bis 24 Stunden vorher
                    kostenlos umbuchen oder stornieren.
                  </p>
                  <p className="mt-4 text-[#1C1612]/85">
                    Bitte gib uns möglichst früh Bescheid, damit wir den Termin neu vergeben können.
                    Bei kurzfristigen Absagen oder Nichterscheinen behalten wir uns vor, den Termin in
                    Rechnung zu stellen.
                  </p>
                </div>
              </div>

              <aside className="space-y-4">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#1C1612]/45">
                  Übersicht
                </p>
                <div className="overflow-hidden rounded-xl border border-[#DBD4CB] bg-[#F7F5F1]">
                  <div className="flex items-center justify-between border-b border-[#DDD7CE] px-4 py-3 text-sm text-[#1C1612]">
                    <span>Stylistin</span>
                    <span>{selectedStaff ? selectedStaff.firstName : "Beliebig"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#DDD7CE] px-4 py-3 text-sm text-[#1C1612]">
                    <span>Datum</span>
                    <span>{selectedDateLabelLong}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#DDD7CE] px-4 py-3 text-sm text-[#1C1612]">
                    <span>Uhrzeit</span>
                    <span>{selectedTimeLabel}</span>
                  </div>
                  {selectedServices.map((s) => (
                    <div key={s._id} className="flex items-center justify-between border-b border-[#DDD7CE] px-4 py-3 text-sm text-[#1C1612]">
                      <span>{baseServiceTitle(s.name)}</span>
                      <span>{s.priceEur} €</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 text-[#1C1612]">
                    <span className="text-sm">Vor Ort bezahlen</span>
                    <span className="text-[33px] leading-none">{totalPrice} €</span>
                  </div>
                </div>
                <p className="text-sm text-[#1C1612]/70">
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
                    className="w-full rounded-full border border-[#1C1612]/70 bg-transparent py-3 text-sm font-medium text-[#1C1612] transition hover:bg-black/5 disabled:opacity-60"
                  >
                    {loading ? "Wird gesendet…" : "Zur Warteliste"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="w-full rounded-full border border-[#1C1612]/70 bg-transparent py-3 text-sm font-medium text-[#1C1612] transition hover:bg-black/5"
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
