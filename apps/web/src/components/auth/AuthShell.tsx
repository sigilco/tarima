import type { ReactNode } from "react";

import * as m from "#/paraglide/messages.js";

/**
 * AuthShell: the shared chrome for /login — centered card on the off-white
 * surface with the tarima brand mark. Amber is used only as the small
 * accent square next to the wordmark; surfaces stay off-white/white.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-16 text-foreground">
      <div className="w-full max-w-sm">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#FDE047]">
            <span className="h-2 w-2 rounded-[2px] bg-foreground" />
          </span>
          <span className="text-[19px] font-semibold tracking-tight text-foreground">
            {m["app.title"]()}
          </span>
        </a>
        {children}
      </div>
    </main>
  );
}
