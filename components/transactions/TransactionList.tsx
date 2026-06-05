"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Transaction, Category } from "@/types";
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft,
  Filter,
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ReceiptText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Delete Action
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) setCategories(await res.json());
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const { data, totalPages: tp } = await res.json();
        setTransactions(data);
        setTotalPages(tp || 1);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, categoryFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${transactionToDelete}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast.success("Transaction deleted");
        setTransactions(transactions.filter(t => t.id !== transactionToDelete));
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast.error("Failed to delete transaction");
    } finally {
      setIsDeleting(false);
      setTransactionToDelete(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
      case 'expense': return <ArrowDownRight className="h-4 w-4 text-rose-500" />;
      case 'transfer': return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild className="ml-auto">
            <Link href="/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Manual
            </Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <ReceiptText className="h-12 w-12 mb-4 opacity-20" />
                    <p>No transactions found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {transaction.merchant_name || 'Unknown'}
                          {transaction.source === 'scan' && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">Scan</Badge>
                          )}
                        </p>
                        {transaction.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{transaction.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="flex w-fit items-center gap-1">
                      {transaction.category?.icon} 
                      {transaction.category?.name || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(transaction.transaction_date)}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${
                    transaction.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : ''
                  }`}>
                    {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/transactions/${transaction.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/transactions/${transaction.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          onClick={() => setTransactionToDelete(transaction.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              transaction and any attached receipt images.
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
