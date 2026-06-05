"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, ChevronUp, ChevronDown, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";

import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Category, Transaction } from "@/types";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(1, "Must be at least 1"),
  price: z.coerce.number().min(0, "Must be positive"),
});

const otherFeeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  amount: z.coerce.number().min(0, "Must be positive"),
});

const formSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().default("IDR"),
  category_id: z.string().min(1, "Category is required"),
  merchant_name: z.string().optional(),
  description: z.string().optional(),
  transaction_date: z.date({
    message: "A date is required.",
  }),
  payment_method: z.string().optional(),
  items: z.array(itemSchema).optional(),
  subtotal: z.coerce.number().optional().nullable(),
  discount: z.coerce.number().optional().nullable(),
  tax: z.coerce.number().optional().nullable(),
  service_charge: z.coerce.number().optional().nullable(),
  other_fees: z.array(otherFeeSchema).optional(),
  receipt_url: z.string().optional().nullable(),
  receipt_public_id: z.string().optional().nullable(),
  source: z.enum(["manual", "scan"]).optional().default("manual"),
});

type TransactionFormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  initialData?: Transaction;
  isEdit?: boolean;
}

export function TransactionForm({ initialData, isEdit }: TransactionFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: initialData?.type || "expense",
      amount: initialData?.amount || 0,
      currency: initialData?.currency || "IDR",
      category_id: initialData?.category_id || "",
      merchant_name: initialData?.merchant_name || "",
      description: initialData?.description || "",
      transaction_date: initialData?.transaction_date ? new Date(initialData.transaction_date) : new Date(),
      payment_method: initialData?.payment_method || "",
      items: initialData?.items || [],
      subtotal: initialData?.subtotal || null,
      discount: initialData?.discount || null,
      tax: initialData?.tax || null,
      service_charge: initialData?.service_charge || null,
      other_fees: initialData?.other_fees || [],
      receipt_url: initialData?.receipt_url || null,
      receipt_public_id: initialData?.receipt_public_id || null,
      source: initialData?.source || "manual",
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const { fields: otherFeeFields, append: appendOtherFee, remove: removeOtherFee } = useFieldArray({
    name: "other_fees",
    control: form.control,
  });

  const watchType = form.watch("type");
  const watchReceiptUrl = form.watch("receipt_url");

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    }
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(
    (c) => c.type === watchType || c.type === "both"
  );

  async function onSubmit(data: TransactionFormValues) {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        transaction_date: format(data.transaction_date, "yyyy-MM-dd"),
      };

      const url = isEdit && initialData ? `/api/transactions/${initialData.id}` : "/api/transactions";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save transaction");
      }

      toast.success(`Transaction ${isEdit ? "updated" : "created"} successfully`);
      router.push("/transactions");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <FormControl>
                <Tabs
                  value={field.value}
                  onValueChange={field.onChange}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="expense" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/30 dark:data-[state=active]:text-red-400">Expense</TabsTrigger>
                    <TabsTrigger value="income" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-400">Income</TabsTrigger>
                    <TabsTrigger value="transfer" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400">Transfer</TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">Rp</span>
                  <FormControl>
                    <Input type="number" step="0.01" className="pl-9 text-lg font-semibold" placeholder="0" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transaction_date"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <CategoryBadge 
                          icon={cat.icon} 
                          color={cat.color} 
                          name={cat.name} 
                          showName 
                          size="sm" 
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <FormControl>
                  <Input placeholder="Cash, Credit Card, Bank Transfer..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="merchant_name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Merchant / Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Starbucks, Monthly Salary, Rent..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Add more details about this transaction..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fee Breakdown Section */}
        {watchType === "expense" && (
          <div className="border rounded-lg p-4 bg-muted/10">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}>
              <div>
                <h3 className="font-medium text-lg">Fee Breakdown</h3>
                <p className="text-sm text-muted-foreground">Add subtotal, tax, service charge, and discounts</p>
              </div>
              <Button type="button" variant="ghost" size="sm">
                {showFeeBreakdown ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
            
            {showFeeBreakdown && (
              <div className="space-y-4 pt-4 border-t mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subtotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service_charge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Charge</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-dashed">
                  <div className="flex items-center justify-between mb-3">
                    <FormLabel className="text-base font-semibold">Other Fees</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendOtherFee({ name: "", amount: 0 })}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Fee
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {otherFeeFields.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No other fees added.</p>
                    ) : (
                      otherFeeFields.map((fee, index) => (
                        <div key={fee.id} className="flex gap-2 items-start">
                          <div className="grid grid-cols-2 gap-2 flex-1">
                            <FormField
                              control={form.control}
                              name={`other_fees.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Fee name (e.g. Platform Fee)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`other_fees.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" placeholder="Amount" {...field} value={field.value ?? ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removeOtherFee(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Line Items Section */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-lg">Line Items</h3>
              <p className="text-sm text-muted-foreground">Add specific items from your receipt (optional)</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", quantity: 1, price: 0 })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-md">
              No items added.
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-start">
                  <div className="grid grid-cols-12 gap-2 flex-1">
                    <div className="col-span-6 md:col-span-7">
                      <FormField
                        control={form.control}
                        name={`items.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Item name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" placeholder="Qty" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" placeholder="Price" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Update Transaction" : "Save Transaction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
