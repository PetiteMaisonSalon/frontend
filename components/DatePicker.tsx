"use client";

import { useRef, useEffect, useState } from "react";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
};

export function DatePicker({ value, onChange, className = "", id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parseDateInput(value));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setViewMonth(parseDateInput(value));
  }, [open, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const displayLabel = value
    ? parseDateInput(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  const todayStr = formatDateInput(new Date());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = prevMonthDays - startOffset + i + 1;
    cells.push({ date: new Date(year, month - 1, d), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={`rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-left text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20 ${className}`}
      >
        {displayLabel || "Datum wählen"}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-[#E8E4DF] bg-white p-3 shadow-xl"
          style={{ minWidth: "260px" }}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="rounded-md px-2 py-1 text-[#2D2D2D]/70 hover:bg-[#F5F2ED]"
              aria-label="Vorheriger Monat"
            >
              ‹
            </button>
            <p className="text-sm font-medium text-[#2D2D2D]">
              {MONTH_NAMES[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="rounded-md px-2 py-1 text-[#2D2D2D]/70 hover:bg-[#F5F2ED]"
              aria-label="Nächster Monat"
            >
              ›
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-[#2D2D2D]/45">
            {WEEKDAY_LABELS.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
            {cells.map(({ date, isCurrentMonth }, idx) => {
              const val = formatDateInput(date);
              const isSelected = val === value;
              const isToday = val === todayStr;
              return (
                <button
                  key={`${val}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(val);
                    setOpen(false);
                  }}
                  className={`h-8 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1 ${
                    isSelected
                      ? "bg-[#4A5D4A] text-white"
                      : isToday
                        ? "border border-[#4A5D4A] bg-[#4A5D4A]/15 text-[#4A5D4A]"
                        : isCurrentMonth
                          ? "text-[#2D2D2D] hover:bg-[#4A5D4A]/10"
                          : "text-[#2D2D2D]/35"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-end gap-2 border-t border-[#E8E4DF] pt-3">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[#4A5D4A] hover:bg-[#4A5D4A]/10"
            >
              Löschen
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setOpen(false);
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[#4A5D4A] hover:bg-[#4A5D4A]/10"
            >
              Heute
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
