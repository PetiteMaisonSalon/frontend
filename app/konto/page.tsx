"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import {
  cancelAppointment,
  deleteMyProfile,
  deleteMyWaitlistEntry,
  getMyAppointments,
  getMyWaitlistEntries,
  updateMyPassword,
  updateMyProfile,
} from "@/lib/api";
import { googleReviewWriteUrl } from "@/lib/googleReview";

type AppointmentService = {
  _id: string;
  name: string;
  durationMinutes?: number;
  priceEur?: number;
};

type MyAppointment = {
  _id: string;
  startAt: string;
  endAt?: string;
  durationMinutes?: number;
  status: string;
  cancelToken?: string;
  serviceId?: AppointmentService;
  serviceIds?: AppointmentService[];
  staffId?: { firstName?: string; lastName?: string };
};

type MyWaitlistEntry = {
  _id: string;
  createdAt: string;
  preferredDates?: string[];
  serviceId?: AppointmentService;
  staffId?: { firstName?: string; lastName?: string };
};

type AccountTab = "bookings" | "profile";
type EditableField = "firstName" | "lastName" | "email" | "phone" | "password" | null;

function formatDateShort(value: string) {
  return new Date(value).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/** z. B. „Do., 26. April“ (Screenshot Kartenkopf) */
function formatDateCardTitle(iso: string) {
  const d = new Date(iso);
  const wd = d.toLocaleDateString("de-DE", { weekday: "short" });
  const dayMonth = d.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  return `${wd}. ${dayMonth}`;
}

/** z. B. „Donnerstag | 9:00 – 11:00 (120 min)“ */
function formatWeekdayTimeBar(startAt: string, endAt?: string, durationMinutes?: number) {
  const start = new Date(startAt);
  const end = endAt
    ? new Date(endAt)
    : new Date(start.getTime() + Math.max(durationMinutes || 0, 0) * 60000);
  const weekday = start.toLocaleDateString("de-DE", { weekday: "long" });
  const t1 = start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const t2 = end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const dur = durationMinutes ?? 0;
  return `${weekday} | ${t1} – ${t2} (${dur} min)`;
}

/** Badge „In 2 Tagen“ / „Heute“ / … */
function relativeDaysUntilLabel(startAt: string): string | null {
  const start = new Date(startAt);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(start);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (days < 0) return null;
  if (days === 0) return "Heute";
  if (days === 1) return "Morgen";
  return `In ${days} Tagen`;
}

function statusStyle(status: string) {
  if (status === "cancelled") return "bg-[#F5E4E8] text-[#B84A56]";
  if (status === "completed" || status === "attended") return "bg-[#E8E4DF] text-[#7A6C5B]";
  return "bg-[#4A5D4A]/15 text-[#4A5D4A]";
}

function statusLabel(status: string) {
  if (status === "cancelled") return "Storniert";
  if (status === "completed" || status === "attended") return "Vergangen";
  if (status === "confirmed") return "Bestätigt";
  return "Anstehend";
}

function getAppointmentServiceLabel(a: MyAppointment) {
  if (a.serviceIds && a.serviceIds.length > 0) return a.serviceIds.map((s) => s.name).join(" + ");
  return a.serviceId?.name || "Leistung";
}

function getAppointmentServiceIds(a: MyAppointment) {
  if (a.serviceIds && a.serviceIds.length > 0) return a.serviceIds.map((s) => s._id).filter(Boolean);
  if (a.serviceId?._id) return [a.serviceId._id];
  return [];
}

function AccountPageContent() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab: AccountTab = searchParams.get("tab") === "profile" ? "profile" : "bookings";

  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<MyWaitlistEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(null);
  const [busyWaitlistId, setBusyWaitlistId] = useState<string | null>(null);

  const [editingField, setEditingField] = useState<EditableField>(null);
  const [savingField, setSavingField] = useState<EditableField>(null);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [showDeleteProfileDialog, setShowDeleteProfileDialog] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const reloadBookings = async () => {
    if (!user) return;
    setLoadingData(true);
    setError("");
    const [appointmentsRes, waitlistRes] = await Promise.allSettled([
      getMyAppointments({ includePast: true, includeCancelled: true }),
      getMyWaitlistEntries(),
    ]);
    let nextError = "";

    if (appointmentsRes.status === "fulfilled") {
      setAppointments(Array.isArray(appointmentsRes.value) ? appointmentsRes.value : []);
    } else {
      nextError = appointmentsRes.reason?.message || "Termine konnten nicht geladen werden.";
    }

    if (waitlistRes.status === "fulfilled") {
      setWaitlistEntries(Array.isArray(waitlistRes.value) ? waitlistRes.value : []);
    } else if (!nextError) {
      nextError = waitlistRes.reason?.message || "Warteliste konnte nicht geladen werden.";
    }

    setError(nextError);
    setLoadingData(false);
  };

  useEffect(() => {
    if (!user) return;
    setProfileDraft({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab !== "bookings") return;
    reloadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return [...appointments]
      .filter((a) => new Date(a.startAt) >= now && a.status !== "cancelled")
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  }, [appointments]);

  const pastAppointments = useMemo(() => {
    const now = new Date();
    return [...appointments]
      .filter((a) => new Date(a.startAt) < now || a.status === "cancelled")
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [appointments]);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "PM";

  const switchTab = (tab: AccountTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "bookings") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const handleCancelAppointment = async (appointment: MyAppointment) => {
    if (!appointment.cancelToken) return;
    setBusyAppointmentId(appointment._id);
    setError("");
    try {
      await cancelAppointment(appointment.cancelToken);
      await reloadBookings();
    } catch (e: unknown) {
      setError((e as Error).message || "Stornierung fehlgeschlagen.");
    } finally {
      setBusyAppointmentId(null);
    }
  };

  const handleRemoveWaitlist = async (entry: MyWaitlistEntry) => {
    setBusyWaitlistId(entry._id);
    setError("");
    try {
      await deleteMyWaitlistEntry(entry._id);
      await reloadBookings();
    } catch (e: unknown) {
      setError((e as Error).message || "Wartelisten-Eintrag konnte nicht gelöscht werden.");
    } finally {
      setBusyWaitlistId(null);
    }
  };

  const saveField = async (field: EditableField) => {
    if (!field || field === "password") return;
    setSavingField(field);
    setProfileError("");
    setProfileSuccess("");
    try {
      if (field === "firstName") {
        await updateMyProfile({ firstName: profileDraft.firstName });
      } else if (field === "lastName") {
        await updateMyProfile({ lastName: profileDraft.lastName });
      } else if (field === "email") {
        await updateMyProfile({ email: profileDraft.email });
      } else if (field === "phone") {
        await updateMyProfile({ phone: profileDraft.phone });
      }
      await refreshUser();
      setEditingField(null);
      setProfileSuccess("Änderungen erfolgreich gespeichert.");
    } catch (e: unknown) {
      setProfileError((e as Error).message || "Speichern fehlgeschlagen.");
    } finally {
      setSavingField(null);
    }
  };

  const savePassword = async () => {
    setSavingField("password");
    setProfileError("");
    setProfileSuccess("");
    try {
      if (!passwordDraft.currentPassword || !passwordDraft.newPassword) {
        throw new Error("Bitte aktuelles und neues Passwort eingeben.");
      }
      if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
        throw new Error("Die neuen Passwörter stimmen nicht überein.");
      }
      await updateMyPassword({
        currentPassword: passwordDraft.currentPassword,
        newPassword: passwordDraft.newPassword,
      });
      setEditingField(null);
      setPasswordDraft({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setProfileSuccess("Änderungen erfolgreich gespeichert.");
    } catch (e: unknown) {
      setProfileError((e as Error).message || "Passwort konnte nicht geändert werden.");
    } finally {
      setSavingField(null);
    }
  };

  const handleDeleteProfile = async () => {
    setDeletingProfile(true);
    setProfileError("");
    try {
      await deleteMyProfile();
      setShowDeleteProfileDialog(false);
      logout();
      router.push("/");
      router.refresh();
    } catch (e: unknown) {
      setProfileError((e as Error).message || "Profil konnte nicht gelöscht werden.");
      setDeletingProfile(false);
    }
  };

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F2F0EB] px-4 py-20 sm:px-6">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#2D2D2D]/15 border-t-[#2D2D2D]/55" />
          <p className="text-sm text-[#2D2D2D]/60">Konto wird geladen…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl bg-[#F2F0EB] px-4 py-12 sm:px-6">
        <h1 className="font-display text-h1 text-[#2D2D2D]">Dein Profil</h1>
        <p className="mt-3 text-[#2D2D2D]/80">Bitte melde dich an, um dein Profil zu verwalten.</p>
        <Link
          href="/login?redirect=%2Fkonto"
          className="mt-6 inline-block rounded-full border border-[#2D2D2D] bg-transparent px-6 py-3 font-medium text-[#2D2D2D] hover:bg-black/[0.04]"
        >
          Zur Anmeldung
        </Link>
      </main>
    );
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.firstName || "Gast";

  const outlineBtnClass =
    "inline-flex items-center justify-center rounded-full border border-[#2D2D2D] bg-transparent px-5 py-2 text-sm font-medium text-[#2D2D2D] transition hover:bg-black/[0.04] disabled:opacity-50";

  const textLinkUnderline =
    "text-sm underline decoration-[#2D2D2D]/50 underline-offset-4 hover:decoration-[#2D2D2D]";

  const labelUnderline = "text-xs text-[#2D2D2D] underline decoration-[#2D2D2D]/35 underline-offset-4";

  const profileCardInner =
    "rounded-[32px] bg-white px-7 py-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:px-9 sm:py-9";
  const profileBearbeitenLink =
    "shrink-0 text-sm text-[#2D2D2D] underline decoration-[#2D2D2D]/40 underline-offset-[7px] hover:decoration-[#2D2D2D]";
  const profileSectionHeading =
    "font-display text-[1.375rem] leading-tight text-[#2D2D2D] sm:text-[1.5rem]";
  const profileFieldLabel = "text-xs text-[#2D2D2D]/52";
  const profileFieldValue =
    "font-display text-[1.375rem] leading-snug tracking-tight text-[#2D2D2D] sm:text-2xl";
  const profileFormBtnSecondary =
    "rounded-full border border-[#2D2D2D] bg-transparent px-5 py-2 text-sm font-medium text-[#2D2D2D] hover:bg-black/[0.04]";
  const profileFormBtnPrimary =
    "rounded-full bg-[#2D2D2D] px-5 py-2 text-sm font-medium text-white hover:bg-[#1a1a1a] disabled:opacity-50";

  return (
    <main className="min-h-screen bg-[#F2F0EB] pb-16 pt-10 sm:pt-14">
      <div className="mx-auto grid max-w-[1180px] items-start gap-12 px-4 sm:gap-14 sm:px-6 lg:grid-cols-[minmax(200px,280px)_minmax(0,1fr)] lg:gap-16 lg:px-8">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="mx-auto flex w-full max-w-[280px] flex-col lg:mx-0">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#E4E4E0] font-display text-xl tracking-tight text-[#2D2D2D]">
              {initials}
            </div>
            <h1 className="mt-8 font-display text-2xl leading-tight text-[#2D2D2D] sm:text-[1.65rem]">
              {displayName}
            </h1>
            {user.email && (
              <p className="mt-2 text-sm leading-relaxed text-[#2D2D2D]/55">{user.email}</p>
            )}

            <nav className="mt-10 flex flex-col gap-5 text-[0.9375rem] text-[#2D2D2D]" aria-label="Konto">
              <button
                type="button"
                onClick={() => switchTab("bookings")}
                className={`w-fit text-left transition hover:opacity-80 ${
                  activeTab === "bookings"
                    ? "underline decoration-[#2D2D2D] decoration-1 underline-offset-8"
                    : "text-[#2D2D2D]/80"
                }`}
              >
                Meine Termine
              </button>
              <button
                type="button"
                onClick={() => switchTab("profile")}
                className={`w-fit text-left transition hover:opacity-80 ${
                  activeTab === "profile"
                    ? "font-semibold underline decoration-[#2D2D2D] decoration-1 underline-offset-8"
                    : "text-[#2D2D2D]/80"
                }`}
              >
                Profileinstellungen
              </button>
            </nav>

            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-[#D9534F] transition hover:opacity-85"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <path d="M16 17l5-5-5-5M21 12H9" />
              </svg>
              Ausloggen
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          {activeTab === "bookings" ? (
            <div className="space-y-14 sm:space-y-16">
              {error && (
                <div className="rounded-2xl bg-[#F5E4E4]/80 px-4 py-3 text-sm text-[#5C3535]">{error}</div>
              )}

              {loadingData ? (
                <div className="grid min-h-[320px] place-items-center rounded-[28px] bg-white px-6 py-14 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col items-center gap-3">
                    <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#2D2D2D]/15 border-t-[#2D2D2D]/60" />
                    <p className="text-sm text-[#2D2D2D]/60">Daten werden geladen…</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Nächster Termin */}
                  <section className="space-y-6">
                    <h2 className="font-display text-h1 text-[#2D2D2D] sm:text-[2.125rem] sm:leading-[1.15]">
                      Nächster Termin
                    </h2>
                    {nextAppointment ? (
                      <div className="rounded-[28px] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:p-10">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-display text-[2rem] leading-[1.1] tracking-tight text-[#2D2D2D] sm:text-[2.35rem]">
                              {formatDateCardTitle(nextAppointment.startAt)}
                            </p>
                            <p className="mt-3 text-[0.8125rem] leading-relaxed text-[#2D2D2D]/75">
                              {formatWeekdayTimeBar(
                                nextAppointment.startAt,
                                nextAppointment.endAt,
                                nextAppointment.durationMinutes,
                              )}
                            </p>
                          </div>
                          {relativeDaysUntilLabel(nextAppointment.startAt) && (
                            <span className="shrink-0 rounded-full bg-[#E6E1FF] px-3 py-1.5 text-xs font-medium text-[#7660DD]">
                              {relativeDaysUntilLabel(nextAppointment.startAt)}
                            </span>
                          )}
                        </div>

                        <div className="mt-10 grid gap-10 sm:grid-cols-2 sm:gap-12">
                          <div>
                            <p className={labelUnderline}>Mitarbeiter</p>
                            <p className="mt-3 text-[0.9375rem] leading-relaxed text-[#2D2D2D]">
                              {nextAppointment.staffId?.firstName || "Freier Mitarbeiter"}
                            </p>
                          </div>
                          <div>
                            <p className={labelUnderline}>Service</p>
                            <p className="mt-3 text-[0.9375rem] leading-relaxed text-[#2D2D2D]">
                              {getAppointmentServiceLabel(nextAppointment)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center justify-end gap-8">
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(nextAppointment)}
                            disabled={
                              busyAppointmentId === nextAppointment._id ||
                              !nextAppointment.cancelToken
                            }
                            className={`${textLinkUnderline} disabled:opacity-50`}
                          >
                            {busyAppointmentId === nextAppointment._id ? "…" : "Termin stornieren"}
                          </button>
                          <Link
                            href={`/buchung?rescheduleToken=${encodeURIComponent(nextAppointment.cancelToken || "")}${getAppointmentServiceIds(nextAppointment).length > 0 ? `&serviceIds=${encodeURIComponent(getAppointmentServiceIds(nextAppointment).join(","))}` : ""}`}
                            className={outlineBtnClass}
                          >
                            Verschieben
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-[28px] bg-white px-8 py-10 text-[0.9375rem] text-[#2D2D2D]/65 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                        Kein kommender Termin vorhanden.
                      </p>
                    )}
                  </section>

                  {/* Warteliste */}
                  <section className="space-y-6">
                    <h2 className="font-display text-h1 text-[#2D2D2D] sm:text-[2.125rem] sm:leading-[1.15]">
                      Warteliste
                    </h2>
                    <div className="space-y-4">
                      {waitlistEntries.length > 0 ? (
                        waitlistEntries.map((entry) => {
                          const day = entry.preferredDates?.[0] || entry.createdAt;
                          return (
                            <div
                              key={entry._id}
                              className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                            >
                              <div>
                                <p className="font-display text-[1.75rem] leading-tight text-[#2D2D2D]">
                                  {formatDateShort(day)}
                                </p>
                                <p className="mt-2 text-sm text-[#2D2D2D]/75">
                                  {entry.staffId?.firstName || "Freier Mitarbeiter"}
                                </p>
                                <p className="text-sm text-[#2D2D2D]/75">{entry.serviceId?.name || "Leistung"}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveWaitlist(entry)}
                                disabled={busyWaitlistId === entry._id}
                                className={outlineBtnClass}
                              >
                                {busyWaitlistId === entry._id ? "…" : "Von Warteliste entfernen"}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-[24px] bg-white px-8 py-6 text-[0.9375rem] leading-relaxed text-[#2D2D2D]/75 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                          Du stehst aktuell nicht auf der Warteliste.
                        </p>
                      )}
                    </div>
                  </section>

                  {/* Vergangene */}
                  <section className="space-y-6">
                    <h2 className="font-display text-h1 text-[#2D2D2D] sm:text-[2.125rem] sm:leading-[1.15]">
                      Vergangene
                    </h2>
                    <div className="space-y-6">
                      {pastAppointments.length > 0 ? (
                        pastAppointments.slice(0, 8).map((a) => (
                          <div
                            key={a._id}
                            className="rounded-[28px] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:p-10"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-display text-[2rem] leading-[1.1] tracking-tight text-[#2D2D2D] sm:text-[2.35rem]">
                                  {formatDateCardTitle(a.startAt)}
                                </p>
                                <p className="mt-3 text-[0.8125rem] leading-relaxed text-[#2D2D2D]/75">
                                  {formatWeekdayTimeBar(a.startAt, a.endAt, a.durationMinutes)}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${statusStyle(a.status)}`}
                              >
                                {statusLabel(a.status)}
                              </span>
                            </div>

                            <div className="mt-10 grid gap-10 sm:grid-cols-2 sm:gap-12">
                              <div>
                                <p className={labelUnderline}>Mitarbeiter</p>
                                <p className="mt-3 text-[0.9375rem] leading-relaxed text-[#2D2D2D]">
                                  {a.staffId?.firstName || "Freier Mitarbeiter"}
                                </p>
                              </div>
                              <div>
                                <p className={labelUnderline}>Service</p>
                                <p className="mt-3 text-[0.9375rem] leading-relaxed text-[#2D2D2D]">
                                  {getAppointmentServiceLabel(a)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-10 flex flex-wrap items-center justify-end gap-8">
                              <a
                                href={googleReviewWriteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={textLinkUnderline}
                              >
                                Bewertung schreiben
                              </a>
                              <Link
                                href={`/buchung${getAppointmentServiceIds(a).length > 0 ? `?serviceIds=${encodeURIComponent(getAppointmentServiceIds(a).join(","))}` : ""}`}
                                className={outlineBtnClass}
                              >
                                Erneut buchen
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-[28px] bg-white px-8 py-10 text-[0.9375rem] text-[#2D2D2D]/65 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                          Keine vergangenen Termine vorhanden.
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              <h2 className="font-display text-h1 text-[#2D2D2D] sm:text-[2.125rem] sm:leading-[1.15]">
                Persönliche Daten
              </h2>

              {profileSuccess && (
                <div className="flex items-center gap-4 rounded-2xl bg-[#2D2D2D] px-5 py-3.5 pr-4 text-sm text-white sm:px-6">
                  <p className="min-w-0 flex-1 leading-relaxed">{profileSuccess}</p>
                  <button
                    type="button"
                    onClick={() => setProfileSuccess("")}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg leading-none text-white/90 transition hover:bg-white/10"
                    aria-label="Benachrichtigung schließen"
                  >
                    ×
                  </button>
                </div>
              )}

              {profileError && (
                <div className="rounded-2xl border border-[#C9A5A5]/70 bg-[#FCF0EF] px-5 py-3.5 text-sm text-[#5C2E2E] sm:px-6">
                  {profileError}
                </div>
              )}

              <div className="space-y-5">
                {/* Vorname */}
                <div className={profileCardInner}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <p className={profileFieldLabel}>Vorname</p>
                      {editingField !== "firstName" && (
                        <p className={`mt-3 ${profileFieldValue}`}>{profileDraft.firstName || "—"}</p>
                      )}
                    </div>
                    {editingField !== "firstName" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingField("firstName");
                          setProfileError("");
                          setProfileSuccess("");
                        }}
                        className={profileBearbeitenLink}
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  {editingField === "firstName" && (
                    <div className="mt-5 space-y-4">
                      <input
                        value={profileDraft.firstName}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, firstName: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#E8E4DF] bg-[#FBFAF8] px-4 py-3.5 text-[#2D2D2D]"
                        placeholder="Vorname"
                      />
                      <div className="flex justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className={profileFormBtnSecondary}
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={() => saveField("firstName")}
                          disabled={savingField === "firstName"}
                          className={profileFormBtnPrimary}
                        >
                          {savingField === "firstName" ? "…" : "Speichern"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nachname */}
                <div className={profileCardInner}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <p className={profileFieldLabel}>Nachname</p>
                      {editingField !== "lastName" && (
                        <p className={`mt-3 ${profileFieldValue}`}>{profileDraft.lastName || "—"}</p>
                      )}
                    </div>
                    {editingField !== "lastName" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingField("lastName");
                          setProfileError("");
                          setProfileSuccess("");
                        }}
                        className={profileBearbeitenLink}
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  {editingField === "lastName" && (
                    <div className="mt-5 space-y-4">
                      <input
                        value={profileDraft.lastName}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, lastName: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#E8E4DF] bg-[#FBFAF8] px-4 py-3.5 text-[#2D2D2D]"
                        placeholder="Nachname"
                      />
                      <div className="flex justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className={profileFormBtnSecondary}
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={() => saveField("lastName")}
                          disabled={savingField === "lastName"}
                          className={profileFormBtnPrimary}
                        >
                          {savingField === "lastName" ? "…" : "Speichern"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Telefonnummer */}
                <div className={profileCardInner}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <p className={profileFieldLabel}>Telefonnummer</p>
                      {editingField !== "phone" && (
                        <p className={`mt-3 ${profileFieldValue}`}>{profileDraft.phone || "—"}</p>
                      )}
                    </div>
                    {editingField !== "phone" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingField("phone");
                          setProfileError("");
                          setProfileSuccess("");
                        }}
                        className={profileBearbeitenLink}
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  {editingField === "phone" && (
                    <div className="mt-5 space-y-4">
                      <input
                        value={profileDraft.phone}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, phone: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#E8E4DF] bg-[#FBFAF8] px-4 py-3.5 text-[#2D2D2D]"
                        placeholder="+49 …"
                      />
                      <div className="flex justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className={profileFormBtnSecondary}
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={() => saveField("phone")}
                          disabled={savingField === "phone"}
                          className={profileFormBtnPrimary}
                        >
                          {savingField === "phone" ? "…" : "Speichern"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5 pt-2">
                <h3 className={profileSectionHeading}>Anmeldedaten</h3>

                {/* E-Mail */}
                <div className={profileCardInner}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <p className={profileFieldLabel}>E-Mail-Adresse</p>
                      {editingField !== "email" && (
                        <p className={`mt-3 break-all ${profileFieldValue}`}>{profileDraft.email}</p>
                      )}
                    </div>
                    {editingField !== "email" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingField("email");
                          setProfileError("");
                          setProfileSuccess("");
                        }}
                        className={profileBearbeitenLink}
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  {editingField === "email" && (
                    <div className="mt-5 space-y-4">
                      <input
                        value={profileDraft.email}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, email: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#E8E4DF] bg-[#FBFAF8] px-4 py-3.5 text-[#2D2D2D]"
                        placeholder="E-Mail-Adresse"
                      />
                      <div className="flex justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className={profileFormBtnSecondary}
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={() => saveField("email")}
                          disabled={savingField === "email"}
                          className={profileFormBtnPrimary}
                        >
                          {savingField === "email" ? "…" : "Speichern"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Passwort */}
                <div className={profileCardInner}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <p className={profileFieldLabel}>Passwort</p>
                      {editingField !== "password" && (
                        <p className={`mt-3 font-display text-xl tracking-[0.2em] text-[#2D2D2D] sm:text-2xl`}>
                          ••••••••••••
                        </p>
                      )}
                    </div>
                    {editingField !== "password" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingField("password");
                          setProfileError("");
                          setProfileSuccess("");
                        }}
                        className={profileBearbeitenLink}
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  {editingField === "password" && (
                    <div className="mt-5 space-y-3">
                      <input
                        type="password"
                        value={passwordDraft.currentPassword}
                        onChange={(e) =>
                          setPasswordDraft((p) => ({ ...p, currentPassword: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#E8E4DF] bg-[#FBFAF8] px-4 py-3.5 text-[#2D2D2D]"
                        placeholder="Aktuelles Passwort"
                      />
                      <input
                        type="password"
                        value={passwordDraft.newPassword}
                        onChange={(e) =>
                          setPasswordDraft((p) => ({ ...p, newPassword: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#E8E4DF] bg-[#FBFAF8] px-4 py-3.5 text-[#2D2D2D]"
                        placeholder="Neues Passwort"
                      />
                      <input
                        type="password"
                        value={passwordDraft.confirmPassword}
                        onChange={(e) =>
                          setPasswordDraft((p) => ({ ...p, confirmPassword: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#E8E4DF] bg-[#FBFAF8] px-4 py-3.5 text-[#2D2D2D]"
                        placeholder="Neues Passwort wiederholen"
                      />
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className={profileFormBtnSecondary}
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={savePassword}
                          disabled={savingField === "password"}
                          className={profileFormBtnPrimary}
                        >
                          {savingField === "password" ? "…" : "Speichern"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5 pt-4">
                <h3 className={profileSectionHeading}>Konto löschen</h3>
                <div className={profileCardInner}>
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                    <p className="max-w-xl text-sm leading-relaxed text-[#2D2D2D]/78">
                      Wenn du dein Konto löschst, werden alle deine Daten und Termine unwiderruflich
                      entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileError("");
                        setProfileSuccess("");
                        setShowDeleteProfileDialog(true);
                      }}
                      disabled={deletingProfile}
                      className="shrink-0 self-start text-sm font-medium text-[#D9534F] underline decoration-[#D9534F]/45 underline-offset-[6px] hover:decoration-[#D9534F] disabled:opacity-50 sm:self-center"
                    >
                      {deletingProfile ? "Löschen…" : "Konto löschen"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {showDeleteProfileDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-h2 text-[#2D2D2D]">Profil wirklich löschen?</h3>
            <p className="mt-2 text-sm text-[#2D2D2D]/75">
              Dein Konto wird dauerhaft entfernt. Kommende Termine werden storniert.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteProfileDialog(false)}
                disabled={deletingProfile}
                className="rounded-full border border-[#E8E4DF] px-5 py-2 text-sm font-medium text-[#2D2D2D] disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteProfile}
                disabled={deletingProfile}
                className="rounded-full bg-[#B34A3F] px-6 py-2 text-sm font-medium text-white hover:bg-[#9C3F35] disabled:opacity-50"
              >
                {deletingProfile ? "Löschen..." : "Endgültig löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#F2F0EB] px-4 py-20 sm:px-6">
          <div className="flex flex-col items-center gap-3">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#2D2D2D]/15 border-t-[#2D2D2D]/55" />
            <p className="text-sm text-[#2D2D2D]/60">Konto wird geladen…</p>
          </div>
        </main>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}

