import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownRight, ShieldCheck, Zap, BarChart3, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tickwise — Ups & Downs Trading Terminal" },
      { name: "description", content: "A premium, mobile-first terminal for Ups & Downs trading: martingale engine, session analytics, real-time P&L." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </div>
            <div className="font-display text-lg font-semibold">Tickwise</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm hover:bg-accent sm:inline-flex">
              Sign in
            </Link>
            <Link to="/signup" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" />
            now live · v1.0
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-6xl">
            A terminal built for one thing.
            <span className="block text-muted-foreground">Ups. Downs. Discipline.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Tickwise is a focused, mobile-first trading workspace for Rise/Fall, Higher/Lower, and Up/Down tick strategies — with a real martingale engine, live session analytics and exportable performance reports.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
              Start trading <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm hover:bg-accent">
              I have an account
            </Link>
          </div>

          {/* Mock terminal preview */}
          <div className="panel mt-14 grid gap-4 p-4 md:grid-cols-3">
            {[
              { label: "Win rate", value: "67.4%", accent: "text-up" },
              { label: "Session P&L", value: "+$184.20", accent: "text-up" },
              { label: "Martingale lvl", value: "0 / 5", accent: "" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-surface/60 p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                <div className={`mt-2 font-display text-2xl tabular ${s.accent}`}>{s.value}</div>
              </div>
            ))}
            <div className="md:col-span-3 flex items-center gap-2">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-up py-3 text-sm font-semibold">
                <ArrowUpRight className="h-4 w-4" /> UP
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-down py-3 text-sm font-semibold">
                <ArrowDownRight className="h-4 w-4" /> DOWN
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Zap, title: "Real martingale engine", body: "Configurable multiplier, max-level caps, reset-on-win, and live exposure forecasting." },
            { icon: BarChart3, title: "Session analytics", body: "Live ROI, streaks, win rate, average duration. Export to CSV or PDF." },
            { icon: ShieldCheck, title: "Risk guardrails", body: "Take-profit, stop-loss, max trades per session, and cooldown timers — enforced automatically." },
          ].map((f) => (
            <div key={f.title} className="panel p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Tickwise. Simulated trading for educational use.</div>
          <a href="https://architeq.co.za" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Built by Architeq Web Agency
          </a>
        </div>
      </footer>
    </div>
  );
}
