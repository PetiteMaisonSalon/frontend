"use client";

import { useMemo, useState } from "react";
import { STATIC_SERVICES, type StaticService } from "@/lib/staticServices";
import { TREATWELL_BOOKING_URL } from "@/lib/siteConfig";
import BookingLink from "@/components/BookingLink";

type Service = StaticService;

type VariantEntry = {
  id: string;
  label: string;
  durationMinutes: number;
  priceEur: number;
  ctaType?: "select" | "call";
  description?: string;
};

type GroupedEntry = {
  key: string;
  title: string;
  variants: VariantEntry[];
  groupDurationLabel?: string;
};

const WOMEN_SECTION_ORDER = [
  "SCHNITT & STYLING",
  "COLORATIONEN (INKL. STYLING)",
] as const;

const treatwellBtnClass =
  "inline-flex w-full items-center justify-center rounded-full border border-[#1C1612]/55 px-4 py-[7px] text-[13px] font-medium text-[#1C1612] transition hover:bg-[#1C1612]/5 md:w-auto";

function extractVariantLabel(name: string) {
  const match = name.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : "Standard";
}

function baseTitle(name: string) {
  return name.replace(/\s*\([^)]+\)\s*$/, "").trim();
}

function toDisplayTitle(name: string) {
  return baseTitle(name)
    .replace(/^Damen\s*-\s*/i, "")
    .replace(/^Herren\s*-\s*/i, "")
    .trim();
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} Std. ${m} Min.`;
  if (h > 0) return `${h} Std.`;
  return `${m} Min.`;
}

function formatPrice(value: number) {
  return `${value}€`;
}

function TreatwellBookButton({ className }: { className?: string }) {
  return (
    <a
      href={TREATWELL_BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? treatwellBtnClass}
    >
      Buchen
    </a>
  );
}

export default function LeistungenClient() {
  const services = STATIC_SERVICES;
  const [activeGender, setActiveGender] = useState<"women" | "men">("women");
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const womenSections = useMemo(() => {
    const women = services
      .filter((s) => s.category === "women")
      .sort(
        (a, b) =>
          (a.displayOrder ?? 1000) - (b.displayOrder ?? 1000) ||
          a.name.localeCompare(b.name, "de"),
      );
    const sectionMap = new Map<string, Service[]>();
    for (const s of women) {
      const section = s.displaySection || "COLORATIONEN (INKL. STYLING)";
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section)?.push(s);
    }

    const sortedSections = Array.from(sectionMap.entries()).sort((a, b) => {
      const ai = WOMEN_SECTION_ORDER.indexOf(
        a[0] as (typeof WOMEN_SECTION_ORDER)[number],
      );
      const bi = WOMEN_SECTION_ORDER.indexOf(
        b[0] as (typeof WOMEN_SECTION_ORDER)[number],
      );
      const safeAi = ai === -1 ? 999 : ai;
      const safeBi = bi === -1 ? 999 : bi;
      return safeAi - safeBi;
    });

    return sortedSections.map(([sectionLabel, rows]) => {
      const grouped = new Map<string, GroupedEntry>();
      rows.forEach((row) => {
        const key = row.groupKey || row._id;
        if (!grouped.has(key)) {
          grouped.set(key, {
            key,
            title: baseTitle(row.name),
            variants: [],
            groupDurationLabel: row.groupDurationLabel,
          });
        }
        grouped.get(key)?.variants.push({
          id: row._id,
          label: extractVariantLabel(row.name),
          durationMinutes: row.durationMinutes,
          priceEur: row.priceEur,
          ctaType: row.ctaType,
          description: row.description,
        });
      });

      return {
        label: sectionLabel,
        entries: Array.from(grouped.values()).map((entry) => ({
          ...entry,
          variants: entry.variants.sort((a, b) => a.priceEur - b.priceEur),
        })),
      };
    });
  }, [services]);

  const menEntries = useMemo(() => {
    return services
      .filter((s) => s.category === "men")
      .sort(
        (a, b) =>
          (a.displayOrder ?? 1000) - (b.displayOrder ?? 1000) ||
          a.name.localeCompare(b.name, "de"),
      )
      .map((s) => ({
        key: s._id,
        title: baseTitle(s.name),
        variants: [
          {
            id: s._id,
            label: "Standard",
            durationMinutes: s.durationMinutes,
            priceEur: s.priceEur,
            ctaType: s.ctaType,
            description: s.description,
          },
        ],
      }));
  }, [services]);

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="bg-[#EBEAE7] pb-16 font-normal [font-family:var(--font-public-sans)]">
      <section>
        <div className="mx-auto max-w-7xl px-4 md:px-6 pb-8 pt-16 md:pt-20">
          <h1
            className="text-h1 text-[#1C1612]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Unsere Leistungen
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-[#1C1612] font-semibold">
            Wir bieten Haarschnitte, Farb- und Pflegebehandlungen für Frauen und
            Männer an – immer individuell abgestimmt auf dein Haar, deinen Typ
            und deinen Alltag.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.875rem] [font-family:var(--font-public-sans)]">
            <BookingLink className="underline decoration-[#1C1612]/30 underline-offset-[6px] transition hover:decoration-[#1C1612] font-semibold">
              Online buchen
            </BookingLink>
            <a
              href="tel:+4917669150964"
              className="underline decoration-[#1C1612]/30 underline-offset-[6px] transition hover:decoration-[#1C1612] font-semibold"
            >
              Anrufen
            </a>
          </div>

          <div className="mt-16 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveGender("women")}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium leading-none ${
                activeGender === "women"
                  ? "border-[#1C1612] bg-[#1C1612] text-white"
                  : "border-[#1C1612]/55 bg-transparent text-[#1C1612]"
              }`}
            >
              Damen
            </button>
            <button
              type="button"
              onClick={() => setActiveGender("men")}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium leading-none ${
                activeGender === "men"
                  ? "border-[#1C1612] bg-[#1C1612] text-white"
                  : "border-[#1C1612]/55 bg-transparent text-[#1C1612]"
              }`}
            >
              Herren
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-2 md:px-6">
          <div className="border-[#1C1612]/40">
            {activeGender === "women" ? (
              womenSections.map((section) => (
                <div key={section.label} className="pt-5 first:pt-0">
                  <p className="text-[12px] font-medium tracking-[0.22em] text-[#524f48]">
                    {section.label}
                  </p>
                  <div className="mt-1 border-[#1C1612]/40">
                    {section.entries.map((entry) => {
                      const hasVariants = entry.variants.length > 1;
                      const isExpanded = expandedKeys[entry.key] || false;
                      const minPrice = Math.min(
                        ...entry.variants.map((v) => v.priceEur),
                      );
                      const minDuration = Math.min(
                        ...entry.variants.map((v) => v.durationMinutes),
                      );
                      const maxDuration = Math.max(
                        ...entry.variants.map((v) => v.durationMinutes),
                      );
                      const isCallRow = entry.variants.some(
                        (v) => v.ctaType === "call",
                      );
                      const durationLabel =
                        entry.groupDurationLabel ||
                        (minDuration === maxDuration
                          ? formatDuration(minDuration)
                          : `${formatDuration(minDuration)} – ${formatDuration(maxDuration)}`);

                      return (
                        <div
                          key={entry.key}
                          className="border-b border-[#1C1612]/40"
                        >
                          <div className="flex items-center justify-between gap-4 py-2.5 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:py-4">
                            <div className="min-w-0">
                              <p className="text-[14px] text-[#1C1612] font-semibold">
                                {toDisplayTitle(entry.title)}
                              </p>
                              <p className="mt-1 text-[12px] leading-snug text-[#1C1612]/65">
                                {durationLabel}
                              </p>
                            </div>
                            <div className="text-right">
                              {isCallRow ? (
                                <span className="hidden text-h3 font-display text-[#1C1612] md:inline">
                                  Auf Anfrage (telefonisch)
                                </span>
                              ) : hasVariants ? (
                                <span className="hidden text-h3 font-display tabular-nums text-[#1C1612] md:inline">
                                  ab {formatPrice(minPrice)}
                                </span>
                              ) : (
                                <span className="text-h3 font-display tabular-nums text-[#1C1612]">
                                  {formatPrice(minPrice)}
                                </span>
                              )}
                            </div>
                            {isCallRow ? (
                              <a
                                href="tel:+4917669150964"
                                className="inline-flex items-center justify-center rounded-full border border-[#1C1612]/55 px-4 py-1.75 text-[13px] font-medium text-[#1C1612] md:w-auto"
                              >
                                Anrufen
                              </a>
                            ) : hasVariants ? (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(entry.key)}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1C1612]/55 px-4 py-1.75 text-[13px] font-medium text-[#1C1612] md:w-auto"
                              >
                                {isExpanded ? "Schließen" : "Optionen"}
                                <svg
                                  aria-hidden="true"
                                  viewBox="0 0 20 20"
                                  className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`}
                                  fill="none"
                                >
                                  <path
                                    d="M5 7.5L10 12.5L15 7.5"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </button>
                            ) : (
                              <></>
                            )}
                          </div>
                          {hasVariants && isExpanded && (
                            <div className="pb-2">
                              {entry.variants.map((variant) => (
                                <div
                                  key={variant.id}
                                  className="flex items-center justify-between gap-4 border-t border-[#1C1612]/25 py-2.5 pl-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto] md:py-4 md:pl-10"
                                >
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-[#1C1612]">
                                      {variant.label}
                                    </p>
                                    <p className="mt-1 text-[12px] leading-snug text-[#1C1612]/65">
                                      {formatDuration(variant.durationMinutes)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-h3 font-display tabular-nums text-[#1C1612]">
                                      {formatPrice(variant.priceEur)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="pt-5 first:pt-0">
                <p className="text-[12px] font-medium tracking-[0.22em] text-[#524f48]">
                  SCHNITT & STYLING
                </p>
                <div className="mt-1 border-[#1C1612]/40">
                  {menEntries.map((entry) => {
                    const item = entry.variants[0];
                    return (
                      <div
                        key={entry.key}
                        className="border-b border-[#1C1612]/40"
                      >
                        <div className="flex items-center justify-between gap-4 py-2.5 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:py-4">
                          <div className="min-w-0">
                            <p className="text-[14px] text-[#1C1612] font-semibold">
                              {toDisplayTitle(entry.title)}
                            </p>
                            <p className="mt-1 text-[12px] leading-snug text-[#1C1612]/65">
                              {formatDuration(item.durationMinutes)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-h3 font-display tabular-nums text-[#1C1612]">
                              {formatPrice(item.priceEur)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
