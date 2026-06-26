"use client";

import { useState, useEffect } from "react";
import { Category, BudgetSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CategorySelector } from "@/components/ui/CategorySelector";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  existingBudget?: BudgetSummary | null;
  onSuccess: () => void;
  onCategoryCreated?: (category: Category) => void;
  workspaceId?: string | null;
}

export function BudgetForm({ open, onOpenChange, categories, existingBudget, onSuccess, onCategoryCreated, workspaceId }: BudgetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(existingBudget?.category_id || "");
  const [amount, setAmount] = useState(existingBudget?.budget_amount?.toString() || "");
  const [notes, setNotes] = useState(existingBudget?.notes || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    existingBudget?.start_date ? new Date(existingBudget.start_date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    existingBudget?.end_date ? new Date(existingBudget.end_date) : (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(0); // last day of current month
      return d;
    })()
  );
  const [isRecurring, setIsRecurring] = useState(existingBudget?.is_recurring || false);
  const [isRollover, setIsRollover] = useState(existingBudget?.is_rollover || false);

  // Reset form when opened with new data
  useEffect(() => {
    if (open) {
      setCategoryId(existingBudget?.category_id || "");
      setAmount(existingBudget?.budget_amount?.toString() || "");
      setNotes(existingBudget?.notes || "");
      setStartDate(
        existingBudget?.start_date ? new Date(existingBudget.start_date) : new Date()
      );
      setEndDate(
        existingBudget?.end_date ? new Date(existingBudget.end_date) : (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          d.setDate(0);
          return d;
        })()
      );
      setIsRecurring(existingBudget?.is_recurring || false);
      setIsRollover(existingBudget?.is_rollover || false);
    } else if (!existingBudget) {
      setCategoryId("");
      setAmount("");
      setNotes("");
      setStartDate(new Date());
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(0);
      setEndDate(d);
      setIsRecurring(false);
      setIsRollover(false);
    }
  }, [open, existingBudget]);

  const resetForm = () => {
    setCategoryId("");
    setAmount("");
    setNotes("");
    setStartDate(new Date());
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    setEndDate(d);
    setIsRecurring(false);
    setIsRollover(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount || !startDate || !endDate) {
      toast.error("Please fill all required fields");
      return;
    }

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    setIsLoading(true);
    try {
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const url = existingBudget ? `/api/budgets/${existingBudget.id}` : "/api/budgets";
      const method = existingBudget ? "PATCH" : "POST";

      const payload = existingBudget ? {
        category_id: categoryId,
        amount: parseFloat(amount),
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        is_recurring: isRecurring,
        is_rollover: isRecurring ? isRollover : false,
        notes: notes || null,
        workspace_id: workspaceId || null,
      } : {
        category_id: categoryId,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        amount: parseFloat(amount),
        is_recurring: isRecurring,
        is_rollover: isRecurring ? isRollover : false,
        notes: notes || null,
        workspace_id: workspaceId || null,
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
      resetForm();
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{existingBudget ? "Edit Budget" : "Add Budget"}</DialogTitle>
          <DialogDescription>
            Set a spending limit for a category with a custom date period.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelector
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              onCategoryCreated={onCategoryCreated}
              filterType="expense"
              placeholder="Select category"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount (IDR)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground font-medium select-none pointer-events-none">
                Rp
              </span>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                className="pl-9 text-base font-semibold"
                placeholder="e.g. 1.000.000"
                value={amount ? (amount.includes(".") ? amount : new Intl.NumberFormat("id-ID").format(parseInt(amount.replace(/\D/g, "") || "0", 10))) : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setAmount(raw);
                }}
                required
              />
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "d MMM yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "d MMM yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date <= startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {startDate && endDate && endDate <= startDate && (
            <p className="text-xs text-destructive">End date must be after start date</p>
          )}

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="recurring" className="cursor-pointer">Recurring</Label>
                <InfoTooltip text="When this period ends, you'll be able to renew it with the same duration" />
              </div>
              <p className="text-xs text-muted-foreground">Auto-renew with same duration</p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => {
                setIsRecurring(checked);
                if (!checked) setIsRollover(false);
              }}
            />
          </div>

          {/* Rollover Toggle */}
          <div className={cn(
            "flex items-center justify-between rounded-lg border p-3 transition-opacity",
            !isRecurring && "opacity-50 cursor-not-allowed"
          )}>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="rollover" className={cn("cursor-pointer", !isRecurring && "cursor-not-allowed")}>Rollover</Label>
                <InfoTooltip text="Carry over any unused (surplus) budget from this period into the next period" />
              </div>
              <p className="text-xs text-muted-foreground">Carry unused budget to next period</p>
            </div>
            <Switch
              id="rollover"
              checked={isRollover}
              onCheckedChange={setIsRollover}
              disabled={!isRecurring}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add a note about this budget..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
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
