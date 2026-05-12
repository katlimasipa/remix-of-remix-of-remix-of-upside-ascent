import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "@/lib/store";
import { PageHeader, Panel, StatCard } from "@/components/app-shell";
import { TickChart, type TickPoint } from "@/components/tick-chart";
import { STRATEGIES, nextStake, totalExposure, fmtMoney, evaluateSignal, type Direction } from "@/lib/trading";
import { DerivClient, DERIV_MARKETS } from "@/lib/deriv";
import { Play, Square, TrendingUp, TrendingDown, Zap, Wifi, WifiOff, Loader2, AlertTriangle, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/terminal")({
  head: () => ({ meta: [{ title: "Terminal — Tickwise" }] }),
  component: Terminal,
});

type Tab = "chart" | "trade" | "ladder" | "log";

function Terminal() {
  const s = useSession();
  const { user } = useAuth();
  const sessionDbId = useRef<string | null>(null);
  const clientRef = useRef<DerivClient | null>(null);
  const tradingRef = useRef(false); // mutex to avoid overlapping trades in auto mode

  const [tab, setTab] = useState<Tab>("chart");
  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [ticks, setTicks] = useState<TickPoint[]>([]);
  const [trend, setTrend] = useState<"up" | "down" | "flat">("flat");
  const [lastQuote, setLastQuote] = useState<number | null>(null);
  const [connState, setConnState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [signalReason, setSignalReason] = useState<string>("idle");

  // Load saved token
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("deriv_api_token, deriv_account_id, deriv_currency").eq("id", user.id).maybeSingle().then(({ data }) => {
      setToken(data?.deriv_api_token ?? null);
      if (data?.deriv_account_id) useSession.setState({ derivAccountId: data.deriv_account_id, derivCurrency: data.deriv_currency || "USD" });
      setTokenChecked(true);
    });
  }, [user]);

  // Connect to Deriv when we have a token
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const c = new DerivClient();
    clientRef.current = c;
    c.onClose = () => setConnState("error");
    c.onBalance = ({ balance, currency }) =>
      useSession.setState({ derivLiveBalance: balance, derivCurrency: currency });
    setConnState("connecting");
    (async () => {
      try {
        await c.connect();
        const auth = await c.authorize(token);
        if (cancelled) return;
        if (!auth.is_virtual) {
          setError("Token is for a REAL account. Use a DEMO token.");
          setConnState("error");
          return;
        }
        useSession.setState({
          derivConnected: true, derivAuthorized: true,
          derivAccountId: auth.loginid, derivCurrency: auth.currency,
          derivLiveBalance: Number(auth.balance),
        });
        setConnState("connected");
      } catch (e: any) {
        setError(e?.message ?? "Connection failed");
        setConnState("error");
      }
    })();
    return () => {
      cancelled = true;
      c.close();
      clientRef.current = null;
      useSession.setState({ derivConnected: false, derivAuthorized: false });
    };
  }, [token]);

  useEffect(() => {
    const durationTicks = Math.max(2, Math.min(5, Math.round(s.config.durationTicks)));
    if (durationTicks !== s.config.durationTicks) s.setConfig({ durationTicks });
  }, [s.config.durationTicks, s.setConfig]);

  // Subscribe to live tick stream + backfill recent history
  useEffect(() => {
    const c = clientRef.current;
    if (!c || connState !== "connected") return;
    const sym = s.config.market;
    setTicks([]);
    setTrend("flat");
    let mounted = true;
    (async () => {
      try {
        await c.unsubscribeTicks(sym);
        // Backfill ~200 recent ticks for context
        const history = await c.fetchTickHistory(sym, 240);
        if (!mounted) return;
        setTicks(history);
        await c.subscribeTicks(sym, (t) => {
          if (!mounted) return;
          setLastQuote((prev) => {
            if (prev != null) {
              if (t.quote > prev) setTrend("up");
              else if (t.quote < prev) setTrend("down");
            }
            return t.quote;
          });
          useSession.setState({ price: t.quote });
          setTicks((prev) => {
            const next = prev.length && prev[prev.length - 1].epoch === t.epoch
              ? prev.slice(0, -1).concat({ epoch: t.epoch, quote: t.quote })
              : prev.concat({ epoch: t.epoch, quote: t.quote });
            return next.slice(-300);
          });
        });
      } catch (e: any) {
        toast.error(e?.message ?? "Stream error");
      }
    })();
    return () => { mounted = false; };
  }, [s.config.market, connState]);

  async function start() {
    if (connState !== "connected") return toast.error("Connect your Deriv token in Settings first.");
    s.startSession(s.derivLiveBalance ?? s.startingBalance ?? 1000);
    if (user) {
      const { data, error: dbErr } = await supabase.from("trading_sessions").insert({
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
        starting_balance: s.derivLiveBalance ?? 1000,
        settings: s.config,
      }).select("id").single();
      if (!dbErr && data) sessionDbId.current = data.id;
    }
    toast.success("Session started.");
    setTab("trade");
  }

  const endSession = useCallback(async () => {
    s.endSession();
    if (sessionDbId.current && user) {
      await supabase.from("trading_sessions").update({
        status: "ended",
        ended_at: new Date().toISOString(),
        ending_balance: useSession.getState().balance,
        total_trades: useSession.getState().trades.length,
        wins: useSession.getState().wins,
        losses: useSession.getState().losses,
        pnl: useSession.getState().pnl,
      }).eq("id", sessionDbId.current);
      sessionDbId.current = null;
    }
    toast.success("Session saved.");
  }, [s, user]);

  const placeTrade = useCallback(async (direction: Direction) => {
    const cur = useSession.getState();
    if (cur.status !== "running") return;
    if (!clientRef.current) return toast.error("Not connected.");
    if (tradingRef.current) return; // already trading

    // Guardrails
    if (cur.config.maxTrades && cur.trades.length >= cur.config.maxTrades) {
      toast.warning("Max trades reached."); endSession(); return;
    }
    if (cur.config.takeProfit && cur.pnl >= cur.config.takeProfit) {
      toast.success("Take-profit hit."); endSession(); return;
    }
    if (cur.config.stopLoss && cur.pnl <= -cur.config.stopLoss) {
      toast.error("Stop-loss hit."); endSession(); return;
    }

    tradingRef.current = true;
    const stake = Number(cur.nextStake.toFixed(2));
    const entry = cur.price;

    try {
      const { buy } = await clientRef.current.buyOnlyUpsDowns({
        symbol: cur.config.market,
        direction,
        stake,
        ticks: cur.config.durationTicks,
        currency: cur.derivCurrency,
      });
      // Watch contract until settlement
      const final = await clientRef.current.watchContract(buy.contract_id);
      const result: "win" | "loss" = final.status === "won" ? "win" : "loss";
      const profit = Number(final.profit ?? (result === "win" ? buy.payout - stake : -stake));
      const exitPrice = Number(final.exit_tick ?? cur.price);

      s.recordTrade({ direction, stake, pnl: profit, result, entry, exit: exitPrice, level: cur.currentLevel });

      // Martingale
      const ms = nextStake({
        baseStake: cur.config.baseStake,
        multiplier: cur.config.martingaleMultiplier,
        lastResult: result,
        currentLevel: cur.currentLevel,
        maxLevels: cur.config.maxMartingaleLevels,
        resetOnWin: cur.config.resetOnWin,
      });
      s.setNextStake(cur.config.martingaleEnabled ? ms.stake : cur.config.baseStake, cur.config.martingaleEnabled ? ms.level : 0);

      if (sessionDbId.current && user) {
        supabase.from("trades").insert({
          session_id: sessionDbId.current, user_id: user.id,
          direction, stake, pnl: profit, payout: Number(final.payout ?? buy.payout ?? 0),
          result, martingale_level: cur.currentLevel,
          entry_price: entry, exit_price: exitPrice, duration_ticks: cur.config.durationTicks,
        }).then(() => {});
      }
      if (result === "win") toast.success(`WIN +${fmtMoney(profit, cur.derivCurrency + " ")}`);
      else toast.error(`LOSS ${fmtMoney(profit, cur.derivCurrency + " ")}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Trade failed");
    } finally {
      tradingRef.current = false;
    }
  }, [endSession, s, user]);

  // Auto-trade loop — waits for an entry signal, then fires & awaits settlement
  const ticksRef = useRef<TickPoint[]>([]);
  useEffect(() => { ticksRef.current = ticks; }, [ticks]);
  useEffect(() => {
    if (!s.config.autoTrade || s.status !== "running") return;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled) {
        const cur = useSession.getState();
        if (cur.status !== "running" || !cur.config.autoTrade) break;
        if (tradingRef.current) { await new Promise(r => setTimeout(r, 200)); continue; }
        const dir = STRATEGIES.find(x => x.id === cur.config.strategy)!.direction;
        const waitStart = Date.now();
        let fired = false;
        while (!cancelled) {
          const st = useSession.getState();
          if (st.status !== "running" || !st.config.autoTrade) return;
          const quotes = ticksRef.current.map((t) => t.quote);
          const sig = evaluateSignal(quotes, {
            mode: cur.config.entryMode,
            streakTicks: cur.config.streakTicks,
            direction: dir,
          });
          setSignalReason(sig.reason);
          if (sig.fire) { fired = true; break; }
          if (Date.now() - waitStart > 30000) { setSignalReason("timeout — firing"); fired = true; break; }
          await new Promise((r) => setTimeout(r, 250));
        }
        if (cancelled || !fired) return;
        setSignalReason(`entering ${dir.toUpperCase()}`);
        try {
          await placeTrade(dir);
        } catch (e: any) {
          toast.error(e?.message ?? "Trade error");
          setSignalReason("error — retrying");
        }
        const cool = Math.max(500, useSession.getState().config.cooldownSeconds * 1000);
        await new Promise(r => setTimeout(r, cool));
      }
    };
    loop();
    return () => { cancelled = true; setSignalReason("idle"); };
  }, [s.config.autoTrade, s.status, placeTrade]);

  const strategy = STRATEGIES.find((x) => x.id === s.config.strategy)!;
  const market = DERIV_MARKETS.find((m) => m.symbol === s.config.market) ?? DERIV_MARKETS[2];
  const winRate = s.trades.length ? ((s.wins / s.trades.length) * 100).toFixed(1) : "0.0";
  const pnlPct = s.startingBalance ? ((s.pnl / s.startingBalance) * 100) : 0;

  // Token gate
  if (tokenChecked && !token) {
    return (
      <>
        <PageHeader title="Terminal" />
        <Panel className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-warn" />
          <h2 className="mt-3 font-display text-xl font-semibold">Connect your Deriv account</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add your Deriv DEMO API token to start trading.</p>
          <Link to="/settings" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Go to Settings</Link>
        </Panel>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top status strip — dense and technical */}
      <div className="flex items-center gap-2 border border-border/60 bg-surface/40 px-3 py-1.5 rounded-lg overflow-hidden backdrop-blur-sm">
        <ConnPill state={connState} />
        <div className="h-4 w-px bg-border/40" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{market.name}</span>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">Balance</span>
            <span className="font-display font-bold tabular-nums text-foreground">{s.derivLiveBalance != null ? `${s.derivLiveBalance.toFixed(2)}` : "0.00"} <span className="text-[10px] font-normal text-muted-foreground">{s.derivCurrency}</span></span>
          </div>
          {s.derivAccountId && (
            <div className="flex items-center gap-2 rounded-sm border border-up/30 bg-up/5 px-2 py-0.5">
               <div className="h-1 w-1 rounded-full bg-up shadow-[0_0_5px_rgba(var(--up),0.5)]" />
               <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-up">{s.derivAccountId}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-down flex items-center gap-2">
           <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </div>
      )}

      {/* Main Terminal Layout */}
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Analytics & Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Spot_Price" value={lastQuote != null ? lastQuote.toFixed(4) : "—"} sub={trend === "up" ? "▲ ASCENDING" : trend === "down" ? "▼ DESCENDING" : "— STABLE"} />
            <MiniStat label="Net_PnL" value={fmtMoney(s.pnl, "")} accent={s.pnl >= 0 ? "up" : "down"} sub={`${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}% ROI`} />
            <MiniStat label="Win_Rate" value={`${winRate}%`} sub={`${s.wins}W / ${s.losses}L`} />
            <MiniStat label="Next_Stake" value={s.nextStake.toFixed(2)} sub={`Level_L${s.currentLevel}`} accent="primary" />
          </div>

          {/* Strategy Engine Controls */}
          <Panel className="border-border/60">
            <div className="mb-4 flex items-center justify-between">
               <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Execution_Engine</h3>
               {s.status === "running" && <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-up animate-pulse" /><span className="font-mono text-[9px] uppercase tracking-widest text-up">Engine_Live</span></div>}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={connState !== "connected"}
                onClick={async () => {
                  s.setConfig({ strategy: "only_ups", autoTrade: true });
                  if (useSession.getState().status !== "running") await start();
                }}
                className={`btn-mono flex flex-col items-center justify-center gap-1 py-6 border transition-all ${s.config.autoTrade && s.config.strategy === "only_ups" && s.status === "running" ? "bg-up text-up-foreground border-up shadow-[0_0_20px_rgba(var(--up),0.2)]" : "bg-muted/30 border-border/60 hover:border-up/50 text-muted-foreground hover:text-up"}`}
              >
                <TrendingUp className="h-5 w-5 mb-1" />
                <span>Only_Ups</span>
                <span className="text-[9px] opacity-60">Engine_01</span>
              </button>
              <button
                disabled={connState !== "connected"}
                onClick={async () => {
                  s.setConfig({ strategy: "only_downs", autoTrade: true });
                  if (useSession.getState().status !== "running") await start();
                }}
                className={`btn-mono flex flex-col items-center justify-center gap-1 py-6 border transition-all ${s.config.autoTrade && s.config.strategy === "only_downs" && s.status === "running" ? "bg-down text-down-foreground border-down shadow-[0_0_20px_rgba(var(--down),0.2)]" : "bg-muted/30 border-border/60 hover:border-down/50 text-muted-foreground hover:text-down"}`}
              >
                <TrendingDown className="h-5 w-5 mb-1" />
                <span>Only_Downs</span>
                <span className="text-[9px] opacity-60">Engine_02</span>
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {s.status !== "running" ? (
                <button onClick={start} disabled={connState !== "connected"} className="btn-mono w-full bg-primary text-primary-foreground hover:brightness-110 py-3">
                  Initialize_Session
                </button>
              ) : (
                <button onClick={endSession} className="btn-mono w-full border border-down bg-down/10 text-down hover:bg-down/20 py-3">
                  Kill_Engine
                </button>
              )}
            </div>
            
            {s.config.autoTrade && s.status === "running" && (
              <div className="mt-4 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Signal_Status</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-primary">{signalReason}</span>
                </div>
              </div>
            )}
          </Panel>

          {/* Config Panel */}
          <Panel className="border-border/60">
            <h3 className="mb-4 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Kernel_Parameters</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Base_Stake">
                  <NumInput value={s.config.baseStake} onCommit={(n) => s.setConfig({ baseStake: n })} min={0.01} step={0.1} />
                </Field>
                <Field label="Tick_Duration">
                  <NumInput value={s.config.durationTicks} onCommit={(n) => s.setConfig({ durationTicks: Math.max(2, Math.min(5, Math.round(n))) })} min={2} max={5} step={1} integer />
                </Field>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center justify-between rounded border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:border-primary/40 group cursor-pointer">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Martingale_Module</span>
                  <input type="checkbox" checked={s.config.martingaleEnabled} onChange={(e) => s.setConfig({ martingaleEnabled: e.target.checked })} className="h-3.5 w-3.5 accent-primary" />
                </label>
                
                {s.config.martingaleEnabled && (
                  <div className="grid grid-cols-2 gap-3 rounded border border-border/40 bg-muted/10 p-3 animate-in fade-in slide-in-from-top-2">
                    <Field label="Multiplier">
                      <NumInput value={s.config.martingaleMultiplier} onCommit={(n) => s.setConfig({ martingaleMultiplier: Math.max(1.1, n) })} min={1.1} step={0.1} />
                    </Field>
                    <Field label="Max_Steps">
                      <NumInput value={s.config.maxMartingaleLevels} onCommit={(n) => s.setConfig({ maxMartingaleLevels: Math.max(1, Math.min(15, Math.round(n))) })} min={1} max={15} step={1} integer />
                    </Field>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between rounded border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:border-primary/40 group cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Auto_Fire_Control</span>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/40">{s.config.cooldownSeconds}s Cooldown</span>
                  </div>
                  <input type="checkbox" checked={s.config.autoTrade} onChange={(e) => s.setConfig({ autoTrade: e.target.checked })} className="h-3.5 w-3.5 accent-primary" />
                </label>
                
                <div className="rounded border border-border/40 bg-muted/10 p-3 space-y-3">
                  <Field label="Entry_Logic">
                    <select value={s.config.entryMode} onChange={(e) => s.setConfig({ entryMode: e.target.value as any })} className="select-base font-mono text-[10px] uppercase tracking-widest">
                      <option value="always">Continuous_Fire</option>
                      <option value="streak">Momentum_Streak</option>
                      <option value="reversal">Mean_Reversion</option>
                    </select>
                  </Field>
                  <Field label="Streak_Threshold">
                    <input type="number" min={2} max={10} value={s.config.streakTicks} onChange={(e) => s.setConfig({ streakTicks: Math.max(2, Math.min(10, +e.target.value)) })} className="select-base font-mono text-[10px]" disabled={s.config.entryMode === "always"} />
                  </Field>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Column: Visualization & Logs */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Visualizer */}
          <Panel className="!p-0 border-border/60 overflow-hidden">
             <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2">
               <div className="flex items-center gap-4">
                  <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Telemetry_Feed</h3>
                  <select value={s.config.market} onChange={(e) => s.setConfig({ market: e.target.value })} className="bg-transparent border-none font-mono text-[10px] uppercase tracking-widest text-primary focus:ring-0 cursor-pointer">
                    {DERIV_MARKETS.map((m) => <option key={m.symbol} value={m.symbol}>{m.name}</option>)}
                  </select>
               </div>
               <div className="flex items-center gap-3">
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded ${trend === "up" ? "bg-up/10 text-up" : trend === "down" ? "bg-down/10 text-down" : "bg-muted text-muted-foreground"}`}>
                    {trend === "up" ? "▲ Tick_Up" : trend === "down" ? "▼ Tick_Dn" : "— Stable"}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">{ticks.length}_DATA_POINTS</span>
               </div>
             </div>
             <div className="p-4">
                {ticks.length === 0 ? (
                  <div className="grid h-[320px] place-items-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    <Loader2 className="h-6 w-6 animate-spin mb-2 opacity-20" />
                    Connecting_to_Data_Kernel...
                  </div>
                ) : (
                  <TickChart ticks={ticks} trend={trend} height={340} />
                )}
             </div>
          </Panel>

          {/* Lower Grid: Ladder & Logs */}
          <div className="grid gap-4 md:grid-cols-2">
            <Panel className="!p-0 border-border/60 overflow-hidden">
              <div className="border-b border-border/60 bg-muted/30 px-4 py-2">
                <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Recovery_Ladder</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                <table className="w-full text-[10px] font-mono uppercase tracking-widest">
                  <thead className="sticky top-0 bg-surface text-muted-foreground/60 border-b border-border/40">
                    <tr><th className="px-4 py-2 text-left font-normal">Step</th><th className="px-4 py-2 text-right font-normal">Stake</th><th className="px-4 py-2 text-right font-normal">Risk</th></tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: s.config.maxMartingaleLevels + 1 }).map((_, i) => {
                      const stake = s.config.baseStake * Math.pow(s.config.martingaleMultiplier, i);
                      const cum = totalExposure(s.config.baseStake, s.config.martingaleMultiplier, i);
                      return (
                        <tr key={i} className={`border-t border-border/20 ${i === s.currentLevel && s.status === "running" ? "bg-primary/5 text-primary" : "text-muted-foreground"}`}>
                          <td className="px-4 py-2.5">L{i}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{stake.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-down/60">-{cum.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel className="!p-0 border-border/60 overflow-hidden">
              <div className="border-b border-border/60 bg-muted/30 px-4 py-2 flex items-center justify-between">
                <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Session_Log</h3>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">{s.trades.length}_Trades</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                {s.trades.length === 0 ? (
                  <div className="p-12 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">No_Active_Logs</div>
                ) : (
                  <table className="w-full text-[10px] font-mono uppercase tracking-widest">
                    <thead className="sticky top-0 bg-surface text-muted-foreground/60 border-b border-border/40">
                      <tr><th className="px-4 py-2 text-left font-normal">Dir</th><th className="px-4 py-2 text-right font-normal">Stake</th><th className="px-4 py-2 text-right font-normal">PnL</th></tr>
                    </thead>
                    <tbody>
                      {s.trades.map((t) => (
                        <tr key={t.id} className="border-t border-border/20 group hover:bg-muted/10">
                          <td className="px-4 py-2.5"><span className={t.direction === "up" ? "text-up" : "text-down"}>{t.direction === "up" ? "▲ UP" : "▼ DN"}</span></td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{t.stake.toFixed(2)}</td>
                          <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${t.pnl >= 0 ? "text-up" : "text-down"}`}>{t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <style>{`.select-base{width:100%;background:var(--input);border:1px solid var(--border);border-radius:4px;padding:.5rem .75rem;font-size:.75rem;color:var(--foreground);outline:none;appearance:none;cursor:pointer}.select-base:focus{border-color:var(--primary)}`}</style>
    </div>
  );
}

function ConnPill({ state }: { state: "idle" | "connecting" | "connected" | "error" }) {
  if (state === "connected") return <span className="flex items-center gap-1 rounded-full bg-up/15 px-2 py-0.5 font-mono uppercase tracking-widest text-up"><Wifi className="h-3 w-3" /> live</span>;
  if (state === "connecting") return <span className="flex items-center gap-1 rounded-full bg-warn/15 px-2 py-0.5 font-mono uppercase tracking-widest text-warn"><Loader2 className="h-3 w-3 animate-spin" /> connecting</span>;
  if (state === "error") return <span className="flex items-center gap-1 rounded-full bg-down/15 px-2 py-0.5 font-mono uppercase tracking-widest text-down"><WifiOff className="h-3 w-3" /> offline</span>;
  return <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono uppercase tracking-widest text-muted-foreground">idle</span>;
}

function MiniStat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: "up" | "down" | "primary" }) {
  const cls = accent === "up" ? "text-up" : accent === "down" ? "text-down" : accent === "primary" ? "text-primary" : "";
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-2.5">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-base tabular ${cls}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground tabular">{sub}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/**
 * Number input that lets the user type freely (including empty/partial like "0." or "")
 * and only commits a valid number on blur or Enter. No spinner placeholders that
 * fight the user's typing.
 */
function NumInput({
  value,
  onCommit,
  min,
  max,
  step = 1,
  integer = false,
}: {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
}) {
  const [text, setText] = useState<string>(String(value));
  const focusedRef = useRef(false);
  useEffect(() => { if (!focusedRef.current) setText(String(value)); }, [value]);
  function commit() {
    const raw = text.trim();
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") { setText(String(value)); return; }
    let n = Number(raw);
    if (!Number.isFinite(n)) { setText(String(value)); return; }
    if (integer) n = Math.round(n);
    if (min != null && n < min) n = min;
    if (max != null && n > max) n = max;
    setText(String(n));
    onCommit(n);
  }
  return (
    <input
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      value={text}
      onFocus={(e) => { focusedRef.current = true; e.currentTarget.select(); }}
      onChange={(e) => {
        const v = e.target.value;
        // allow empty + valid numeric fragments
        if (v === "" || /^-?\d*\.?\d*$/.test(v)) setText(v);
      }}
      onBlur={() => { focusedRef.current = false; commit(); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      step={step}
      className="select-base"
    />
  );
}
