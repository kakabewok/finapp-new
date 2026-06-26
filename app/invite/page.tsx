"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Users,
  LogIn,
  UserPlus,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
  ShieldX,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

interface InviteInfo {
  valid: boolean;
  workspace_id: string;
  workspace_name: string;
  owner_name: string;
  expires_at: string;
  is_logged_in: boolean;
  membership_status: "none" | "member" | "owner";
}

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError({ message: "No invite token provided", code: "MISSING_TOKEN" });
      setIsLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/invite/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError({ message: data.error, code: data.code || "ERROR" });
        } else {
          setInviteInfo(data);
        }
      } catch {
        setError({ message: "Failed to validate invite link", code: "NETWORK" });
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/invite/${token}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Already a member
          toast.info(data.error);
          router.push("/dashboard");
        } else {
          toast.error(data.error || "Failed to join workspace");
        }
        return;
      }

      toast.success(`You've successfully joined ${data.workspace_name}!`);

      // Set the active workspace in localStorage so it switches on next dashboard load
      localStorage.setItem("siboros_active_workspace_id", data.workspace_id);
      router.push("/dashboard");
    } catch {
      toast.error("Failed to join workspace");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    router.push("/");
  };

  const handleLogin = () => {
    router.push(`/login?next=${encodeURIComponent(`/invite?token=${token}`)}`);
  };

  const handleSignup = () => {
    router.push(`/register?next=${encodeURIComponent(`/invite?token=${token}`)}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md border-border/40 shadow-xl bg-card/80 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Validating invite link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorIcons: Record<string, React.ReactNode> = {
      INVALID: <AlertCircle className="h-12 w-12 text-destructive" />,
      REVOKED: <ShieldX className="h-12 w-12 text-destructive" />,
      EXPIRED: <Clock className="h-12 w-12 text-amber-500" />,
      USED: <Ban className="h-12 w-12 text-muted-foreground" />,
      MISSING_TOKEN: <AlertCircle className="h-12 w-12 text-destructive" />,
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md border-border/40 shadow-xl bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {errorIcons[error.code] || errorIcons.INVALID}
            </div>
            <CardTitle className="text-xl">Unable to Join</CardTitle>
            <CardDescription className="text-base mt-2">{error.message}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!inviteInfo) return null;

  // Not logged in state
  if (!inviteInfo.is_logged_in) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md border-border/40 shadow-xl bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">You&apos;ve been invited!</CardTitle>
            <CardDescription className="text-base mt-2">
              You&apos;ve been invited to join{" "}
              <strong className="text-foreground">{inviteInfo.workspace_name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={handleLogin}>
              <LogIn className="mr-2 h-4 w-4" />
              Log in to join
            </Button>
            <Button variant="outline" className="w-full" onClick={handleSignup}>
              <UserPlus className="mr-2 h-4 w-4" />
              Sign up to join
            </Button>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-xs text-muted-foreground">
              You need an account to join this workspace.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Already a member
  if (inviteInfo.membership_status !== "none") {
    const isOwner = inviteInfo.membership_status === "owner";
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md border-border/40 shadow-xl bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-xl">
              {isOwner ? "You are the owner" : "Already a member"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isOwner
                ? `You are the owner of ${inviteInfo.workspace_name}.`
                : `You are already a member of ${inviteInfo.workspace_name}.`}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => {
              localStorage.setItem("siboros_active_workspace_id", inviteInfo.workspace_id);
              router.push("/dashboard");
            }}>
              Go to Workspace
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Confirmation — logged in, not yet a member
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md border-border/40 shadow-xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Join Workspace</CardTitle>
          <CardDescription className="text-base mt-2">
            You&apos;ve been invited to join{" "}
            <strong className="text-foreground">{inviteInfo.workspace_name}</strong> by{" "}
            <strong className="text-foreground">{inviteInfo.owner_name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Accept &amp; Join
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDecline}
            disabled={isAccepting}
          >
            <X className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            You&apos;ll be able to view and manage shared finances together.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
          <Card className="w-full max-w-md border-border/40 shadow-xl bg-card/80 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <InvitePageContent />
    </Suspense>
  );
}
