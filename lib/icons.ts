import {
  UtensilsCrossed, Car, ShoppingBag, Tv, HeartPulse, Zap,
  GraduationCap, TrendingUp, Tag, CheckCircle2,
  AlertTriangle, XCircle, Info, Wallet, ArrowUpCircle, ArrowDownCircle,
  Home, Wifi, Droplets, Coffee, Shirt, Plane, Dumbbell, Gift,
  Landmark, BriefcaseMedical, PiggyBank, Banknote, Baby, Music,
  BookOpen, Gamepad2, Phone, Bus, Bike, Train, ShoppingCart,
  Receipt, Heart, Pizza, Wrench, Stethoscope, Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  // Existing
  UtensilsCrossed, Car, ShoppingBag, Tv, HeartPulse, Zap,
  GraduationCap, TrendingUp, Tag, CheckCircle2,
  AlertTriangle, XCircle, Info, Wallet, ArrowUpCircle, ArrowDownCircle,
  // New
  Home, Wifi, Droplets, Coffee, Shirt, Plane, Dumbbell, Gift,
  Landmark, BriefcaseMedical, PiggyBank, Banknote, Baby, Music,
  BookOpen, Gamepad2, Phone, Bus, Bike, Train, ShoppingCart,
  Receipt, Heart, Pizza, Wrench, Stethoscope, Building2,
};

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Tag;
  return ICON_MAP[name] ?? Tag;
}
