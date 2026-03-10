"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cancelAppointment, getMyAppointments } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";

type MyAppointment = {
  _id: string;
  startAt: string;
  status: string;
  cancelToken?: string;
  serviceId?: { name?: string };
  serviceIds?: { _id: string; name: string }[];
  staffId?: { firstName?: string; lastName?: string };
};

export default function MyAppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<MyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyAppointments({ includePast: true, includeCancelled: true });
      setItems(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError((e as Error).message || "Termine konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    reload();
  }, [user]);

  const upcoming = useMemo(
    () => items.filter((a) => new Date(a.startAt) >= new Date() && a.status !== "cancelled"),
    [items]
  );
  const history = useMemo(
    () => items.filter((a) => new Date(a.startAt) < new Date() || a.status === "cancelled"),
    [items]
  );

  const cancelOne = async (a: MyAppointment) => {
    if (!a.cancelToken) return;
    setBusyId(a._id);
    setError("");
    try {
      await cancelAppointment(a.cancelToken);
      await reload();
    } catch (e: unknown) {
      setError((e as Error).message || "Stornierung fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return <main className="mx-auto max-w-3xl px-6 py-14 text-[#2D2D2D]/70">Lade Konto…</main>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-display text-3xl text-[#2D2D2D]">Meine Termine</h1>
        <p className="mt-3 text-[#2D2D2D]/80">Bitte melde dich an, um deine Termine zu sehen.</p>
        <Link
          href="/login?redirect=%2Fkonto%2Ftermine"
          className="mt-6 inline-block rounded-full bg-[#4A5D4A] px-6 py-3 font-medium text-white"
        >
          Zur Anmeldung
        </Link>
      </main>
    );
  }

  const renderItem = (a: MyAppointment, allowCancel: boolean) => {
    const services =
      a.serviceIds && a.serviceIds.length > 0
        ? a.serviceIds.map((s) => s.name).join(" + ")
        : a.serviceId?.name || "Leistung";
    const dt = new Date(a.startAt);
    return (
      <div
        key={a._id}
        className={`rounded-xl border p-4 ${
          a.status === "cancelled"
            ? "border-[#D4A5A5]/60 bg-[#D4A5A5]/18"
            : "border-[#E8E4DF] bg-white"
        }`}
      >
        <p className="font-medium text-[#2D2D2D]">
          {dt.toLocaleString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="mt-1 text-sm text-[#2D2D2D]/80">
          {services} • {a.staffId?.firstName || "Team"}
        </p>
        <p className="mt-1 text-sm text-[#2D2D2D]/70">Status: {a.status}</p>
        {allowCancel && a.cancelToken && (
          <button
            type="button"
            disabled={busyId === a._id}
            onClick={() => cancelOne(a)}
            className="mt-3 rounded-full border border-[#D4A5A5] px-4 py-2 text-sm text-[#5C4033] hover:bg-[#D4A5A5]/20 disabled:opacity-50"
          >
            {busyId === a._id ? "Storniere…" : "Termin stornieren"}
          </button>
        )}
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-[#2D2D2D]">Meine Termine</h1>
        <Link href="/buchung" className="rounded-full bg-[#4A5D4A] px-5 py-2 text-sm font-medium text-white">
          Neuer Termin
        </Link>
      </div>
      {error && <div className="mt-4 rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">{error}</div>}
      {loading ? (
        <p className="mt-6 text-[#2D2D2D]/70">Termine werden geladen…</p>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-medium text-[#2D2D2D]">Aktuell & kommend</h2>
            <div className="mt-3 space-y-3">
              {upcoming.length > 0 ? upcoming.map((a) => renderItem(a, true)) : (
                <p className="rounded-xl border border-[#E8E4DF] bg-white p-4 text-[#2D2D2D]/70">Keine kommenden Termine.</p>
              )}
            </div>
          </section>
          <section className="mt-10">
            <h2 className="text-lg font-medium text-[#2D2D2D]">Vergangene & stornierte</h2>
            <div className="mt-3 space-y-3">
              {history.length > 0 ? history.map((a) => renderItem(a, false)) : (
                <p className="rounded-xl border border-[#E8E4DF] bg-white p-4 text-[#2D2D2D]/70">Keine Historie vorhanden.</p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
