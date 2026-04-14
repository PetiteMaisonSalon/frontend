"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    fetch(`${API_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        await res.json();
        setStatus(res.ok ? "success" : "error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F5F2ED] px-6">
      {status === "loading" && (
        <p className="text-[#2D2D2D]/70">E-Mail wird bestätigt…</p>
      )}
      {status === "success" && (
        <div className="max-w-md rounded-2xl border border-[#4A5D4A]/30 bg-white p-8 text-center shadow-sm">
          <h1 className="text-h2 text-[#2D2D2D]">
            E-Mail bestätigt
          </h1>
          <p className="mt-4 text-[#2D2D2D]/85">
            Du kannst dich jetzt anmelden.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-[#4A5D4A] px-6 py-3 font-medium text-white transition hover:bg-[#3A4A3A]"
          >
            Zum Login
          </Link>
        </div>
      )}
      {status === "error" && (
        <div className="max-w-md rounded-2xl border border-[#E8E4DF] bg-white p-8 text-center">
          <h1 className="text-h2 text-[#2D2D2D]">
            Link ungültig oder abgelaufen
          </h1>
          <p className="mt-4 text-[#2D2D2D]/85">
            Der Bestätigungslink ist ungültig oder abgelaufen. Bitte registriere dich erneut.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-[#4A5D4A] hover:underline"
          >
            Zur Startseite
          </Link>
        </div>
      )}
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2ED]">
        <p className="text-[#2D2D2D]/70">Laden…</p>
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}
