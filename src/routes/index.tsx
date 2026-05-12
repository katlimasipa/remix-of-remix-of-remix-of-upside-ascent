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
    <div className="min-h-svh selection:bg-primary/30 selection:text-primary">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              <Activity className="h-5 w-5" />
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-background bg-up" />
            </div>
            <div className="font-display text-xl font-bold tracking-tighter uppercase">Tickwise</div>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            {["Terminal", "Analytics", "Strategy"].map((item) => (
              <a key={item} href="#" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground sm:inline-flex">
              Log_in
            </Link>
            <Link to="/signup" className="rounded-sm bg-primary px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110 active:scale-95 transition-all">
              Initialize
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-border/40 overflow-hidden">
          <div className="grid-bg absolute inset-0" />
          <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  System Status: Operational
                </div>
                <h1 className="max-w-3xl font-display text-5xl font-black leading-[0.9] tracking-tighter sm:text-7xl lg:text-8xl">
                  TICK_BASED <br />
                  <span className="text-muted-foreground/30">EXECUTION</span> <br />
                  ENGINE_V1
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-muted-foreground/80 font-medium">
                  A high-frequency workspace for speculative tick strategies. Real-time Martingale logic, sub-second latency, and industrial-grade session analytics.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link to="/signup" className="btn-mono relative overflow-hidden bg-foreground px-8 py-4 text-background group">
                    <span className="relative z-10 flex items-center gap-2">
                      Start_Trading <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                  <Link to="/login" className="btn-mono border border-border bg-background px-8 py-4 text-foreground hover:bg-muted transition-colors">
                    Access_Terminal
                  </Link>
                </div>
              </div>

              <div className="flex-1 lg:pl-12">
                <div className="panel relative overflow-hidden border-border/60 bg-surface/80 p-1 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                      <div className="h-2.5 w-2.5 rounded-full bg-warn/40" />
                      <div className="h-2.5 w-2.5 rounded-full bg-up/40" />
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">LIVE_SESSION_MONITOR</div>
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "NET_PNL", value: "+$412.80", color: "text-up" },
                        { label: "WIN_RATE", value: "68.2%", color: "text-primary" },
                        { label: "EXPOSURE", value: "$1.00", color: "" },
                        { label: "STEP_LVL", value: "L0", color: "" },
                      ].map((s) => (
                        <div key={s.label} className="border-l-2 border-border/40 pl-4 py-1">
                          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                          <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="h-32 rounded bg-muted/20 border border-border/20 flex items-end gap-1 p-2">
                       {Array.from({ length: 24 }).map((_, i) => (
                         <div key={i} className="flex-1 bg-primary/20 rounded-t-sm transition-all hover:bg-primary/40" style={{ height: `${20 + Math.random() * 80}%` }} />
                       ))}
                    </div>
                    <div className="flex gap-2">
                       <div className="flex-1 h-10 rounded-sm bg-up/90 flex items-center justify-center font-mono text-[10px] font-bold text-up-foreground uppercase tracking-widest">Buy_Ups</div>
                       <div className="flex-1 h-10 rounded-sm bg-down/90 flex items-center justify-center font-mono text-[10px] font-bold text-down-foreground uppercase tracking-widest">Buy_Downs</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-1 bg-border/40 p-1 md:grid-cols-3">
            {[
              { icon: Zap, title: "MARTINGALE_ENGINE", body: "Configurable multiplier, max-level caps, and reset-on-win logic enforced at the kernel level." },
              { icon: BarChart3, title: "DATA_VISUALS", body: "Live ROI, win rate, and average duration metrics tracked via sub-second tick telemetry." },
              { icon: ShieldCheck, title: "RISK_CONTROL", body: "Automated take-profit and stop-loss guardrails designed for disciplined session management." },
            ].map((f) => (
              <div key={f.title} className="bg-background p-8 space-y-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-muted text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight uppercase">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <div className="pt-4">
                   <div className="h-px w-8 bg-primary/30" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-muted/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:items-start">
             <div className="font-display text-lg font-bold tracking-tighter uppercase">Tickwise</div>
             <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">© {new Date().getFullYear()} TERMINAL_ACCESS_AUTHORIZED</p>
          </div>
          <div className="flex gap-8">
             {["Privacy", "Terms", "Documentation"].map(l => (
               <a key={l} href="#" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">{l}</a>
             ))}
          </div>
          <a href="https://architeq.co.za" target="_blank" rel="noreferrer" className="font-mono text-[10px] uppercase tracking-widest text-primary/60 hover:text-primary">
            Built_by_Architeq
          </a>
        </div>
      </footer>
    </div>
  );
}
