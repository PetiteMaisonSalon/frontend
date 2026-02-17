import BuchungsFlow from "@/components/BuchungsFlow";

export const metadata = {
  title: "Termin buchen | Petite Maison",
  description: "Buchen Sie Ihren Termin online – schnell und einfach.",
};

export default function BuchungPage() {
  return (
    <main className="min-h-screen bg-[#F5F2ED]">
      <section className="border-b border-[#E8E4DF] py-12 md:py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h1 className="font-display text-4xl font-medium tracking-tight text-[#2D2D2D] md:text-5xl">
            Termin buchen
          </h1>
          <p className="mt-4 text-lg text-[#2D2D2D]/85">
            Wähle deine Leistung, einen passenden Termin und bestätige deine Buchung.
          </p>
        </div>
      </section>
      <BuchungsFlow />
    </main>
  );
}
