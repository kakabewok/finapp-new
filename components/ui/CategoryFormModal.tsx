"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getIcon } from "@/lib/icons";
import { PRESET_COLORS, PICKER_ICONS, getSuggestedIconAndColor } from "@/lib/categoryIconMap";
import { toast } from "sonner";
import type { Category } from "@/types";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (category: Category) => void;
  categories: Category[];
  mode?: "create" | "edit";
  initialData?: Category;
  workspaceId?: string | null;
}

export function CategoryFormModal({
  open,
  onOpenChange,
  onSuccess,
  categories,
  mode = "create",
  initialData,
  workspaceId,
}: CategoryFormModalProps) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Tag");
  const [newColor, setNewColor] = useState("#6b7280");
  const [newType, setNewType] = useState<"expense" | "income" | "both">("expense");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setNewName(initialData.name);
        setNewIcon(initialData.icon || "Tag");
        setNewColor(initialData.color || "#6b7280");
        setNewType(initialData.type as any);
      } else {
        resetForm();
      }
    }
  }, [open, mode, initialData]);

  const handleNameChange = (name: string) => {
    setNewName(name);
    if (mode === "create" && name.length >= 2) {
      const suggestion = getSuggestedIconAndColor(name);
      setNewIcon(suggestion.icon);
      setNewColor(suggestion.color);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewIcon("Tag");
    setNewColor("#6b7280");
    setNewType("expense");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newName.trim()) {
      toast.error("Category name is required");
      return;
    }

    // Client-side duplicate check
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === newName.trim().toLowerCase() &&
        c.id !== initialData?.id &&
        (c.type === newType || c.type === "both" || newType === "both")
    );
    if (isDuplicate) {
      toast.error(`Category "${newName.trim()}" already exists`);
      return;
    }

    setIsSaving(true);
    try {
      const url = mode === "edit" && initialData ? `/api/categories/${initialData.id}` : "/api/categories";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          icon: newIcon,
          color: newColor,
          type: newType,
          workspace_id: workspaceId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${mode} category`);
      }
      const savedCategory: Category = await res.json();
      toast.success(`Category "${savedCategory.name}" ${mode === "create" ? "created" : "updated"}`);

      // Close the modal first, safely decoupled from the submit event
      setTimeout(() => {
        onOpenChange(false);
      }, 0);

      onSuccess?.(savedCategory);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSaving) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Category" : "Edit Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
            <CategoryBadge icon={newIcon} color={newColor} name={newName || "Category name"} size="md" showName />
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
              onClick={() => onOpenChange(false)}
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
  );
}
