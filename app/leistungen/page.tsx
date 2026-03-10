"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getServices } from "@/lib/api";

type Service = {
  _id: string;
  category: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceEur: number;
};

type GroupConfig = {
  id: string;
  label: string;
  matcher: (service: Service) => boolean;
};

type VariantEntry = {
  id: string;
  label: string;
  durationMinutes: number;
  priceEur: number;
};

type GroupedEntry = {
  key: string;
  title: string;
  variants: VariantEntry[];
};

const GROUPS: GroupConfig[] = [
  {
    id: "women-cut-styling",
    label: "Damen - Haarschnitte & Stylings",
    matcher: (s) =>
      s.category === "women" &&
      s.name.startsWith("Damen -") &&
      !s.name.includes("Coloration") &&
      !s.name.includes("Ansatzfarbe") &&
      !s.name.includes("Foliensträhnen") &&
      !s.name.includes("Balayage") &&
      !s.name.includes("Glossing") &&
      !s.name.includes("Face Frame"),
  },
  {
    id: "women-color-styling",
    label: "Damen - Colorationen & Styling",
    matcher: (s) =>
      s.category === "women" &&
      !s.name.includes(", Haarschnitt & Styling") &&
      (s.name.includes("Ansatzfarbe") ||
        s.name.includes("Soft Coloration") ||
        s.name.includes("Foliensträhnen") ||
        s.name.includes("Balayage") ||
        s.name.includes("Glossing/Milkshake") ||
        s.name.includes("Face Frame")),
  },
  {
    id: "women-color-cut-style",
    label: "Damen - Colorationen, Waschen, Schneiden & Stylen",
    matcher: (s) => s.category === "women" && s.name.includes(", Haarschnitt & Styling"),
  },
  {
    id: "men-cut-styling",
    label: "Herren - Haarschnitte & Stylings",
    matcher: (s) => s.category === "men",
  },
];

function extractVariantLabel(name: string) {
  const match = name.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : "Standard";
}

