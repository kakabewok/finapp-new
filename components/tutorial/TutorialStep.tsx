import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TutorialStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon?: ReactNode;
}

export function TutorialStep({
  stepNumber,
  title,
  description,
  icon,
}: TutorialStepProps) {
  return (
    <div
      className={cn(
        "relative flex gap-4 p-5 rounded-2xl border transition-all duration-300",
        "bg-card border-border shadow-sm hover:shadow-md"
      )}
    >
      <div className="flex-shrink-0 mt-1">
        <div
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full border-2 transition-colors",
            "border-muted-foreground/30 text-muted-foreground"
          )}
        >
          <span className="text-sm font-semibold">{stepNumber}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <h3
            className={cn(
              "text-lg font-semibold tracking-tight",
            )}
          >
            {title}
          </h3>
          {icon && (
            <div
              className={cn(
                "p-2 rounded-lg bg-primary/10 text-primary hidden sm:block",
              )}
            >
              {icon}
            </div>
          )}
        </div>
        <p className={cn("text-sm text-muted-foreground leading-relaxed")}>
          {description}
        </p>
      </div>
    </div>
  );
}
