import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/store";
import { PageHeader, StatCard, Panel } from "@/components/app-shell";
import { fmtMoney, fmtPct, MARKETS } from "@/lib/trading";
import { ArrowUpRight, Activity, TrendingUp, Timer } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tickwise" }] }),
  component: Dashboard,
});

function Dashboard() {
  const s = useSession();
  const market = MARKETS.find((m) => m.id === s.config.market);
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
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${market?.name ?? "—"} · ${s.config.strategy.replace("_", " / ")}`}
        action={
          <Link to="/terminal" className="hidden rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 md:inline-flex">
            Open terminal <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Balance" value={fmtMoney(s.balance)} delta={`Starting ${fmtMoney(s.startingBalance)}`} />
        <StatCard label="Session P&L" value={fmtMoney(s.pnl)} accent={s.pnl >= 0 ? "up" : "down"} delta={fmtPct(roi)} />
        <StatCard label="Win rate" value={`${winRate.toFixed(1)}%`} delta={`${s.wins}W · ${s.losses}L`} />
        <StatCard label="Trades" value={s.trades.length} delta={`Max ${s.config.maxTrades ?? "∞"}`} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StatCard label="Streak (win)" value={s.consecutiveWins} accent="up" />
        <StatCard label="Streak (loss)" value={s.consecutiveLosses} accent="down" />
        <StatCard label="Martingale" value={`L${s.currentLevel} / ${s.config.maxMartingaleLevels}`} delta={`Next ${fmtMoney(s.nextStake)}`} accent="primary" />
      </div>

      <Panel className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Status</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${s.status === "running" ? "bg-up animate-pulse" : s.status === "paused" ? "bg-warn" : "bg-muted-foreground"}`} />
              <span className="font-display text-xl capitalize">{s.status}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Elapsed</div>
            <div className="mt-1 flex items-center gap-1.5 font-display text-xl tabular">
              <Timer className="h-4 w-4 text-muted-foreground" />{elapsed}
            </div>
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent trades</h3>
            <Link to="/history" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Activity} title="No trades yet" body="Start a session in the terminal to begin trading." cta={{ to: "/terminal", label: "Open terminal" }} />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${t.direction === "up" ? "bg-up" : "bg-down"}`}>
                      {t.direction === "up" ? "↑" : "↓"}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{t.direction.toUpperCase()} · {fmtMoney(t.stake)}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">L{t.level} · {t.result}</div>
                    </div>
                  </div>
                  <div className={`tabular text-sm font-semibold ${t.pnl >= 0 ? "text-up" : "text-down"}`}>{fmtMoney(t.pnl)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h3 className="font-display text-lg font-semibold">Strategy snapshot</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Item k="Base stake" v={fmtMoney(s.config.baseStake)} />
            <Item k="Duration" v={`${s.config.durationTicks} ticks`} />
            <Item k="Multiplier" v={`${s.config.martingaleMultiplier}×`} />
            <Item k="Max levels" v={s.config.maxMartingaleLevels} />
            <Item k="Take profit" v={s.config.takeProfit ? fmtMoney(s.config.takeProfit) : "—"} />
            <Item k="Stop loss" v={s.config.stopLoss ? fmtMoney(s.config.stopLoss) : "—"} />
          </dl>
          <div className="mt-4 rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> Tune your strategy in
              <Link to="/settings" className="text-primary hover:underline">Settings</Link>.
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface/40 px-3 py-2">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
      <dd className="tabular text-sm font-medium">{v}</dd>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, cta }: { icon: any; title: string; body: string; cta?: { to: string; label: string } }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-muted-foreground"><Icon className="h-5 w-5" /></div>
      <div className="font-display text-base font-medium">{title}</div>
      <div className="max-w-xs text-xs text-muted-foreground">{body}</div>
      {cta && (
        <Link to={cta.to} className="mt-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
