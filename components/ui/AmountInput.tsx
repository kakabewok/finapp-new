"use client";

import * as React from "react";
import { cn, formatRupiah } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, className, placeholder = "0", disabled, ...props }, ref) => {
    // Keep local string representation for visual formatting
    const [displayVal, setDisplayVal] = React.useState(() => {
      return value > 0 ? formatRupiah(value) : "";
    });

    // Sync with external value changes (e.g. form resets or initial load)
    React.useEffect(() => {
      if (value === 0) {
        setDisplayVal("");
      } else {
        const formatted = formatRupiah(value);
        if (formatted !== displayVal.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")) {
          setDisplayVal(formatted);
        }
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      
      // Keep only digits
      const digitsOnly = inputVal.replace(/\D/g, "");
      
      if (!digitsOnly) {
        setDisplayVal("");
        onChange(0);
        return;
      }

      // Convert to number
      const parsedNum = parseInt(digitsOnly, 10);
      const formatted = formatRupiah(parsedNum);
      
      // Calculate cursor position adjustment
      const selectionStart = e.target.selectionStart || 0;
      const originalLen = inputVal.length;
      const formattedLen = formatted.length;
      
      setDisplayVal(formatted);
      onChange(parsedNum);

      // Restore cursor position on next tick to avoid jumping
      setTimeout(() => {
        const diff = formattedLen - originalLen;
        let newCursorPos = selectionStart + diff;
        
        // Boundaries check
        if (newCursorPos < 0) newCursorPos = 0;
        if (newCursorPos > formattedLen) newCursorPos = formattedLen;
        
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    };

    return (
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none z-10">
          <span className="text-muted-foreground font-medium select-none">
            Rp
          </span>
        </div>
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={cn("pl-10 text-lg font-semibold", className)}
          placeholder={placeholder}
          value={displayVal}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
    );
  }
);

AmountInput.displayName = "AmountInput";
