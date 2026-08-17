import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanSquare, LayoutDashboard, LogOut, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] as const;

export function AppShell({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) || user?.email || "Account";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <KanbanSquare className="size-4" aria-hidden="true" />
        </span>
        <span className="font-display text-base font-bold text-sidebar-foreground">
          Sprint Board
        </span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3" aria-label="Main">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Separator />
      <div className="space-y-3 p-3">
        <div className="px-2">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r shadow-panel">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
              {description && (
                <p className="truncate text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        </header>
        <main className={cn("px-4 py-6 sm:px-6 lg:px-8")}>{children}</main>
      </div>
    </div>
  );
}
