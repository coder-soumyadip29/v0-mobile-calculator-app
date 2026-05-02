"use client";

import { useMemo } from "react";
import { Mic } from "lucide-react";
import { formatDisplay } from "@/lib/calculator";

interface CalculatorDisplayProps {
  value: string;
  expression?: string;
}

export function CalculatorDisplay({
  value,
  expression,
}: CalculatorDisplayProps) {
  // Calculate font size based on content length for auto-resize
  const fontSize = useMemo(() => {
    const displayValue = formatDisplay(value);
    const length = displayValue.length;

    if (length <= 6) return "text-7xl";
    if (length <= 8) return "text-6xl";
    if (length <= 10) return "text-5xl";
    if (length <= 12) return "text-4xl";
    return "text-3xl";
  }, [value]);

  const displayValue = formatDisplay(value);

  return (
    <div className="w-full relative">
      {/* Microphone Icon */}
      <div className="absolute top-2 left-0 p-3">
        <Mic className="w-6 h-6 text-muted-foreground opacity-60" />
      </div>

      {/* Display Area */}
      <div className="px-6 py-8 flex flex-col items-end justify-end min-h-[140px]">
        {/* Expression Row */}
        {expression && (
          <div className="w-full text-right mb-2">
            <span className="text-sm text-muted-foreground font-light">
              {expression}
            </span>
          </div>
        )}

        {/* Result Row */}
        <span
          className={`font-sans font-light text-foreground transition-all duration-200 ${fontSize}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}
