"use client";

import { useState } from "react";
import { Category, BudgetSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getIcon } from "@/lib/icons";

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  existingBudget?: BudgetSummary | null;
  selectedMonth: number;
  selectedYear: number;
  onSuccess: () => void;
}

export function BudgetForm({ open, onOpenChange, categories, existingBudget, selectedMonth, selectedYear, onSuccess }: BudgetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(existingBudget?.category_id || "");
  const [amount, setAmount] = useState(existingBudget?.budget_amount?.toString() || "");
  const [rolloverEnabled, setRolloverEnabled] = useState((existingBudget as any)?.rollover_enabled || false);

  // Reset form when opened with new data
  useState(() => {
    if (open) {
      setCategoryId(existingBudget?.category_id || "");
      setAmount(existingBudget?.budget_amount?.toString() || "");
      setRolloverEnabled((existingBudget as any)?.rollover_enabled || false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const url = existingBudget ? `/api/budgets/${existingBudget.id}` : "/api/budgets";
      const method = existingBudget ? "PATCH" : "POST";
      
      const payload = existingBudget ? {
        amount: parseFloat(amount),
        rollover_enabled: rolloverEnabled
      } : {
        category_id: categoryId,
        month: selectedMonth,
        year: selectedYear,
        amount: parseFloat(amount),
        rollover_enabled: rolloverEnabled
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save budget");
      }

      toast.success(existingBudget ? "Budget updated" : "Budget created");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existingBudget ? "Edit Budget" : "Add Budget"}</DialogTitle>
          <DialogDescription>
            Set a spending limit for a category for the selected month.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {!existingBudget && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.type === 'expense' || c.type === 'both').map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        {(() => {
                          const IconComponent = getIcon(category.icon);
                          return <IconComponent size={14} className="text-muted-foreground" />;
                        })()}
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount (IDR)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 1000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1000"
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Rollover</Label>
              <p className="text-sm text-muted-foreground">
                Carry over unused budget to next month
              </p>
            </div>
            <Switch
              checked={rolloverEnabled}
              onCheckedChange={setRolloverEnabled}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
