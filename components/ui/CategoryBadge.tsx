import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  icon?: string | null;
  color?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

export function CategoryBadge({ icon, color, name, size = "md", showName = false, className }: CategoryBadgeProps) {
  const IconComponent = getIcon(icon ?? "MoreHorizontal");
  const bgColor = color ?? "#6B7280";

  const sizeClasses = {
    sm: "w-6 h-6 rounded-md",
    md: "w-8 h-8 rounded-lg",
    lg: "w-9 h-9 rounded-lg"
  };

  const iconSizes = {
    sm: 13,
    md: 16,
    lg: 18
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn("flex items-center justify-center flex-shrink-0", sizeClasses[size])}
        style={{
          backgroundColor: `${bgColor}20`,
          color: bgColor,
        }}
      >
        <IconComponent size={iconSizes[size]} />
      </span>
      {showName && name && (
        <span className={size === "sm" ? "text-sm" : "font-medium text-sm"}>
          {name}
        </span>
      )}
    </div>
  );
}
