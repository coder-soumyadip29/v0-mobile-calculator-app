"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CalculatorButtonProps {
  label: string;
  onClick: () => void;
  onLongPress?: () => void;
  variant: "number" | "function" | "operator";
  isWide?: boolean;
  isActive?: boolean;
  disabled?: boolean;
}

export function CalculatorButton({
  label,
  onClick,
  onLongPress,
  variant,
  isWide = false,
  isActive = false,
  disabled = false,
}: CalculatorButtonProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Handle long press detection (2 seconds)
  const handleTouchStart = useCallback(() => {
    if (!onLongPress || disabled) return;

    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, 2000);
  }, [onLongPress, disabled]);

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Only trigger onClick if it wasn't a long press
    if (!isLongPressRef.current && !disabled) {
      onClick();
    }
    isLongPressRef.current = false;
  }, [onClick, disabled]);

  const handleTouchCancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isLongPressRef.current = false;
  }, []);

  // Desktop click handler
  const handleClick = useCallback(() => {
    if (disabled || onLongPress) return; // Skip if has long press handler
    onClick();
  }, [onClick, disabled, onLongPress]);

  // Mouse events for desktop long press
  const handleMouseDown = useCallback(() => {
    if (!onLongPress || disabled) return;

    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, 2000);
  }, [onLongPress, disabled]);

  const handleMouseUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isLongPressRef.current && !disabled && onLongPress) {
      onClick();
    }
    isLongPressRef.current = false;
  }, [onClick, disabled, onLongPress]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isLongPressRef.current = false;
  }, []);

  // Base styles
  const baseStyles = cn(
    "flex items-center justify-center font-sans text-3xl font-medium",
    "transition-all duration-150 ease-out select-none",
    "active:scale-95 active:brightness-125",
    "hover:brightness-110",
    "touch-manipulation",
    isWide
      ? "col-span-2 w-[96%] justify-self-center rounded-full h-[4.5rem]"
      : "w-[92%] justify-self-center aspect-square rounded-full",
    disabled && "pointer-events-none",
  );

  // Variant-specific styles
  const variantStyles = {
    number: cn(
      "bg-secondary text-secondary-foreground",
      isActive && "brightness-125",
    ),
    function: cn("bg-muted text-muted-foreground", isActive && "brightness-90"),
    operator: cn(
      isActive
        ? "bg-foreground text-primary"
        : "bg-primary text-primary-foreground",
    ),
  };

  return (
    <button
      type="button"
      className={cn(baseStyles, variantStyles[variant])}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      aria-label={label}
    >
      {isWide ? <span className="pl-7 text-left w-full">{label}</span> : label}
    </button>
  );
}
