"use client";

import { useRef, useEffect, useState } from "react";

type Option = { value: string; label: string };

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  clearable?: boolean;
  className?: string;
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Auswählen…",
  clearable = true,
  className = "",
}: CustomSelectProps) {
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

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-left text-sm focus:border-[#4A5D4A] focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/20 ${className}`}
      >
        <span className={`min-w-0 truncate ${value ? "text-[#1C1612]" : "text-[#1C1612]/55"}`}>
          {selectedLabel}
        </span>
        <span className="ml-2 shrink-0 text-[#1C1612]/50" aria-hidden>▼</span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#E8E4DF] bg-white py-1 shadow-xl"
        >
          {clearable && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#4A5D4A]/10 ${
                !value ? "bg-[#4A5D4A]/10 text-[#4A5D4A]" : "text-[#1C1612]/55"
              }`}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#4A5D4A]/10 ${
                  isSelected ? "bg-[#4A5D4A] text-white hover:bg-[#4A5D4A]" : "text-[#1C1612]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
