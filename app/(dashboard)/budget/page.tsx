"use client";

import { useState, useEffect, useCallback } from "react";
import { BudgetSummary, Category } from "@/types";
import { BudgetCard } from "@/components/budget/BudgetCard";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
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

export default function BudgetPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [velocities, setVelocities] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetSummary | null>(null);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/budgets/${deletingId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Budget deleted");
        fetchBudgets();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete budget");
    } finally {
      setDeletingId(null);
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

  const totalBudget = budgets.reduce((acc, b) => acc + b.effective_budget, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Planner</h1>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Category Budgets</h2>
        <Button onClick={handleAddNew} className="h-11 sm:h-9">
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed bg-muted/20">
          <p className="text-muted-foreground mb-4">No budgets set for this month.</p>
          <Button onClick={handleAddNew} variant="outline">Create your first budget</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              velocityMessage={velocities[budget.id]?.message}
              velocityStatus={velocities[budget.id]?.velocityStatus}
              onEdit={handleEdit}
              onDelete={setDeletingId}
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
    </div>
  );
}
