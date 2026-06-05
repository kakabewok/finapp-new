"use client";

import { useState, useEffect } from "react";
import { ReceiptUploader } from "@/components/scan/ReceiptUploader";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { ScanResponse, Category } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories so we can map category name → category_id
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchCategories();
  }, []);

  const resetScan = () => {
    setScanResult(null);
  };

  // Map scan result fields to TransactionForm's expected initialData shape
  const getInitialData = () => {
    if (!scanResult?.extractedData) return undefined;
    const data = scanResult.extractedData;

    // Look up the category_id by matching the AI's returned category name
    let categoryId = "";
    if (data.category) {
      const matchedCategory = categories.find(
        (c) => c.name.toLowerCase() === data.category!.toLowerCase()
      );
      if (matchedCategory) {
        categoryId = matchedCategory.id;
      }
    }

    return {
      type: "expense" as const,
      amount: data.total_amount ?? 0,
      currency: data.currency || "IDR",
      category_id: categoryId,
      merchant_name: data.merchant_name || "",
      description: "",
      transaction_date: data.transaction_date || new Date().toISOString().split("T")[0],
      payment_method: data.payment_method || "",
      items: data.items || [],
      source: "scan" as const,
      receipt_url: scanResult.receiptUrl,
      receipt_public_id: scanResult.publicId,
    } as any;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            AI Receipt Scanner <Sparkles className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload a receipt and let our AI extract the details for you.
          </p>
        </div>
        {scanResult && (
          <Button variant="outline" onClick={resetScan}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Scan Another
          </Button>
        )}
      </div>

      {!scanResult ? (
        <ReceiptUploader 
          onScanComplete={setScanResult} 
          isLoading={isLoading} 
          setIsLoading={setIsLoading} 
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-12 items-start">
          <div className="md:col-span-4">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Receipt Image</CardTitle>
                <CardDescription>Uploaded successfully</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-auto max-h-[500px] w-full rounded-lg overflow-hidden border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={scanResult.receiptUrl} 
                    alt="Scanned Receipt" 
                    className="object-contain w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Verify & Save</CardTitle>
                <CardDescription>
                  Review the extracted details before saving. You can modify any incorrect fields.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionForm 
                  initialData={getInitialData()}
                  isEdit={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

