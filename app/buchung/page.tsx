import { Suspense } from "react";
import LeistungenClient from "../leistungen/LeistungenClient";

export const metadata = {
  title: "Termin buchen | Petite Maison",
  description: "Buchen Sie Ihren Termin online – schnell und einfach."
};

export default function BuchungPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#EBEAE7] px-6 py-16 text-[#1C1612]/70">
          Lade…
        </main>
      }
    >
      <LeistungenClient />
    </Suspense>
  );
}
