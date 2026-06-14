import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TutorialStepProps {
  stepNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  icon?: ReactNode;
}

export function TutorialStep({
  stepNumber,
  title,
  description,
  isCompleted,
  onToggleComplete,
  icon,
}: TutorialStepProps) {
  return (
    <div
      className={cn(
        "relative flex gap-4 p-5 rounded-2xl border transition-all duration-300",
        isCompleted
          ? "bg-muted/30 border-muted opacity-80"
          : "bg-card border-border shadow-sm hover:shadow-md"
      )}
    >
      <div className="flex-shrink-0 mt-1">
        <button
          onClick={onToggleComplete}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full border-2 transition-colors",
            isCompleted
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary"
          )}
        >
          {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-sm font-semibold">{stepNumber}</span>}
        </button>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <h3
            className={cn(
              "text-lg font-semibold tracking-tight",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {title}
          </h3>
          {icon && (
            <div
              className={cn(
                "p-2 rounded-lg bg-primary/10 text-primary hidden sm:block",
                isCompleted && "opacity-50 grayscale"
              )}
            >
              {icon}
            </div>
          )}
        </div>
        <p className={cn("text-sm text-muted-foreground leading-relaxed", isCompleted && "opacity-70")}>
          {description}
        </p>
      </div>
    </div>
  );
}
