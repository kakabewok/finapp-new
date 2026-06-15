"use client";

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  text?: string;
  children?: ReactNode;
  icon?: ReactNode;
  buttonClassName?: string;
  contentClassName?: string;
}

export function InfoTooltip({
  text,
  children,
  icon,
  buttonClassName,
  contentClassName
}: InfoTooltipProps) {
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
          className={cn(
            "text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center",
            buttonClassName
          )}
        >
          {icon ? icon : <Info className="h-4 w-4" />}
          <span className="sr-only">Info</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className={cn("max-w-[250px] text-sm z-50", contentClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        {children || text}
      </PopoverContent>
    </Popover>
  );
}
