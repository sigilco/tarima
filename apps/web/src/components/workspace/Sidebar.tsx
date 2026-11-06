import type { ReactNode } from "react";

import * as m from "#/paraglide/messages.js";
import { cn } from "#/lib/utils.ts";

import { Separator } from "../ui/separator";

/**
 * The persistent chrome of the new workspace (screens workspace-1).
 *
 * A Notion-like collapsible sidebar on the off-white surface: brand mark,
 * three chip tabs (Projects live, Documents and Audit disabled stubs) and
 * the user block at the bottom. Collapse state is local — the URL stays
 * the source of truth for navigation only. The chat panel is NOT part of
 * this shell: SP4 mounts <ChatPanel/> into the <ChatPanelSlot/> the views
 * reserve.
 */

export interface SidebarProps {
  /** Which chip is active: projects and audit are live; Documents is a stub. */
  active: "projects" | "audit";
  /** The signed-in identifier shown in the user block (email today). */
  userEmail?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onSignOut?: () => void;
  children?: ReactNode;
}

const chipClasses = "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors";

export function Sidebar({
  active,
  userEmail,
  collapsed = false,
  onToggleCollapsed,
  onSignOut,
  children,
}: SidebarProps) {
  const tabs = [
    {
      id: "projects" as const,
      label: m["workspace.tabProjects"](),
      icon: "▦",
      href: "/app",
      disabled: false,
    },
    {
      id: "documents" as const,
      label: m["workspace.tabDocuments"](),
      icon: "▤",
      href: "/app",
      disabled: true,
    },
    {
      id: "audit" as const,
      label: m["workspace.tabAudit"](),
      icon: "◻",
      href: "/app/audit",
      disabled: false,
    },
  ];

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "flex h-[100dvh] shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className="flex items-center justify-between px-3 pt-4">
        <a href="/" className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[#FDE047]">
            <span className="h-2 w-2 rounded-[2px] bg-foreground" />
          </span>
          {!collapsed && (
            <span className="text-[17px] font-semibold tracking-tight text-foreground">
              {m["app.title"]()}
            </span>
          )}
        </a>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? m["workspace.expand"]() : m["workspace.collapse"]()}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-0.5 px-2">
        {tabs.map((tab) =>
          tab.disabled ? (
            <span
              key={tab.id}
              aria-disabled="true"
              className={cn(chipClasses, "cursor-default text-muted-foreground/60")}
              title={m["workspace.soon"]()}
            >
              <span aria-hidden="true" className="w-4 text-center">
                {tab.icon}
              </span>
              {!collapsed && (
                <span className="truncate">
                  {tab.label}
                  <span className="ml-1.5 text-[11px] text-muted-foreground/60">
                    {m["workspace.soon"]()}
                  </span>
                </span>
              )}
            </span>
          ) : (
            <a
              key={tab.id}
              href={tab.href}
              aria-current={active === tab.id ? "page" : undefined}
              className={cn(
                chipClasses,
                active === tab.id
                  ? "border border-border bg-card font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span aria-hidden="true" className="w-4 text-center">
                {tab.icon}
              </span>
              {!collapsed && <span className="truncate">{tab.label}</span>}
            </a>
          ),
        )}
      </nav>

      <div className="mt-auto px-3 pb-4">
        {!collapsed && (
          <>
            <Separator className="mb-3" />
            <p className="truncate text-[13px] text-foreground" title={userEmail}>
              {userEmail ?? m["workspace.userFallback"]()}
            </p>
            <button
              type="button"
              onClick={onSignOut}
              className="mt-1 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {m["workspace.signOut"]()}
            </button>
          </>
        )}
      </div>
      {children}
    </aside>
  );
}
