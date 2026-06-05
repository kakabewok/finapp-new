"use client";

import { useState, useCallback } from "react";
import { ReportData, AIInsight } from "@/types";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { AIInsightCards } from "@/components/reports/AIInsightCards";
import { FinancialReportPDF } from "@/components/reports/PDFDocument";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { pdf } from '@react-pdf/renderer';

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [insightsData, setInsightsData] = useState<{ insights: AIInsight[], score: number, summary: string } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setReportData(null);
    setInsightsData(null);
    try {
      const res = await fetch(`/api/reports/summary?month=${month}&year=${year}`);
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
  }, [month, year]);

  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const res = await fetch(`/api/reports/insights?month=${month}&year=${year}`);
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
    if (!reportData) return;
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

      const monthName = new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
      
      const blob = await pdf(<FinancialReportPDF 
        data={reportData} 
        insights={insightsData} 
        chartImageBase64={chartBase64}
        monthName={monthName.toUpperCase()}
        year={year}
      />).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Financial_Report_${monthName}_${year}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF Downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Report</h1>
          <p className="text-muted-foreground mt-1">Analyze your monthly financial performance.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
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

          <Button onClick={fetchReportData} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Generate
          </Button>
          
          <Button variant="outline" onClick={handleExportPDF} disabled={!reportData}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {!reportData && !isLoading && (
        <div className="text-center py-20 border rounded-lg border-dashed bg-muted/10">
          <p className="text-muted-foreground mb-4">Select a month and year to generate your report.</p>
          <Button onClick={fetchReportData}>Generate Report</Button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Compiling your financial data...</p>
        </div>
      )}

      {reportData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  {isGeneratingInsights ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />} Analyze My Finances
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
