"use client";

import { useState, useEffect } from "react";
import { Category } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, Tags } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CategoryFormModal } from "@/components/ui/CategoryFormModal";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete category");
      }

      toast.success("Category deleted");
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const defaultCategories = categories.filter(c => c.is_default);
  const customCategories = categories.filter(c => !c.is_default);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage your transaction categories.</p>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
        <CategoryFormModal 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={fetchCategories}
          categories={categories}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tags className="h-5 w-5" /> Custom Categories
            </CardTitle>
            <CardDescription>Categories you have created.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : customCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                No custom categories yet. Create one above.
              </div>
            ) : (
              <div className="space-y-3">
                {customCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                    <div className="flex items-center gap-3">
                      <CategoryBadge 
                        icon={category.icon} 
                        color={category.color} 
                        name={category.name} 
                        showName 
                        size="md" 
                      />
                      <Badge variant="outline" className="text-[10px] capitalize ml-2">{category.type}</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Default Categories</CardTitle>
            <CardDescription>System provided categories (cannot be deleted).</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {defaultCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-card/50">
                    <CategoryBadge 
                      icon={category.icon} 
                      color={category.color} 
                      name={category.name} 
                      showName 
                      size="md" 
                    />
                    <span className="text-[10px] text-muted-foreground capitalize">{category.type}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
