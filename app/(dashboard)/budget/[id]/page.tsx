"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BudgetSummary } from "@/types";
import { BudgetTransactionList } from "@/components/budget/BudgetTransactionList";
import { BudgetHistoryTable } from "@/components/budget/BudgetHistoryTable";
import { RenewBudgetDialog } from "@/components/budget/RenewBudgetDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CalendarDays,
  RefreshCw,
  Archive,
  Edit2,
  Trash2,
  Loader2,
  ReceiptText,
  History,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
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

export default function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBudget = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/budgets/${id}`);
      if (res.ok) {
        setBudget(await res.json());
      } else {
        toast.error("Budget not found");
        router.push("/budget");
      }
    } catch (error) {
      toast.error("Failed to load budget");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/budgets/${id}/archive`, { method: "POST" });
      if (res.ok) {
        toast.success("Budget archived");
        fetchBudget();
      } else {
        throw new Error("Failed to archive");
      }
    } catch (error) {
      toast.error("Failed to archive budget");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Budget deleted");
        router.push("/budget");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete budget");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!budget) return null;

  const isExpired = new Date(budget.end_date) < new Date();
  const isOverbudget = budget.spending_status === "overbudget";
  const isWarning = budget.spending_status === "warning";

  let progressColor = "bg-emerald-500";
  if (isOverbudget) progressColor = "bg-rose-500";
  else if (isWarning) progressColor = "bg-amber-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/budget">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CategoryBadge
              icon={budget.category_icon}
              color={budget.category_color}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {budget.category_name}
                {budget.is_recurring && <RefreshCw className="h-4 w-4 text-blue-500" />}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{formatDate(budget.start_date)} – {formatDate(budget.end_date)}</span>
                </div>
                {isExpired && budget.budget_status === "active" && (
                  <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25 text-[10px]">
                    Expired
                  </Badge>
                )}
                {budget.budget_status === "archived" && (
                  <Badge variant="secondary" className="text-[10px]">Archived</Badge>
                )}
                {budget.is_recurring && (
                  <Badge variant="outline" className="text-[10px]">Recurring</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 shrink-0">
          {isExpired && budget.budget_status === "active" && budget.is_recurring && (
            <Button
              size="sm"
              onClick={() => setRenewDialogOpen(true)}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Renew
            </Button>
          )}
          {isExpired && budget.budget_status === "active" && !budget.is_recurring && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleArchive}
            >
              <Archive className="h-4 w-4 mr-1.5" />
              Archive
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-9 w-9 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(budget.effective_budget, "IDR")}</p>
            {budget.rollover_amount > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Includes {formatCurrency(budget.rollover_amount, "IDR")} rollover
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(budget.spent_amount, "IDR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${budget.remaining_amount < 0 ? "text-rose-500" : "text-emerald-500"}`}>
              {formatCurrency(Math.abs(budget.remaining_amount), "IDR")}
              {budget.remaining_amount < 0 && <span className="text-sm ml-1">over</span>}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{budget.percentage_used}%</p>
            <Progress
              value={Math.min(100, budget.percentage_used)}
              className="h-2 mt-2"
              indicatorClassName={progressColor}
            />
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {budget.notes && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{budget.notes}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Transactions & History Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions" className="gap-1.5">
            <ReceiptText className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          {budget.is_recurring && (
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          <BudgetTransactionList budgetId={id} />
        </TabsContent>
        {budget.is_recurring && (
          <TabsContent value="history" className="mt-4">
            <BudgetHistoryTable budgetId={id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Renew Dialog */}
      <RenewBudgetDialog
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        budget={budget}
        onSuccess={fetchBudget}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this budget and its history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
