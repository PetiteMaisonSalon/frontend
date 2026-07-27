/**
 * Leistungen aus backend/src/scripts/seed.js – statisch im Frontend.
 * IDs sind stabil (category + displayOrder), unabhängig von MongoDB.
 */
export type StaticService = {
  _id: string;
  category: "women" | "men";
  name: string;
  description?: string;
  durationMinutes: number;
  priceEur: number;
  displaySection?: string;
  displayOrder: number;
  groupKey?: string;
  groupDurationLabel?: string;
  ctaType?: "select" | "call";
};

function sid(category: "women" | "men", displayOrder: number) {
  return `${category}-${displayOrder}`;
}

export const STATIC_SERVICES: StaticService[] = [
  {
    _id: sid("women", 10),
    name: "Damen - Haarschnitt & Styling",
    category: "women",
    durationMinutes: 60,
    priceEur: 95,
    displaySection: "SCHNITT & STYLING",
    displayOrder: 10,
  },
  {
    _id: sid("women", 20),
    name: "Damen - Haarschnitt & Styling 'Neukunden'",
    category: "women",
    durationMinutes: 90,
    priceEur: 125,
    displaySection: "SCHNITT & STYLING",
    displayOrder: 20,
  },
  {
    _id: sid("women", 30),
    name: "Damen - Styling",
    category: "women",
    durationMinutes: 30,
    priceEur: 50,
    displaySection: "SCHNITT & STYLING",
    displayOrder: 30,
  },
  {
    _id: sid("women", 40),
    name: "Damen - Ansatzfarbe",
    category: "women",
    durationMinutes: 105,
    priceEur: 135,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 40,
  },
  {
    _id: sid("women", 50),
    name: "Damen - Foliensträhnen (Oberkopf / Kontur)",
    category: "women",
    durationMinutes: 90,
    priceEur: 145,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 50,
    groupKey: "women-foils",
    groupDurationLabel: "2 Std 15 Min",
  },
  {
    _id: sid("women", 51),
    name: "Damen - Foliensträhnen (Halber Kopf)",
    category: "women",
    durationMinutes: 120,
    priceEur: 170,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 51,
    groupKey: "women-foils",
    groupDurationLabel: "2 Std 15 Min",
  },
  {
    _id: sid("women", 52),
    name: "Damen - Foliensträhnen (Ganzer Kopf)",
    category: "women",
    durationMinutes: 150,
    priceEur: 210,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 52,
    groupKey: "women-foils",
    groupDurationLabel: "2 Std 15 Min",
  },
  {
    _id: sid("women", 60),
    name: "Damen - Glossing / Milkshake (Kurzes Haar)",
    category: "women",
    durationMinutes: 60,
    priceEur: 80,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 60,
    groupKey: "women-gloss",
    groupDurationLabel: "1 Std",
  },
  {
    _id: sid("women", 61),
    name: "Damen - Glossing / Milkshake (Mittellanges - langes Haar)",
    category: "women",
    durationMinutes: 60,
    priceEur: 100,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 61,
    groupKey: "women-gloss",
    groupDurationLabel: "1 Std",
  },
  {
    _id: sid("women", 70),
    name: "Damen - Soft Coloration (Kurzes Haar)",
    category: "women",
    durationMinutes: 90,
    priceEur: 90,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 70,
    groupKey: "women-soft",
    groupDurationLabel: "1 Std 30 Min",
  },
  {
    _id: sid("women", 71),
    name: "Damen - Soft Coloration (Mittellanges - langes Haar)",
    category: "women",
    durationMinutes: 90,
    priceEur: 125,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 71,
    groupKey: "women-soft",
    groupDurationLabel: "1 Std 30 Min",
  },
  {
    _id: sid("women", 80),
    name: "Damen - Face Frame & Waschen, Föhnen / Styling",
    category: "women",
    durationMinutes: 105,
    priceEur: 105,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 80,
    groupDurationLabel: "1 - 1 Std 45 Min",
  },
  {
    _id: sid("women", 90),
    name: "Damen - Freihand/Balayage + Milkshake",
    category: "women",
    durationMinutes: 210,
    priceEur: 0,
    displaySection: "COLORATIONEN (INKL. STYLING)",
    displayOrder: 90,
    groupDurationLabel: "Ca. 3 Std 30 Min",
    ctaType: "call",
    description: "Auf Anfrage (telefonisch)",
  },
  {
    _id: sid("men", 10),
    name: "Herren - Haarschnitt & Styling",
    category: "men",
    durationMinutes: 60,
    priceEur: 65,
    displayOrder: 10,
  },
  {
    _id: sid("men", 20),
    name: "Herren - (Neukunden) Haarschnitt & Styling",
    category: "men",
    durationMinutes: 70,
    priceEur: 75,
    displayOrder: 20,
  },
  {
    _id: sid("men", 30),
    name: "Herren - Glossing & Styling",
    category: "men",
    durationMinutes: 30,
    priceEur: 35,
    displayOrder: 30,
  },
  {
    _id: sid("men", 40),
    name: "Herren - Glossing / Grey Blending & Styling",
    category: "men",
    durationMinutes: 20,
    priceEur: 25,
    displayOrder: 40,
  },
];
