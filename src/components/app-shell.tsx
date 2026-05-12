import { Link, useRouter, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, LineChart, History, Settings, User, Activity, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/terminal", label: "Terminal", icon: Activity },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const loc = useLocation();

  return (
    <div className="min-h-svh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface/40 backdrop-blur-xl md:flex md:flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold leading-none">Tickwise</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">trading terminal</div>
          </div>
        </div>
        <nav className="mt-4 flex-1 px-3">
          {NAV.map((n) => {
            const active = loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent/60"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user?.email ?? "Trader"}</div>
              <div className="text-xs text-muted-foreground">Manage profile</div>
            </div>
          </Link>
          <button
            onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-base font-semibold">Tickwise</span>
        </div>
        <Link to="/profile" className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold">
          {user?.email?.[0]?.toUpperCase() ?? "?"}
        </Link>
      </header>

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 pb-32 pt-4 md:px-8 md:py-8">{children}</div>
        <SiteFooter />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <div className="glass mx-auto flex max-w-md items-center justify-around rounded-2xl p-1.5">
          {NAV.map((n) => {
            const active = loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("panel p-5", className)}>{children}</div>;
}

export function StatCard({
  label, value, delta, accent,
}: { label: string; value: ReactNode; delta?: string; accent?: "up" | "down" | "primary" }) {
  return (
    <div className="panel p-4">
      <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-2 font-display text-2xl tabular md:text-3xl",
        accent === "up" && "text-up",
        accent === "down" && "text-down",
        accent === "primary" && "text-primary",
      )}>{value}</div>
      {delta && <div className="mt-1 text-xs text-muted-foreground tabular">{delta}</div>}
    </div>
  );
}
