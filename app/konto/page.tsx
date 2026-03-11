"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
type EditableField = "name" | "email" | "phone" | "password" | null;

function formatDateShort(value: string) {
  return new Date(value).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTimeRange(startAt: string, endAt?: string, durationMinutes?: number) {
  const start = new Date(startAt);
  const end = endAt
    ? new Date(endAt)
    : new Date(start.getTime() + Math.max(durationMinutes || 0, 0) * 60000);
  return `${start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
}

function statusStyle(status: string) {
  if (status === "cancelled") return "bg-[#D4A5A5]/30 text-[#8A3E3E]";
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

export default function AccountPage() {
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
      if (field === "name") {
        await updateMyProfile({
          firstName: profileDraft.firstName,
          lastName: profileDraft.lastName,
        });
      } else if (field === "email") {
        await updateMyProfile({ email: profileDraft.email });
      } else if (field === "phone") {
        await updateMyProfile({ phone: profileDraft.phone });
      }
      await refreshUser();
      setEditingField(null);
      setProfileSuccess("Erfolgreich gespeichert.");
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
      setProfileSuccess("Passwort erfolgreich geändert.");
    } catch (e: unknown) {
      setProfileError((e as Error).message || "Passwort konnte nicht geändert werden.");
    } finally {
      setSavingField(null);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      "Möchtest du dein Profil wirklich löschen? Kommende Termine werden storniert."
    );
    if (!confirmed) return;

    setDeletingProfile(true);
    setProfileError("");
    try {
      await deleteMyProfile();
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
      <main className="mx-auto grid max-w-6xl place-items-center px-4 py-20 sm:px-6">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#4A5D4A]/25 border-t-[#4A5D4A]" />
          <p className="text-sm text-[#2D2D2D]/70">Konto wird geladen…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl text-[#2D2D2D]">Mein Profil</h1>
        <p className="mt-3 text-[#2D2D2D]/80">Bitte melde dich an, um dein Profil zu verwalten.</p>
        <Link
          href="/login?redirect=%2Fkonto"
          className="mt-6 inline-block rounded-full bg-[#4A5D4A] px-6 py-3 font-medium text-white"
        >
          Zur Anmeldung
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit self-start rounded-2xl border border-[#E8E4DF] bg-white p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#E8E4DF] text-lg font-medium text-[#6A665F]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-3xl text-[#2D2D2D]">
                {user.firstName}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-1 border-t border-[#E8E4DF] pt-4">
            <button
              type="button"
              onClick={() => switchTab("bookings")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${
                activeTab === "bookings"
                  ? "bg-[#4A5D4A]/10 text-[#4A5D4A]"
                  : "text-[#2D2D2D]/85 hover:bg-[#F5F2ED]"
              }`}
            >
              <span>Buchungen</span>
              <span aria-hidden>›</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("profile")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${
                activeTab === "profile"
                  ? "text-[#4A5D4A] bg-[#4A5D4A]/10"
                  : "text-[#2D2D2D]/85 hover:bg-[#F5F2ED]"
              }`}
            >
              <span>Persönliche Daten</span>
              <span aria-hidden>›</span>
            </button>
          </div>

          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[#B34A3F] hover:bg-[#FCEDEB]"
          >
            <span aria-hidden>⇥</span>
            Ausloggen
          </button>
        </aside>

        <section className="min-w-0">
          {activeTab === "bookings" ? (
            <div className="space-y-8">
              {error && (
                <div className="rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">{error}</div>
              )}

              {loadingData ? (
                <div className="grid min-h-[280px] place-items-center rounded-2xl border border-[#E8E4DF] bg-white">
                  <div className="flex flex-col items-center gap-3">
                    <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#4A5D4A]/25 border-t-[#4A5D4A]" />
                    <p className="text-sm text-[#2D2D2D]/70">Daten werden geladen…</p>
                  </div>
                </div>
              ) : (
                <>
                  <section>
                    <h2 className="font-display text-4xl text-[#2D2D2D]">Warteliste</h2>
                    <div className="mt-3 space-y-3">
                      {waitlistEntries.length > 0 ? (
                        waitlistEntries.map((entry) => {
                          const day = entry.preferredDates?.[0] || entry.createdAt;
                          return (
                            <div
                              key={entry._id}
                              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E8E4DF] bg-white p-4"
                            >
                              <div>
                                <p className="text-4xl font-medium text-[#2D2D2D]">
                                  {formatDateShort(day)}
                                </p>
                                <p className="mt-1 text-sm text-[#2D2D2D]/80">
                                  ⦿ {entry.staffId?.firstName || "Freier Mitarbeiter"}
                                </p>
                                <p className="text-sm text-[#2D2D2D]/80">
                                  ✂ {entry.serviceId?.name || "Leistung"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveWaitlist(entry)}
                                disabled={busyWaitlistId === entry._id}
                                className="rounded-full border-2 border-[#D06B5D] px-6 py-2 text-[#B34A3F] hover:bg-[#FCEDEB] disabled:opacity-50"
                              >
                                {busyWaitlistId === entry._id ? "..." : "Stornieren"}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-xl border border-[#E8E4DF] bg-white p-4 text-[#2D2D2D]/70">
                          Kein Eintrag in der Warteliste.
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h2 className="font-display text-4xl text-[#2D2D2D]">Nächster Termin</h2>
                    <div className="mt-3">
                      {nextAppointment ? (
                        <div className="rounded-2xl border border-[#4A5D4A]/45 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-4xl font-medium text-[#2D2D2D]">
                                  {formatDateShort(nextAppointment.startAt)}
                                </p>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(nextAppointment.status)}`}
                                >
                                  {statusLabel(nextAppointment.status)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-[#2D2D2D]/85">
                                ◷ {formatTimeRange(nextAppointment.startAt, nextAppointment.endAt, nextAppointment.durationMinutes)} (
                                {nextAppointment.durationMinutes || 0} min)
                              </p>
                              <p className="text-sm text-[#2D2D2D]/85">
                                ⦿ {nextAppointment.staffId?.firstName || "Freier Mitarbeiter"}
                              </p>
                              <p className="text-sm text-[#2D2D2D]/85">
                                ✂ {getAppointmentServiceLabel(nextAppointment)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(nextAppointment)}
                                disabled={
                                  busyAppointmentId === nextAppointment._id ||
                                  !nextAppointment.cancelToken
                                }
                                className="rounded-full border-2 border-[#AFAFAF] px-4 py-2 text-[#454545] hover:bg-[#F4F4F4] disabled:opacity-50"
                              >
                                {busyAppointmentId === nextAppointment._id
                                  ? "..."
                                  : "Termin stornieren"}
                              </button>
                              <Link
                                href={`/buchung?rescheduleToken=${encodeURIComponent(nextAppointment.cancelToken || "")}${getAppointmentServiceIds(nextAppointment).length > 0 ? `&serviceIds=${encodeURIComponent(getAppointmentServiceIds(nextAppointment).join(","))}` : ""}`}
                                className="rounded-full bg-[#4A5D4A] px-5 py-2 text-white hover:bg-[#3A4A3A]"
                              >
                                Verschieben
                              </Link>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="rounded-xl border border-[#E8E4DF] bg-white p-4 text-[#2D2D2D]/70">
                          Kein kommender Termin vorhanden.
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h2 className="font-display text-4xl text-[#2D2D2D]">Vergangene</h2>
                    <div className="mt-3 space-y-3">
                      {pastAppointments.length > 0 ? (
                        pastAppointments.slice(0, 8).map((a) => (
                          <div key={a._id} className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-4xl font-medium text-[#2D2D2D]">
                                    {formatDateShort(a.startAt)}
                                  </p>
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(a.status)}`}
                                  >
                                    {statusLabel(a.status)}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-[#2D2D2D]/85">
                                  ◷ {formatTimeRange(a.startAt, a.endAt, a.durationMinutes)} (
                                  {a.durationMinutes || 0} min)
                                </p>
                                <p className="text-sm text-[#2D2D2D]/85">
                                  ⦿ {a.staffId?.firstName || "Freier Mitarbeiter"}
                                </p>
                                <p className="text-sm text-[#2D2D2D]/85">
                                  ✂ {getAppointmentServiceLabel(a)}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href="https://g.page/r/CXXf5DCXrN0sEAI/review"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-full border-2 border-[#AFAFAF] px-4 py-2 text-[#454545] hover:bg-[#F4F4F4]"
                                >
                                  Bewertung schreiben
                                </a>
                                <Link
                                  href={`/buchung${getAppointmentServiceIds(a).length > 0 ? `?serviceIds=${encodeURIComponent(getAppointmentServiceIds(a).join(","))}` : ""}`}
                                  className="rounded-full bg-[#4A5D4A] px-5 py-2 text-white hover:bg-[#3A4A3A]"
                                >
                                  Erneut buchen
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl border border-[#E8E4DF] bg-white p-4 text-[#2D2D2D]/70">
                          Keine vergangenen Termine vorhanden.
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="font-display text-4xl text-[#2D2D2D]">Persönliche Daten</h2>
              {profileError && (
                <div className="rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="rounded-lg bg-[#4A5D4A]/15 px-4 py-3 text-[#3A4A3A]">
                  {profileSuccess}
                </div>
              )}

              <div className="space-y-3">
                <div className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#2D2D2D]/70">Name</p>
                      {editingField !== "name" && (
                        <p className="text-xl text-[#2D2D2D]">
                          {profileDraft.firstName} {profileDraft.lastName}
                        </p>
                      )}
                    </div>
                    {editingField !== "name" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingField("name");
                          setProfileError("");
                          setProfileSuccess("");
                        }}
                        className="text-[#4A5D4A] hover:underline"
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  {editingField === "name" && (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={profileDraft.firstName}
                          onChange={(e) =>
                            setProfileDraft((p) => ({ ...p, firstName: e.target.value }))
                          }
                          className="w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                          placeholder="Vorname"
                        />
                        <input
                          value={profileDraft.lastName}
                          onChange={(e) =>
                            setProfileDraft((p) => ({ ...p, lastName: e.target.value }))
                          }
                          className="w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                          placeholder="Nachname"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className="rounded-lg px-4 py-2 text-[#2D2D2D]/80 hover:bg-[#F5F2ED]"
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={() => saveField("name")}
                          disabled={savingField === "name"}
                          className="rounded-lg bg-[#4A5D4A] px-5 py-2 text-white disabled:opacity-50"
                        >
                          {savingField === "name" ? "..." : "Speichern"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#2D2D2D]/70">Email Adresse</p>
                      {editingField !== "email" && (
                        <p className="text-xl text-[#2D2D2D]">{profileDraft.email}</p>
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
                        className="text-[#4A5D4A] hover:underline"
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  {editingField === "email" && (
                    <div className="space-y-3">
                      <input
                        value={profileDraft.email}
                        onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
                        className="w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                        placeholder="E-Mail"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className="rounded-lg px-4 py-2 text-[#2D2D2D]/80 hover:bg-[#F5F2ED]"
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={() => saveField("email")}
                          disabled={savingField === "email"}
                          className="rounded-lg bg-[#4A5D4A] px-5 py-2 text-white disabled:opacity-50"
                        >
                          {savingField === "email" ? "..." : "Speichern"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#2D2D2D]/70">Handynummer</p>
                      {editingField !== "phone" && (
                        <p className="text-xl text-[#2D2D2D]">{profileDraft.phone || "—"}</p>
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
                        className="text-[#4A5D4A] hover:underline"
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  {editingField === "phone" && (
                    <div className="space-y-3">
                      <input
                        value={profileDraft.phone}
                        onChange={(e) => setProfileDraft((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                        placeholder="+49 ..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className="rounded-lg px-4 py-2 text-[#2D2D2D]/80 hover:bg-[#F5F2ED]"
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={() => saveField("phone")}
                          disabled={savingField === "phone"}
                          className="rounded-lg bg-[#4A5D4A] px-5 py-2 text-white disabled:opacity-50"
                        >
                          {savingField === "phone" ? "..." : "Speichern"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#2D2D2D]/70">Passwort</p>
                      {editingField !== "password" && (
                        <p className="text-xl text-[#2D2D2D]">************</p>
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
                        className="text-[#4A5D4A] hover:underline"
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  {editingField === "password" && (
                    <div className="space-y-3">
                      <input
                        type="password"
                        value={passwordDraft.currentPassword}
                        onChange={(e) =>
                          setPasswordDraft((p) => ({ ...p, currentPassword: e.target.value }))
                        }
                        className="w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                        placeholder="Aktuelles Passwort"
                      />
                      <input
                        type="password"
                        value={passwordDraft.newPassword}
                        onChange={(e) =>
                          setPasswordDraft((p) => ({ ...p, newPassword: e.target.value }))
                        }
                        className="w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                        placeholder="Neues Passwort"
                      />
                      <input
                        type="password"
                        value={passwordDraft.confirmPassword}
                        onChange={(e) =>
                          setPasswordDraft((p) => ({ ...p, confirmPassword: e.target.value }))
                        }
                        className="w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
                        placeholder="Neues Passwort wiederholen"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className="rounded-lg px-4 py-2 text-[#2D2D2D]/80 hover:bg-[#F5F2ED]"
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={savePassword}
                          disabled={savingField === "password"}
                          className="rounded-lg bg-[#4A5D4A] px-5 py-2 text-white disabled:opacity-50"
                        >
                          {savingField === "password" ? "..." : "Speichern"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#2D2D2D]/70">Profil löschen</p>
                      <p className="text-[#2D2D2D]/70">
                        Dadurch wird dein Konto dauerhaft entfernt.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteProfile}
                      disabled={deletingProfile}
                      className="text-[#B34A3F] hover:underline disabled:opacity-50"
                    >
                      {deletingProfile ? "Löschen..." : "Profil löschen"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

