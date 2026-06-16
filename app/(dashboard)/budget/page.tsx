"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BudgetSummary, Category } from "@/types";
import { BudgetCard } from "@/components/budget/BudgetCard";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { CopyLastMonthDialog } from "@/components/budget/CopyLastMonthDialog";
import { ProjectedBalanceCard } from "@/components/budget/ProjectedBalanceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, ListChecks, X, Trash2, Copy, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useSelection } from "@/hooks/useSelection";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StatusFilter = "all" | "over" | "on_track" | "near_limit";

export default function BudgetPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [velocities, setVelocities] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetSummary | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const { selectedIds, toggleSelection, selectAll, clearSelection, isSelected, isAllSelected } = useSelection<string>();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [budgetsRes, velocityRes, catRes] = await Promise.all([
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch(`/api/budgets/velocity?month=${month}&year=${year}`),
        fetch(`/api/categories`)
      ]);

      if (budgetsRes.ok) setBudgets(await budgetsRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (velocityRes.ok) {
        const vels = await velocityRes.json();
        const velsMap = vels.reduce((acc: any, v: any) => ({ ...acc, [v.id]: v }), {});
        setVelocities(velsMap);
      }
    } catch (error) {
      toast.error("Failed to load budget data");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Reset search and filter when month/year changes
  useEffect(() => {
    setSearchQuery("");
    setStatusFilter("all");
  }, [month, year]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/budgets/${deletingId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Budget deleted");
        fetchBudgets();
        if (isSelected(deletingId)) {
          toggleSelection(deletingId);
        }
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete budget");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await fetch("/api/budgets/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        toast.success(`${selectedIds.size} budgets deleted`);
        fetchBudgets();
        clearSelection();
        setIsSelectMode(false);
      } else {
        throw new Error("Bulk delete failed");
      }
    } catch (error) {
      toast.error("Failed to delete selected budgets");
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleEdit = (budget: BudgetSummary) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingBudget(null);
    setIsFormOpen(true);
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories((prev) =>
      [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  // --- Client-side filtering ---
  const filteredBudgets = useMemo(() => {
    let result = budgets;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) =>
        b.category_name.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === "over") {
      result = result.filter((b) => b.status === "overbudget");
    } else if (statusFilter === "near_limit") {
      result = result.filter(
        (b) => b.status !== "overbudget" && b.percentage_used >= 80 && b.percentage_used < 100
      );
    } else if (statusFilter === "on_track") {
      result = result.filter(
        (b) => b.status !== "overbudget" && b.percentage_used < 80
      );
    }

    return result;
  }, [budgets, searchQuery, statusFilter]);

  // --- Filter counts ---
  const filterCounts = useMemo(() => {
    // Apply search first, then count by status
    let searchFiltered = budgets;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      searchFiltered = searchFiltered.filter((b) =>
        b.category_name.toLowerCase().includes(q)
      );
    }

    return {
      all: searchFiltered.length,
      over: searchFiltered.filter((b) => b.status === "overbudget").length,
      near_limit: searchFiltered.filter(
        (b) => b.status !== "overbudget" && b.percentage_used >= 80 && b.percentage_used < 100
      ).length,
      on_track: searchFiltered.filter(
        (b) => b.status !== "overbudget" && b.percentage_used < 80
      ).length,
    };
  }, [budgets, searchQuery]);

  // Summary from ALL budgets (not filtered)
  const totalBudget = budgets.reduce((acc, b) => acc + b.effective_budget, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const totalRemaining = totalBudget - totalSpent;

  const isSearchActive = searchQuery.trim().length > 0;
  const isFilterActive = statusFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year} Budget
          </h1>
          <p className="text-muted-foreground mt-1">Manage your monthly spending limits.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-card rounded-lg border flex flex-col justify-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalBudget, "IDR")}</p>
        </div>
        <div className="p-6 bg-card rounded-lg border flex flex-col justify-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalSpent, "IDR")}</p>
        </div>
        <div className="p-6 bg-card rounded-lg border flex flex-col justify-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Remaining</p>
          <p className={`text-2xl font-bold mt-2 ${totalRemaining < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {formatCurrency(totalRemaining, "IDR")}
          </p>
        </div>
        <ProjectedBalanceCard month={month} year={year} refreshTrigger={budgets} />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Category Budgets</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={isSelectMode ? "secondary" : "outline"}
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              clearSelection();
            }}
            className="h-9 sm:h-9"
          >
            {isSelectMode ? <X className="h-4 w-4 sm:mr-2" /> : <ListChecks className="h-4 w-4 sm:mr-2" />}
            <span className="hidden sm:inline">{isSelectMode ? "Cancel" : "Select"}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCopyDialogOpen(true)}
            className="h-9 sm:h-9"
          >
            <Copy className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Copy from...</span>
          </Button>
          <Button onClick={handleAddNew} className="h-9 sm:h-9">
            <Plus className=" h-4 w-4" />
            Add Budget
          </Button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      {!isLoading && budgets.length > 0 && (
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by category name..."
              className="pl-9 pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {([
              { key: "all" as StatusFilter, label: "All" },
              { key: "over" as StatusFilter, label: "Over Budget" },
              { key: "near_limit" as StatusFilter, label: "Near Limit" },
              { key: "on_track" as StatusFilter, label: "On Track" },
            ] as const).map(({ key, label }) => (
              <Button
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(key)}
                className="h-8 text-xs sm:text-sm"
              >
                {label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                  statusFilter === key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {filterCounts[key]}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed bg-muted/20">
          <p className="text-muted-foreground mb-4">No budgets set for this month.</p>
          <Button onClick={handleAddNew} variant="outline">Create your first budget</Button>
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed bg-muted/20">
          <p className="text-muted-foreground">
            {isSearchActive && isFilterActive
              ? `No budget found matching "${searchQuery}" with the selected filter.`
              : isSearchActive
                ? `No budget found for "${searchQuery}".`
                : "No budgets match the selected filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBudgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              velocityMessage={velocities[budget.id]?.message}
              velocityStatus={velocities[budget.id]?.velocityStatus}
              onEdit={handleEdit}
              onDelete={setDeletingId}
              isSelectMode={isSelectMode}
              isSelected={isSelected(budget.id)}
              onToggleSelect={toggleSelection}
            />
          ))}
        </div>
      )}

      <BudgetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        categories={categories}
        existingBudget={editingBudget}
        selectedMonth={month}
        selectedYear={year}
        onSuccess={fetchBudgets}
        onCategoryCreated={handleCategoryCreated}
      />

      <CopyLastMonthDialog
        open={isCopyDialogOpen}
        onOpenChange={setIsCopyDialogOpen}
        selectedMonth={month}
        selectedYear={year}
        onSuccess={fetchBudgets}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your budget limit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Sticky Bar */}
      {isSelectMode && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t shadow-lg z-50 flex items-center justify-between sm:justify-center sm:gap-8">
          <div className="flex items-center gap-4">
            <Checkbox
              id="select-all-mobile"
              checked={isAllSelected(budgets.map(b => b.id))}
              onCheckedChange={(checked) => {
                if (checked) selectAll(budgets.map(b => b.id));
                else clearSelection();
              }}
            />
            <span className="font-medium">
              {selectedIds.size} selected
            </span>
          </div>
          <Button
            variant="destructive"
            disabled={selectedIds.size === 0}
            onClick={() => setShowBulkDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} budgets?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected category budgets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
