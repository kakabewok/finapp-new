import {
  UtensilsCrossed, Car, ShoppingBag, Tv, HeartPulse, Zap,
  GraduationCap, TrendingUp, MoreHorizontal, CheckCircle2,
  AlertTriangle, XCircle, Info, Wallet, ArrowUpCircle, ArrowDownCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed, Car, ShoppingBag, Tv, HeartPulse, Zap,
  GraduationCap, TrendingUp, MoreHorizontal, CheckCircle2,
  AlertTriangle, XCircle, Info, Wallet, ArrowUpCircle, ArrowDownCircle,
};

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return MoreHorizontal;
  return ICON_MAP[name] ?? MoreHorizontal;
}
