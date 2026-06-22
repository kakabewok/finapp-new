"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ReportData, AIInsight } from "@/types";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { AIInsightCards } from "@/components/reports/AIInsightCards";
import { FinancialReportPDF } from "@/components/reports/PDFDocument";
import { ProjectedBalanceCard } from "@/components/budget/ProjectedBalanceCard";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, RefreshCw, Zap, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { pdf } from '@react-pdf/renderer';
import { DateRange } from "react-day-picker";
import { format, startOfMonth, endOfMonth, startOfWeek, subMonths, subDays, startOfYear, endOfYear, parseISO, differenceInDays } from "date-fns";

const PRESETS = [
  { label: "This Week", getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: new Date() }) },
  { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last Month", getValue: () => {
      const now = new Date();
      return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
    }
  },
  { label: "Last 3 Months", getValue: () => {
      const now = new Date();
      return { from: startOfMonth(subMonths(now, 3)), to: endOfMonth(now) };
    }
  },
  { label: "This Year", getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
];

export default function ReportsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    if (fromStr && toStr) {
      return { from: parseISO(fromStr), to: parseISO(toStr) };
    }
    // Default to this month
    return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [insightsData, setInsightsData] = useState<{ insights: AIInsight[], score: number, summary: string } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("This Month");

  // Sync date range to URL and fetch
  const updateUrlAndFetch = useCallback((range: DateRange) => {
    if (range.from && range.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", format(range.from, "yyyy-MM-dd"));
      params.set("to", format(range.to, "yyyy-MM-dd"));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  // Initial load and URL change listener
  useEffect(() => {
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    
    let from = startOfMonth(new Date());
    let to = endOfMonth(new Date());

    if (fromStr && toStr) {
      from = parseISO(fromStr);
      to = parseISO(toStr);
    } else {
      // If no params, set default params in URL
      updateUrlAndFetch({ from, to });
    }
    
    setDateRange({ from, to });
    fetchReportData(from, to);

    // Try to match preset
    let matchedPreset = "Custom";
    for (const preset of PRESETS) {
      const p = preset.getValue();
      if (format(p.from, "yyyy-MM-dd") === format(from, "yyyy-MM-dd") && format(p.to, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")) {
        matchedPreset = preset.label;
        break;
      }
    }
    setActivePreset(matchedPreset);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchReportData = async (from: Date, to: Date) => {
    setIsLoading(true);
    setReportData(null);
    setInsightsData(null);
    try {
      const fromStr = format(from, "yyyy-MM-dd");
      const toStr = format(to, "yyyy-MM-dd");
      const res = await fetch(`/api/reports/summary?from=${fromStr}&to=${toStr}`);
      if (res.ok) {
        setReportData(await res.json());
      } else {
        toast.error("Failed to load report data");
      }
    } catch (error) {
      toast.error("Error loading report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      updateUrlAndFetch(range);
    }
  };

  const handlePresetSelect = (label: string, getValue: () => { from: Date; to: Date }) => {
    setActivePreset(label);
    const range = getValue();
    setDateRange(range);
    updateUrlAndFetch(range);
  };

  const generateInsights = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    setIsGeneratingInsights(true);
    try {
      const fromStr = format(dateRange.from, "yyyy-MM-dd");
      const toStr = format(dateRange.to, "yyyy-MM-dd");
      const res = await fetch(`/api/reports/insights?from=${fromStr}&to=${toStr}`);
      if (res.ok) {
        setInsightsData(await res.json());
        toast.success("AI Insights generated!");
      } else {
        toast.error("Failed to generate AI insights");
      }
    } catch (error) {
      toast.error("Error generating insights");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportData || !dateRange?.from || !dateRange?.to) return;
    try {
      toast.info("Generating PDF...");
      
      let chartBase64 = null;
      if (reportData.categoryBreakdown.length > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const total = reportData.categoryBreakdown.reduce((acc, curr) => acc + curr.value, 0);
          let currentAngle = -0.5 * Math.PI;

          reportData.categoryBreakdown.forEach((item) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 150, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(200, 200);
            ctx.fillStyle = item.color || "#cbd5e1";
            ctx.fill();
            
            const midAngle = currentAngle + sliceAngle / 2;
            const labelX = 200 + Math.cos(midAngle) * 100;
            const labelY = 200 + Math.sin(midAngle) * 100;
            
            ctx.fillStyle = "#fff";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            if (item.percentage > 5) {
              ctx.fillText(`${item.percentage.toFixed(0)}%`, labelX, labelY);
            }
            
            currentAngle += sliceAngle;
          });

          chartBase64 = canvas.toDataURL("image/png");
        }
      }

      const periodLabel = `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
      
      const blob = await pdf(<FinancialReportPDF 
        data={reportData} 
        insights={insightsData} 
        chartImageBase64={chartBase64}
        monthName={periodLabel}
        year={new Date().getFullYear()} // Just passing for compatibility
      />).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Financial_Report_${format(dateRange.from, "yyyyMMdd")}_${format(dateRange.to, "yyyyMMdd")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF Downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    }
  };

  const hasData = reportData && (reportData.income > 0 || reportData.expense > 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Report</h1>
          <p className="text-muted-foreground mt-1">Analyze your custom date range performance.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <DatePickerWithRange 
            date={dateRange} 
            setDate={handleDateChange} 
            className="w-full sm:w-auto"
          />
          
          <Button variant="outline" onClick={handleExportPDF} disabled={!reportData || isLoading} className="shrink-0">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 hide-scrollbar gap-2">
        <span className="text-sm text-muted-foreground flex items-center mr-1 shrink-0">Presets:</span>
        {PRESETS.map((preset) => (
          <Badge
            key={preset.label}
            variant={activePreset === preset.label ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5 shrink-0"
            onClick={() => handlePresetSelect(preset.label, preset.getValue)}
          >
            {preset.label}
          </Badge>
        ))}
        {activePreset === "Custom" && (
          <Badge variant="default" className="whitespace-nowrap px-3 py-1.5 shrink-0">
            Custom Range
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Compiling your financial data...</p>
        </div>
      ) : !hasData ? (
        <div className="text-center py-24 border rounded-lg border-dashed bg-muted/10">
          <ReceiptText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-1 font-medium">No transactions found</p>
          <p className="text-sm text-muted-foreground/70">
            There is no income or expense data for the selected period.
          </p>
        </div>
      ) : reportData ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProjectedBalanceCard 
              month={dateRange?.from?.getMonth()! + 1 || new Date().getMonth() + 1} 
              year={dateRange?.from?.getFullYear() || new Date().getFullYear()} 
            />
          </div>
          <ReportSummary data={reportData} />
          
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">AI Insights</h2>
              {!insightsData && (
                <Button variant="secondary" onClick={generateInsights} disabled={isGeneratingInsights}>
                  {isGeneratingInsights ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />} 
                  {isGeneratingInsights ? "Analyzing..." : "Generate AI Insights"}
                </Button>
              )}
            </div>
            
            {insightsData ? (
              <AIInsightCards 
                insights={insightsData.insights} 
                score={insightsData.score} 
                summary={insightsData.summary} 
              />
            ) : (
              <div className="p-8 border rounded-lg bg-indigo-50/30 dark:bg-indigo-950/10 text-center">
                <p className="text-muted-foreground mb-4">Get personalized recommendations and analysis from our AI advisor.</p>
                <Button onClick={generateInsights} disabled={isGeneratingInsights} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isGeneratingInsights ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />} Analyze Period
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
