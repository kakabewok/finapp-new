"use client";

import { useState, useEffect } from "react";
import { BudgetItem, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PieChart, Plus, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [budgetRes, catRes] = await Promise.all([
        fetch("/api/budget"),
        fetch("/api/categories")
      ]);
      
      if (budgetRes.ok) setBudgets(await budgetRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !budgetAmount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: selectedCategory,
          amount: Number(budgetAmount)
        })
      });

      if (!res.ok) throw new Error("Failed to save budget");

      toast.success("Budget updated successfully");
      setIsDialogOpen(false);
      setSelectedCategory("");
      setBudgetAmount("");
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show expense categories in the dropdown that don't already have a budget
  const availableCategories = categories.filter(c => 
    (c.type === "expense" || c.type === "both") && 
    !budgets.some(b => b.category.id === c.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground mt-1">Track your monthly spending limits.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Monthly Budget</DialogTitle>
              <DialogDescription>
                Choose a category and set a maximum amount you want to spend this month.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSetBudget}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            {c.icon} {c.name}
                          </span>
                        </SelectItem>
                      ))}
                      {availableCategories.length === 0 && (
                        <SelectItem value="none" disabled>All expense categories have budgets</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">Monthly Limit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">Rp</span>
                    <Input 
                      id="amount" 
                      type="number" 
                      className="pl-9" 
                      placeholder="0"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !selectedCategory || availableCategories.length === 0}>
                  {isSubmitting ? "Saving..." : "Save Budget"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" /> Current Month Budget
          </CardTitle>
          <CardDescription>Your progress against monthly spending limits.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <PieChart className="mx-auto h-12 w-12 opacity-20 mb-3" />
              <p>No budgets set yet.</p>
              <Button variant="link" onClick={() => setIsDialogOpen(true)}>Create your first budget</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {budgets.map((item) => (
                <div key={item.category.id} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: `${item.category.color}20`, color: item.category.color || "inherit" }}
                      >
                        {item.category.icon}
                      </div>
                      <div>
                        <p className="font-medium">{item.category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.spent)} of {formatCurrency(item.budget)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        item.status === 'alert' ? 'text-destructive' :
                        item.status === 'warning' ? 'text-orange-500' :
                        'text-emerald-500'
                      }`}>
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={item.percentage} 
                    className={`h-2 ${
                      item.status === 'alert' ? '[&>div]:bg-destructive' :
                      item.status === 'warning' ? '[&>div]:bg-orange-500' :
                      '[&>div]:bg-emerald-500'
                    }`} 
                  />
                  
                  {item.status === 'alert' && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" /> Over budget by {formatCurrency(item.spent - item.budget)}
                    </p>
                  )}
                  {item.status === 'warning' && (
                    <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" /> Nearing budget limit
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
