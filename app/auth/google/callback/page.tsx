"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const redirect = searchParams.get("redirect") || "/konto";

    if (!token) {
      router.replace(`/login?googleError=${encodeURIComponent("Google Anmeldung fehlgeschlagen.")}`);
      return;
    }

    localStorage.setItem("pm_token", token);
    refreshUser().finally(() => {
      router.replace(redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/konto");
      router.refresh();
    });
  }, [refreshUser, router, searchParams]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#E4E1DC] px-4">
      <div className="rounded-[28px] bg-[#EBEAE7] px-8 py-10 text-center">
        <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-[#2D2D2D]/15 border-t-[#2D2D2D]" />
        <p className="mt-4 text-sm text-[#2D2D2D]/70">Google Anmeldung wird abgeschlossen…</p>
      </div>
    </main>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#E4E1DC] px-4">
          <p className="text-sm text-[#2D2D2D]/70">Laden…</p>
        </main>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
