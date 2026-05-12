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
    <div className="min-h-svh bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/40 bg-surface/60 backdrop-blur-2xl md:flex md:flex-col">
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="relative grid h-9 w-9 place-items-center rounded bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-tighter uppercase leading-none">Tickwise</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-primary/60">System_V1.0</div>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-4">
          {NAV.map((n) => {
            const active = loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-[11px] font-mono uppercase tracking-widest transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border/40 p-4 bg-muted/10">
          <Link
            to="/profile"
            className="group flex items-center gap-3 rounded border border-transparent p-2 hover:border-border/60 hover:bg-muted/30 transition-all"
          >
            <div className="grid h-8 w-8 place-items-center rounded bg-muted font-mono text-xs font-bold text-muted-foreground group-hover:text-foreground">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-mono text-[10px] uppercase tracking-widest font-bold text-foreground">{user?.email?.split('@')[0] ?? "TRADER_00"}</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">Profile_Admin</div>
            </div>
          </Link>
          <button
            onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}
            className="mt-3 flex w-full items-center gap-3 px-3 py-2 text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-down transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Log_out_Engine
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/40 bg-background/80 px-6 py-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold tracking-tighter uppercase">Tickwise</span>
        </div>
        <Link to="/profile" className="grid h-8 w-8 place-items-center rounded bg-muted font-mono text-xs font-bold">
          {user?.email?.[0]?.toUpperCase() ?? "?"}
        </Link>
      </header>

      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl px-6 pb-32 pt-8 md:px-10 md:py-10">{children}</div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-4 bottom-4 z-50 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around rounded-lg border border-border/60 bg-surface/80 p-1 backdrop-blur-2xl shadow-2xl">
          {NAV.map((n) => {
            const active = loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded py-2 transition-all",
                  active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                <span className="font-mono text-[8px] font-bold uppercase tracking-widest">{n.label}</span>
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
    <div className="mb-8 flex items-end justify-between gap-6">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-black uppercase tracking-tighter sm:text-4xl">{title}</h1>
        {subtitle && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("panel p-6", className)}>{children}</div>;
}

export function StatCard({
  label, value, delta, accent,
}: { label: string; value: ReactNode; delta?: string; accent?: "up" | "down" | "primary" }) {
  return (
    <div className="panel p-5">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-2 font-display text-3xl font-bold tabular-nums tracking-tight",
        accent === "up" && "text-up",
        accent === "down" && "text-down",
        accent === "primary" && "text-primary",
      )}>{value}</div>
      {delta && <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">{delta}</div>}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-8 max-w-6xl px-4 pb-28 pt-2 text-center text-[11px] text-muted-foreground md:px-8 md:pb-8">
      Built by{" "}
      <a href="https://architeq.co.za" target="_blank" rel="noreferrer" className="font-medium text-foreground hover:text-primary">
        Architeq Web Agency
      </a>
    </footer>
  );
}
