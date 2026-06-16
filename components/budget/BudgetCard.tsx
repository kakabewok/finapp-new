import { BudgetSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface BudgetCardProps {
  budget: BudgetSummary;
  velocityMessage?: string;
  velocityStatus?: string;
  onEdit: (budget: BudgetSummary) => void;
  onDelete: (id: string) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function BudgetCard({ budget, velocityMessage, velocityStatus, onEdit, onDelete, isSelectMode, isSelected, onToggleSelect }: BudgetCardProps) {
  const isOverbudget = budget.status === "overbudget";
  const isWarning = budget.status === "warning";

  let progressColor = "bg-emerald-500";
  if (isOverbudget) progressColor = "bg-rose-500";
  else if (isWarning) progressColor = "bg-amber-500";

  return (
    <Card 
      className={`relative overflow-hidden transition-colors ${isOverbudget ? 'border-rose-500/30' : ''} ${isSelectMode && isSelected ? 'border-primary bg-primary/5' : ''}`}
      onClick={(e) => {
        if (isSelectMode && onToggleSelect) {
          e.preventDefault();
          onToggleSelect(budget.id);
        }
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {isSelectMode && onToggleSelect && (
              <Checkbox 
                checked={isSelected} 
                onCheckedChange={() => onToggleSelect(budget.id)}
                className="mt-1"
              />
            )}
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
            {budget.notes && (
              <InfoTooltip 
                text={budget.notes}
                buttonClassName="rounded-full p-0.5 text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20"
              />
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(budget)} 
              className="h-11 w-11 md:h-8 md:w-8"
              aria-label="Edit budget"
            >
              <Edit2 className="h-5 w-5 md:h-4 md:w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(budget.id)} 
              className="h-11 w-11 md:h-8 md:w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Delete budget"
            >
              <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm items-center mb-1.5">
            <span>{budget.percentage_used}% spent</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-muted-foreground">
                Remaining: {formatCurrency(Math.max(0, budget.remaining_amount), "IDR")}
              </span>
              {velocityMessage && (
                <InfoTooltip 
                  text={velocityMessage}
                  buttonClassName={`rounded-full p-0.5 ${
                    velocityStatus === 'overbudget' ? 'text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20' :
                    velocityStatus === 'warning' ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20' :
                    'text-emerald-500 hover:text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20'
                  }`}
                />
              )}
            </div>
          </div>
          <Progress 
            value={Math.min(100, budget.percentage_used)} 
            className="h-2" 
            indicatorClassName={progressColor} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
