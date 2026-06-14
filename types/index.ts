export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  budget_monthly: number | null;
  type: 'expense' | 'income' | 'both';
  is_default: boolean;
  created_at: string;
}

export interface TransactionItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OtherFee {
  name: string;
  amount: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  category_id: string | null;
  merchant_name: string | null;
  description: string | null;
  transaction_date: string;
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  service_charge: number | null;
  other_fees: OtherFee[] | null;
  receipt_url: string | null;
  receipt_public_id: string | null;
  payment_method: string | null;
  items: TransactionItem[] | null;
  tags: string[] | null;
  source: 'manual' | 'scan';
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
}

export interface TransactionFormData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  category_id: string;
  merchant_name: string;
  description: string;
  transaction_date: string;
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  service_charge: number | null;
  other_fees: OtherFee[];
  payment_method: string;
  items: TransactionItem[];
  tags: string[];
  receipt_url?: string;
  receipt_public_id?: string;
  source: 'manual' | 'scan';
}

export interface ScanResult {
  merchant_name: string | null;
  transaction_date: string | null;
  total_amount: number | null;
  currency: string | null;
  items: TransactionItem[] | null;
  category: string | null;
  payment_method: string | null;
}

export interface ScanResponse {
  receiptUrl: string;
  publicId: string;
  extractedData: ScanResult | null;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
}

export interface ChartDataPoint {
  date: string;
  amount: number;
  label?: string;
}

export interface CategoryBreakdownItem {
  name: string;
  value: number;
  color: string;
  icon: string;
  percentage: number;
}

export interface BudgetItem {
  category: Category;
  spent: number;
  budget: number;
  percentage: number;
  status: 'normal' | 'warning' | 'alert';
}

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  type?: 'income' | 'expense' | 'transfer';
  amountMin?: number;
  amountMax?: number;
  search?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  rollover_enabled: boolean;
  rollover_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetSummary {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  category_icon: string | null;
  category_color: string | null;
  month: number;
  year: number;
  budget_amount: number;
  rollover_amount: number;
  effective_budget: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  status: 'normal' | 'warning' | 'overbudget';
  created_at?: string;
}

export interface AIInsight {
  type: 'positive' | 'warning' | 'negative' | 'info';
  title: string;
  description: string;
}

export interface ReportData {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  categoryBreakdown: CategoryBreakdownItem[];
  dailyTrend: ChartDataPoint[];
  budgetPerformance: BudgetSummary[];
  topTransactions: Transaction[];
  vsLastMonth: {
    incomeChange: number;
    expenseChange: number;
  };
}
