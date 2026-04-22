"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

type SectionTheme = {
  id: "salon" | "team" | "aveda";
  bg: string;
};

const HOME_SECTIONS: SectionTheme[] = [
  { id: "salon", bg: "#F1EEE9" },
  { id: "team", bg: "#F1EEE9" },
  { id: "aveda", bg: "#BEA8FF" },
];

function dispatch(name: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export default function HomeMain() {
  const heroRef = useRef<HTMLElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const sectionById = useMemo(() => {
    const map = new Map<string, SectionTheme>();
    for (const s of HOME_SECTIONS) map.set(s.id, s);
    return map;
  }, []);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        dispatch("pm:home:hero", { visible: entry.isIntersecting });
      },
      { threshold: 0.25 }
    );
    heroObserver.observe(heroEl);

    const sectionEls = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        // Nimm die Section mit der größten Sichtbarkeit.
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!best?.target) return;
        const id = (best.target as HTMLElement).dataset.sectionId;
        if (!id) return;
        const theme = sectionById.get(id);
        if (!theme) return;
        dispatch("pm:home:section", { id: theme.id, bg: theme.bg });
      },
      { threshold: [0.25, 0.4, 0.6] }
    );

    for (const el of sectionEls) sectionObserver.observe(el);

    // Initialzustand: Hero sichtbar, damit Header korrekt startet.
    dispatch("pm:home:hero", { visible: true });

    return () => {
      heroObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, [sectionById]);

  return (
    <main className="relative">
      {/* HERO (Viewport 1) */}
      <section
        ref={(el) => {
          heroRef.current = el;
        }}
        className="relative flex min-h-[100dvh] min-h-screen flex-col"
      >
        <Image
          src="/header_bg.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/25" aria-hidden />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-28 text-center md:pb-32 md:pt-36">
          <h1 className="text-h1 max-w-3xl text-white">
            Deine Haare sind
            <br className="hidden md:block" />
            Vertrauenssache.
          </h1>
          <Link
            href="/buchung"
            className="text-copy mt-10 inline-block rounded-full border border-white bg-transparent px-10 py-4 font-medium text-white transition hover:bg-white/10"
          >
            Jetzt buchen
          </Link>
        </div>
      </section>

      {/* MAIN (Viewport 2+) — wie Screenshot: viel Weißraum, Bild + Text */}
      <section
        id="salon"
        data-section-id="salon"
        ref={(el) => {
          sectionRefs.current.salon = el;
        }}
        className="pm-home-section bg-[#F1EEE9] px-6 py-20 md:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-start gap-12 md:gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8E4DF]">
            <Image
              src="/main_left_bild.png"
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <div className="max-w-xl">
            <p className="text-h2 text-[#2D2D2D]">
              Petite Maison ist ein Salon, in dem man sich Zeit füreinander nimmt.
              Für Gespräche, für Beratung und für eine Arbeit, mit Liebe zum Detail,
              die nicht zwischen Tür und Angel entsteht.
            </p>
          </div>
        </div>
      </section>

      {/* Zwischen-Section (Teil der Salon-Story, nicht der #team Anchor) */}
      <section id="salon-info" className="bg-[#F1EEE9] px-6 pb-24">
        <div className="mx-auto grid max-w-7xl items-end gap-12 md:gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-xl">
            <p className="text-copy leading-relaxed text-[#2D2D2D]/85">
              Uns ist wichtig, dass du dich bei uns gut aufgehoben fühlst. Wir nehmen
              uns Zeit, stellen Fragen und beraten individuell. Jeder Termin ist bewusst
              so geplant, dass deine Wünsche im Mittelpunkt stehen und wir unsere Arbeit
              mit Ruhe und Sorgfalt ausführen können.
            </p>
            <Link
              href="/buchung"
              className="text-copy mt-8 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
            >
              Jetzt Termin buchen
            </Link>
          </div>
          <div className="relative aspect-square w-full overflow-hidden bg-[#E8E4DF]">
            <Image
              src="/main_right_bild.png"
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </section>

      {/* Unsere Leistungen (wie Screenshot: Bild oben + zentrierter Text) */}
      <section className="pm-home-section bg-[#F1EEE9]" aria-labelledby="home-services-heading">
      
        <div className="px-6 py-20 text-center md:py-24">
          <p className="text-overline text-[#2D2D2D]/70">Unsere Leistungen</p>
          <h2 id="home-services-heading" className="text-h2 mx-auto mt-6 max-w-3xl text-[#2D2D2D]">
            Wir bieten Haarschnitte, Farb- und Pflegebehandlungen für Frauen und Männer an —
            immer individuell abgestimmt auf dein Haar, deinen Typ und deinen Alltag.
          </h2>
          <div className="text-copy mt-10 flex items-center justify-center gap-6">
            <Link
              href="/buchung"
              className="font-medium text-[#2D2D2D] underline underline-offset-4 transition hover:opacity-80"
            >
              Jetzt buchen
            </Link>
            <Link
              href="/leistungen"
              className="font-medium text-[#2D2D2D] underline underline-offset-4 transition hover:opacity-80"
            >
              Zur Leistungsübersicht
            </Link>
          </div>
        </div>
      </section>

      <section
        className="pm-home-section bg-[#F1EEE9] px-6 py-16 md:py-20"
        aria-labelledby="home-services-cards-heading"
      >
        <h2 id="home-services-cards-heading" className="sr-only">
          Leistungen im Überblick
        </h2>
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3 md:gap-8">
          {[
            {
              icon: "/schere.png",
              title: "Haarschnitt & Styling",
            },
            {
              icon: "/farbe.png",
              title: "Farbe & Highlights",
            },
            {
              icon: "/hand.png",
              title: "Pflege & individuelle Beratung",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="flex flex-col items-center rounded-[28px] bg-white px-8 py-10 text-center shadow-sm transition-colors duration-300 ease-out hover:bg-[#BEA8FF]"
            >
              <div className="relative h-28 w-28">
                <Image
                  src={card.icon}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="112px"
                />
              </div>
              <h3 className="text-h3 mt-8 text-[#1a1a1a]">
                {card.title}
              </h3>
              <Link
                href="/buchung"
                className="text-copy mt-6 font-medium text-[#1a1a1a] underline underline-offset-4 transition hover:opacity-80"
              >
                Jetzt buchen
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="pm-home-section bg-[#F1EEE9] px-6 pb-24 pt-4 md:pb-28 md:pt-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-overline text-[#1a1a1a]/85">Unser Team</p>
          <p className="text-h2 mt-10 text-[#1a1a1a]">
            Was uns verbindet, ist die Freude am Handwerk, ein ruhiger Arbeitsstil und der
            Wunsch, eine Atmosphäre zu schaffen, in der man sich wohl und ernst genommen
            fühlt.
          </p>
        </div>
      </section>

      {/* TEAM / Mitarbeiter (Anchor + Submenu Ziel) — Bilder vorerst Platzhalter */}
      <section
        id="team"
        data-section-id="team"
        ref={(el) => {
          sectionRefs.current.team = el;
        }}
        className="pm-home-section bg-[#F1EEE9] px-6 pb-28 pt-6 md:pb-36"
        aria-labelledby="home-team-heading"
      >
        <h2 id="home-team-heading" className="sr-only">
          Team
        </h2>

        <div className="mx-auto max-w-7xl space-y-24 md:space-y-32">
          {[
            {
              name: "Mehtap",
              image: { src: "/mehtap.avif", alt: "Mehtap" },
              text: [
                "Ich bin Mehtap, Friseurmeisterin und Inhaberin von Petite Maison. Seit vielen Jahren arbeite ich in diesem Beruf und habe früh gemerkt, dass mir der persönliche Umgang mit Menschen genauso wichtig ist wie das Handwerk selbst.",
                "Für mich bedeutet Friseurhandwerk, Verantwortung zu übernehmen — für Entscheidungen, für Wünsche und für das Vertrauen, das mir entgegengebracht wird. Diese Haltung prägt meine tägliche Arbeit und den Salon als Ganzes.",
              ],
              layout: { img: "lg:col-span-7", body: "lg:col-span-5" },
              aspect: "aspect-[4/3]",
              offset: "",
            },
            {
              name: "Maria",
              image: { src: "/maria.avif", alt: "Maria", grayscale: true },
              text: [
                "Maria ist unsere Schnittspezialistin! Sie ist seit 35 Jahren Friseurin mit Leidenschaft und hat 31 Jahre für den Starfriseur Jaques Le Coz gearbeitet. Maria isst gerne Tapas und tanzt leidenschaftlich Rumba. Seit Anfang 2022 gehört sie zum Team dazu.",
              ],
              layout: { img: "lg:col-span-4 lg:col-start-6", body: "lg:col-span-3 lg:col-start-10" },
              aspect: "aspect-[4/3]",
              offset: "lg:pt-24",
            },
            {
              name: "Sevim",
              image: { src: "/sevim.avif", alt: "Sevim" },
              text: [
                "Sevim ist unsere Farbspezialistin! Sie liebt es, mit Haaren zu experimentieren, einschließlich ihren Haaren. Zwölf Jahre lang hat sie beim Starfriseur Jaques Le Coz gearbeitet und ist seit Anfang 2022 bei Petite Maison.",
              ],
              layout: { img: "lg:col-span-4", body: "lg:col-span-4 lg:col-start-6" },
              aspect: "aspect-[5/4]",
              offset: "",
            },
            {
              name: "Masoud",
              image: { src: "/masoud.avif", alt: "Masoud", grayscale: true },
              text: [
                "Masoud ist spezialisiert auf präzise Schnitte und Farbtechniken. Geboren im Iran, ausgebildet auf zwei Kontinenten, ist er seit über 20 Jahren Friseur und seit Ende 2025 bei Petite Maison. Als zertifizierter Aveda-Spezialist schwört er auf natürliche, nachhaltige Produkte.",
              ],
              layout: { img: "lg:col-span-4 lg:col-start-6", body: "lg:col-span-3 lg:col-start-10" },
              aspect: "aspect-[5/4]",
              offset: "lg:pt-8",
            },
            {
              name: "Sarah",
              image: { src: "/sarah.avif", alt: "Sarah" },
              text: [
                "Sarah ist spezialisiert auf Haarschnitte, Styling und natürliche Färbungen. Seit über 15 Jahren arbeitet sie mit Aveda-Produkten, 2022 hat sie ihren Meister gemacht — unter anderem lebte und arbeitete sie in Wien. Seit November 2024 ist sie bei Petite Maison. Ihr Hund Cooper gehört im Salon quasi zum Team.",
              ],
              layout: { img: "lg:col-span-4", body: "lg:col-span-4 lg:col-start-5" },
              aspect: "aspect-[5/4]",
              offset: "lg:pt-10",
            },
            {
              name: "Kanj",
              image: { src: "/kanj.avif", alt: "Kanj", grayscale: true },
              text: [
                "Kanj ist spezialisiert auf Strähnen, Balayage und Schnitte. Er hat 2016 in Libanon seine Ausbildung gemacht und ist seit August 2025 fester Bestandteil des Teams. Nebenbei spielt er libanesische Flöte, tritt mit seiner eigenen Band bei Festivals und Hochzeiten auf und war bereits im libanesischen Fernsehen zu sehen.",
              ],
              layout: { img: "lg:col-span-4 lg:col-start-6", body: "lg:col-span-3 lg:col-start-10" },
              aspect: "aspect-[5/4]",
              offset: "lg:pt-6",
            },
            {
              name: "Cooper",
              image: { src: "/cooper.avif", alt: "Cooper" },
              text: [
                "Cooper ist spezialisiert auf gute Laune und ist als Sarahs treuer Begleiter fester Bestandteil des Salons.",
              ],
              layout: { img: "lg:col-span-6", body: "lg:col-span-4 lg:col-start-7" },
              aspect: "aspect-[4/3]",
              offset: "lg:pt-10",
            },
          ].map((p) => (
            <article key={p.name} className={`grid items-start gap-10 lg:grid-cols-12 lg:gap-20 ${p.offset}`}>
              <div className={p.layout.img}>
                <div className={`relative w-full overflow-hidden bg-white/70 ${p.aspect}`}>
                  <Image
                    src={p.image.src}
                    alt={p.image.alt}
                    fill
                    className={`object-cover ${p.image.grayscale ? "grayscale" : ""}`}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                  />
                </div>
              </div>
              <div className={p.layout.body}>
                <h3 className="text-h3 text-[#2D2D2D]">
                  {p.name}
                </h3>
                {p.text.map((t) => (
                  <p
                    key={t.slice(0, 18)}
                    className="text-copy mt-5 leading-relaxed text-[#2D2D2D]/85"
                  >
                    {t}
                  </p>
                ))}
                <Link
                  href="/buchung"
                  className="text-copy mt-6 inline-block font-medium text-[#2D2D2D] underline underline-offset-4 transition hover:opacity-80"
                >
                  Jetzt buchen
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* AVEDA (lila) — wie Screenshot */}
      <section
        id="aveda"
        data-section-id="aveda"
        ref={(el) => {
          sectionRefs.current.aveda = el;
        }}
        className="pm-home-section bg-[#BEA8FF] px-6 pb-28 pt-24 md:pb-36 md:pt-28"
        aria-labelledby="home-aveda-heading"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-overline text-[#2D2D2D]/70">Aveda</p>
            <h2
              id="home-aveda-heading"
              className="text-h2 mt-6 text-[#2D2D2D]"
            >
              Als Aveda-Salon arbeiten wir mit Produkten, die nicht nur deinem Haar guttun,
              sondern auch der Umwelt.
            </h2>
          </div>

          <div className="mt-20 grid items-start gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-6">
              <div className="relative aspect-square w-full overflow-hidden bg-white/30">
                <Image
                  src="/aveda_bild1.png"
                  alt=""
                  fill
                  className="object-cover grayscale"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </div>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <p className="text-overline text-[#2D2D2D]/70">Aveda Philosophie</p>
              <p className="text-h2 mt-4 text-[#2D2D2D]">
                Aveda wurde mit der Vision gegründet, Schönheit und Nachhaltigkeit zu verbinden.
                Die Marke setzt auf pflanzliche Inhaltsstoffe, recycelbare Verpackungen und einen
                respektvollen Umgang mit der Natur.
              </p>
            </div>
          </div>

          <div className="mt-24 grid items-end gap-10 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-7">
              <p className="text-copy max-w-xl leading-relaxed text-[#2D2D2D]/85">
                Diese Haltung passt zu unserer Arbeit: verantwortungsvoll, achtsam und mit echtem
                Anspruch an Qualität. Wir sind stolz darauf, Produkte anbieten zu können, die genau
                das widerspiegeln — und freuen uns, diese Werte gemeinsam mit unseren Kunden zu
                leben. Unsere Aveda-Produkte kannst du übrigens nicht nur bei uns erleben, sondern
                auch direkt im Salon erwerben.
              </p>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <div className="relative aspect-square w-full overflow-hidden bg-white/30">
                <Image
                  src="/aveda_bild2.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bildstreifen + 2er-Grid (wie Screenshot, vor Footer) */}
      <section className="bg-[#F1EEE9]" aria-label="Impressionen">
        <div className="relative h-64 w-full overflow-hidden sm:h-72 md:h-96 lg:h-[520px]">
          <Image
            src="/salon.png"
            alt=""
            fill
            className="object-cover grayscale"
            sizes="100vw"
          />
        </div>
        <div className="bg-[#F1EEE9] px-3 py-3 sm:px-4 sm:py-4 lg:px-0 lg:py-0">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:gap-4 lg:gap-px lg:bg-[#F1EEE9]">
            <div className="relative aspect-square w-full overflow-hidden bg-[#F1EEE9]">
              <Image
                src="/aveda_bild1.png"
                alt=""
                fill
                className="object-cover grayscale"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="relative aspect-square w-full overflow-hidden bg-[#F1EEE9]">
              <Image
                src="/footer_bild_1.png"
                alt=""
                fill
                className="object-cover grayscale"
                sizes="(min-width: 1024px) 50vw, 100vw"
                quality={100}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

