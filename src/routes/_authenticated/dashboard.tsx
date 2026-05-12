import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/store";
import { PageHeader, StatCard, Panel } from "@/components/app-shell";
import { fmtMoney, fmtPct } from "@/lib/trading";
import { DERIV_MARKETS } from "@/lib/deriv";
import { ArrowUpRight, Activity, TrendingUp, Timer } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tickwise" }] }),
  component: Dashboard,
});

function Dashboard() {
  const s = useSession();
  const market = DERIV_MARKETS.find((m) => m.symbol === s.config.market);
  const winRate = s.trades.length ? (s.wins / s.trades.length) * 100 : 0;
  const roi = s.startingBalance ? (s.pnl / s.startingBalance) * 100 : 0;
  const elapsed = useMemo(() => {
    if (!s.startedAt) return "—";
    const ms = (s.endedAt ?? Date.now()) - s.startedAt;
    const m = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${m}m ${sec}s`;
  }, [s.startedAt, s.endedAt, s.trades.length]);

  const recent = s.trades.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command_Center"
        subtitle={`${market?.name ?? "NULL_MARKET"} // ${s.config.strategy.toUpperCase()}_ENGINE`}
        action={
          <Link to="/terminal" className="hidden items-center gap-2 rounded bg-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110 active:scale-95 md:inline-flex">
            Engage_Terminal <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Live_Balance" value={fmtMoney(s.balance, "")} delta={`Start_Ref: ${fmtMoney(s.startingBalance, "")}`} />
        <StatCard label="Net_Session_PnL" value={fmtMoney(s.pnl, "")} accent={s.pnl >= 0 ? "up" : "down"} delta={`${roi >= 0 ? "+" : ""}${roi.toFixed(2)}% ROI`} />
        <StatCard label="Win_Probability" value={`${winRate.toFixed(1)}%`} delta={`${s.wins}W // ${s.losses}L`} />
        <StatCard label="Execution_Count" value={s.trades.length} delta={`Quota: ${s.config.maxTrades ?? "Unlimited"}`} />
      </div>

      {/* Secondary Telemetry */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Max_Win_Streak" value={s.consecutiveWins} accent="up" />
        <StatCard label="Max_Loss_Streak" value={s.consecutiveLosses} accent="down" />
        <StatCard label="Martingale_Step" value={`L${s.currentLevel}`} delta={`Ceiling: L${s.config.maxMartingaleLevels}`} accent="primary" />
      </div>

      {/* Runtime Status */}
      <Panel className="border-border/60 bg-surface/40 backdrop-blur-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center justify-between border-b border-border/20 pb-4 md:border-b-0 md:pb-0">
            <div className="space-y-1">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">System_Runtime_State</div>
              <div className="flex items-center gap-3">
                <div className="relative">
                   <div className={`h-2.5 w-2.5 rounded-full ${s.status === "running" ? "bg-up shadow-[0_0_10px_rgba(var(--up),0.5)]" : s.status === "paused" ? "bg-warn" : "bg-muted-foreground/40"}`} />
                   {s.status === "running" && <div className="absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-up/40" />}
                </div>
                <span className="font-display text-2xl font-black uppercase tracking-tighter">{s.status}_</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Session_Chronometer</div>
              <div className="flex items-center justify-end gap-2 font-display text-2xl font-black tabular-nums tracking-tighter">
                <Timer className="h-5 w-5 text-muted-foreground/60" />
                {elapsed.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {s.status === "running" && (
              <button 
                onClick={() => s.pauseSession()}
                className="flex-1 rounded border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/10 md:flex-none"
              >
                Pause_
              </button>
            )}
            {s.status === "paused" && (
              <button 
                onClick={() => s.resumeSession()}
                className="flex-1 rounded border border-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 md:flex-none"
              >
                Resume_
              </button>
            )}
            {(s.status === "running" || s.status === "paused") && (
              <button 
                onClick={() => s.endSession()}
                className="flex-1 rounded bg-down px-6 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-down-foreground hover:brightness-110 md:flex-none"
              >
                End_Session_
              </button>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Recent Executions */}
        <div className="md:col-span-7">
          <Panel className="!p-0 border-border/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-6 py-3">
              <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Recent_Executions</h3>
              <Link to="/history" className="font-mono text-[9px] uppercase tracking-widest text-primary/60 hover:text-primary">View_Archive_</Link>
            </div>
            <div className="p-2">
              {recent.length === 0 ? (
                <EmptyState icon={Activity} title="NO_ACTIVE_TELEMETRY" body="The execution engine is idle. Initiate a session in the terminal to begin data capture." cta={{ to: "/terminal", label: "Open_Terminal" }} />
              ) : (
                <div className="space-y-1">
                  {recent.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded border border-transparent p-3 hover:border-border/40 hover:bg-muted/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`grid h-8 w-8 place-items-center rounded-sm font-mono text-[10px] font-bold ${t.direction === "up" ? "bg-up text-up-foreground" : "bg-down text-down-foreground"}`}>
                          {t.direction === "up" ? "UP" : "DN"}
                        </div>
                        <div>
                          <div className="font-mono text-[11px] font-bold uppercase tracking-tight">{t.direction.toUpperCase()} @ {fmtMoney(t.stake, "")}</div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">Step_L{t.level} // {t.result.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className={`font-display text-lg font-bold tabular-nums tracking-tighter ${t.pnl >= 0 ? "text-up" : "text-down"}`}>
                        {t.pnl >= 0 ? "+" : ""}{fmtMoney(t.pnl, "")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Strategy Parameters */}
        <div className="md:col-span-5">
          <Panel className="!p-0 border-border/60 overflow-hidden">
            <div className="border-b border-border/60 bg-muted/30 px-6 py-3">
              <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Strategy_Snapshot</h3>
            </div>
            <div className="p-6 space-y-3">
              <dl className="grid grid-cols-1 gap-2">
                <Item k="Engine_Base_Stake" v={fmtMoney(s.config.baseStake)} />
                <Item k="Temporal_Duration" v={`${s.config.durationTicks} Ticks`} />
                <Item k="Recovery_Multiplier" v={`${s.config.martingaleMultiplier}×`} />
                <Item k="Max_Recovery_Steps" v={s.config.maxMartingaleLevels} />
                <Item k="Target_Take_Profit" v={s.config.takeProfit ? fmtMoney(s.config.takeProfit) : "DISABLED"} />
                <Item k="Threshold_Stop_Loss" v={s.config.stopLoss ? fmtMoney(s.config.stopLoss) : "DISABLED"} />
              </dl>
              <div className="mt-6 rounded border border-primary/20 bg-primary/5 p-4 group">
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.1em] text-primary/80">
                  <TrendingUp className="h-4 w-4" /> 
                  <span>Modify core parameters in </span>
                  <Link to="/settings" className="font-black text-primary hover:underline underline-offset-4">Kernel_Settings</Link>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/20 py-2.5 last:border-0">
      <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{k}</dt>
      <dd className="font-mono text-[10px] font-bold tabular-nums uppercase tracking-tight text-foreground">{v}</dd>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, cta }: { icon: any; title: string; body: string; cta?: { to: string; label: string } }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded border border-dashed border-border text-muted-foreground/40"><Icon className="h-6 w-6" /></div>
      <div className="space-y-2">
        <div className="font-mono text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
        <div className="max-w-[240px] font-mono text-[9px] uppercase leading-relaxed tracking-widest text-muted-foreground/40">{body}</div>
      </div>
      {cta && (
        <Link to={cta.to} className="mt-2 rounded bg-muted px-6 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-foreground hover:bg-muted/80">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
