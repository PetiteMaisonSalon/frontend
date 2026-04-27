"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { getServices } from "@/lib/api";
import BuchungsFlow from "@/components/BuchungsFlow";

type Service = {
  _id: string;
  category: "women" | "men" | "unisex";
  name: string;
  description?: string;
  durationMinutes: number;
  priceEur: number;
  displaySection?: string;
  displayOrder?: number;
  groupKey?: string;
  groupDurationLabel?: string;
  ctaType?: "select" | "call";
};

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

function extractVariantLabel(name: string) {
  const match = name.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : "Standard";
}

function baseTitle(name: string) {
  return name.replace(/\s*\([^)]+\)\s*$/, "").trim();
}

function toDisplayTitle(name: string) {
  return baseTitle(name).replace(/^Damen\s*-\s*/i, "").replace(/^Herren\s*-\s*/i, "").trim();
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

function selectedServiceTitle(s: Service) {
  const match = s.name.match(/\(([^)]+)\)\s*$/);
  const suffix = match ? match[1].trim() : "";
  const title = baseTitle(s.name);

  return suffix ? `${toDisplayTitle(title)} (${suffix})` : toDisplayTitle(title);
}

export default function LeistungenClient() {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [activeGender, setActiveGender] = useState<"women" | "men">("women");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const urlServiceSelectionApplied = useRef(false);

  useEffect(() => {
    getServices()
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    if (searchParams.has("booking") || searchParams.has("rescheduleToken")) {
      urlServiceSelectionApplied.current = false;
      return;
    }
    if (urlServiceSelectionApplied.current) return;
    const raw = searchParams.get("serviceIds");
    if (!raw) return;
    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return;
    startTransition(() => {
      setSelectedServiceIds(ids);
      urlServiceSelectionApplied.current = true;
    });
  }, [searchParams]);

  const womenSections = useMemo(() => {
    const women = services
      .filter((s) => s.category === "women")
      .sort(
        (a, b) =>
          (a.displayOrder ?? 1000) - (b.displayOrder ?? 1000) ||
          a.name.localeCompare(b.name, "de")
      );
    const sectionMap = new Map<string, Service[]>();
    for (const s of women) {
      const section = s.displaySection || "COLORATIONEN (INKL. STYLING)";
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section)?.push(s);
    }

    const sortedSections = Array.from(sectionMap.entries()).sort((a, b) => {
      const ai = WOMEN_SECTION_ORDER.indexOf(a[0] as (typeof WOMEN_SECTION_ORDER)[number]);
      const bi = WOMEN_SECTION_ORDER.indexOf(b[0] as (typeof WOMEN_SECTION_ORDER)[number]);
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
          a.name.localeCompare(b.name, "de")
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

  const selectedServices = useMemo(() => {
    const map = new Map(services.map((s) => [s._id, s] as const));
    return selectedServiceIds.map((id) => map.get(id)).filter(Boolean) as Service[];
  }, [services, selectedServiceIds]);

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.priceEur, 0);

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const removeService = (serviceId: string) => {
    setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
  };

  const bookingHref =
    selectedServiceIds.length > 0
      ? `/buchung?booking=1&serviceIds=${encodeURIComponent(selectedServiceIds.join(","))}`
      : "/buchung?booking=1";

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showBookingFlow =
    searchParams.has("booking") || searchParams.has("rescheduleToken");

  if (showBookingFlow) {
    return (
      <main className="min-h-screen bg-[#F1EEE9] px-2 py-4 md:px-4 md:py-6">
        <BuchungsFlow />
      </main>
    );
  }

  return (
    <main className="bg-[#F1EEE9] pb-36 font-normal [font-family:var(--font-public-sans)]">
      <section>
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 md:pt-20">
          <h1
            className="text-h1 text-[#2D2D2D]"
            style={{ fontFamily: "var(--font-public-sans)" }}
          >
            Unsere Leistungen
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-[#2D2D2D]/95">
            Wir bieten Haarschnitte, Farb- und Pflegebehandlungen für Frauen und Männer an –immer
            individuell abgestimmt auf dein Haar, deinen Typ und deinen Alltag.
          </p>
          <div className="mt-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveGender("women")}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium leading-none ${
                activeGender === "women"
                  ? "border-[#2D2D2D] bg-[#2D2D2D] text-white"
                  : "border-[#2D2D2D]/55 bg-transparent text-[#2D2D2D]"
              }`}
            >
              Damen
            </button>
            <button
              type="button"
              onClick={() => setActiveGender("men")}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium leading-none ${
                activeGender === "men"
                  ? "border-[#2D2D2D] bg-[#2D2D2D] text-white"
                  : "border-[#2D2D2D]/55 bg-transparent text-[#2D2D2D]"
              }`}
            >
              Herren
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6">
          <div className="border-[#2D2D2D]/40">
            {activeGender === "women" ? (
              womenSections.map((section) => (
                <div key={section.label} className="pt-7 first:pt-0">
                  <p className="text-[11px] font-medium tracking-[0.12em] text-[#2D2D2D]/55">
                    {section.label}
                  </p>
                  <div className="mt-3 border-[#2D2D2D]/40">
                    {section.entries.map((entry) => {
                      const hasVariants = entry.variants.length > 1;
                      const isExpanded = expandedKeys[entry.key] || false;
                      const minPrice = Math.min(...entry.variants.map((v) => v.priceEur));
                      const minDuration = Math.min(...entry.variants.map((v) => v.durationMinutes));
                      const maxDuration = Math.max(...entry.variants.map((v) => v.durationMinutes));
                      const isCallRow = entry.variants.some((v) => v.ctaType === "call");
                      const durationLabel =
                        entry.groupDurationLabel ||
                        (minDuration === maxDuration
                          ? formatDuration(minDuration)
                          : `${formatDuration(minDuration)} – ${formatDuration(maxDuration)}`);

                      return (
                        <div key={entry.key} className="border-b border-[#2D2D2D]/40">
                          <div className="grid grid-cols-1 items-center gap-6 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#2D2D2D]">
                                {toDisplayTitle(entry.title)}
                              </p>
                              <p className="mt-1 text-[12px] leading-snug text-[#2D2D2D]/65">
                                {durationLabel}
                              </p>
                            </div>
                            <div className="md:text-right">
                              {isCallRow ? (
                                <span className="text-h3 font-display text-[#2D2D2D]">
                                  Auf Anfrage (telefonisch)
                                </span>
                              ) : hasVariants ? (
                                <span className="text-h3 font-display text-[#2D2D2D] tabular-nums">
                                  ab {formatPrice(minPrice)}
                                </span>
                              ) : (
                                <span className="text-h3 font-display text-[#2D2D2D] tabular-nums">
                                  {formatPrice(minPrice)}
                                </span>
                              )}
                            </div>
                            {isCallRow ? (
                              <a
                                href="tel:+4917669150964"
                                className="inline-flex w-full items-center justify-center rounded-full border border-[#2D2D2D]/55 px-4 py-[7px] text-[13px] font-medium text-[#2D2D2D] md:w-auto"
                              >
                                Anrufen
                              </a>
                            ) : hasVariants ? (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(entry.key)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#2D2D2D]/55 px-4 py-[7px] text-[13px] font-medium text-[#2D2D2D] md:w-auto"
                              >
                                {isExpanded ? "Schließen" : "Optionen"}
                                <svg
                                  aria-hidden="true"
                                  viewBox="0 0 20 20"
                                  className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`}
                                  fill="none"
                                >
                                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleService(entry.variants[0].id)}
                                className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-[7px] text-[13px] font-medium md:w-auto transition ${
                                  selectedServiceIds.includes(entry.variants[0].id)
                                    ? "border-[#2D2D2D] bg-[#2D2D2D] text-white"
                                    : "border-[#2D2D2D]/55 bg-transparent text-[#2D2D2D] hover:bg-[#2D2D2D]/5"
                                }`}
                              >
                                {selectedServiceIds.includes(entry.variants[0].id) ? "Ausgewählt" : "Auswählen"}
                              </button>
                            )}
                          </div>
                          {hasVariants && isExpanded && (
                            <div className="pb-2">
                              {entry.variants.map((variant) => (
                                <div
                                  key={variant.id}
                                  className="grid grid-cols-1 items-center gap-6 border-t border-[#2D2D2D]/25 py-4 pl-10 md:grid-cols-[minmax(0,1fr)_auto_auto]"
                                >
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-[#2D2D2D]">{variant.label}</p>
                                    <p className="mt-1 text-[12px] leading-snug text-[#2D2D2D]/65">
                                      {formatDuration(variant.durationMinutes)}
                                    </p>
                                  </div>
                                  <div className="md:text-right">
                                    <span className="text-h3 font-display text-[#2D2D2D] tabular-nums">
                                      {formatPrice(variant.priceEur)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleService(variant.id)}
                                    className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-[7px] text-[13px] font-medium md:w-auto transition ${
                                      selectedServiceIds.includes(variant.id)
                                        ? "border-[#2D2D2D] bg-[#2D2D2D] text-white"
                                        : "border-[#2D2D2D]/55 bg-transparent text-[#2D2D2D] hover:bg-[#2D2D2D]/5"
                                    }`}
                                  >
                                    {selectedServiceIds.includes(variant.id) ? "Ausgewählt" : "Auswählen"}
                                  </button>
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
              menEntries.map((entry) => {
                const item = entry.variants[0];
                return (
                  <div key={entry.key} className="border-b border-[#2D2D2D]/40">
                    <div className="grid grid-cols-1 items-center gap-6 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#2D2D2D]">{toDisplayTitle(entry.title)}</p>
                        <p className="mt-1 text-[12px] leading-snug text-[#2D2D2D]/65">
                          {formatDuration(item.durationMinutes)}
                        </p>
                      </div>
                      <div className="md:text-right">
                        <span className="text-h3 font-display text-[#2D2D2D] tabular-nums">
                          {formatPrice(item.priceEur)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleService(item.id)}
                        className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-[7px] text-[13px] font-medium md:w-auto transition ${
                          selectedServiceIds.includes(item.id)
                            ? "border-[#2D2D2D] bg-[#2D2D2D] text-white"
                            : "border-[#2D2D2D]/55 bg-transparent text-[#2D2D2D] hover:bg-[#2D2D2D]/5"
                        }`}
                      >
                        {selectedServiceIds.includes(item.id) ? "Ausgewählt" : "Auswählen"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>


      {selectedServiceIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2D2D2D]/35 bg-[#EDEBE6]/95 px-4 py-4 backdrop-blur !bg-[#BEA8FF]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-4 md:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#2D2D2D]">
                {selectedServiceIds.length} Leistung(en) ausgewählt
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedServices.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => removeService(s._id)}
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#2D2D2D]/55 bg-[#BEA8FF]/60 px-3 py-1 text-left text-[12px] font-medium text-[#2D2D2D] transition hover:bg-[#BEA8FF]"
                    title="Entfernen"
                  >
                    <span className="min-w-0 truncate">{selectedServiceTitle(s)}</span>
                    <span aria-hidden className="shrink-0 text-[#2D2D2D]/70">
                      ×
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[#2D2D2D]/80">
                Gesamt: {totalDuration} Min. · {totalPrice}€
              </p>
            </div>
            <Link
              href={bookingHref}
              className="inline-flex w-full items-center justify-center rounded-full border border-[#2D2D2D] bg-[#2D2D2D] px-6 py-3 text-center text-sm font-medium text-white sm:w-auto"
            >
              Zur Terminauswahl
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

