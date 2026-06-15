"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CategoryFormModal } from "@/components/ui/CategoryFormModal";
import { getIcon, ICON_MAP } from "@/lib/icons";
import { PRESET_COLORS, PICKER_ICONS, getSuggestedIconAndColor } from "@/lib/categoryIconMap";
import { toast } from "sonner";
import type { Category } from "@/types";

interface CategorySelectorProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  onCategoryCreated?: (category: Category) => void;
  filterType?: "expense" | "income" | "transfer" | "all";
  placeholder?: string;
  disabled?: boolean;
}

export function CategorySelector({
  categories,
  value,
  onChange,
  onCategoryCreated,
  filterType = "all",
  placeholder = "Select a category",
  disabled = false,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const selectedCategory = categories.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const byType =
      filterType === "all"
        ? categories
        : categories.filter((c) => c.type === filterType || c.type === "both");

    if (!search.trim()) return byType;
    const q = search.toLowerCase();
    return byType.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, filterType, search]);

  const handleCategorySuccess = (created: Category) => {
    onCategoryCreated?.(created);
    onChange(created.id);
  };

  return (
    <>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSearch(""); } }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground"
            )}
          >
            {selectedCategory ? (
              <CategoryBadge
                icon={selectedCategory.icon}
                color={selectedCategory.color}
                name={selectedCategory.name}
                showName
                size="sm"
              />
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[280px] p-0" 
          align="start" 
        >
          <div className="flex flex-col">
            {/* Search */}
            <div className="p-2 border-b">
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            </div>

            {/* Category list */}
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No categories found.
                </p>
              ) : (
                filtered.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { onChange(cat.id); setOpen(false); setSearch(""); }}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                      value === cat.id && "bg-accent"
                    )}
                  >
                    <CategoryBadge
                      icon={cat.icon}
                      color={cat.color}
                      name={cat.name}
                      showName
                      size="sm"
                    />
                    {value === cat.id && (
                      <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Create new button */}
            <div className="border-t p-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setShowCreate(true);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Create new category
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Create Category Dialog */}
      <CategoryFormModal 
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={handleCategorySuccess}
        categories={categories}
      />
    </>
  );
}
