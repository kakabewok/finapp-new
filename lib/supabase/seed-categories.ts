import { SupabaseClient } from "@supabase/supabase-js";

export async function seedDefaultCategories(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error checking existing categories:", error);
    return;
  }

  if (count === 0) {
    const defaultCategories = [
      { name: "Food & Beverage", icon: "UtensilsCrossed", color: "#F97316", type: "expense" },
      { name: "Transportation", icon: "Car", color: "#3B82F6", type: "expense" },
      { name: "Shopping", icon: "ShoppingBag", color: "#EC4899", type: "expense" },
      { name: "Entertainment", icon: "Tv", color: "#8B5CF6", type: "expense" },
      { name: "Health", icon: "HeartPulse", color: "#EF4444", type: "expense" },
      { name: "Utilities", icon: "Zap", color: "#EAB308", type: "expense" },
      { name: "Education", icon: "GraduationCap", color: "#06B6D4", type: "expense" },
      { name: "Income", icon: "TrendingUp", color: "#22C55E", type: "income" },
      { name: "Other", icon: "MoreHorizontal", color: "#6B7280", type: "both" },
    ].map(cat => ({ ...cat, user_id: userId, is_default: true }));

    const { error: insertError } = await supabase.from("categories").insert(defaultCategories);
    if (insertError) {
      console.error("Error inserting default categories:", insertError);
    }
  }
}
