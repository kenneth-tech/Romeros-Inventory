"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowDownCircle, ArrowUpCircle, Filter } from "lucide-react";

interface TypeFilterProps {
  selectedType: "" | "IN" | "OUT";
  onChange: (type: "" | "IN" | "OUT") => void;
}

export default function TypeFilter({ selectedType, onChange }: TypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const options = [
    { value: "", label: "All types" },
    { value: "IN", label: "Stock In", icon: ArrowDownCircle, color: "text-green-600" },
    { value: "OUT", label: "Stock Out", icon: ArrowUpCircle, color: "text-orange-600" },
  ];

  const selected = options.find((opt) => opt.value === selectedType);
  const displayLabel = selected?.label || "All types";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all flex items-center justify-between gap-2 group"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span>{displayLabel}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[180px]">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedType === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value as "" | "IN" | "OUT");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  {Icon && <Icon className={`w-4 h-4 ${opt.color || ""}`} />}
                  <span>{opt.label}</span>
                </span>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
