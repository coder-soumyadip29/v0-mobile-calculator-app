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

  const bgStyles: React.CSSProperties =
    variant === "operator"
      ? isActive
        ? {
            background: "rgba(255,255,255,0.92)",
            color: "#f57c00",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow:
              "0 8px 32px rgba(245,124,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)",
          }
        : {
            background:
              "linear-gradient(145deg, rgba(255,160,0,0.85) 0%, rgba(233,99,0,0.9) 100%)",
            color: "#fff",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,180,60,0.4)",
            boxShadow:
              "0 8px 32px rgba(233,99,0,0.45), inset 0 1px 0 rgba(255,210,100,0.35)",
          }
      : variant === "function"
        ? {
            background: "rgba(120,120,128,0.45)",
            color: "#fff",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
          }
        : {
            background: "rgba(60,60,67,0.55)",
            color: "#fff",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
          };

  return (
    <button
      type="button"
      style={bgStyles}
      className={cn(
        "flex items-center justify-center text-[26px] font-light",
        "select-none touch-manipulation transition-all duration-100",
        "active:scale-[0.93]",
        "rounded-[22px]",
        isWide ? "col-span-2 h-full" : "aspect-square",
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => timerRef.current && clearTimeout(timerRef.current)}
    >
      {isWide ? (
        <span className="pl-6 text-left w-full text-[28px]">{label}</span>
      ) : (
        label
      )}
    </button>
  );
}

function CalcDisplay({
  value,
  expression,
}: {
  value: string;
  expression: string;
}) {
  const displayValue = formatDisplay(value);
  const length = displayValue.length;

  const fontSize =
    length <= 5
      ? "text-[72px]"
      : length <= 8
        ? "text-[54px]"
        : length <= 11
          ? "text-[42px]"
          : "text-[32px]";

  return (
    <div className="w-full px-5 pt-4 pb-3 flex flex-col items-end justify-end min-h-[120px]">
      <span className="text-[16px] text-[#8e8e93] font-light mb-1 min-h-[20px]">
        {expression || "\u00A0"}
      </span>
      <span
        className={cn(
          "font-thin text-white tracking-tight leading-none transition-all duration-150",
          fontSize,
        )}
      >
        {displayValue}
      </span>
    </div>
  );
}

function BlackoutScreen() {
  return (
    <div className="absolute inset-0 bg-black z-[9999]" aria-hidden="true" />
  );
}

export function VictimCalculator() {
  const { isDistressActive, activateDistress } = useDistress();
  const [state, setState] = useState<CalculatorState>(initialState);
  const [activeOperator, setActiveOperator] = useState<Operator>(null);
  const [inputHistory, setInputHistory] = useState("");
  const [expression, setExpression] = useState("");

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
        if (prev.waitingForOperand)
          return { ...prev, display: digit, waitingForOperand: false };
        if (!isValidInput(prev.display, digit)) return prev;
        const newDisplay =
          prev.display === "0" && digit !== "." ? digit : prev.display + digit;
        return { ...prev, display: newDisplay };
      });
    },
    [trackInput],
  );

  const opSymbol: Record<string, string> = {
    "÷": "÷",
    "×": "×",
    "-": "-",
    "+": "+",
  };

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
          const expr = `${formatDisplay(resultStr)} ${opSymbol[op || ""] || ""}`;
          setExpression(expr);
          return {
            display: resultStr,
            previousValue: resultStr,
            operator: op,
            waitingForOperand: true,
            expression: expr,
          };
        }
        const expr = `${formatDisplay(prev.display)} ${opSymbol[op || ""] || ""}`;
        setExpression(expr);
        return {
          ...prev,
          previousValue: prev.display,
          operator: op,
          waitingForOperand: true,
          expression: expr,
        };
      });
      setActiveOperator(op);
    },
    [trackInput],
  );

  const handleEquals = useCallback(() => {
    if (state.display === "9119") {
      activateDistress();
      return;
    }
    trackInput("=");
    setState((prev) => {
      if (!prev.operator || !prev.previousValue) return prev;
      const expr = `${formatDisplay(prev.previousValue)} ${opSymbol[prev.operator] || ""} ${formatDisplay(prev.display)}`;
      setExpression(expr);
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
    setExpression("");
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

  if (isDistressActive) return <BlackoutScreen />;

  return (
    <div
      className="w-full h-full flex flex-col justify-end relative overflow-hidden"
      style={{ background: "#000000" }}
    >
      {/* Ambient glow blobs behind everything — gives glass something to blur */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {/* Top-left warm blob */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-20%",
            width: "70%",
            height: "55%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(80,60,30,0.55) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Orange glow bottom-right for operators */}
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            right: "-15%",
            width: "60%",
            height: "50%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(200,80,0,0.35) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        {/* Subtle cool blue top-right */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "-10%",
            width: "50%",
            height: "40%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(30,50,100,0.4) 0%, transparent 70%)",
            filter: "blur(55px)",
          }}
        />
      </div>

      {/* Content above blobs */}
      <div className="relative z-10 flex flex-col justify-end h-full">
        <button
          type="button"
          className="absolute top-2 left-2 w-12 h-12 opacity-0 z-10"
          onClick={activateDistress}
          aria-label="Hidden emergency trigger"
        />

        <CalcDisplay value={state.display} expression={expression} />

        {/* Glass divider */}
        <div
          className="mx-4 mb-4"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          }}
        />

        <div
          className="grid grid-cols-4 gap-3 px-4 pb-6"
          style={{ gridAutoRows: "1fr" }}
        >
          <CalcButton
            label={clearLabel}
            onClick={handleClear}
            variant="function"
          />
          <CalcButton
            label="+/-"
            onClick={handleToggleSign}
            variant="function"
          />
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
    </div>
  );
}
