import Link from "next/link";

export default function Home() {
  return (
    <main>
      {/* Hero – Startseite 1 & 2 */}
      <section className="relative overflow-hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24 text-center md:py-32 lg:py-40">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-[#2D2D2D] md:text-5xl lg:text-6xl">
              Deine Haare sind Vertrauenssache.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#2D2D2D]/80">
              Herzlich willkommen bei Petite Maison. Wir sind ein Friseursalon,
              in dem wir uns bewusst Zeit nehmen – für dich und dein Haar. In
              ruhiger Atmosphäre arbeiten wir sorgfältig und mit Erfahrung,
              damit du dich gut beraten fühlst und mit einem Ergebnis gehst, das
              wirklich zu dir passt.
            </p>
            <Link
              href="/buchung"
              className="mt-10 inline-block rounded-full bg-[#2D2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#4A5D4A]"
            >
              Termin buchen
            </Link>
          </div>
        </div>
        {/* Bildplatzhalter */}
        <div className="h-96 bg-[#E8E4DF] md:h-[28rem] lg:h-[32rem]">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-center px-6">
            <span className="font-display text-6xl text-[#D4CFC8]">
              Bildbereich
            </span>
          </div>
        </div>
      </section>

      {/* Philosophie – Startseite 2 & 3 */}
      <section className="border-t border-[#E8E4DF] bg-[#F5F2ED]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="font-display text-2xl leading-relaxed text-[#2D2D2D] md:text-3xl">
                Petite Maison ist ein Salon, in dem man sich Zeit füreinander
                nimmt. Für Gespräche, für Beratung und für eine Arbeit, die nicht
                zwischen Tür und Angel entsteht.
              </p>
            </div>
            <div className="space-y-6">
              <p className="text-lg leading-relaxed text-[#2D2D2D]/85">
                Uns ist wichtig, dass du dich bei uns gut aufgehoben fühlst. Wir
                nehmen uns Zeit, stellen Fragen und beraten individuell. Jeder
                Termin ist bewusst so geplant, dass deine Wünsche im Mittelpunkt
                stehen und wir unsere Arbeit mit Ruhe und Sorgfalt ausführen
                können.
              </p>
              <p className="text-lg leading-relaxed text-[#2D2D2D]/85">
                Uns ist wichtig, Wünsche und Bedürfnisse wirklich zu verstehen
                und unsere Arbeit daran auszurichten. Wir arbeiten mit Ruhe und
                Sorgfalt und legen Wert auf Ergebnisse, die sich stimmig anfühlen
                und auch nach dem Termin bestand haben.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Termine CTA – aus Salonseite */}
      <section className="bg-[#E8E4DF] py-20 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[#2D2D2D] md:text-4xl">
            Termine
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#2D2D2D]/85">
            Wir freuen uns darauf, dich bei uns begrüßen zu dürfen. Deinen
            Termin kannst du jederzeit online oder telefonisch vereinbaren. Wenn
            du uns anrufen möchtest, erreichst du uns direkt über die
            Kontaktseite.
          </p>
          <Link
            href="/kontakt?buchung=1"
            className="mt-10 inline-block rounded-full bg-[#2D2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#4A5D4A]"
          >
            Jetzt Termin buchen
          </Link>
        </div>
      </section>
    </main>
  );
}
