"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <main className="min-h-screen bg-[#EBEAE7] py-16">
        <div className="mx-auto max-w-md px-6">
          <h1 className="text-h2 text-[#2D2D2D]">
            Passwort zurücksetzen
          </h1>
          <p className="mt-4 text-[#2D2D2D]/85">
            Der Link ist ungültig oder unvollständig.
          </p>
          <p className="mt-4">
            <Link href="/passwort-vergessen" className="text-[#4A5D4A] hover:underline">
              Neuen Link anfordern
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      setMessage(res.message || "Passwort wurde aktualisiert.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (e: unknown) {
      setError((e as Error).message || "Fehler beim Zurücksetzen des Passworts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EBEAE7] py-16">
      <div className="mx-auto max-w-md px-6">
        <h1 className="text-h2 text-[#2D2D2D]">
          Passwort zurücksetzen
        </h1>
        <p className="mt-2 text-[#2D2D2D]/85">
          Vergib ein neues Passwort für dein Konto.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {message && (
            <div className="rounded-lg bg-[#4A5D4A]/20 px-4 py-3 text-[#3A4A3A]">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-[#D4A5A5]/30 px-4 py-3 text-[#5C4033]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">
              Neues Passwort *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D]">
              Passwort wiederholen *
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#4A5D4A] py-3 font-medium text-white transition hover:bg-[#3A4A3A] disabled:opacity-50"
          >
            {loading ? "Wird gespeichert…" : "Passwort setzen"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#EBEAE7]">
          <p className="text-[#2D2D2D]/70">Laden…</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

