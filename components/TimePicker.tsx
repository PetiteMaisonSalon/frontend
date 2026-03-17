"use client";

import { useRef, useEffect, useState } from "react";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const MINUTES = ["00", "15", "30", "45"];

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (const h of HOURS) {
    for (const m of MINUTES) {
      if (h === 20 && m !== "00") break;
      slots.push(`${String(h).padStart(2, "0")}:${m}`);
    }
  }
  return slots;
}

const DEFAULT_TIME_SLOTS = generateTimeSlots();

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function TimePicker({ value, onChange, className = "" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const displayLabel = value || "Uhrzeit wählen";
  const timeSlots = [...DEFAULT_TIME_SLOTS];
  if (value && !timeSlots.includes(value)) {
    timeSlots.push(value);
    timeSlots.sort();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-left text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20 ${className}`}
      >
        {displayLabel}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#E8E4DF] bg-white p-2 shadow-xl"
          style={{ minWidth: "120px" }}
        >
          <div className="grid grid-cols-2 gap-1">
            {timeSlots.map((slot) => {
              const isSelected = slot === value;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    onChange(slot);
                    setOpen(false);
                  }}
                  className={`rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D4A] focus:ring-offset-1 ${
                    isSelected
                      ? "bg-[#4A5D4A] text-white"
                      : "text-[#2D2D2D] hover:bg-[#4A5D4A]/10"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
