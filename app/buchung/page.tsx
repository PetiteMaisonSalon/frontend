import { Suspense } from "react";
import BuchungsFlow from "../../components/BuchungsFlow";

export const metadata = {
  title: "Termin buchen | Petite Maison",
  description: "Buchen Sie Ihren Termin online – schnell und einfach."
};


export default function BuchungPage() {
  return (
    <main className="min-h-screen bg-[#F5F2ED]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-2xl px-6 py-12 text-center text-[#2D2D2D]/70">
            Lade Buchungsflow…
          </div>
        }
      >
        <BuchungsFlow />
      </Suspense>
    </main>
  );
}
