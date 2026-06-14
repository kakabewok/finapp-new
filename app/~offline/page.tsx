import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
      <WifiOff className="w-16 h-16 text-muted-foreground mb-6 opacity-50" />
      <h1 className="text-2xl font-semibold mb-2">You're Offline</h1>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Please check your internet connection to access all features of SiBoros.
      </p>
      <p className="text-sm text-muted-foreground/70">
        Some previously loaded content may still be available.
      </p>
    </div>
  );
}
