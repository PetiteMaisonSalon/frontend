"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import BookingLink from "@/components/BookingLink";

type SectionTheme = {
  id: "salon" | "team" | "gallerie"| "aveda" ;
  bg: string;
};

const HOME_SECTIONS: SectionTheme[] = [
  { id: "salon", bg: "#EBEAE7" },
  { id: "team", bg: "#EBEAE7" },
  { id: "gallerie", bg: "#EBEAE7" },
  { id: "aveda", bg: "#BEA8FF" },
];

function dispatch(name: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export default function HomeMain() {
  const heroRef = useRef<HTMLElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const galerieRef = useRef<HTMLDivElement | null>(null);
  const [galerieIndex, setGalerieIndex] = useState(0);
  const mainLeftRef = useRef<HTMLDivElement | null>(null);
  const [mainLeftIndex, setMainLeftIndex] = useState(0);
  const galerieImages = useMemo(
    () => [
      "/gallerie/galerie_bild1.png",
      "/gallerie/galerie_bild2.png",
      "/gallerie/galerie_bild3.png",
      "/gallerie/galerie_bild4.png",
      "/gallerie/galerie_bild5.png",
      "/gallerie/galerie_bild6.png",
      "/gallerie/galerie_bild7.png",
      "/gallerie/galerie_bild8.png",
      "/gallerie/galerie_bild9.png",
      "/gallerie/galerie_bild10.png",
      "/gallerie/galerie_bild11.png",
      "/gallerie/galerie_bild12.png",
    ],
    []
  );
  const galerieSlides = useMemo(() => Math.ceil(galerieImages.length / 3), [galerieImages.length]);

  const sectionById = useMemo(() => {
    const map = new Map<string, SectionTheme>();
    for (const s of HOME_SECTIONS) map.set(s.id, s);
    return map;
  }, []);

  const mainLeftImages = useMemo(
    () => [
      "/mehtap_arbeit.png",
      "/main_leftbild1_2.jpg",
      "/main_leftbild1_3.jpg",
      "/main_leftbild1_4.avif",
    ],
    []
  );
  const mainLeftSlides = useMemo(() => mainLeftImages.length, [mainLeftImages.length]);
  const blockImageDownloadInteraction = (event: React.SyntheticEvent) => {
    event.preventDefault();
  };

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
    let rafId = 0;
    const syncActiveSection = () => {
      rafId = 0;
      const markerY = Math.min(180, window.innerHeight * 0.35);
      const current =
        sectionEls.find((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top <= markerY && rect.bottom > markerY;
        }) ||
        sectionEls
          .map((el) => ({ el, distance: Math.abs(el.getBoundingClientRect().top - markerY) }))
          .sort((a, b) => a.distance - b.distance)[0]?.el;

      const id = current?.dataset.sectionId;
      if (!id) return;
        const theme = sectionById.get(id);
        if (!theme) return;
        dispatch("pm:home:section", { id: theme.id, bg: theme.bg });
    };
    const scheduleActiveSectionSync = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(syncActiveSection);
    };

    syncActiveSection();
    window.addEventListener("scroll", scheduleActiveSectionSync, { passive: true });
    window.addEventListener("resize", scheduleActiveSectionSync);

    // Initialzustand: Hero sichtbar, damit Header korrekt startet.
    dispatch("pm:home:hero", { visible: true });

    return () => {
      heroObserver.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleActiveSectionSync);
      window.removeEventListener("resize", scheduleActiveSectionSync);
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
          <BookingLink
            className="text-copy mt-10 inline-block rounded-full border border-white bg-transparent px-10 py-4 font-medium text-white transition hover:bg-white/10"
          >
            Jetzt buchen
          </BookingLink>
        </div>
      </section>

      {/* MAIN (Viewport 2+) — Bild links · Intro rechts, am Rand */}
      <section
        id="salon"
        data-section-id="salon"
        ref={(el) => {
          sectionRefs.current.salon = el;
        }}
        className="pm-home-section bg-[#EBEAE7] px-4 py-20 md:py-24"
      >
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full shrink-0 lg:w-[min(48vw,540px)]">
            <div className="relative aspect-[15/12] w-full overflow-hidden bg-[#E8E4DF]">
              <div
                ref={mainLeftRef}
                className="no-scrollbar absolute inset-0 overflow-x-auto scroll-smooth snap-x snap-mandatory"
                onScroll={() => {
                  const el = mainLeftRef.current;
                  if (!el) return;
                  const idx = Math.round(el.scrollLeft / el.clientWidth);
                  if (idx !== mainLeftIndex) setMainLeftIndex(idx);
                }}
              >
                <div className="flex h-full w-full">
                  {mainLeftImages.map((src) => (
                    <div key={src} className="relative h-full w-full flex-none snap-start">
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Indicators + Buttons (unter dem Bild) */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2" aria-hidden>
                {mainLeftImages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-px w-8 ${i === mainLeftIndex ? "bg-[#2D2D2D]/60" : "bg-[#2D2D2D]/20"}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Zurück"
                  className="grid h-10 w-16 place-items-center text-[#2D2D2D] transition hover:opacity-70 disabled:opacity-30"
                  onClick={() => {
                    const el = mainLeftRef.current;
                    if (!el) return;
                    const next = Math.max(0, mainLeftIndex - 1);
                    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
                    setMainLeftIndex(next);
                  }}
                  disabled={mainLeftIndex === 0}
                >
                  <svg
                    width="64"
                    height="16"
                    viewBox="0 0 64 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M12 2L2 8l10 6M4 8h58"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Weiter"
                  className="grid h-10 w-16 place-items-center text-[#2D2D2D] transition hover:opacity-70 disabled:opacity-30"
                  onClick={() => {
                    const el = mainLeftRef.current;
                    if (!el) return;
                    const next = Math.min(mainLeftSlides - 1, mainLeftIndex + 1);
                    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
                    setMainLeftIndex(next);
                  }}
                  disabled={mainLeftIndex >= mainLeftSlides - 1}
                >
                  <svg
                    width="64"
                    height="16"
                    viewBox="0 0 64 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M52 2l10 6-10 6M2 8h58"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="shrink-0 lg:max-w-[min(42vw,32rem)]">
            <p className="text-intro text-[#2D2D2D]">
              Petite Maison ist ein Salon, in dem man sich Zeit füreinander nimmt.
              Für Gespräche, für Beratung und für eine Arbeit, mit Liebe zum Detail,
              die nicht zwischen Tür und Angel entsteht.
            </p>
          </div>
        </div>
      </section>

      {/* Salon-Story unten: Text links · Bild rechts */}
      <section id="salon-info" className="bg-[#EBEAE7] px-4 pb-24 pt-8 md:pb-32 md:pt-12">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="shrink-0 lg:max-w-[34rem]">
            <p className="text-copy leading-relaxed text-[#2D2D2D]/85">
              Uns ist wichtig, dass du dich bei uns gut aufgehoben fühlst. Wir nehmen
              uns Zeit, stellen Fragen und beraten individuell. Jeder Termin ist bewusst
              so geplant, dass deine Wünsche im Mittelpunkt stehen und wir unsere Arbeit
              mit Ruhe und Sorgfalt ausführen können.
            </p>
            <BookingLink
              className="text-copy mt-8 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
            >
              Jetzt Termin buchen
            </BookingLink>
          </div>
          <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#EBEAE7] lg:w-[min(32vw,26rem)]">
            <Image
              src="/main_rightbild.png"
              alt=""
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 32vw, 100vw"
            />
          </div>
        </div>
      </section>

      {/* Unsere Leistungen */}
      <section className="pm-home-section bg-[#EBEAE7]" aria-labelledby="home-services-heading">
        <div className="px-4 py-32 text-center md:py-40">
          <p className="text-copy-sm font-medium tracking-[0.04em] text-[#2D2D2D]/100">
            Unsere Leistungen
          </p>
          <h2
            id="home-services-heading"
            className="text-intro mx-auto mt-6 max-w-[420px] text-[#2D2D2D]"
          >
            Wir bieten Haarschnitte, Farb- und Pflegebehandlungen für Frauen und Männer an —
            immer individuell abgestimmt auf dein Haar, deinen Typ und deinen Alltag.
          </h2>
          <div className="mt-10 flex items-center justify-center gap-8 text-copy-sm">
            <BookingLink
              className="font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
            >
              Jetzt buchen
            </BookingLink>
            <Link
              href="/leistungen"
              className="font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
            >
              Zur Leistungsübersicht
            </Link>
          </div>
        </div>
      </section>

      <section
        className="pm-home-section bg-[#EBEAE7] px-4 py-20 md:py-28"
        aria-labelledby="home-services-cards-heading"
      >
        <h2 id="home-services-cards-heading" className="sr-only">
          Leistungen im Überblick
        </h2>
        <div className="mx-auto grid max-w-[68rem] gap-5 md:grid-cols-3 md:gap-5 lg:gap-6">
          {[
            {
              icon: "/schere_new.png",
              title: "Haarschnitt & Styling",
              description:
                "Präzise Schnitte für jeden Typ – vom klassischen Look bis zum modernen Statement.",
            },
            {
              icon: "/farbe_new.png",
              title: "Farbe & Highlights",
              description:
                "Natürlich oder ausdrucksstark: Wir finden den Farbton, der wirklich zu dir passt.",
            },
            {
              icon: "/hand_new.png",
              title: "Pflege & individuelle Beratung",
              description:
                "Wir schauen genau hin, was dein Haar braucht und beraten dich ehrlich und ohne Umwege.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="flex flex-col items-center rounded-[28px] bg-white px-7 py-12 text-center transition-colors duration-300 ease-out hover:bg-[#BEA8FF] md:px-8 md:py-14"
            >
              <div className="relative h-24 w-28 shrink-0">
                <Image
                  src={card.icon}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="112px"
                />
              </div>
              <h3 className="text-h3 mt-8 text-[#2D2D2D]">{card.title}</h3>
              <p className="text-copy-sm mt-5 max-w-[15rem] leading-relaxed text-[#2D2D2D]/75">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pm-home-section bg-[#EBEAE7] px-4 py-32 md:py-40">
        <div className="mx-auto max-w-[28rem] text-center lg:max-w-[35rem]">
          <p className="text-copy font-medium tracking-[0.04em] text-[#1a1a1a]/100">
            Unser Team
          </p>
          <p className="text-intro mt-6 text-[#1a1a1a]">
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
        className="pm-home-section bg-[#EBEAE7] px-4 pb-28 pt-6 md:pb-36"
        aria-labelledby="home-team-heading"
      >
        <h2 id="home-team-heading" className="sr-only">
          Team
        </h2>

        <div className="flex flex-col gap-24 md:gap-32 lg:gap-40">
          {/* Mehtap — links */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-start">
            <div className="relative aspect-[16/15] w-full shrink-0 overflow-hidden bg-transparent lg:w-[min(48vw,560px)]">
              <Image
                src="/mehtap.png"
                alt="Mehtap"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 48vw, 100vw"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-[340px] lg:pt-2">
              <h3 className="text-h2 text-[#2D2D2D]">Mehtap</h3>
              <p className="text-copy-sm mt-4 font-medium leading-relaxed text-[#2D2D2D]/85">
                Ich bin Mehtap, Friseurmeisterin und Inhaberin von Petite Maison. Seit vielen Jahren arbeite ich
                in diesem Beruf und habe früh gemerkt, dass mir der persönliche Umgang mit Menschen genauso
                wichtig ist wie das Handwerk selbst.
              </p>
              <p className="text-copy-sm mt-5 font-medium leading-relaxed text-[#2D2D2D]/85">
                Für mich bedeutet Friseurhandwerk, Verantwortung zu übernehmen — für Entscheidungen, für Wünsche
                und für das Vertrauen, das mir entgegengebracht wird. Diese Haltung prägt meine tägliche Arbeit
                und den Salon als Ganzes.
              </p>
           
            </div>
          </article>

          {/* Maria — rechts */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-end">
            <div className="lg:max-w-[340px] lg:pt-2">
              <h3 className="text-h2 text-[#2D2D2D]">Maria</h3>
              <p className="text-copy-sm mt-4 leading-relaxed text-[#2D2D2D]/85">
                Maria ist unsere Schnittspezialistin! Sie ist seit 35 Jahren Friseurin mit Leidenschaft und hat
                31 Jahre für den Starfriseur Jaques Le Coz gearbeitet. Maria isst gerne Tapas und tanzt
                leidenschaftlich Rumba. Seit Anfang 2022 gehört sie zum Team dazu.
              </p>
         
            </div>
            <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-transparent lg:w-[17.5rem]">
              <Image
                src="/maria.png"
                alt="Maria"
                fill
                className="object-cover grayscale"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
          </article>

          {/* Sevim — links */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-start">
            <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-transparent lg:w-[17.5rem]">
              <Image
                src="/sevim.png"
                alt="Sevim"
                fill
                className="object-cover"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-[340px] lg:pt-2">
              <h3 className="text-h2 text-[#2D2D2D]">Sevim</h3>
              <p className="text-copy-sm mt-4 leading-relaxed text-[#2D2D2D]/85">
                Sevim ist unsere Farbspezialistin! Sie liebt es, mit Haaren zu experimentieren, einschließlich
                ihren Haaren. Zwölf Jahre lang hat sie beim Starfriseur Jaques Le Coz gearbeitet und ist seit
                Anfang 2022 bei Petite Maison.
              </p>
            
            </div>
          </article>

          {/* Masoud — rechts */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-end">
            <div className="lg:max-w-[340px] lg:pt-2">
              <h3 className="text-h2 text-[#2D2D2D]">Masoud</h3>
              <p className="text-copy-sm mt-4 leading-relaxed text-[#2D2D2D]/85">
                Masoud ist spezialisiert auf präzise Schnitte und Farbtechniken. Geboren im Iran, ausgebildet
                auf zwei Kontinenten, ist er seit über 20 Jahren Friseur und seit Ende 2025 bei Petite Maison.
                Als zertifizierter Aveda-Spezialist schwört er auf natürliche, nachhaltige Produkte.
              </p>
           
            </div>
            <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-transparent lg:w-[17.5rem]">
              <Image
                src="/masoud.png"
                alt="Masoud"
                fill
                className="object-cover grayscale"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
          </article>

          {/* Sarah — links */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-start">
            <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-transparent lg:w-[17.5rem]">
              <Image
                src="/sarah.png"
                alt="Sarah"
                fill
                className="object-cover"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-[340px] lg:pt-2">
              <h3 className="text-h2 text-[#2D2D2D]">Sarah</h3>
              <p className="text-copy-sm mt-4 leading-relaxed text-[#2D2D2D]/85">
                Sarah ist spezialisiert auf Haarschnitte, Styling und natürliche Färbungen. Seit über 15 Jahren
                arbeitet sie mit Aveda-Produkten, 2022 hat sie ihren Meister gemacht — unter anderem lebte und
                arbeitete sie in Wien. Seit November 2024 ist sie bei Petite Maison. Ihr Hund Cooper gehört im
                Salon quasi zum Team.
              </p>
          
            </div>
          </article>

          {/* Kanj — rechts */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-end">
            <div className="lg:max-w-[340px] lg:pt-2">
              <h3 className="text-h2 text-[#2D2D2D]">Kanj</h3>
              <p className="text-copy-sm mt-4 leading-relaxed text-[#2D2D2D]/85">
                Kanj ist spezialisiert auf Strähnen, Balayage und Schnitte. Er hat 2016 im Libanon seine
                Ausbildung gemacht und ist seit August 2025 fester Bestandteil des Teams. Nebenbei spielt er
                libanesische Flöte, tritt mit seiner eigenen Band bei Festivals und Hochzeiten auf und war
                bereits im libanesischen Fernsehen zu sehen.
              </p>
           
            </div>
            <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-transparent lg:w-[17.5rem]">
              <Image
                src="/kanj.png"
                alt="Kanj"
                fill
                className="object-cover grayscale"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
          </article>

          {/* Cooper — links */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-start">
            <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-transparent lg:w-[17.5rem]">
              <Image
                src="/cooper.png"
                alt="Cooper"
                fill
                className="object-cover"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-[340px] lg:pt-2">
              <h3 className="text-h2 text-[#2D2D2D]">Cooper</h3>
              <p className="text-copy-sm mt-4 leading-relaxed text-[#2D2D2D]/85">
                Cooper ist spezialisiert auf gute Laune und ist als Sarahs treuer Begleiter fester Bestandteil
                des Salons.
              </p>
          
            </div>
          </article>
        </div>
      </section>

      {/* GALLERIE (Carousel wie Screenshot) */}
      <section
        id="gallerie"
        data-section-id="gallerie"
        ref={(el) => {
          sectionRefs.current.gallerie = el;
        }}
        className="pm-home-section bg-[#EBEAE7] pb-0 pt-6"
        aria-label="Galerie"
      >
        <div className="w-full">
          <div className="flex items-center justify-end gap-3 px-4 pb-4 md:pb-6">
            <button
              type="button"
              aria-label="Zurück"
              className="grid h-10 w-16 place-items-center text-[#2D2D2D] transition hover:opacity-70 disabled:opacity-30"
              onClick={() => {
                const el = galerieRef.current;
                if (!el) return;
                const next = Math.max(0, galerieIndex - 1);
                el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
                setGalerieIndex(next);
              }}
              disabled={galerieIndex === 0}
            >
              <svg
                width="64"
                height="16"
                viewBox="0 0 64 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M12 2L2 8l10 6M4 8h58"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Weiter"
              className="grid h-10 w-16 place-items-center text-[#2D2D2D] transition hover:opacity-70 disabled:opacity-30"
              onClick={() => {
                const el = galerieRef.current;
                if (!el) return;
                const next = Math.min(galerieSlides - 1, galerieIndex + 1);
                el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
                setGalerieIndex(next);
              }}
              disabled={galerieIndex >= galerieSlides - 1}
            >
              <svg
                width="64"
                height="16"
                viewBox="0 0 64 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M52 2l10 6-10 6M2 8h58"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div
            ref={galerieRef}
            className="no-scrollbar overflow-x-auto scroll-smooth snap-x snap-mandatory"
            onScroll={() => {
              const el = galerieRef.current;
              if (!el) return;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== galerieIndex) setGalerieIndex(idx);
            }}
          >
            <div className="flex w-full">
              {galerieImages
                .reduce<string[][]>((acc, src, i) => {
                  const groupIndex = Math.floor(i / 3);
                  if (!acc[groupIndex]) acc[groupIndex] = [];
                  acc[groupIndex].push(src);
                  return acc;
                }, [])
                .map((group, groupIdx) => (
                  <div
                    key={group.join("|")}
                    className="w-full flex-none snap-start"
                    aria-label={`Galerie Seite ${groupIdx + 1}`}
                  >
                    <div className="grid gap-4 px-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-0 lg:px-4">
                      {group.map((src) => (
                        <div
                          key={src}
                          className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBEAE7]"
                          onContextMenu={blockImageDownloadInteraction}
                          onDragStart={blockImageDownloadInteraction}
                        >
                          <Image
                            src={src}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                            draggable={false}
                            onContextMenu={blockImageDownloadInteraction}
                            onDragStart={blockImageDownloadInteraction}
                          />
                        </div>
                      ))}
                      {/* Fülle auf 3 Slots auf Desktop auf, damit Breiten immer gleich bleiben */}
                      {group.length < 3 &&
                        Array.from({ length: 3 - group.length }).map((_, idx) => (
                          <div
                            key={`empty-${groupIdx}-${idx}`}
                            className="hidden aspect-[3/4] w-full bg-[#EBEAE7] lg:block"
                            aria-hidden
                          />
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* AVEDA (lila) — wie Screenshot */}
      <section
        id="aveda"
        data-section-id="aveda"
        ref={(el) => {
          sectionRefs.current.aveda = el;
        }}
        className="pm-home-section bg-[#BEA8FF] px-4 pb-28 pt-24 md:pb-36 md:pt-28"
        aria-labelledby="home-aveda-heading"
      >
        <div className="mx-auto w-full max-w-[32rem] text-center min-[1400px]:max-w-[38rem]">
          <p className="text-copy-sm font-bold text-[#2D2D2D]">Aveda</p>
          <h2 id="home-aveda-heading" className="text-intro mt-4 text-[#2D2D2D]">
            Als Aveda-Salon arbeiten wir mit
            <br className="hidden lg:inline" />
            Produkten, die nicht nur deinem Haar
            <br className="hidden lg:inline" />
            guttun, sondern auch der Umwelt.
          </h2>
        </div>

        {/* Mobile / Tablet */}
        <div className="mt-16 flex flex-col gap-14 lg:hidden">
          <div className="relative aspect-square w-full max-w-[20rem] overflow-hidden bg-white/30">
            <Image
              src="/aveda_bild1.png"
              alt=""
              fill
              className="object-cover grayscale"
              sizes="100vw"
            />
          </div>
          <p className="text-intro text-[#2D2D2D]">
            Aveda wurde mit der Vision gegründet, Schönheit und Nachhaltigkeit zu verbinden.
            Die Marke setzt auf pflanzliche Inhaltsstoffe, recycelbare Verpackungen und einen
            respektvollen Umgang mit der Natur.
          </p>
          <p className="text-copy leading-relaxed text-[#2D2D2D]/85">
            Diese Haltung passt zu unserer Arbeit: verantwortungsvoll, achtsam und mit echtem
            Anspruch an Qualität. Wir sind stolz darauf, dir Produkte anbieten zu können, die genau
            das widerspiegeln – und freuen uns, diese Werte gemeinsam mit unseren Kunden zu leben.
            Unsere Aveda-Produkte kannst du übrigens nicht nur bei uns erleben, sondern auch direkt
            im Salon erwerben.
          </p>
          <div className="relative ml-auto aspect-square w-full max-w-[18rem] overflow-hidden bg-white/30">
            <Image
              src="/aveda_bild2.png"
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>

        {/* Desktop — 2×2 Grid, keine Überlappung */}
        <div className="mt-24 hidden lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-40 xl:gap-y-48">
          <figure className="relative aspect-square w-[20rem] justify-self-start overflow-hidden bg-white/30">
            <Image
              src="/aveda_bild1.png"
              alt=""
              fill
              className="object-cover grayscale"
              sizes="20rem"
            />
          </figure>

          <div className="w-[28rem] justify-self-end min-[1400px]:w-[28rem]">
            <p className="text-intro text-[#2D2D2D]">
              Aveda wurde mit der Vision gegründet,{" "}
              Schönheit und Nachhaltigkeit zu
              verbinden. Die Marke setzt auf
              pflanzliche Inhaltsstoffe, recycelbare{" "}
              Verpackungen und einen respektvollen
              <br className="hidden lg:inline" />
              Umgang mit der Natur.
            </p>
          </div>

          <div className="max-w-[32rem] justify-self-start self-end">
            <p className="text-copy leading-relaxed text-[#2D2D2D]/85">
              Diese Haltung passt zu unserer Arbeit: verantwortungsvoll, achtsam und mit{" "}
              <br />
              echtem Anspruch an Qualität. Wir sind stolz darauf, dir Produkte anbieten zu{" "}
              <br />
              können, die genau das widerspiegeln – und freuen uns, diese Werte{" "}
              <br />
              gemeinsam mit unseren Kunden zu leben. Unsere Aveda-Produkte kannst du{" "}
              <br />
              übrigens nicht nur bei uns erleben, sondern auch direkt im Salon erwerben.
            </p>
          </div>

          <figure className="relative aspect-square w-[18rem] justify-self-end self-end overflow-hidden bg-white/30">
            <Image
              src="/aveda_bild2.png"
              alt=""
              fill
              className="object-cover"
              sizes="18rem"
            />
          </figure>
        </div>
      </section>

      {/* Bildstreifen + 2er-Grid (wie Screenshot, vor Footer) */}
      <section className="bg-[#EBEAE7]" aria-label="Impressionen">
        <div className="relative h-92 w-full overflow-hidden sm:h-80 md:h-[460px] lg:h-[820px]">
          <Image
            src="/salon.png"
            alt=""
            fill
            className="object-cover grayscale"
            sizes="100vw"
          />
        </div>

      </section>
    </main>
  );
}

