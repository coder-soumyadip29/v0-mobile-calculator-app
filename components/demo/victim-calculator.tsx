"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  CalculatorState,
  Operator,
  initialState,
  calculate,
  isValidInput,
  checkDistressCode,
  formatDisplay,
} from "@/lib/calculator";
import { useDistress } from "@/lib/distress-context";

function CalcButton({
  label,
  onClick,
  onLongPress,
  variant,
  isWide = false,
  isActive = false,
}: {
  label: string;
  onClick: () => void;
  onLongPress?: () => void;
  variant: "number" | "function" | "operator";
  isWide?: boolean;
  isActive?: boolean;
}) {
  const timerRef = { current: null as NodeJS.Timeout | null };
  const isLongPressRef = { current: false };

  const handleMouseDown = () => {
    if (!onLongPress) return;
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, 2000);
  };

  const handleMouseUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLongPressRef.current) {
      if (onLongPress) onClick();
    }
    isLongPressRef.current = false;
  };

  const handleClick = () => {
    if (onLongPress) return;
    onClick();
  };

  const variantStyles = {
    number: "bg-[#333333] text-white hover:bg-[#4a4a4a]",
    function: "bg-[#a5a5a5] text-black hover:bg-[#d4d4d4]",
    operator: isActive
      ? "bg-white text-[#ff9500]"
      : "bg-[#ff9500] text-white hover:bg-[#ffad33]",
  };

  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center text-3xl font-medium transition-all duration-100",
        "active:scale-95 active:brightness-125 select-none touch-manipulation",
        isWide
          ? "col-span-2 w-[134px] h-[62px] rounded-full"
          : "w-[62px] h-[62px] rounded-full",
        variantStyles[variant],
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => timerRef.current && clearTimeout(timerRef.current)}
    >
      {isWide ? <span className="pl-4 text-left w-full">{label}</span> : label}
    </button>
  );
}

function CalcDisplay({ value }: { value: string }) {
  const displayValue = formatDisplay(value);
  const length = displayValue.length;

  const fontSize =
    length <= 6
      ? "text-6xl"
      : length <= 8
        ? "text-5xl"
        : length <= 10
          ? "text-4xl"
          : "text-3xl";

  return (
    <div className="w-full px-4 py-2 flex items-end justify-end min-h-[90px]">
      <span className={cn("font-light text-white transition-all", fontSize)}>
        {displayValue}
      </span>
    </div>
  );
}

function BlackoutScreen() {
  return (
    <div
      className="absolute inset-0 bg-black z-[9999] flex items-center justify-center"
      aria-hidden="true"
    >
      {/* Completely black - simulates dead/off phone */}
    </div>
  );
}

