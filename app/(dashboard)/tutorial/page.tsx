"use client";

import { useState, useEffect } from "react";
import { TutorialStep } from "@/components/tutorial/TutorialStep";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  ArrowRightLeft, 
  Tags, 
  PieChart, 
  Copy, 
  TrendingUp, 
  Trash2, 
  Smartphone,
  CheckCircle2,
  BookOpen
} from "lucide-react";

const TUTORIAL_STEPS = [
  {
    id: "step_1_transactions",
    title: "1. Log your first transaction",
    description: "Head over to the Dashboard or Transactions page and click 'Add Transaction'. You can manually input your income or expense, or use the 'Scan Receipt' feature to let AI do the heavy lifting for you.",
    icon: <ArrowRightLeft className="w-5 h-5" />
  },
  {
    id: "step_2_categories",
    title: "2. Personalize your categories",
    description: "SiBoros comes with default categories, but you can create custom ones! Go to the Categories page to add new icons, assign colors, and organize your finances your way.",
    icon: <Tags className="w-5 h-5" />
  },
  {
    id: "step_3_budget",
    title: "3. Set up a monthly budget",
    description: "Control your spending by creating a budget plan. Navigate to the Budget page, select a month, and allocate spending limits for your chosen categories.",
    icon: <PieChart className="w-5 h-5" />
  },
  {
    id: "step_4_copy_budget",
    title: "4. Copy last month's budget",
    description: "Don't want to recreate your budget from scratch every month? Use the 'Copy Last Month' button on the Budget page to instantly carry over your previous limits.",
    icon: <Copy className="w-5 h-5" />
  },
  {
    id: "step_5_reports",
    title: "5. View your financial reports",
    description: "Check the Reports page to see visual breakdowns of your spending. You can also view your 'Projected Remaining Balance' to see how much you'll have left if you spend exactly as planned.",
    icon: <TrendingUp className="w-5 h-5" />
  },
  {
    id: "step_6_bulk_delete",
    title: "6. Clean up with Bulk Delete",
    description: "Made a mistake or need to clear old data? Use the 'Select' button on the Transactions or Budget pages to delete multiple items at once efficiently.",
    icon: <Trash2 className="w-5 h-5" />
  },
  {
    id: "step_7_pwa",
    title: "7. Install SiBoros on your phone",
    description: "For the best experience, install SiBoros as an app! Open this site in Chrome or Safari on your phone, and select 'Add to Home Screen' from the browser menu.",
    icon: <Smartphone className="w-5 h-5" />
  }
];

export default function TutorialPage() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("siboros_tutorial_progress");
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setCompletedSteps(new Set(parsed));
      } catch (e) {
        console.error("Failed to parse tutorial progress");
      }
    }
    setIsLoaded(true);
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("siboros_tutorial_progress", JSON.stringify(Array.from(completedSteps)));
    }
  }, [completedSteps, isLoaded]);

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const allCompleted = completedSteps.size === TUTORIAL_STEPS.length;

  if (!isLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome to SiBoros</h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Follow this quick guide to master your finances. Check off the steps as you complete them to track your progress!
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Your Progress</p>
            <p className="text-2xl font-bold">{completedSteps.size} <span className="text-muted-foreground text-lg font-normal">/ {TUTORIAL_STEPS.length}</span></p>
          </div>
          {allCompleted && (
            <div className="flex items-center text-emerald-500 font-medium text-sm animate-in zoom-in duration-300">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              All caught up!
            </div>
          )}
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-700 ease-out" 
            style={{ width: `${(completedSteps.size / TUTORIAL_STEPS.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {TUTORIAL_STEPS.map((step, index) => (
          <TutorialStep
            key={step.id}
            stepNumber={index + 1}
            title={step.title}
            description={step.description}
            icon={step.icon}
            isCompleted={completedSteps.has(step.id)}
            onToggleComplete={() => toggleStep(step.id)}
          />
        ))}
      </div>

      {/* Completion / Skip Action */}
      <div className="pt-8 flex justify-center">
        <Button 
          size="lg" 
          className="rounded-full px-8 shadow-md hover:shadow-lg transition-all"
          onClick={() => router.push("/dashboard")}
        >
          {allCompleted ? "Awesome! Go to Dashboard" : "Got it! Skip to Dashboard"}
        </Button>
      </div>

    </div>
  );
}
