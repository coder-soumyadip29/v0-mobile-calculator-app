'use client';

import { useEffect, useCallback } from 'react';

interface DistressModeProps {
  isActive: boolean;
  onExit: () => void;
}

export function DistressMode({ isActive, onExit }: DistressModeProps) {
  // Handle keyboard shortcut to exit (Ctrl + Shift + D)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      onExit();
    }
  }, [onExit]);

  useEffect(() => {
    if (isActive) {
      // Log distress activation
      console.log('Distress Active');
      
      // Add keyboard listener for exit shortcut
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isActive, handleKeyDown]);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 bg-black z-50"
      style={{ touchAction: 'none' }}
      aria-hidden="true"
    >
      {/* Pitch black screen - no UI elements */}
      {/* Exit only via page refresh or Ctrl+Shift+D */}
    </div>
  );
}
