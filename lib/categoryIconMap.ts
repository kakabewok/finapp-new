/**
 * Default icon and color suggestions for common personal finance category names.
 * Used to auto-populate icon/color when creating or seeding categories.
 * Keys are lowercase category names (or substrings).
 */
export const CATEGORY_ICON_MAP: Record<string, { icon: string; color: string }> = {
  // Food & Dining
  food: { icon: "UtensilsCrossed", color: "#f97316" },
  dining: { icon: "UtensilsCrossed", color: "#f97316" },
  restaurant: { icon: "UtensilsCrossed", color: "#f97316" },
  meal: { icon: "Pizza", color: "#f97316" },
  coffee: { icon: "Coffee", color: "#92400e" },
  cafe: { icon: "Coffee", color: "#92400e" },
  snack: { icon: "Pizza", color: "#fb923c" },

  // Transport
  transport: { icon: "Car", color: "#3b82f6" },
  transportation: { icon: "Car", color: "#3b82f6" },
  car: { icon: "Car", color: "#3b82f6" },
  fuel: { icon: "Car", color: "#60a5fa" },
  petrol: { icon: "Car", color: "#60a5fa" },
  bus: { icon: "Bus", color: "#2563eb" },
  train: { icon: "Train", color: "#1d4ed8" },
  bike: { icon: "Bike", color: "#6366f1" },
  taxi: { icon: "Car", color: "#8b5cf6" },
  parking: { icon: "Car", color: "#7c3aed" },

  // Shopping
  shopping: { icon: "ShoppingBag", color: "#ec4899" },
  clothes: { icon: "Shirt", color: "#db2777" },
  clothing: { icon: "Shirt", color: "#db2777" },
  fashion: { icon: "Shirt", color: "#be185d" },
  grocery: { icon: "ShoppingCart", color: "#16a34a" },
  groceries: { icon: "ShoppingCart", color: "#16a34a" },
  supermarket: { icon: "ShoppingCart", color: "#15803d" },

  // Health & Medical
  health: { icon: "HeartPulse", color: "#ef4444" },
  medical: { icon: "Stethoscope", color: "#dc2626" },
  medicine: { icon: "BriefcaseMedical", color: "#b91c1c" },
  hospital: { icon: "Stethoscope", color: "#ef4444" },
  pharmacy: { icon: "BriefcaseMedical", color: "#f87171" },
  fitness: { icon: "Dumbbell", color: "#10b981" },
  gym: { icon: "Dumbbell", color: "#059669" },
  sport: { icon: "Dumbbell", color: "#047857" },

  // Entertainment
  entertainment: { icon: "Tv", color: "#a855f7" },
  streaming: { icon: "Tv", color: "#9333ea" },
  gaming: { icon: "Gamepad2", color: "#7c3aed" },
  games: { icon: "Gamepad2", color: "#6d28d9" },
  music: { icon: "Music", color: "#8b5cf6" },
  movie: { icon: "Tv", color: "#a78bfa" },
  cinema: { icon: "Tv", color: "#7c3aed" },

  // Income
  salary: { icon: "Wallet", color: "#22c55e" },
  income: { icon: "ArrowUpCircle", color: "#16a34a" },
  freelance: { icon: "Banknote", color: "#15803d" },
  bonus: { icon: "Gift", color: "#4ade80" },
  allowance: { icon: "Banknote", color: "#86efac" },

  // Investment & Savings
  investment: { icon: "TrendingUp", color: "#0ea5e9" },
  invest: { icon: "TrendingUp", color: "#0284c7" },
  saving: { icon: "PiggyBank", color: "#06b6d4" },
  savings: { icon: "PiggyBank", color: "#0891b2" },
  stock: { icon: "TrendingUp", color: "#0e7490" },

  // Housing & Utilities
  housing: { icon: "Home", color: "#64748b" },
  home: { icon: "Home", color: "#475569" },
  rent: { icon: "Building2", color: "#64748b" },
  utilities: { icon: "Zap", color: "#eab308" },
  electricity: { icon: "Zap", color: "#ca8a04" },
  water: { icon: "Droplets", color: "#38bdf8" },
  internet: { icon: "Wifi", color: "#0ea5e9" },
  phone: { icon: "Phone", color: "#6366f1" },
  mobile: { icon: "Phone", color: "#818cf8" },

  // Education
  education: { icon: "GraduationCap", color: "#f59e0b" },
  school: { icon: "GraduationCap", color: "#d97706" },
  course: { icon: "BookOpen", color: "#b45309" },
  book: { icon: "BookOpen", color: "#92400e" },
  books: { icon: "BookOpen", color: "#92400e" },

  // Travel
  travel: { icon: "Plane", color: "#06b6d4" },
  vacation: { icon: "Plane", color: "#0891b2" },
  hotel: { icon: "Building2", color: "#0e7490" },
  flight: { icon: "Plane", color: "#22d3ee" },

  // Personal & Family
  personal: { icon: "Heart", color: "#f43f5e" },
  family: { icon: "Baby", color: "#fb7185" },
  baby: { icon: "Baby", color: "#fda4af" },
  kids: { icon: "Baby", color: "#fecdd3" },
  gift: { icon: "Gift", color: "#e879f9" },
  gifts: { icon: "Gift", color: "#d946ef" },
  donation: { icon: "Heart", color: "#ec4899" },

  // Finance
  tax: { icon: "Receipt", color: "#6b7280" },
  insurance: { icon: "Landmark", color: "#374151" },
  bank: { icon: "Landmark", color: "#1f2937" },
  transfer: { icon: "ArrowUpCircle", color: "#4b5563" },
  maintenance: { icon: "Wrench", color: "#9ca3af" },
};

/**
 * Given a category name, returns a suggested { icon, color } pair.
 * Tries exact match first, then substring match.
 */
export function getSuggestedIconAndColor(name: string): { icon: string; color: string } {
  const lower = name.toLowerCase().trim();

  // Exact match
  if (CATEGORY_ICON_MAP[lower]) return CATEGORY_ICON_MAP[lower];

  // Substring match — find first key that is contained in the name
  for (const [key, value] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return value;
  }

  return { icon: "Tag", color: "#6b7280" };
}

/** Preset color palette for the icon/color picker */
export const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
  "#10b981", // emerald
  "#f59e0b", // amber
  "#a855f7", // purple
];

/** Icons displayed in the icon picker grid */
export const PICKER_ICONS = [
  "UtensilsCrossed", "Car", "ShoppingBag", "Tv", "HeartPulse", "Zap",
  "GraduationCap", "TrendingUp", "Wallet", "PiggyBank", "Plane", "Home",
  "Coffee", "Shirt", "Dumbbell", "Gift", "Music", "Gamepad2",
  "Phone", "Droplets", "Wifi", "BookOpen", "Bus", "Tag",
];
