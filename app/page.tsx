'use client';

import { useState, useCallback } from 'react';
import { Calculator } from '@/components/calculator';
import { DistressMode } from '@/components/distress-mode';

export default function CalculatorPage() {
  const [isDistressMode, setIsDistressMode] = useState(false);

  // Activate distress mode
  const handleDistressActivate = useCallback(() => {
    setIsDistressMode(true);
  }, []);

  // Exit distress mode (via keyboard shortcut)
  const handleDistressExit = useCallback(() => {
    setIsDistressMode(false);
  }, []);

  return (
    <main className="min-h-dvh bg-background flex items-end justify-center pb-8 pt-4">
      {/* Calculator UI */}
      <Calculator onDistressActivate={handleDistressActivate} />

      {/* Distress overlay - completely hides UI when active */}
      <DistressMode isActive={isDistressMode} onExit={handleDistressExit} />
    </main>
  );
}
