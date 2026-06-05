"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@/types";
import { toast } from "sonner";

export default function EditTransactionPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTransaction() {
      try {
        const res = await fetch(`/api/transactions/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setTransaction(data);
        } else {
          toast.error("Transaction not found");
          router.push("/transactions");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load transaction");
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      fetchTransaction();
    }
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Transaction</h1>
        <p className="text-muted-foreground mt-1">Modify details for this transaction.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Update the fields below to save changes.</CardDescription>
        </CardHeader>
        <CardContent>
          {transaction && (
            <TransactionForm initialData={transaction} isEdit={true} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
