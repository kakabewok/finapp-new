"use client";

import { TutorialStep } from "@/components/tutorial/TutorialStep";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  ArrowRightLeft, 
  Tags, 
  PieChart, 
  Copy, 
  TrendingUp, 
  BookOpen
} from "lucide-react";

const TUTORIAL_STEPS = [
  {
    id: "step_1_categories",
    title: "1. Set up your categories first",
    description: "Go to the Categories page (or create inline while adding a transaction/budget) to personalize your finances. SiBoros comes with default categories, but you can create custom ones!",
    icon: <Tags className="w-5 h-5" />
  },
  {
    id: "step_2_budget",
    title: "2. Create a budget for each category",
    description: "Go to Budget Planner and create a budget for each category (set planned amount). Control your spending by setting up a monthly budget.",
    icon: <PieChart className="w-5 h-5" />
  },
  {
    id: "step_3_copy_budget",
    title: "3. Copy Budget From...",
    description: "(Optional) Next month, use 'Copy Budget From...' to copy categories from a previous month and just update the amounts.",
    icon: <Copy className="w-5 h-5" />
  },
  {
    id: "step_4_transactions",
    title: "4. Track your spending",
    description: "Add transactions and assign them to categories. You can manually input your income or expense, or use the 'Scan Receipt' feature.",
    icon: <ArrowRightLeft className="w-5 h-5" />
  },
  {
    id: "step_5_reports",
    title: "5. View Reports and Projected Remaining Balance",
    description: "See how you're tracking against your budget. Check the Reports page and the Budget Dashboard for visual breakdowns of your spending.",
    icon: <TrendingUp className="w-5 h-5" />
  }
];

export default function TutorialPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome to SiBoros</h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Follow this quick guide to master your finances.
        </p>
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
          />
        ))}
      </div>

      {/* Action */}
      <div className="pt-8 flex justify-center">
        <Button 
          size="lg" 
          className="rounded-full px-8 shadow-md hover:shadow-lg transition-all"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>

    </div>
  );
}
