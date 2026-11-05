import { useState, type ReactNode } from "react";

import { Sidebar } from "./Sidebar";

/**
 * The workspace shell layout (screens workspace-1): the Sidebar chrome on
 * the left, the active view in the content column. Collapse state is
 * local; navigation stays in the URL.
 */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  function signOut() {
    // The session cookie is HttpOnly, so clearing happens via the api;
    // for now drop the client-side state and land on /login (the guards
    // on /app do the rest). A dedicated logout endpoint lands with SP7.
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      <Sidebar
        active="projects"
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        onSignOut={signOut}
      />
      <main className="min-w-0 flex-1 overflow-y-auto px-6 py-8">{children}</main>
    </div>
  );
}
