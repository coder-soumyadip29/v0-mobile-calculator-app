// Calculator engine - handles all arithmetic logic

export type Operator = '+' | '-' | '×' | '÷' | null;

export interface CalculatorState {
  display: string;
  previousValue: string;
  operator: Operator;
  waitingForOperand: boolean;
  expression: string;
}

export const initialState: CalculatorState = {
  display: '0',
  previousValue: '',
  operator: null,
  waitingForOperand: false,
  expression: '',
};

// Perform arithmetic calculation
export function calculate(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      if (b === 0) return NaN; // Division by zero
      return a / b;
    default:
      return b;
  }
}

// Format number for display with overflow handling
export function formatDisplay(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return 'Error';
  
  // Convert to string for length checking
  const strValue = num.toString();
  
  // If number is too long, use scientific notation
  if (strValue.replace('-', '').replace('.', '').length > 9) {
    const formatted = num.toExponential(5);
    return formatted;
  }
  
  // Format with commas for readability
  const parts = strValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
}

// Check if input sequence matches distress code
export function checkDistressCode(expression: string): boolean {
  // Remove spaces and check for "9119="
  const cleaned = expression.replace(/\s/g, '');
  return cleaned.includes('9119=');
}

// Parse and validate numeric input
export function isValidInput(current: string, digit: string): boolean {
  // Prevent multiple decimal points
  if (digit === '.' && current.includes('.')) return false;
  
  // Limit input length
  if (current.replace('.', '').length >= 9 && digit !== '.') return false;
  
  return true;
}
