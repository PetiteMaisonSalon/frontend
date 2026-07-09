import { Suspense } from "react";

import LeistungenClient from "./LeistungenClient";

export default function LeistungenPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#EBEAE7] px-6 py-16 text-[#2D2D2D]/70">
          Lade…
        </main>
      }
    >
      <LeistungenClient />
    </Suspense>
  );
}
