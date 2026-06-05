import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Calendar, Tag, CreditCard, Receipt, Store } from "lucide-react";
import Image from "next/image";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

export function TransactionDetail({ transaction }: { transaction: Transaction }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowUpRight className="h-5 w-5 text-emerald-500" />;
      case 'expense': return <ArrowDownRight className="h-5 w-5 text-rose-500" />;
      case 'transfer': return <ArrowRightLeft className="h-5 w-5 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-muted rounded-full">
                  {getTypeIcon(transaction.type)}
                </div>
                <CardTitle className="text-xl capitalize">{transaction.type}</CardTitle>
              </div>
              <Badge variant="outline" className="capitalize">
                {transaction.source} entry
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-4 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Total Amount</span>
              <span className={`text-4xl font-bold tracking-tighter ${
                transaction.type === 'income' ? 'text-emerald-500' : 
                transaction.type === 'expense' ? 'text-foreground' : ''
              }`}>
                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                {formatCurrency(transaction.amount, transaction.currency)}
              </span>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">Merchant / Title</p>
                  <p className="text-sm text-muted-foreground mt-1">{transaction.merchant_name || "N/A"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">Date</p>
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(transaction.transaction_date)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <CategoryBadge 
                  icon={transaction.category?.icon ?? "MoreHorizontal"} 
                  color={transaction.category?.color ?? "#6B7280"} 
                  size="lg" 
                />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">Category</p>
                  <p className="text-sm font-medium mt-1">
                    {transaction.category?.name || "Uncategorized"}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">Payment Method</p>
                  <p className="text-sm text-muted-foreground mt-1">{transaction.payment_method || "N/A"}</p>
                </div>
              </div>
            </div>

            {transaction.description && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{transaction.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Breakdown */}
        {(transaction.subtotal != null || transaction.discount != null || transaction.tax != null || transaction.service_charge != null || (transaction.other_fees && transaction.other_fees.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Fee Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {transaction.subtotal != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(transaction.subtotal, transaction.currency)}</span>
                  </div>
                )}
                {transaction.discount != null && transaction.discount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-emerald-500">-{formatCurrency(transaction.discount, transaction.currency)}</span>
                  </div>
                )}
                {transaction.tax != null && transaction.tax > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(transaction.tax, transaction.currency)}</span>
                  </div>
                )}
                {transaction.service_charge != null && transaction.service_charge > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Service Charge</span>
                    <span>{formatCurrency(transaction.service_charge, transaction.currency)}</span>
                  </div>
                )}
                {transaction.other_fees?.map((fee, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{fee.name}</span>
                    <span>{formatCurrency(fee.amount, transaction.currency)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-bold text-base">
                  <span>Grand Total</span>
                  <span>{formatCurrency(transaction.amount, transaction.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {transaction.items && transaction.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span>{formatCurrency(item.price * item.quantity, transaction.currency)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center font-bold">
                  <span className="text-muted-foreground">Items Total</span>
                  <span className="text-muted-foreground">{formatCurrency(
                    transaction.items.reduce((acc, item) => acc + (item.price * item.quantity), 0), 
                    transaction.currency
                  )}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        {transaction.receipt_url ? (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Receipt Image</CardTitle>
              <CardDescription>Payment proof attached to this transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-auto min-h-[400px] w-full rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={transaction.receipt_url} 
                  alt="Receipt" 
                  className="object-contain w-full h-full"
                />
                <a
                  href={transaction.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded hover:bg-black/70 transition-colors"
                >
                  Open full
                </a>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-muted/10 border-dashed">
            <Receipt className="h-12 w-12 mb-4 opacity-20" />
            <p>No receipt image attached to this transaction.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