export function VictimCalculator() {
  const { isDistressActive, activateDistress } = useDistress();
  const [state, setState] = useState<CalculatorState>(initialState);
  const [activeOperator, setActiveOperator] = useState<Operator>(null);
  const [inputHistory, setInputHistory] = useState("");

  const trackInput = useCallback((input: string) => {
    setInputHistory((prev) => (prev + input).slice(-15));
  }, []);

  useEffect(() => {
    if (checkDistressCode(inputHistory)) {
      activateDistress();
      setInputHistory("");
    }
  }, [inputHistory, activateDistress]);

  const handleDigit = useCallback(
    (digit: string) => {
      trackInput(digit);
      setState((prev) => {
        if (prev.waitingForOperand) {
          return { ...prev, display: digit, waitingForOperand: false };
        }
        if (!isValidInput(prev.display, digit)) return prev;
        const newDisplay =
          prev.display === "0" && digit !== "." ? digit : prev.display + digit;
        return { ...prev, display: newDisplay };
      });
    },
    [trackInput],
  );

  const handleOperator = useCallback(
    (op: Operator) => {
      trackInput(op || "");
      setState((prev) => {
        if (prev.previousValue && prev.operator && !prev.waitingForOperand) {
          const result = calculate(
            parseFloat(prev.previousValue),
            parseFloat(prev.display),
            prev.operator,
          );
          const resultStr = isNaN(result) ? "Error" : result.toString();
          return {
            display: resultStr,
            previousValue: resultStr,
            operator: op,
            waitingForOperand: true,
            expression: `${resultStr} ${op}`,
          };
        }
        return {
          ...prev,
          previousValue: prev.display,
          operator: op,
          waitingForOperand: true,
          expression: `${prev.display} ${op}`,
        };
      });
      setActiveOperator(op);
    },
    [trackInput],
  );

  const handleEquals = useCallback(() => {
    // Check if display is exactly "9119" - trigger distress instead of calculating
    if (state.display === "9119") {
      activateDistress();
      return;
    }

    trackInput("=");
    setState((prev) => {
      if (!prev.operator || !prev.previousValue) return prev;
      const result = calculate(
        parseFloat(prev.previousValue),
        parseFloat(prev.display),
        prev.operator,
      );
      const resultStr = isNaN(result) ? "Error" : result.toString();
      return {
        display: resultStr,
        previousValue: "",
        operator: null,
        waitingForOperand: true,
        expression: "",
      };
    });
    setActiveOperator(null);
  }, [trackInput, state.display, activateDistress]);

  const handleClear = useCallback(() => {
    setState(initialState);
    setActiveOperator(null);
    setInputHistory("");
  }, []);

  const handleToggleSign = useCallback(() => {
    setState((prev) => {
      const value = parseFloat(prev.display);
      if (isNaN(value)) return prev;
      return { ...prev, display: (value * -1).toString() };
    });
  }, []);

  const handlePercent = useCallback(() => {
    setState((prev) => {
      const value = parseFloat(prev.display);
      if (isNaN(value)) return prev;
      return { ...prev, display: (value / 100).toString() };
    });
  }, []);

  const clearLabel = state.display === "0" && !state.previousValue ? "AC" : "C";

  // If distress is active, show blackout (dead phone look)
  if (isDistressActive) {
    return <BlackoutScreen />;
  }

  return (
    <div className="w-full h-full bg-black flex flex-col justify-end p-4 relative">
      {/* Hidden invisible panic button in top-left */}
      <button
        type="button"
        className="absolute top-2 left-2 w-12 h-12 opacity-0"
        onClick={activateDistress}
        aria-label="Hidden emergency trigger"
      />

      <CalcDisplay value={state.display} />

      <div className="grid grid-cols-4 gap-4 mt-3 justify-items-center">
        <CalcButton
          label={clearLabel}
          onClick={handleClear}
          variant="function"
        />
        <CalcButton label="+/-" onClick={handleToggleSign} variant="function" />
        <CalcButton label="%" onClick={handlePercent} variant="function" />
        <CalcButton
          label="÷"
          onClick={() => handleOperator("÷")}
          variant="operator"
          isActive={activeOperator === "÷"}
        />

        <CalcButton
          label="7"
          onClick={() => handleDigit("7")}
          variant="number"
        />
        <CalcButton
          label="8"
          onClick={() => handleDigit("8")}
          variant="number"
        />
        <CalcButton
          label="9"
          onClick={() => handleDigit("9")}
          variant="number"
        />
        <CalcButton
          label="×"
          onClick={() => handleOperator("×")}
          variant="operator"
          isActive={activeOperator === "×"}
        />

        <CalcButton
          label="4"
          onClick={() => handleDigit("4")}
          variant="number"
        />
        <CalcButton
          label="5"
          onClick={() => handleDigit("5")}
          variant="number"
        />
        <CalcButton
          label="6"
          onClick={() => handleDigit("6")}
          variant="number"
        />
        <CalcButton
          label="-"
          onClick={() => handleOperator("-")}
          variant="operator"
          isActive={activeOperator === "-"}
        />

        <CalcButton
          label="1"
          onClick={() => handleDigit("1")}
          variant="number"
        />
        <CalcButton
          label="2"
          onClick={() => handleDigit("2")}
          variant="number"
        />
        <CalcButton
          label="3"
          onClick={() => handleDigit("3")}
          variant="number"
        />
        <CalcButton
          label="+"
          onClick={() => handleOperator("+")}
          variant="operator"
          isActive={activeOperator === "+"}
        />

        <CalcButton
          label="0"
          onClick={() => handleDigit("0")}
          variant="number"
          isWide
        />
        <CalcButton
          label="."
          onClick={() => handleDigit(".")}
          variant="number"
        />
        <CalcButton
          label="="
          onClick={handleEquals}
          onLongPress={activateDistress}
          variant="operator"
        />
      </div>
    </div>
  );
}
