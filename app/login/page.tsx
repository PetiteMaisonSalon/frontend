"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const redirectParam = searchParams.get("redirect");
  const redirectDefault = "/buchung";
  const verified = searchParams.get("verified");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      await refreshUser();
      const role = data?.user?.role;
      let target = redirectDefault;

      if (redirectParam) {
        target = redirectParam;
      } else if (role === "admin" || role === "staff") {
        target = "/admin";
      }

      router.push(target);
      router.refresh();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F2ED] py-16">
      <div className="mx-auto max-w-md px-6">
        <h1 className="font-display text-3xl font-medium text-[#2D2D2D]">
          Anmelden
        </h1>
        <p className="mt-2 text-[#2D2D2D]/85">
          Melde dich an, um einen Termin zu buchen.
        </p>

        {verified === "true" && (
          <div className="mt-6 rounded-lg bg-[#4A5D4A]/20 px-4 py-3 text-[#3A4A3A]">
            E-Mail bestätigt. Du kannst dich jetzt anmelden.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D]">
              E-Mail *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D]">
              Passwort *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
              autoComplete="current-password"
            />
          </div>

          <div className="text-right text-sm">
            <Link href="/passwort-vergessen" className="text-[#4A5D4A] hover:underline">
              Passwort vergessen?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#4A5D4A] py-3 font-medium text-white transition hover:bg-[#3A4A3A] disabled:opacity-50"
          >
            {loading ? "Wird angemeldet…" : "Anmelden"}
          </button>
        </form>

        <p className="mt-8 text-center text-[#2D2D2D]/85">
          Noch kein Konto?{" "}
          <Link
            href={`/register?redirect=${encodeURIComponent(redirectParam || redirectDefault)}`}
            className="text-[#4A5D4A] hover:underline"
          >
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2ED]">
        <p className="text-[#2D2D2D]/70">Laden…</p>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
