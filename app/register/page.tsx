"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/buchung";

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await register(form);
      setEmailSent(result?.emailSent !== false);
      setSuccess(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#F5F2ED] py-16">
        <div className="mx-auto max-w-md px-6">
          <div className="rounded-2xl border border-[#4A5D4A]/30 bg-white p-8 text-center shadow-sm">
            <h1 className="font-display text-2xl font-medium text-[#2D2D2D]">
              E-Mail bestätigen
            </h1>
            {emailSent ? (
              <>
                <p className="mt-4 text-[#2D2D2D]/85">
                  Wir haben dir eine E-Mail mit einem Bestätigungslink geschickt. Bitte
                  klicke darauf, um dein Konto zu aktivieren. Der Link ist 24 Stunden
                  gültig.
                </p>
                <p className="mt-4 text-sm text-[#2D2D2D]/70">
                  Hast du keine E-Mail erhalten? Prüfe deinen Spam-Ordner.
                </p>
              </>
            ) : (
              <p className="mt-4 rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-sm text-[#5C4033]">
                Registrierung erfolgreich, aber die Verifizierungs-E-Mail konnte gerade
                nicht gesendet werden. Bitte versuche es in Kürze erneut.
              </p>
            )}
            <Link
              href="/login"
              className="mt-8 inline-block rounded-full bg-[#4A5D4A] px-6 py-3 font-medium text-white transition hover:bg-[#3A4A3A]"
            >
              Zum Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2ED] py-16">
      <div className="mx-auto max-w-md px-6">
        <h1 className="font-display text-3xl font-medium text-[#2D2D2D]">
          Registrieren
        </h1>
        <p className="mt-2 text-[#2D2D2D]/85">
          Erstelle ein Konto, um Termine online zu buchen.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">
              {error}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-[#2D2D2D]">
                Vorname *
              </label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-[#2D2D2D]">
                Nachname *
              </label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D]">
              E-Mail *
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
              autoComplete="email"
            />
            <p className="mt-1 text-xs text-[#2D2D2D]/70">
              Nur echte E-Mail-Adressen werden akzeptiert. Du erhältst einen Bestätigungslink.
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D]">
              Passwort *
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-[#2D2D2D]/70">
              Mindestens 6 Zeichen
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[#2D2D2D]">
              Telefon
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#4A5D4A] py-3 font-medium text-white transition hover:bg-[#3A4A3A] disabled:opacity-50"
          >
            {loading ? "Wird registriert…" : "Registrieren"}
          </button>
        </form>

        <p className="mt-8 text-center text-[#2D2D2D]/85">
          Bereits ein Konto?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-[#4A5D4A] hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2ED]">
        <p className="text-[#2D2D2D]/70">Laden…</p>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
