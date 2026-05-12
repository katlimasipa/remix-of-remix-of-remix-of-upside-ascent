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
        const dir = STRATEGIES.find(x => x.id === cur.config.strategy)!.direction;
        // Wait for signal
        // Poll the latest tick window every 250ms until signal fires
        // (cheap, since ticks update via state)
        // Safety cap: 60s wait per entry then fall through anyway
        const waitStart = Date.now();
        while (!cancelled) {
          const quotes = ticksRef.current.map((t) => t.quote);
          const sig = evaluateSignal(quotes, {
            mode: cur.config.entryMode,
            streakTicks: cur.config.streakTicks,
            direction: dir,
          });
          setSignalReason(sig.reason);
          if (sig.fire) break;
          if (Date.now() - waitStart > 60000) { setSignalReason("timeout — firing"); break; }
          await new Promise((r) => setTimeout(r, 250));
          if (useSession.getState().status !== "running" || !useSession.getState().config.autoTrade) return;
        }
        if (cancelled) return;
        setSignalReason(`entering ${dir.toUpperCase()}`);
        await placeTrade(dir);
        await new Promise(r => setTimeout(r, Math.max(500, cur.config.cooldownSeconds * 1000)));
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
    <>
      {/* Top status strip */}
      <div className="-mx-4 mb-3 flex items-center gap-2 overflow-x-auto border-b border-border bg-surface/40 px-4 py-2 text-[11px] no-scrollbar md:mx-0 md:rounded-xl md:border">
        <ConnPill state={connState} />
        <span className="font-mono uppercase tracking-widest text-muted-foreground">{market.name}</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="font-mono text-muted-foreground">Bal</span>
          <span className="font-display tabular text-foreground">{s.derivLiveBalance != null ? `${s.derivLiveBalance.toFixed(2)} ${s.derivCurrency}` : "—"}</span>
          {s.derivAccountId && <span className="rounded-full bg-up/15 px-2 py-0.5 font-mono uppercase text-up">{s.derivAccountId}</span>}
        </span>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-xs text-down">{error}</div>
      )}

      {/* Tabs */}
      <div className="mb-3 flex gap-1 rounded-xl bg-surface/40 p-1 text-xs font-medium">
        {(["chart", "trade", "ladder", "log"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-lg px-3 py-2 uppercase tracking-widest transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <MiniStat label="Spot" value={lastQuote != null ? lastQuote.toFixed(4) : "—"} />
        <MiniStat label="P&L" value={fmtMoney(s.pnl, s.derivCurrency + " ")} accent={s.pnl >= 0 ? "up" : "down"} sub={`${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`} />
        <MiniStat label="Win rate" value={`${winRate}%`} sub={`${s.wins}W / ${s.losses}L`} />
        <MiniStat label="Next stake" value={fmtMoney(s.nextStake, s.derivCurrency + " ")} sub={`L${s.currentLevel}`} accent="primary" />
      </div>

      {tab === "chart" && (
        <Panel className="!p-3">
          <div className="mb-2 flex items-center gap-2">
            <select value={s.config.market} onChange={(e) => s.setConfig({ market: e.target.value })} className="select-base !w-auto">
              {DERIV_MARKETS.map((m) => <option key={m.symbol} value={m.symbol}>{m.name}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className={`rounded-md px-2 py-1 ${trend === "up" ? "bg-up/15 text-up" : trend === "down" ? "bg-down/15 text-down" : "bg-surface"}`}>
                {trend === "up" ? "▲ tick up" : trend === "down" ? "▼ tick dn" : "— flat"}
              </span>
              <span>{ticks.length} ticks</span>
            </div>
          </div>
          {ticks.length === 0 ? (
            <div className="grid h-[320px] place-items-center text-xs text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Streaming ticks…</div>
          ) : (
            <TickChart ticks={ticks} trend={trend} height={340} />
          )}
        </Panel>
      )}

      {tab === "trade" && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={tradingRef.current || s.status !== "running"}
                onClick={() => { s.setConfig({ strategy: "only_ups", autoTrade: true }); placeTrade("up"); }}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-up py-7 text-up-foreground active:scale-[0.98] disabled:opacity-50"
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-base font-bold">ONLY UPS</span>
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">{s.config.durationTicks}t · all rising</span>
              </button>
              <button
                disabled={tradingRef.current || s.status !== "running"}
                onClick={() => { s.setConfig({ strategy: "only_downs", autoTrade: true }); placeTrade("down"); }}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-down py-7 text-down-foreground active:scale-[0.98] disabled:opacity-50"
              >
                <TrendingDown className="h-6 w-6" />
                <span className="text-base font-bold">ONLY DOWNS</span>
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">{s.config.durationTicks}t · all falling</span>
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">{strategy.hint}</p>
            <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-primary/80">Bot keeps entering until take-profit / stop-loss is hit</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {s.status !== "running" ? (
                <button onClick={start} className="col-span-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                  <Play className="-mt-0.5 mr-1 inline h-4 w-4" /> Start session
                </button>
              ) : (
                <button onClick={endSession} className="col-span-2 rounded-full bg-down px-4 py-3 text-sm font-semibold text-down-foreground">
                  <Square className="-mt-0.5 mr-1 inline h-4 w-4" /> End session
                </button>
              )}
            </div>
          </Panel>

          <Panel>
            <h3 className="font-display text-base font-semibold">Trade controls</h3>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Stake">
                  <NumInput value={s.config.baseStake} onCommit={(n) => s.setConfig({ baseStake: n })} min={0.01} step={0.1} />
                </Field>
                <Field label="Ticks">
                  <NumInput value={s.config.durationTicks} onCommit={(n) => s.setConfig({ durationTicks: Math.max(5, Math.min(10, Math.round(n))) })} min={5} max={10} step={1} integer />
                </Field>
              </div>
              <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Martingale</span></div>
                <input type="checkbox" checked={s.config.martingaleEnabled} onChange={(e) => s.setConfig({ martingaleEnabled: e.target.checked })} className="h-4 w-4 accent-primary" />
              </label>
              {s.config.martingaleEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Multiplier">
                    <NumInput value={s.config.martingaleMultiplier} onCommit={(n) => s.setConfig({ martingaleMultiplier: Math.max(1.1, n) })} min={1.1} step={0.1} />
                  </Field>
                  <Field label="Max levels">
                    <NumInput value={s.config.maxMartingaleLevels} onCommit={(n) => s.setConfig({ maxMartingaleLevels: Math.max(1, Math.min(15, Math.round(n))) })} min={1} max={15} step={1} integer />
                  </Field>
                </div>
              )}
              <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                <div><span className="text-sm font-medium">Auto-trade</span><div className="text-[10px] text-muted-foreground">{s.config.cooldownSeconds}s between trades</div></div>
                <input type="checkbox" checked={s.config.autoTrade} onChange={(e) => s.setConfig({ autoTrade: e.target.checked })} className="h-4 w-4 accent-primary" />
              </label>
              <div className="rounded-xl border border-border bg-surface/40 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Bot signal</span>
                  {s.config.autoTrade && s.status === "running" && (
                    <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-primary">{signalReason}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Entry mode">
                    <select value={s.config.entryMode} onChange={(e) => s.setConfig({ entryMode: e.target.value as any })} className="select-base">
                      <option value="always">Always (fire ASAP)</option>
                      <option value="streak">Momentum streak</option>
                      <option value="reversal">Reversal after opposite streak</option>
                    </select>
                  </Field>
                  <Field label="Streak ticks">
                    <input type="number" min={2} max={10} value={s.config.streakTicks} onChange={(e) => s.setConfig({ streakTicks: Math.max(2, Math.min(10, +e.target.value)) })} className="select-base" disabled={s.config.entryMode === "always"} />
                  </Field>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Bot trades <span className="font-mono uppercase">{strategy.label}</span>. {s.config.entryMode === "streak" && `Waits for ${s.config.streakTicks} ticks moving ${strategy.direction === "up" ? "up" : "down"} before entering.`} {s.config.entryMode === "reversal" && `Waits for ${s.config.streakTicks} ticks moving ${strategy.direction === "up" ? "down" : "up"} (mean-reversion entry).`} {s.config.entryMode === "always" && "Fires whenever cooldown elapses."}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === "ladder" && (
        <Panel>
          <h3 className="font-display text-base font-semibold">Martingale ladder</h3>
          <p className="mt-1 text-xs text-muted-foreground">Stake at each loss-recovery step from your base.</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-xs tabular">
              <thead className="bg-surface/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Lvl</th><th className="px-3 py-2 text-left">Stake</th><th className="px-3 py-2 text-left">Cum. risk</th><th className="px-3 py-2 text-left">Recovery if win</th></tr>
              </thead>
              <tbody>
                {Array.from({ length: s.config.maxMartingaleLevels + 1 }).map((_, i) => {
                  const stake = s.config.baseStake * Math.pow(s.config.martingaleMultiplier, i);
                  const cum = totalExposure(s.config.baseStake, s.config.martingaleMultiplier, i);
                  return (
                    <tr key={i} className={`border-t border-border ${i === s.currentLevel && s.status === "running" ? "bg-primary/10" : ""}`}>
                      <td className="px-3 py-2 font-mono">L{i}</td>
                      <td className="px-3 py-2">{fmtMoney(stake, s.derivCurrency + " ")}</td>
                      <td className="px-3 py-2 text-down">-{fmtMoney(cum, s.derivCurrency + " ").replace("-", "")}</td>
                      <td className="px-3 py-2 text-up">net ≈ {fmtMoney(stake * 0.85 - (cum - stake), s.derivCurrency + " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            <StatCard label="Current level" value={`L${s.currentLevel}`} accent="primary" />
            <StatCard label="Total exposure" value={fmtMoney(totalExposure(s.config.baseStake, s.config.martingaleMultiplier, s.config.maxMartingaleLevels), s.derivCurrency + " ")} accent="down" />
            <StatCard label="Streak" value={`${s.consecutiveLosses}L / ${s.consecutiveWins}W`} />
          </div>
        </Panel>
      )}

      {tab === "log" && (
        <Panel className="!p-0">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-display text-base font-semibold">Trade log</h3>
            <p className="text-[11px] text-muted-foreground">Newest first · session only</p>
          </div>
          <div className="max-h-[60svh] overflow-y-auto">
            {s.trades.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">No trades yet.</div>
            ) : (
              <table className="w-full text-xs tabular">
                <thead className="sticky top-0 bg-surface/95 text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
                  <tr><th className="px-3 py-2 text-left">Time</th><th className="px-3 py-2 text-left">Dir</th><th className="px-3 py-2 text-right">Stake</th><th className="px-3 py-2 text-right">Lvl</th><th className="px-3 py-2 text-right">P&L</th></tr>
                </thead>
                <tbody>
                  {s.trades.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">{new Date(t.ts).toLocaleTimeString()}</td>
                      <td className="px-3 py-2"><span className={t.direction === "up" ? "text-up" : "text-down"}>{t.direction === "up" ? "▲ UP" : "▼ DN"}</span></td>
                      <td className="px-3 py-2 text-right">{t.stake.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono">L{t.level}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${t.pnl >= 0 ? "text-up" : "text-down"}`}>{t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      )}

      <style>{`.select-base{width:100%;background:var(--input);border:1px solid var(--border);border-radius:.65rem;padding:.55rem .7rem;font-size:.85rem;color:var(--foreground);outline:none}.select-base:focus{border-color:var(--primary)}`}</style>
    </>
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
