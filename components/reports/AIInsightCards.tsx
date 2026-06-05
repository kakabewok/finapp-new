import { AIInsight } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

export function AIInsightCards({ insights, score, summary }: { insights: AIInsight[], score?: number, summary?: string }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />;
      case 'negative': return <XCircle className="h-5 w-5 text-rose-500 mt-0.5" />;
      case 'info':
      default: return <Info className="h-5 w-5 text-blue-500 mt-0.5" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      case 'warning': return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      case 'negative': return 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
      case 'info':
      default: return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
    }
  };

  return (
    <Card className="border-indigo-200 dark:border-indigo-800 shadow-sm">
      <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="text-2xl">💡</span> AI Financial Insights
            </CardTitle>
            {summary && <p className="text-sm text-muted-foreground mt-2">{summary}</p>}
          </div>
          {score !== undefined && (
            <div className="text-center bg-white dark:bg-background rounded-lg border p-3 shadow-sm min-w-[80px]">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Score</p>
              <p className={`text-2xl font-bold ${
                score >= 80 ? 'text-emerald-500' : 
                score >= 60 ? 'text-amber-500' : 'text-rose-500'
              }`}>{score}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className={`flex gap-3 p-4 rounded-lg border ${getBg(insight.type)}`}>
              <div className="shrink-0">{getIcon(insight.type)}</div>
              <div>
                <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
