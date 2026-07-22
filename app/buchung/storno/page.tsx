"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAppointmentByToken, cancelAppointment } from "@/lib/api";

function StornoContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [appointment, setAppointment] = useState<{
    startAt: string;
    serviceId: { name: string };
    staffId: { firstName: string; lastName: string };
    durationMinutes: number;
    priceEur: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Kein gültiger Link.");
      return;
    }
    getAppointmentByToken(token)
      .then(setAppointment)
      .catch(() => setError("Termin nicht gefunden."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await cancelAppointment(token);
      setCancelled(true);
    } catch (e: unknown) {
      setError((e as Error).message || "Stornierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#EBEAE7]">
        <p className="text-[#1C1612]/70">Laden…</p>
      </main>
    );
  }

  if (error && !appointment) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-[#E8E4DF] bg-white p-8 text-center">
          <h1 className="text-h2 text-[#1C1612]">
            {error}
          </h1>
          <Link
            href="/buchung"
            className="mt-6 inline-block text-[#4A5D4A] hover:underline"
          >
            Neuen Termin buchen
          </Link>
        </div>
      </main>
    );
  }

  if (cancelled) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-[#4A5D4A]/30 bg-white p-8 text-center shadow-sm">
          <h1 className="text-h2 text-[#1C1612]">
            Termin storniert
          </h1>
          <p className="mt-4 text-[#1C1612]/85">
            Dein Termin wurde erfolgreich storniert.
          </p>
          <Link
            href="/buchung"
            className="mt-8 inline-block rounded-full bg-[#4A5D4A] px-6 py-3 font-medium text-white transition hover:bg-[#3A4A3A]"
          >
            Neuen Termin buchen
          </Link>
        </div>
      </main>
    );
  }

  if (!appointment) return null;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-2xl border border-[#E8E4DF] bg-white p-8">
        <h1 className="text-h2 text-[#1C1612]">
          Termin ändern oder stornieren
        </h1>
        <div className="mt-6 space-y-1 text-[#1C1612]/85">
          <p>{appointment.serviceId?.name}</p>
          <p>
            {appointment.staffId?.firstName} {appointment.staffId?.lastName}
          </p>
          <p>
            {new Date(appointment.startAt).toLocaleString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p>{appointment.durationMinutes} min · {appointment.priceEur} €</p>
        </div>
        {error && (
          <p className="mt-4 text-[#5C4033]">{error}</p>
        )}
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="rounded-full border-2 border-[#D4A5A5] px-6 py-3 font-medium text-[#5C4033] transition hover:bg-[#D4A5A5]/20 disabled:opacity-50"
          >
            {loading ? "Wird storniert…" : "Termin stornieren"}
          </button>
          <Link
            href={`/buchung?rescheduleToken=${token}`}
            className="rounded-full bg-[#4A5D4A] px-6 py-3 font-medium text-white transition hover:bg-[#3A4A3A]"
          >
            Termin ändern
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function StornoPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#EBEAE7]">
        <p className="text-[#1C1612]/70">Laden…</p>
      </main>
    }>
      <StornoContent />
    </Suspense>
  );
}
