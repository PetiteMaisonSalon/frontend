"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      setMessage(res.message || "Wenn ein Konto existiert, wurde eine E-Mail gesendet.");
    } catch (e: unknown) {
      setError((e as Error).message || "Fehler beim Senden der E-Mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EBEAE7] py-16">
      <div className="mx-auto max-w-md px-6">
        <h1 className="text-h2 text-[#2D2D2D]">
          Passwort vergessen
        </h1>
        <p className="mt-2 text-[#2D2D2D]/85">
          Gib deine E-Mail-Adresse ein. Wenn ein Konto existiert, senden wir dir einen Link zum Zurücksetzen.
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
              E-Mail *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[#E8E4DF] px-4 py-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#4A5D4A] py-3 font-medium text-white transition hover:bg-[#3A4A3A] disabled:opacity-50"
          >
            {loading ? "Wird gesendet…" : "Link anfordern"}
          </button>
        </form>

        <p className="mt-8 text-center text-[#2D2D2D]/85">
          Zurück zum{" "}
          <Link href="/login" className="text-[#4A5D4A] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}

