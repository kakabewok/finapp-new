import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { ReportData, AIInsight } from '@/types';
import { formatCurrency } from '@/lib/utils';

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
  },
  appName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#111827" },
  reportTitle: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryLabel: { fontSize: 9, color: "#6b7280", marginBottom: 4 },
  summaryValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#111827" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#f9fafb",
  },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2, marginRight: 8 },
  insightText: { flex: 1, fontSize: 9, color: "#374151", lineHeight: 1.5 },
  chartRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  chartImage: { width: 200, height: 200 },
  categoryLegend: { flex: 1, paddingLeft: 16, justifyContent: "center" },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendName: { flex: 1, fontSize: 9, color: "#374151" },
  legendAmount: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111827" },
  legendPercent: { fontSize: 8, color: "#6b7280", marginLeft: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  tableCell: { fontSize: 9, color: "#374151" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

interface PDFDocumentProps {
  data: ReportData;
  insights: { insights: AIInsight[], score: number, summary: string } | null;
  chartImageBase64: string | null;
  monthName: string;
  year: number;
}

export function FinancialReportPDF({ data, insights, chartImageBase64, monthName, year }: PDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>Siboros</Text>
            <Text style={styles.reportTitle}>Personal Financial Report</Text>
          </View>
          <View>
            <Text style={{ fontSize: 10, color: "#4b5563", textAlign: "right" }}>Period: {monthName} {year}</Text>
            <Text style={{ fontSize: 8, color: "#9ca3af", textAlign: "right", marginTop: 2 }}>Generated: {new Date().toLocaleDateString('en-US')}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.income, 'IDR')}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.expense, 'IDR')}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net Balance</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.balance, 'IDR')}</Text>
          </View>
        </View>

        {insights && (
          <View>
            <Text style={styles.sectionTitle}>AI Insights (Skor: {insights.score}/100)</Text>
            {insights.insights.map((insight, idx) => {
              let dotColor = "#3b82f6";
              if (insight.type === "positive") dotColor = "#10b981";
              if (insight.type === "warning") dotColor = "#f59e0b";
              if (insight.type === "negative") dotColor = "#ef4444";
              
              return (
                <View key={idx} style={styles.insightRow}>
                  <View style={[styles.insightDot, { backgroundColor: dotColor }]} />
                  <Text style={styles.insightText}>{insight.description}</Text>
                </View>
              );
            })}
          </View>
        )}

        {chartImageBase64 && data.categoryBreakdown.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Expense Breakdown</Text>
            <View style={styles.chartRow}>
              <Image src={chartImageBase64} style={styles.chartImage} />
              <View style={styles.categoryLegend}>
                {data.categoryBreakdown.slice(0, 8).map((cat, i) => (
                  <View key={i} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color || "#cbd5e1" }]} />
                    <Text style={styles.legendName}>{cat.name}</Text>
                    <Text style={styles.legendAmount}>{formatCurrency(cat.value, 'IDR')}</Text>
                    <Text style={styles.legendPercent}>{cat.percentage.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {data.budgetPerformance.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Budget Performance</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Category</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Budget</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Spent</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Remaining</Text>
            </View>
            {data.budgetPerformance.map((b, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{b.category_name}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(b.effective_budget, 'IDR')}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(b.spent_amount, 'IDR')}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', color: b.remaining_amount < 0 ? '#ef4444' : '#10b981' }]}>
                  {formatCurrency(b.remaining_amount, 'IDR')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.topTransactions.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Top 10 Largest Transactions</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>No</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Category</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>
            {data.topTransactions.map((t, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{i + 1}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{t.merchant_name || t.description || 'Unknown'}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{t.category?.name || 'Uncategorized'}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontFamily: "Helvetica-Bold" }]}>
                  {formatCurrency(t.amount, 'IDR')}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Siboros — Personal Financial Planner</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
