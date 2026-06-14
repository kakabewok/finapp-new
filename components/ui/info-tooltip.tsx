"use client";

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center"
        >
          <Info className="h-4 w-4" />
          <span className="sr-only">Info</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="max-w-[250px] text-sm z-50">
        {text}
      </PopoverContent>
    </Popover>
  );
}
