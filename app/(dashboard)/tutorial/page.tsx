"use client";

import { TutorialStep } from "@/components/tutorial/TutorialStep";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRightLeft, 
  Tags, 
  PieChart, 
  Copy, 
  TrendingUp, 
  BookOpen,
  Users,
  Building2,
  UserPlus,
  LogIn,
  ArrowLeftRight,
  Shield,
  AlertTriangle,
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

const WORKSPACE_TUTORIAL_STEPS = [
  {
    id: "ws_step_1",
    title: "1. What is a Workspace?",
    description: "A Workspace is a shared space where multiple users can manage finances together — perfect for households, couples, or small teams. Your personal data always stays private and completely separate from any workspace.",
    icon: <Building2 className="w-5 h-5" />
  },
  {
    id: "ws_step_2",
    title: "2. Create a Workspace",
    description: "Go to 'Shared Workspace' in the sidebar and click 'Create Workspace'. Give it a name (e.g. 'Household Finance', 'Business Finance'). You automatically become the Owner of the workspace.",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: "ws_step_3",
    title: "3. Invite Members",
    description: "Open the workspace settings page and click 'Invite Member'. The system generates a unique invite link you can share via WhatsApp, chat, or any messaging app. Each link is valid for 7 days.",
    icon: <UserPlus className="w-5 h-5" />
  },
  {
    id: "ws_step_4",
    title: "4. Joining a Workspace",
    description: "Click the invite link. If you're not logged in, sign up or log in first — you'll be redirected back automatically. Then click 'Accept' to confirm and join as a Member of that workspace.",
    icon: <LogIn className="w-5 h-5" />
  },
  {
    id: "ws_step_5",
    title: "5. Switching Between Workspaces",
    description: "Use the workspace switcher in the sidebar to switch between 'Personal' and any shared workspaces you belong to. All data (transactions, budgets, reports) updates to reflect the active workspace.",
    icon: <ArrowLeftRight className="w-5 h-5" />
  },
  {
    id: "ws_step_6",
    title: "6. What Can Members Do?",
    description: "Each member has a role: Owner (full control), Admin (manage data & members), Member (manage own data), or Viewer (read-only). See the full permission details for a complete breakdown of what each role can do.",
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: "ws_step_7",
    title: "7. Important Notes",
    description: "Deleting a workspace permanently deletes all its shared data — this cannot be undone. Your personal data is never affected by workspace actions. Invite links expire after 7 days; generate a new one if needed.",
    icon: <AlertTriangle className="w-5 h-5" />
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

      {/* Workspace Section */}
      <div className="pt-8 border-t">
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7 text-blue-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Shared Workspace</h2>
          <p className="text-muted-foreground max-w-lg">
            Collaborate on finances with your household, partner, or team.
          </p>
        </div>

        <div className="space-y-4">
          {WORKSPACE_TUTORIAL_STEPS.map((step, index) => {
            // For step 6, render with the permission link
            if (step.id === "ws_step_6") {
              return (
                <div key={step.id}>
                  <TutorialStep
                    stepNumber={index + 1}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                  />
                  <div className="ml-12 mt-2 mb-4">
                    <Link
                      href="/workspace/permissions"
                      className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1.5"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      View full permission details →
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <TutorialStep
                key={step.id}
                stepNumber={index + 1}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            );
          })}
        </div>
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