function baseTitle(name: string) {
  return name.replace(/\s*\([^)]+\)\s*$/, "").trim();
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} Std. ${m} Min.`;
  if (h > 0) return `${h} Std.`;
  return `${m} Min.`;
}

export default function LeistungenPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>(GROUPS[0].id);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getServices()
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));
  }, []);

  const groupedById = useMemo(() => {
    const result: Record<string, GroupedEntry[]> = {};
    for (const group of GROUPS) {
      const filtered = services.filter(group.matcher).sort((a, b) => a.name.localeCompare(b.name));
      const map = new Map<string, GroupedEntry>();
      filtered.forEach((service) => {
        const key = baseTitle(service.name);
        if (!map.has(key)) {
          map.set(key, { key, title: key, variants: [] });
        }
        map.get(key)?.variants.push({
          id: service._id,
          label: extractVariantLabel(service.name),
          durationMinutes: service.durationMinutes,
          priceEur: service.priceEur,
        });
      });
      result[group.id] = Array.from(map.values()).map((entry) => ({
        ...entry,
        variants: entry.variants.sort((a, b) => a.priceEur - b.priceEur),
      }));
    }
    return result;
  }, [services]);

  const groupStats = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        count: groupedById[g.id]?.length || 0,
      })),
    [groupedById]
  );

  const visibleEntries = groupedById[activeGroupId] || [];

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s._id)),
    [services, selectedServiceIds]
  );

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.priceEur, 0);

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const bookingHref =
    selectedServiceIds.length > 0
      ? `/buchung?serviceIds=${encodeURIComponent(selectedServiceIds.join(","))}`
      : "/buchung";

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main>
      <section className="border-b border-[#E8E4DF]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
          <h1 className="font-display text-4xl font-medium tracking-tight text-[#2D2D2D] md:text-5xl">
            Unsere Leistungen
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#2D2D2D]/85">
            Wir bieten Haarschnitte, Farb- und Pflegebehandlungen für Frauen und
            Männer an – immer individuell abgestimmt auf dein Haar, deinen Typ
            und deinen Alltag.
          </p>
        </div>
      </section>

      <section className="bg-[#F5F2ED] py-14 pb-36 md:py-24 md:pb-44">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-medium tracking-tight text-[#2D2D2D]">
            Alle Services
          </h2>

          <div className="mt-8 grid items-start gap-4 lg:gap-6 lg:grid-cols-[250px_1fr]">
            <div className="h-fit self-start rounded-xl border border-[#E8E4DF] bg-white p-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:block">
                {groupStats.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
                    className={`w-full whitespace-normal break-words rounded-lg px-3 py-3 text-left text-sm font-medium lg:mb-1 ${
                      activeGroupId === group.id
                        ? "border border-[#4A5D4A]/35 bg-[#4A5D4A]/10 text-[#2D2D2D]"
                        : "border border-[#E8E4DF]/60 text-[#2D2D2D]/90 hover:bg-[#F7F7F9]"
                    }`}
                  >
                    {group.label} ({group.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-[#E8E4DF] bg-white">
              {visibleEntries.map((entry) => {
                const hasVariants = entry.variants.length > 1;
                const isExpanded = expandedKeys[entry.key] || false;
                const minPrice = Math.min(...entry.variants.map((v) => v.priceEur));
                const minDuration = Math.min(...entry.variants.map((v) => v.durationMinutes));
                const maxDuration = Math.max(...entry.variants.map((v) => v.durationMinutes));

                return (
                  <div key={entry.key} className="min-w-0 border-b border-[#E8E4DF] p-4 last:border-b-0">
                    <div className="min-w-0 grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <div className="min-w-0">
                        <p className="break-words font-medium text-[#2D2D2D]">{entry.title}</p>
                        <p className="mt-1 text-sm text-[#2D2D2D]/70">
                          {minDuration === maxDuration
                            ? formatDuration(minDuration)
                            : `${formatDuration(minDuration)} - ${formatDuration(maxDuration)}`}
                        </p>
                      </div>
                      <div className="text-left font-semibold text-[#2D2D2D] sm:text-right">
                        {hasVariants ? `ab ${minPrice} €` : `${minPrice} €`}
                      </div>
                      {hasVariants ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(entry.key)}
                          className="w-full rounded-full border border-[#E8E4DF] px-4 py-2 text-sm font-medium text-[#2D2D2D] hover:bg-[#F5F2ED] md:w-auto lg:justify-self-end"
                        >
                          {isExpanded ? "Varianten ausblenden" : "Varianten anzeigen"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleService(entry.variants[0].id)}
                          className={`w-full rounded border px-4 py-2 text-sm font-medium md:w-auto lg:justify-self-end ${
                            selectedServiceIds.includes(entry.variants[0].id)
                              ? "border-[#4A5D4A] bg-[#4A5D4A] text-white"
                              : "border-[#D4A5A5] text-[#C2787E]"
                          }`}
                        >
                          {selectedServiceIds.includes(entry.variants[0].id)
                            ? "Ausgewählt"
                            : "Auswählen"}
                        </button>
                      )}
                    </div>

                    {hasVariants && isExpanded && (
                      <div className="mt-3 space-y-2">
                        {entry.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="min-w-0 grid grid-cols-1 items-center gap-3 rounded-lg border border-[#E8E4DF] bg-[#FAF9F7] p-3 md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto]"
                          >
                            <div className="min-w-0">
                              <p className="break-words text-sm font-medium text-[#2D2D2D]">{variant.label}</p>
                              <p className="text-sm text-[#2D2D2D]/70">
                                {formatDuration(variant.durationMinutes)}
                              </p>
                            </div>
                            <div className="text-left font-semibold text-[#2D2D2D] sm:text-right">
                              {variant.priceEur} €
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleService(variant.id)}
                              className={`w-full rounded border px-4 py-2 text-sm font-medium md:w-auto lg:justify-self-end ${
                                selectedServiceIds.includes(variant.id)
                                  ? "border-[#4A5D4A] bg-[#4A5D4A] text-white"
                                  : "border-[#D4A5A5] text-[#C2787E]"
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

        </div>
      </section>

      {selectedServiceIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#4A5D4A]/20 bg-white/95 px-4 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium text-[#2D2D2D]">
                {selectedServiceIds.length} Leistung(en) ausgewählt
              </p>
              <p className="text-sm text-[#2D2D2D]/80">
                Gesamt: {totalDuration} Min. · {totalPrice} €
              </p>
            </div>
            <Link
              href={bookingHref}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#4A5D4A] px-6 py-3 text-center font-medium text-white transition hover:bg-[#3A4A3A] sm:w-auto"
            >
              Weiter zur Mitarbeiterauswahl
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
