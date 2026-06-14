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

  // Create form state
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Tag");
  const [newColor, setNewColor] = useState("#6b7280");
  const [newType, setNewType] = useState<"expense" | "income" | "both">("expense");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleNameChange = (name: string) => {
    setNewName(name);
    if (name.length >= 2) {
      const suggestion = getSuggestedIconAndColor(name);
      setNewIcon(suggestion.icon);
      setNewColor(suggestion.color);
    }
  };

  const resetCreate = () => {
    setNewName("");
    setNewIcon("Tag");
    setNewColor("#6b7280");
    setNewType("expense");
    setShowCreate(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    // Client-side duplicate check
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === newName.trim().toLowerCase() && 
      (filterType === "all" || c.type === filterType || c.type === "both" || newType === "both")
    );
    if (isDuplicate) {
      toast.error(`Category "${newName.trim()}" already exists`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          icon: newIcon,
          color: newColor,
          type: newType,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create category");
      }
      const created: Category = await res.json();
      toast.success(`Category "${created.name}" created`);
      onCategoryCreated?.(created);
      onChange(created.id);
      resetCreate();
    } catch (err: any) {
      toast.error(err.message);
      // Keep form open with entered data on error
    } finally {
      setIsSaving(false);
    }
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
      <Dialog 
        open={showCreate} 
        onOpenChange={(isOpen) => {
          if (!isOpen && !isSaving) {
            resetCreate();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
              <CategoryBadge icon={newIcon} color={newColor} size="md" />
              <span className="text-sm font-medium truncate">
                {newName || <span className="text-muted-foreground">Category name</span>}
              </span>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Name <span className="text-red-500">*</span></Label>
              <Input
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Groceries"
                className="h-9"
                required
                autoFocus
              />
            </div>

            {/* Icon picker */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Icon</Label>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                {PICKER_ICONS.map((iconName) => {
                  const IconComp = getIcon(iconName);
                  return (
                    <button
                      key={iconName}
                      type="button"
                      title={iconName}
                      onClick={() => setNewIcon(iconName)}
                      className={cn(
                        "flex items-center justify-center aspect-square rounded-md text-muted-foreground hover:bg-accent transition-colors",
                        newIcon === iconName && "bg-primary/15 text-primary ring-2 ring-primary ring-offset-1 dark:ring-offset-background"
                      )}
                    >
                      <IconComp size={16} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                      newColor === c ? "border-foreground scale-110 ring-2 ring-foreground/20 ring-offset-1 dark:ring-offset-background" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  title="Custom color"
                  className="w-7 h-7 rounded-full cursor-pointer border border-border bg-transparent p-0"
                />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Type</Label>
              <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={resetCreate}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !newName.trim()}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
