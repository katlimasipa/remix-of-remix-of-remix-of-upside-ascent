import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/store";
import { PageHeader, Panel, StatCard } from "@/components/app-shell";
import { MARKETS, STRATEGIES, simulateTrade, nextStake, totalExposure, fmtMoney, type Direction } from "@/lib/trading";
import { Play, Pause, Square, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/terminal")({
  head: () => ({ meta: [{ title: "Terminal — Tickwise" }] }),
  component: Terminal,
});

function Terminal() {
  const s = useSession();
  const { user } = useAuth();
  const sessionDbId = useRef<string | null>(null);
  const market = MARKETS.find((m) => m.id === s.config.market) ?? MARKETS[0];
  const strategy = STRATEGIES.find((x) => x.id === s.config.strategy) ?? STRATEGIES[0];
  const direction: Direction = strategy.direction;

  // Live price ticker for the active market
  useEffect(() => {
    if (s.status !== "running") return;
    const i = setInterval(() => {
      useSession.setState((prev) => ({ price: prev.price * (1 + (Math.random() - 0.5) * market.vol) }));
    }, 350);
    return () => clearInterval(i);
  }, [s.status, market.vol]);

  // Auto-trader loop
  useEffect(() => {
    if (!s.config.autoTrade || s.status !== "running") return;
    const i = setInterval(() => {
      placeTrade(direction);
    }, Math.max(1500, s.config.cooldownSeconds * 1000));
    return () => clearInterval(i);
  }, [s.config.autoTrade, s.config.cooldownSeconds, s.status, direction]);

  async function start() {
    s.startSession(s.startingBalance || 1000);
    if (user) {
      const { data, error } = await supabase.from("trading_sessions").insert({
        user_id: user.id,
        market: s.config.market,
        strategy: s.config.strategy,
        base_stake: s.config.baseStake,
        duration_ticks: s.config.durationTicks,
        martingale_enabled: s.config.martingaleEnabled,
        martingale_multiplier: s.config.martingaleMultiplier,
        max_martingale_levels: s.config.maxMartingaleLevels,
        take_profit: s.config.takeProfit,
        stop_loss: s.config.stopLoss,
        max_trades: s.config.maxTrades,
        cooldown_seconds: s.config.cooldownSeconds,
        starting_balance: s.startingBalance || 1000,
        settings: s.config,
      }).select("id").single();
      if (!error && data) sessionDbId.current = data.id;
    }
    toast.success("Session started.");
  }

  async function endSession() {
    s.endSession();
    if (sessionDbId.current && user) {
      await supabase.from("trading_sessions").update({
        status: "ended",
        ended_at: new Date().toISOString(),
        ending_balance: s.balance,
        total_trades: s.trades.length,
        wins: s.wins,
        losses: s.losses,
        pnl: s.pnl,
      }).eq("id", sessionDbId.current);
    }
    toast.success("Session saved.");
  }

  function placeTrade(direction: Direction) {
    if (s.status !== "running") return toast.error("Start a session first.");
    if (s.config.maxTrades && s.trades.length >= s.config.maxTrades) {
      toast.warning("Max trades reached."); s.endSession(); return;
    }
    if (s.config.takeProfit && s.pnl >= s.config.takeProfit) {
      toast.success("Take-profit hit. Session ended."); endSession(); return;
    }
    if (s.config.stopLoss && s.pnl <= -s.config.stopLoss) {
      toast.error("Stop-loss hit. Session ended."); endSession(); return;
    }
    const stake = s.nextStake;
    const entry = s.price;
    const result = simulateTrade({
      entry, ticks: s.config.durationTicks, vol: market.vol,
      direction, stake,
    });
    s.recordTrade({
      direction, stake, pnl: result.pnl, result: result.result,
      entry, exit: result.exit, level: s.currentLevel,
    });
    useSession.setState({ price: result.exit });

    // martingale next
    const ms = nextStake({
      baseStake: s.config.baseStake,
      multiplier: s.config.martingaleMultiplier,
      lastResult: result.result,
      currentLevel: s.currentLevel,
      maxLevels: s.config.maxMartingaleLevels,
      resetOnWin: s.config.resetOnWin,
    });
    s.setNextStake(s.config.martingaleEnabled ? ms.stake : s.config.baseStake, s.config.martingaleEnabled ? ms.level : 0);

    // persist trade
    if (sessionDbId.current && user) {
      supabase.from("trades").insert({
        session_id: sessionDbId.current,
        user_id: user.id,
        direction, stake, pnl: result.pnl, payout: result.payout,
        result: result.result, martingale_level: s.currentLevel,
        entry_price: entry, exit_price: result.exit, duration_ticks: s.config.durationTicks,
      }).then(() => {});
    }
  }

  return (
    <>
      <PageHeader
        title="Trade Terminal"
        subtitle={`${market.name} · live`}
        action={
          <div className="hidden gap-2 md:flex">
            {s.status === "idle" || s.status === "ended" ? (
              <button onClick={start} className="rounded-full bg-up px-4 py-2 text-sm font-semibold text-up-foreground">
                <Play className="-mt-0.5 mr-1 inline h-4 w-4" /> Start session
              </button>
            ) : s.status === "running" ? (
              <>
                <button onClick={() => s.pauseSession()} className="rounded-full border border-border px-4 py-2 text-sm">
                  <Pause className="-mt-0.5 mr-1 inline h-4 w-4" /> Pause
                </button>
                <button onClick={endSession} className="rounded-full bg-down px-4 py-2 text-sm font-semibold text-down-foreground">
                  <Square className="-mt-0.5 mr-1 inline h-4 w-4" /> End
                </button>
              </>
            ) : (
              <button onClick={() => s.resumeSession()} className="rounded-full bg-up px-4 py-2 text-sm font-semibold text-up-foreground">
                <Play className="-mt-0.5 mr-1 inline h-4 w-4" /> Resume
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Live panel */}
        <Panel className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Spot</div>
              <div className="mt-1 font-display text-4xl tabular md:text-5xl">{s.price.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Next stake</div>
              <div className="mt-1 font-display text-2xl text-primary tabular">{fmtMoney(s.nextStake)}</div>
              <div className="text-xs text-muted-foreground">L{s.currentLevel} · exp {fmtMoney(totalExposure(s.config.baseStake, s.config.martingaleMultiplier, s.config.maxMartingaleLevels))}</div>
            </div>
          </div>

          <Sparkline trades={s.trades} className="mt-4 h-24 w-full" />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => { s.setConfig({ strategy: "only_ups" }); placeTrade("up"); }}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-5 text-base font-bold transition-transform active:scale-[0.98] ${
                s.config.strategy === "only_ups"
                  ? "bg-up text-up-foreground ring-2 ring-up/40"
                  : "bg-up/80 text-up-foreground"
              }`}
            >
              <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> ONLY UPS</div>
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-80">{s.config.durationTicks} ticks · all rising</div>
            </button>
            <button
              onClick={() => { s.setConfig({ strategy: "only_downs" }); placeTrade("down"); }}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-5 text-base font-bold transition-transform active:scale-[0.98] ${
                s.config.strategy === "only_downs"
                  ? "bg-down text-down-foreground ring-2 ring-down/40"
                  : "bg-down/80 text-down-foreground"
              }`}
            >
              <div className="flex items-center gap-2"><TrendingDown className="h-5 w-5" /> ONLY DOWNS</div>
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-80">{s.config.durationTicks} ticks · all falling</div>
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">{strategy.hint}</p>

          {/* Mobile session controls */}
          <div className="mt-3 grid grid-cols-2 gap-2 md:hidden">
            {s.status === "idle" || s.status === "ended" ? (
              <button onClick={start} className="col-span-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                Start session
              </button>
            ) : s.status === "running" ? (
              <>
                <button onClick={() => s.pauseSession()} className="rounded-full border border-border px-4 py-2.5 text-sm">Pause</button>
                <button onClick={endSession} className="rounded-full bg-down px-4 py-2.5 text-sm font-semibold text-down-foreground">End session</button>
              </>
            ) : (
              <button onClick={() => s.resumeSession()} className="col-span-2 rounded-full bg-up px-4 py-2.5 text-sm font-semibold text-up-foreground">Resume</button>
            )}
          </div>
        </Panel>

        {/* Settings panel */}
        <Panel>
          <h3 className="font-display text-lg font-semibold">Trade controls</h3>
          <div className="mt-4 space-y-4">
            <Row label="Market">
              <select value={s.config.market} onChange={(e) => s.setConfig({ market: e.target.value })} className="select-base">
                {MARKETS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Row>
            <Row label="Strategy">
              <select value={s.config.strategy} onChange={(e) => s.setConfig({ strategy: e.target.value as any })} className="select-base">
                {STRATEGIES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </Row>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Base stake">
                <input type="number" min={0.1} step={0.1} value={s.config.baseStake} onChange={(e) => s.setConfig({ baseStake: +e.target.value })} className="select-base" />
              </Row>
              <Row label="Duration (ticks)">
                <input type="number" min={1} max={30} value={s.config.durationTicks} onChange={(e) => s.setConfig({ durationTicks: +e.target.value })} className="select-base" />
              </Row>
            </div>

            <div className="rounded-xl border border-border p-3">
              <label className="flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Martingale</span></div>
                <input type="checkbox" checked={s.config.martingaleEnabled} onChange={(e) => s.setConfig({ martingaleEnabled: e.target.checked })} className="h-4 w-4 accent-primary" />
              </label>
              {s.config.martingaleEnabled && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Row label="Multiplier">
                    <input type="number" step={0.1} min={1.1} value={s.config.martingaleMultiplier} onChange={(e) => s.setConfig({ martingaleMultiplier: +e.target.value })} className="select-base" />
                  </Row>
                  <Row label="Max levels">
                    <input type="number" min={1} max={15} value={s.config.maxMartingaleLevels} onChange={(e) => s.setConfig({ maxMartingaleLevels: +e.target.value })} className="select-base" />
                  </Row>
                </div>
              )}
            </div>

            <Row label="Auto-trade">
              <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <span className="text-xs text-muted-foreground">Cycle automatically · {s.config.cooldownSeconds}s</span>
                <input type="checkbox" checked={s.config.autoTrade} onChange={(e) => s.setConfig({ autoTrade: e.target.checked })} className="h-4 w-4 accent-primary" />
              </label>
            </Row>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Balance" value={fmtMoney(s.balance)} />
        <StatCard label="Session P&L" value={fmtMoney(s.pnl)} accent={s.pnl >= 0 ? "up" : "down"} />
        <StatCard label="Win rate" value={`${s.trades.length ? ((s.wins / s.trades.length) * 100).toFixed(1) : "0.0"}%`} />
        <StatCard label="Trades" value={`${s.trades.length}${s.config.maxTrades ? ` / ${s.config.maxTrades}` : ""}`} />
      </div>

      <style>{`.select-base{width:100%;background:var(--input);border:1px solid var(--border);border-radius:.65rem;padding:.55rem .7rem;font-size:.85rem;color:var(--foreground);outline:none}.select-base:focus{border-color:var(--primary)}`}</style>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Sparkline({ trades, className }: { trades: { pnl: number }[]; className?: string }) {
  if (trades.length < 2) {
    return <div className={`${className} grid place-items-center rounded-xl bg-surface/40 text-xs text-muted-foreground`}>No data yet — place a trade</div>;
  }
  const series = [...trades].reverse().reduce<number[]>((acc, t) => {
    acc.push((acc[acc.length - 1] ?? 0) + t.pnl);
    return acc;
  }, [0]);
  const min = Math.min(...series), max = Math.max(...series);
  const range = max - min || 1;
  const points = series.map((v, i) => {
    const x = (i / (series.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");
  const last = series[series.length - 1];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className}>
      <polyline points={points} fill="none" stroke={last >= 0 ? "var(--up)" : "var(--down)"} strokeWidth="1.5" />
    </svg>
  );
}
