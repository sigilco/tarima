import "#/styles.css";
import { TooltipProvider } from "#/components/ui/tooltip";
import { Toaster } from "#/components/ui/sonner";
import type { DecoratorProps } from "react-cosmos/client";

// Directory-tree decorator for `apps/web/src/cosmos/*`.
// Wraps every fixture in TooltipProvider + the sonner Toaster and applies
// the per-fixture `theme` option to the <html> dark class so tokens resolve
// correctly on first paint.
type CosmosOptions = { theme?: "light" | "dark" };

export default function CosmosDecorator({ children, options }: DecoratorProps<CosmosOptions>) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", options?.theme === "dark");
  }
  return (
    <div className="min-h-screen bg-background p-6 font-sans text-foreground antialiased">
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </div>
  );
}
