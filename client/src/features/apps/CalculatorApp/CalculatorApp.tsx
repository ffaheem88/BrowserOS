/**
 * Calculator Application
 * Simple calculator with basic arithmetic operations
 */

import { useState } from 'react';
import { AppComponentProps } from '../../../types/desktop';

export function CalculatorApp(_props: AppComponentProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumberClick = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperationClick = (op: string) => {
    const currentValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operation) {
      const result = performCalculation(previousValue, currentValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setOperation(op);
    setNewNumber(true);
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const currentValue = parseFloat(display);
      const result = performCalculation(previousValue, currentValue, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setNewNumber(false);
    }
  };

  const performCalculation = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  };

  const buttonClass =
    'h-14 text-lg font-semibold rounded-lg transition-colors hover:opacity-80 active:scale-95';
  const numberButtonClass = `${buttonClass} bg-gray-700 text-white hover:bg-gray-600`;
  const operationButtonClass = `${buttonClass} bg-blue-600 text-white hover:bg-blue-500`;
  const specialButtonClass = `${buttonClass} bg-gray-600 text-white hover:bg-gray-500`;

  return (
    <div className="h-full flex flex-col bg-gray-800 p-4">
      {/* Display */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <div className="text-right">
          {operation && (
            <div className="text-gray-400 text-sm mb-1">
              {previousValue} {operation}
            </div>
          )}
          <div className="text-white text-4xl font-bold truncate">{display}</div>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2 flex-1">
        {/* Row 1 */}
        <button onClick={handleClear} className={`${specialButtonClass} col-span-2`}>
          C
        </button>
        <button onClick={() => handleOperationClick('/')} className={operationButtonClass}>
          ÷
        </button>
        <button onClick={() => handleOperationClick('*')} className={operationButtonClass}>
          ×
        </button>

        {/* Row 2 */}
        <button onClick={() => handleNumberClick('7')} className={numberButtonClass}>
          7
        </button>
        <button onClick={() => handleNumberClick('8')} className={numberButtonClass}>
          8
        </button>
        <button onClick={() => handleNumberClick('9')} className={numberButtonClass}>
          9
        </button>
        <button onClick={() => handleOperationClick('-')} className={operationButtonClass}>
          −
        </button>

        {/* Row 3 */}
        <button onClick={() => handleNumberClick('4')} className={numberButtonClass}>
          4
        </button>
        <button onClick={() => handleNumberClick('5')} className={numberButtonClass}>
          5
        </button>
        <button onClick={() => handleNumberClick('6')} className={numberButtonClass}>
          6
        </button>
        <button onClick={() => handleOperationClick('+')} className={operationButtonClass}>
          +
        </button>

        {/* Row 4 */}
        <button onClick={() => handleNumberClick('1')} className={numberButtonClass}>
          1
        </button>
        <button onClick={() => handleNumberClick('2')} className={numberButtonClass}>
          2
        </button>
        <button onClick={() => handleNumberClick('3')} className={numberButtonClass}>
          3
        </button>
        <button onClick={handleEquals} className={`${operationButtonClass} row-span-2`}>
          =
        </button>

        {/* Row 5 */}
        <button onClick={() => handleNumberClick('0')} className={`${numberButtonClass} col-span-2`}>
          0
        </button>
        <button onClick={handleDecimal} className={numberButtonClass}>
          .
        </button>
      </div>
    </div>
  );
}

// App metadata for registration
export const CalculatorAppManifest = {
  id: 'calculator',
  name: 'Calculator',
  version: '1.0.0',
  description: 'Simple calculator for basic arithmetic',
  author: 'BrowserOS',
  icon: '🔢',
  category: 'Utilities',
  permissions: [],
  windowConfig: {
    defaultSize: { width: 320, height: 480 },
    minSize: { width: 320, height: 480 },
    maxSize: { width: 320, height: 480 },
    resizable: false,
    maximizable: false
  },
  component: CalculatorApp
};
