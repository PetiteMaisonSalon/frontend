"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getGoogleAuthUrl, register } from "@/lib/api";

function GoogleMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.2C29.1 35.2 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

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
      <main className="min-h-screen bg-[#E4E1DC] px-3 py-4 sm:px-6 sm:py-8">
        <div className="relative mx-auto w-full max-w-[650px] rounded-[24px] bg-[#EBEAE7] px-10 py-16 text-center text-[#1F1917] sm:rounded-[18px] sm:px-14">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute right-7 top-7 h-11 w-11 text-[#1F1917] transition hover:opacity-70"
            aria-label="Schließen"
          >
            <span className="absolute left-1/2 top-1/2 h-px w-11 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
            <span className="absolute left-1/2 top-1/2 h-px w-11 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
          </button>
          <div>
            <h1 className="font-display text-[2.35rem] leading-none tracking-tight text-[#1F1917] sm:text-[2.55rem]">
              E-Mail bestätigen
            </h1>
            {emailSent ? (
              <>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-[#1F1917]/85">
                  Wir haben dir eine E-Mail mit einem Bestätigungslink geschickt. Bitte
                  klicke darauf, um dein Konto zu aktivieren. Der Link ist 24 Stunden
                  gültig.
                </p>
                <p className="mt-4 text-sm text-[#1F1917]/65">
                  Hast du keine E-Mail erhalten? Prüfe deinen Spam-Ordner.
                </p>
              </>
            ) : (
              <p className="mt-5 rounded-2xl bg-[#F5E4E4] px-4 py-3 text-sm text-[#5C3535]">
                Registrierung erfolgreich, aber die Verifizierungs-E-Mail konnte gerade
                nicht gesendet werden. Bitte versuche es in Kürze erneut.
              </p>
            )}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="mt-9 inline-block rounded-full border border-[#1F1917] bg-[#1F1917] px-8 py-3.5 text-white transition hover:bg-[#120F0E]"
            >
              Zum Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E4E1DC] px-3 py-4 sm:px-6 sm:py-8">
      <div className="relative mx-auto w-full max-w-[650px] rounded-[24px] bg-[#EBEAE7] px-12 pb-12 pt-20 text-[#1F1917] sm:rounded-[18px] sm:px-14 sm:pb-12 sm:pt-20">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute right-7 top-7 h-11 w-11 text-[#1F1917] transition hover:opacity-70"
          aria-label="Schließen"
        >
          <span className="absolute left-1/2 top-1/2 h-px w-11 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
          <span className="absolute left-1/2 top-1/2 h-px w-11 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
        </button>

        <h1 className="font-display text-[2.35rem] leading-none tracking-tight text-[#1F1917] sm:text-[2.55rem]">
          Account erstellen
        </h1>
        <p className="mt-4 max-w-[540px] text-[1.0625rem] leading-relaxed text-[#1F1917] sm:text-[1.12rem]">
          Erstelle einen Account, um Termine zu buchen und zu verwalten.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-7">
          {error && (
            <div className="rounded-2xl bg-[#F5E4E4] px-4 py-3 text-sm text-[#5C3535]">
              {error}
            </div>
          )}

          <div className="grid gap-7 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-[1.0625rem] text-[#1F1917]">
                Vorname*
              </label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
                className="mt-3 w-full border-0 border-b border-[#1F1917] bg-transparent px-0 pb-2 font-display text-[1.5rem] leading-tight text-[#1F1917] shadow-none outline-none focus:shadow-none"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-[1.0625rem] text-[#1F1917]">
                Nachname*
              </label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
                className="mt-3 w-full border-0 border-b border-[#1F1917] bg-transparent px-0 pb-2 font-display text-[1.5rem] leading-tight text-[#1F1917] shadow-none outline-none focus:shadow-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-[1.0625rem] text-[#1F1917]">
              E-Mail*
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="mt-3 w-full border-0 border-b border-[#1F1917] bg-transparent px-0 pb-2 font-display text-[1.65rem] leading-tight text-[#1F1917] shadow-none outline-none focus:shadow-none"
              autoComplete="email"
            />
            <p className="mt-2 text-xs text-[#1F1917]/60">
              Nur echte E-Mail-Adressen werden akzeptiert. Du erhältst einen Bestätigungslink.
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-[1.0625rem] text-[#1F1917]">
              Passwort*
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              className="mt-3 w-full border-0 border-b border-[#1F1917] bg-transparent px-0 pb-2 font-display text-[1.65rem] leading-tight text-[#1F1917] shadow-none outline-none focus:shadow-none"
              autoComplete="new-password"
            />
            <p className="mt-2 text-xs text-[#1F1917]/60">
              Mindestens 6 Zeichen
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-[1.0625rem] text-[#1F1917]">
              Telefon
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-3 w-full border-0 border-b border-[#1F1917] bg-transparent px-0 pb-2 font-display text-[1.65rem] leading-tight text-[#1F1917] shadow-none outline-none focus:shadow-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-full border border-[#1F1917] bg-[#1F1917] py-4 text-center text-[1.0625rem] text-white transition hover:bg-[#120F0E] disabled:opacity-50"
          >
            {loading ? "Wird registriert…" : "Registrieren"}
          </button>
        </form>

        <div className="my-12 flex items-center gap-3 sm:px-8">
          <span className="h-px flex-1 bg-[#1F1917]" />
          <span className="text-[1.0625rem] text-[#1F1917]">oder</span>
          <span className="h-px flex-1 bg-[#1F1917]" />
        </div>

        <a
          href={getGoogleAuthUrl(redirect)}
          className="flex w-full items-center justify-center gap-5 rounded-full border border-[#1F1917] py-3.5 text-[1.0625rem] text-[#1F1917] transition hover:bg-black/[0.03]"
        >
          <GoogleMark />
          Weiter mit Google
        </a>

        <p className="mt-8 text-center text-sm text-[#1F1917]/75">
          Bereits ein Konto?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="underline underline-offset-4 hover:opacity-75">
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
      <main className="flex min-h-screen items-center justify-center bg-[#E4E1DC]">
        <p className="text-[#1C1612]/70">Laden…</p>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
