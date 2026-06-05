import { BudgetSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

interface BudgetCardProps {
  budget: BudgetSummary;
  velocityMessage?: string;
  velocityStatus?: string;
  onEdit: (budget: BudgetSummary) => void;
  onDelete: (id: string) => void;
}

export function BudgetCard({ budget, velocityMessage, velocityStatus, onEdit, onDelete }: BudgetCardProps) {
  const isOverbudget = budget.status === "overbudget";
  const isWarning = budget.status === "warning";

  let progressColor = "bg-emerald-500";
  if (isOverbudget) progressColor = "bg-rose-500";
  else if (isWarning) progressColor = "bg-amber-500";

  return (
    <Card className={`relative overflow-hidden ${isOverbudget ? 'border-rose-500/50 shadow-sm shadow-rose-500/10' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <CategoryBadge 
              icon={budget.category_icon} 
              color={budget.category_color} 
              size="lg" 
            />
            <div>
              <CardTitle className="text-lg">{budget.category_name}</CardTitle>
              <CardDescription>
                {formatCurrency(budget.spent_amount, "IDR")} / {formatCurrency(budget.effective_budget, "IDR")}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(budget)} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(budget.id)} className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{budget.percentage_used}% spent</span>
            <span className="font-medium text-muted-foreground">
              Remaining: {formatCurrency(Math.max(0, budget.remaining_amount), "IDR")}
            </span>
          </div>
          <Progress 
            value={Math.min(100, budget.percentage_used)} 
            className="h-2" 
            indicatorClassName={progressColor} 
          />
        </div>

        {velocityMessage && (
          <div className={`p-3 rounded-md text-sm flex gap-2 items-start ${
            velocityStatus === 'overbudget' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
            velocityStatus === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {velocityStatus === 'overbudget' ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> :
             velocityStatus === 'warning' ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> :
             <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
            <span>{velocityMessage}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
