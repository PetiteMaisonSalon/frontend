"use client";

import { useState, useEffect, useRef } from "react";
import {
  getServices,
  getStaff,
  getAvailableSlots,
  createAppointment,
  addToWaitlist,
} from "@/lib/api";
import Link from "next/link";
import { useAuth } from "./AuthContext";

type Service = { _id: string; name: string; category: string; durationMinutes: number; priceEur: number };
type Staff = { _id: string; firstName: string; lastName: string; serviceIds: { _id: string }[] };

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
  { _id: "fallback-m1", firstName: "Mehtap", lastName: "Kücük", serviceIds: FALLBACK_SERVICES.map((s) => ({ _id: s._id })) },
  { _id: "fallback-s1", firstName: "Sevim", lastName: "Kaya", serviceIds: FALLBACK_SERVICES.filter((s) => s.category === "women").map((s) => ({ _id: s._id })) },
  { _id: "fallback-m2", firstName: "Maria", lastName: "Schmidt", serviceIds: FALLBACK_SERVICES.map((s) => ({ _id: s._id })) },
];

type Step = 1 | 2 | 3 | 4 | 5;

const BOOKING_STATE_KEY = "pm_booking_state";

export default function BuchungsFlow() {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [category, setCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successType, setSuccessType] = useState<"booked" | "waitlist">("booked");
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    note: "",
    privacy: false,
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
        if (s?.service && s?.slot) {
          setSelectedService(s.service);
          setSelectedStaff(s.staff ?? null);
          setSelectedSlot(s.slot);
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

  const filteredServices = category
    ? services.filter((s) => s.category === category)
    : [];

  const availableStaff = selectedService
    ? staff.filter((s) =>
        s.serviceIds?.some(
          (sv) => String((sv as { _id: string })._id) === String(selectedService._id)
        )
      )
    : [];

  const isFallbackData = selectedService?._id?.toString().startsWith("fallback-") ?? false;

  const toLocalDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = toLocalDateInput(new Date());
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: toLocalDateInput(d),
      label: d.toLocaleDateString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
    };
  });

  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Datum auswählen";

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

  const fetchSlots = async (date: string) => {
    if (!selectedService) return;
    setLoading(true);
    setError("");
    try {
      if (isFallbackData) {
        const demoSlots = generateDemoSlots(date, selectedService.durationMinutes);
        setSlots(demoSlots);
      } else {
        const data = await getAvailableSlots(
          date,
          selectedService._id,
          selectedStaff?._id
        );
        setSlots(data);
      }
    } catch (e) {
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
    setSelectedService(null);
    goToStep(1);
  };

  const handleServiceSelect = (s: Service) => {
    setSelectedService(s);
    setSelectedStaff(null);
    setSelectedSlot(null);
    setSlots([]);
    setSelectedDate("");
    goToStep(2);
  };

  const handleStaffSelect = (s: Staff | null) => {
    setSelectedStaff(s);
    setSelectedSlot(null);
    setSlots([]);
    // UX: direkt heutige Slots laden, wenn möglich
    if (s && selectedService) {
      setSelectedDate(todayDate);
      fetchSlots(todayDate);
    }
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlots([]);
    if (date) await fetchSlots(date);
  };

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedStaff || !selectedSlot || !form.privacy) return;
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
      await createAppointment({
        serviceId: selectedService._id,
        staffId: selectedStaff._id,
        startAt: selectedSlot.start,
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          note: form.note.trim() || undefined,
        },
      });
      goToStep(5);
    } catch (e: unknown) {
      setError((e as Error).message || "Buchung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async () => {
    setSuccessType("waitlist");
    if (!selectedService || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
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
        serviceId: selectedService._id,
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

  if (step === 5) {
    return (
      <section className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-[#4A5D4A]/30 bg-white p-8 text-center shadow-sm">
          <h2 className="font-display text-2xl font-medium text-[#2D2D2D]">
            {successType === "booked" ? "Termin gebucht" : "Warteliste"}
          </h2>
          <p className="mt-4 text-[#2D2D2D]/85">
            {successType === "booked"
              ? "Du erhältst in Kürze eine Bestätigung per E-Mail mit allen Details und einem Link zum Ändern oder Stornieren."
              : "Du wurdest zur Warteliste hinzugefügt. Wir melden uns, sobald ein passender Termin frei wird."}
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-[#4A5D4A] px-6 py-3 font-medium text-white transition hover:bg-[#3A4A3A]"
          >
            Zur Startseite
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      {/* Fortschritt */}
      <div className="mb-12 flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              step >= s ? "bg-[#4A5D4A]" : "bg-[#E8E4DF]"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">
          {error}
        </div>
      )}

      {/* Step 1: Kategorie & Service */}
      {step === 1 && (
        <div className="space-y-10">
          <div>
            <h2 className="font-display text-xl font-medium text-[#2D2D2D]">
              Kategorie
            </h2>
            <div className="mt-4 flex gap-4">
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
              <h2 className="font-display text-xl font-medium text-[#2D2D2D]">
                Leistung auswählen
              </h2>
              <div className="mt-4 space-y-2">
                {filteredServices.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handleServiceSelect(s)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#E8E4DF] bg-white p-4 text-left transition hover:border-[#4A5D4A] hover:bg-[#F5F2ED]"
                  >
                    <span>{s.name}</span>
                    <span className="text-[#4A5D4A]">
                      {s.priceEur} € · ca. {s.durationMinutes} min
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Mitarbeiter & Termin */}
      {step === 2 && selectedService && (
        <div className="space-y-10">
          <button
            onClick={() => goToStep(1)}
            className="text-[#4A5D4A] hover:underline"
          >
            ← Zurück
          </button>

          <div>
            <h2 className="font-display text-xl font-medium text-[#2D2D2D]">
              Mitarbeiter
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {availableStaff.map((s) => (
                <button
                  key={s._id}
                  onClick={() => handleStaffSelect(s)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    selectedStaff?._id === s._id
                      ? "bg-[#4A5D4A] text-white"
                      : "border border-[#E8E4DF] text-[#2D2D2D]"
                  }`}
                >
                  {s.firstName} {s.lastName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-[#2D2D2D]">
              Datum & Uhrzeit
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickDates.map((d) => (
                <button
                  key={d.value}
                  onClick={() => handleDateSelect(d.value)}
                  className={`rounded-full px-3 py-2 text-sm font-medium ${
                    selectedDate === d.value
                      ? "bg-[#4A5D4A] text-white"
                      : "border border-[#E8E4DF] bg-white text-[#2D2D2D]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              min={todayDate}
              value={selectedDate}
              onChange={(e) => handleDateSelect(e.target.value)}
              ref={dateInputRef}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => {
                if (!dateInputRef.current) return;
                if (typeof dateInputRef.current.showPicker === "function") {
                  dateInputRef.current.showPicker();
                } else {
                  dateInputRef.current.focus();
                  dateInputRef.current.click();
                }
              }}
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#E8E4DF] bg-white px-4 py-3 text-left text-[#2D2D2D]"
            >
              <span className={selectedDate ? "" : "text-[#2D2D2D]/60"}>{selectedDateLabel}</span>
              <span aria-hidden className="text-[#4A5D4A]">
                📅
              </span>
            </button>
            {loading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-[#2D2D2D]/70">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#4A5D4A]/30 border-t-[#4A5D4A]" />
                <span>Zeiten werden geladen…</span>
              </div>
            )}
            {slots.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => handleSlotSelect(slot)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      selectedSlot?.start === slot.start
                        ? "bg-[#4A5D4A] text-white"
                        : "border border-[#E8E4DF] text-[#2D2D2D]"
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
              <p className="mt-4 text-[#2D2D2D]/70">
                Für dieses Datum sind keine freien Zeiten verfügbar. Wähle ein anderes Datum
                oder{" "}
                <button
                  onClick={() => goToStep(3)}
                  className="text-[#4A5D4A] hover:underline"
                >
                  Warteliste
                </button>
                .
              </p>
            )}
          </div>

          {selectedSlot && (
            <button
              onClick={() => goToStep(3)}
              className="w-full rounded-full bg-[#4A5D4A] py-3 font-medium text-white transition hover:bg-[#3A4A3A]"
            >
              Weiter
            </button>
          )}
        </div>
      )}

      {/* Step 3: Kontaktdaten */}
      {step === 3 && selectedService && (
        <div className="space-y-8">
          {!authLoading && !user && (
            <div className="rounded-xl border-2 border-[#4A5D4A]/50 bg-[#F5F2ED] p-6 text-center">
              <h3 className="font-display text-xl font-medium text-[#2D2D2D]">
                Anmeldung erforderlich
              </h3>
              <p className="mt-2 text-[#2D2D2D]/85">
                Du kannst nur mit einem bestätigten Konto einen Termin buchen.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link
                  href={`/login?redirect=${encodeURIComponent("/buchung")}`}
                  onClick={() => {
                    sessionStorage.setItem(
                      BOOKING_STATE_KEY,
                      JSON.stringify({
                        service: selectedService,
                        staff: selectedStaff,
                        slot: selectedSlot,
                      })
                    );
                  }}
                  className="rounded-full bg-[#4A5D4A] px-6 py-3 font-medium text-white transition hover:bg-[#3A4A3A]"
                >
                  Anmelden
                </Link>
                <Link
                  href={`/register?redirect=${encodeURIComponent("/buchung")}`}
                  onClick={() => {
                    sessionStorage.setItem(
                      BOOKING_STATE_KEY,
                      JSON.stringify({
                        service: selectedService,
                        staff: selectedStaff,
                        slot: selectedSlot,
                      })
                    );
                  }}
                  className="rounded-full border-2 border-[#4A5D4A] px-6 py-3 font-medium text-[#4A5D4A] transition hover:bg-[#4A5D4A]/10"
                >
                  Registrieren
                </Link>
              </div>
              <button
                onClick={() => goToStep(2)}
                className="mt-4 block w-full text-[#2D2D2D]/70 hover:underline"
              >
                ← Zurück zur Terminauswahl
              </button>
            </div>
          )}

          {user && (
            <>
          <button
            onClick={() => goToStep(2)}
            className="text-[#4A5D4A] hover:underline"
          >
            ← Zurück
          </button>

          {/* Übersicht */}
          {selectedSlot && (
            <div className="rounded-xl border border-[#E8E4DF] bg-white p-6">
              <h3 className="font-display text-lg font-medium text-[#2D2D2D]">
                Übersicht
              </h3>
              <ul className="mt-3 space-y-1 text-[#2D2D2D]/85">
                <li>{selectedService.name}</li>
                <li>
                  {selectedStaff
                    ? `${selectedStaff.firstName}`
                    : "Freier Mitarbeiter"}
                </li>
                <li>
                  {new Date(selectedSlot.start).toLocaleDateString("de-DE", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </li>
                <li>{selectedService.durationMinutes} min</li>
                <li>{selectedService.priceEur} €</li>
              </ul>
              <p className="mt-3 text-sm text-[#2D2D2D]/70">
                Stornierung bis 24h vorher möglich.
              </p>
            </div>
          )}

          <div>
            <h2 className="font-display text-xl font-medium text-[#2D2D2D]">
              Kontaktdaten
            </h2>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D]">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D]">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D]">
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D]">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D]">
                  Notiz
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                />
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={form.privacy}
                  onChange={(e) => setForm({ ...form, privacy: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-[#E8E4DF]"
                />
                <label htmlFor="privacy" className="text-sm text-[#2D2D2D]/85">
                  Ich habe die{" "}
                  <Link href="/datenschutz" className="text-[#4A5D4A] hover:underline">
                    Datenschutzerklärung
                  </Link>{" "}
                  gelesen und akzeptiere die Verarbeitung meiner Daten. *
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {selectedSlot ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !form.privacy}
                className="w-full rounded-full bg-[#4A5D4A] py-3 font-medium text-white transition hover:bg-[#3A4A3A] disabled:opacity-50"
              >
                {loading ? "Buchen…" : "Termin verbindlich buchen"}
              </button>
            ) : (
              <button
                onClick={handleWaitlist}
                disabled={loading}
                className="w-full rounded-full border-2 border-[#4A5D4A] py-3 font-medium text-[#4A5D4A] transition hover:bg-[#4A5D4A]/10 disabled:opacity-50"
              >
                {loading ? "Wird gesendet…" : "Auf Warteliste"}
              </button>
            )}
          </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
