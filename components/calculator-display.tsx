'use client';

import { useMemo } from 'react';
import { formatDisplay } from '@/lib/calculator';

interface CalculatorDisplayProps {
  value: string;
}

export function CalculatorDisplay({ value }: CalculatorDisplayProps) {
  // Calculate font size based on content length for auto-resize
  const fontSize = useMemo(() => {
    const displayValue = formatDisplay(value);
    const length = displayValue.length;
    
    if (length <= 6) return 'text-7xl';
    if (length <= 8) return 'text-6xl';
    if (length <= 10) return 'text-5xl';
    if (length <= 12) return 'text-4xl';
    return 'text-3xl';
  }, [value]);

  const displayValue = formatDisplay(value);

  return (
    <div className="w-full px-6 py-4 flex items-end justify-end min-h-[120px]">
      <span
        className={`font-sans font-light text-foreground transition-all duration-200 ${fontSize}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {displayValue}
      </span>
    </div>
  );
}
