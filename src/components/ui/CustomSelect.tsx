"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder: string;
  id?: string;
  className?: string;
  showDefaultOption?: boolean; // Set to true to include the placeholder as a selectable "clear" option
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  id,
  className,
  showDefaultOption = true,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-input flex items-center justify-between cursor-pointer text-sm h-[42px] gap-2 w-full text-left"
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span>{selectedOption.icon}</span>}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span style={{ color: "var(--text-tertiary)" }}>{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={cn("text-muted transition-transform duration-200 shrink-0", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-card-border shadow-lg z-50 py-1 max-h-60 overflow-y-auto animate-scale-in">
          {/* Default/Placeholder Option */}
          {showDefaultOption && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center justify-between w-full px-4 py-2.5 text-sm text-left hover:bg-accent/8 hover:text-accent transition-all text-foreground",
                !value && "text-accent font-semibold"
              )}
              style={{ color: !value ? "var(--accent-emerald)" : "var(--text-primary)" }}
            >
              <span>{placeholder}</span>
              {!value && <Check size={14} />}
            </button>
          )}
          {options.map((opt) => {
            const isSelected = value === opt.value;
            const isDisabled = opt.disabled;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between w-full px-4 py-2.5 text-sm text-left transition-all text-foreground",
                  !isDisabled && "hover:bg-accent/8 hover:text-accent cursor-pointer",
                  isSelected && "text-accent font-semibold",
                  isDisabled && "opacity-40 cursor-not-allowed"
                )}
                style={{
                  color: isSelected
                    ? "var(--accent-emerald)"
                    : isDisabled
                    ? "var(--text-tertiary)"
                    : "var(--text-primary)",
                }}
              >
                <span className="flex items-center gap-2 truncate">
                  {opt.icon && <span>{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </span>
                {isSelected && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
