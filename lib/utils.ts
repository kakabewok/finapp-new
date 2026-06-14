import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency for IDR (Indonesian Rupiah) or other currencies
 */
export function formatCurrency(amount: number, currency: string = "IDR"): string {
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a compact number (e.g., 1.2M, 500K)
 */
export function formatCompactNumber(amount: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
  }).format(amount);
}

/**
 * Format a date string to a human-readable format, supporting timezone adjustment (WIB UTC+7) and relative formatting.
 */
export function formatDate(
  date: string | Date | null | undefined, 
  options?: { relative?: boolean }
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  if (options?.relative) {
    const now = new Date();
    const diffDays = Math.abs(differenceInDays(now, d));
    if (diffDays < 7) {
      return formatDistanceToNow(d, { addSuffix: true });
    }
  }

  // Enforce Asia/Jakarta UTC+7 timezone by shifting local time of the Date object
  const systemOffset = d.getTimezoneOffset() * 60000;
  const jakartaOffset = 7 * 60 * 60000;
  const shiftedDate = new Date(d.getTime() + systemOffset + jakartaOffset);

  return format(shiftedDate, 'd MMM yyyy');
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/**
 * Calculate percentage change between two values
 */
export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Generate a color from a string (for category colors)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 50%)`;
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Format a raw value (number or numeric string) into Indonesian format with thousand separator dots (e.g. 50000 -> "50.000")
 */
export function formatRupiah(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = typeof value === "number" ? value.toString() : value;
  // Keep only digits
  const clean = str.replace(/\D/g, "");
  if (!clean) return "";
  
  // Format with dots as thousand separator
  return new Intl.NumberFormat("id-ID").format(parseInt(clean, 10));
}

/**
 * Parse formatted Indonesian rupiah string back to raw number (e.g. "50.000" -> 50000)
 */
export function parseRupiah(formattedString: string | undefined | null): number {
  if (!formattedString) return 0;
  // Strip all non-digits
  const clean = formattedString.replace(/\D/g, "");
  if (!clean) return 0;
  return parseInt(clean, 10);
}
