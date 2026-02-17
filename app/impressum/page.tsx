export const metadata = {
  title: "Impressum | Petite Maison",
};

export default function ImpressumPage() {
  return (
    <main>
      <section className="border-b border-[#E8E4DF]">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <h1 className="font-display text-4xl font-medium tracking-tight text-[#2D2D2D]">
            Impressum
          </h1>
          <div className="mt-10 space-y-6 text-lg leading-relaxed text-[#2D2D2D]/85">
            <p>[Impressum-Inhalte werden noch eingepflegt]</p>
            <p>Petite Maison</p>
            <p>Arndtstr. 33</p>
            <p>22085 Hamburg</p>
          </div>
        </div>
      </section>
    </main>
  );
}
