"use client";

import { TransactionList } from "@/components/transactions/TransactionList";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function TransactionsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const refreshKey = typeof searchParams?.refresh === 'string' ? searchParams.refresh : 'default';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">Manage and view all your financial activities.</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/export" download>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>
      
      <TransactionList key={refreshKey} />
    </div>
  );
}
