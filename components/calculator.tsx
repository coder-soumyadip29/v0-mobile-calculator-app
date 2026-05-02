'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalculatorButton } from './calculator-button';
import { CalculatorDisplay } from './calculator-display';
import {
  CalculatorState,
  Operator,
  initialState,
  calculate,
  isValidInput,
  checkDistressCode,
} from '@/lib/calculator';

interface CalculatorProps {
  onDistressActivate: () => void;
}

export function Calculator({ onDistressActivate }: CalculatorProps) {
  const [state, setState] = useState<CalculatorState>(initialState);
  const [activeOperator, setActiveOperator] = useState<Operator>(null);
  const [inputHistory, setInputHistory] = useState<string>('');

  // Track input for distress code detection
  const trackInput = useCallback((input: string) => {
    setInputHistory(prev => {
      const newHistory = prev + input;
      // Keep only last 10 characters to save memory
      return newHistory.slice(-10);
    });
  }, []);

  // Check for distress code after each input
  useEffect(() => {
    if (checkDistressCode(inputHistory)) {
      onDistressActivate();
      setInputHistory('');
    }
  }, [inputHistory, onDistressActivate]);

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    trackInput(digit);
    
    setState(prev => {
      if (prev.waitingForOperand) {
        return {
          ...prev,
          display: digit,
          waitingForOperand: false,
        };
      }

      if (!isValidInput(prev.display, digit)) {
        return prev;
      }

      const newDisplay = prev.display === '0' && digit !== '.'
        ? digit
        : prev.display + digit;

      return {
        ...prev,
        display: newDisplay,
      };
    });
  }, [trackInput]);

  // Handle operator input
  const handleOperator = useCallback((op: Operator) => {
    trackInput(op || '');
    
    setState(prev => {
      if (prev.previousValue && prev.operator && !prev.waitingForOperand) {
        // Calculate intermediate result
        const result = calculate(
          parseFloat(prev.previousValue),
          parseFloat(prev.display),
          prev.operator
        );
        
        const resultStr = isNaN(result) ? 'Error' : result.toString();
        
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
  }, [trackInput]);

  // Handle equals
  const handleEquals = useCallback(() => {
    trackInput('=');
    
    setState(prev => {
      if (!prev.operator || !prev.previousValue) {
        return prev;
      }

      const result = calculate(
        parseFloat(prev.previousValue),
        parseFloat(prev.display),
        prev.operator
      );

      const resultStr = isNaN(result) ? 'Error' : result.toString();

      return {
        display: resultStr,
        previousValue: '',
        operator: null,
        waitingForOperand: true,
        expression: '',
      };
    });
    
    setActiveOperator(null);
  }, [trackInput]);

  // Handle long press on equals (distress trigger)
  const handleEqualsLongPress = useCallback(() => {
    onDistressActivate();
  }, [onDistressActivate]);

  // Handle clear (AC)
  const handleClear = useCallback(() => {
    setState(initialState);
    setActiveOperator(null);
    setInputHistory('');
  }, []);

  // Handle toggle sign (+/-)
  const handleToggleSign = useCallback(() => {
    setState(prev => {
      const value = parseFloat(prev.display);
      if (isNaN(value)) return prev;
      
      return {
        ...prev,
        display: (value * -1).toString(),
      };
    });
  }, []);

  // Handle percentage
  const handlePercent = useCallback(() => {
    setState(prev => {
      const value = parseFloat(prev.display);
      if (isNaN(value)) return prev;
      
      return {
        ...prev,
        display: (value / 100).toString(),
      };
    });
  }, []);

  // Handle delete last digit
  const handleDelete = useCallback(() => {
    setState(prev => {
      if (prev.display.length <= 1 || prev.display === '0') {
        return { ...prev, display: '0' };
      }
      
      return {
        ...prev,
        display: prev.display.slice(0, -1),
      };
    });
  }, []);

  // Determine if AC or C should be shown
  const clearLabel = state.display === '0' && !state.previousValue ? 'AC' : 'C';

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-3 p-4">
      {/* Display */}
      <CalculatorDisplay value={state.display} />

      {/* Button Grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Row 1: AC, +/-, %, ÷ */}
        <CalculatorButton
          label={clearLabel}
          onClick={handleClear}
          variant="function"
        />
        <CalculatorButton
          label="+/−"
          onClick={handleToggleSign}
          variant="function"
        />
        <CalculatorButton
          label="%"
          onClick={handlePercent}
          variant="function"
        />
        <CalculatorButton
          label="÷"
          onClick={() => handleOperator('÷')}
          variant="operator"
          isActive={activeOperator === '÷'}
        />

        {/* Row 2: 7, 8, 9, × */}
        <CalculatorButton
          label="7"
          onClick={() => handleDigit('7')}
          variant="number"
        />
        <CalculatorButton
          label="8"
          onClick={() => handleDigit('8')}
          variant="number"
        />
        <CalculatorButton
          label="9"
          onClick={() => handleDigit('9')}
          variant="number"
        />
        <CalculatorButton
          label="×"
          onClick={() => handleOperator('×')}
          variant="operator"
          isActive={activeOperator === '×'}
        />

        {/* Row 3: 4, 5, 6, - */}
        <CalculatorButton
          label="4"
          onClick={() => handleDigit('4')}
          variant="number"
        />
        <CalculatorButton
          label="5"
          onClick={() => handleDigit('5')}
          variant="number"
        />
        <CalculatorButton
          label="6"
          onClick={() => handleDigit('6')}
          variant="number"
        />
        <CalculatorButton
          label="−"
          onClick={() => handleOperator('-')}
          variant="operator"
          isActive={activeOperator === '-'}
        />

        {/* Row 4: 1, 2, 3, + */}
        <CalculatorButton
          label="1"
          onClick={() => handleDigit('1')}
          variant="number"
        />
        <CalculatorButton
          label="2"
          onClick={() => handleDigit('2')}
          variant="number"
        />
        <CalculatorButton
          label="3"
          onClick={() => handleDigit('3')}
          variant="number"
        />
        <CalculatorButton
          label="+"
          onClick={() => handleOperator('+')}
          variant="operator"
          isActive={activeOperator === '+'}
        />

        {/* Row 5: 0 (wide), ., = */}
        <CalculatorButton
          label="0"
          onClick={() => handleDigit('0')}
          variant="number"
          isWide
        />
        <CalculatorButton
          label="."
          onClick={() => handleDigit('.')}
          variant="number"
        />
        <CalculatorButton
          label="="
          onClick={handleEquals}
          onLongPress={handleEqualsLongPress}
          variant="operator"
        />
      </div>

      {/* Hidden delete button - swipe gesture area or long press on display */}
      <button
        type="button"
        className="sr-only"
        onClick={handleDelete}
        aria-label="Delete last digit"
      >
        Delete
      </button>
    </div>
  );
}
