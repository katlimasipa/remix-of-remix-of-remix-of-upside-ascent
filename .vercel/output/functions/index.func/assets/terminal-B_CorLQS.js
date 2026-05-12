import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRef, useEffect, useState, useCallback } from "react";
import { u as useSession } from "./store-BRE9lLtt.js";
import { P as PageHeader, a as Panel } from "./app-shell-e3Gf78kX.js";
import { createChart, AreaSeries, LineStyle } from "lightweight-charts";
import { n as nextStake, f as fmtMoney, S as STRATEGIES, t as totalExposure, e as evaluateSignal } from "./trading-BeWPgjAV.js";
import { D as DerivClient, a as DERIV_MARKETS } from "./deriv-BWHyOL7-.js";
import { AlertTriangle, TrendingUp, TrendingDown, Loader2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { u as useAuth, s as supabase } from "./router-BBK6EZ8W.js";
import { Link } from "@tanstack/react-router";
import "zustand";
import "zustand/middleware";
import "clsx";
import "tailwind-merge";
import "@tanstack/react-query";
import "@supabase/supabase-js";
function TickChart({
  ticks,
  className,
  height = 320,
  trend = "flat",
  markers
}) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const lineRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#94a3b8",
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: 11
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.06)" },
        horzLines: { color: "rgba(148,163,184,0.06)" }
      },
      rightPriceScale: { borderColor: "rgba(148,163,184,0.08)" },
      timeScale: { borderColor: "rgba(148,163,184,0.08)", timeVisible: true, secondsVisible: true, rightOffset: 6 },
      crosshair: { mode: 1 },
      handleScroll: true,
      handleScale: true
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#60a5fa",
      topColor: "rgba(96,165,250,0.35)",
      bottomColor: "rgba(96,165,250,0.0)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true
    });
    chartRef.current = chart;
    seriesRef.current = series;
    const ro = new ResizeObserver(() => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth });
    });
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    const color = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#60a5fa";
    series.applyOptions({
      lineColor: color,
      topColor: trend === "up" ? "rgba(34,197,94,0.35)" : trend === "down" ? "rgba(239,68,68,0.35)" : "rgba(96,165,250,0.35)",
      bottomColor: "rgba(0,0,0,0)"
    });
  }, [trend]);
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    const map = /* @__PURE__ */ new Map();
    for (const t of ticks) map.set(t.epoch, t.quote);
    const sorted = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    series.setData(sorted.map(([epoch, quote]) => ({ time: epoch, value: quote })));
    const last = sorted[sorted.length - 1];
    if (last) {
      if (lineRef.current) series.removePriceLine(lineRef.current);
      lineRef.current = series.createPriceLine({
        price: last[1],
        color: trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#60a5fa",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "spot"
      });
    }
  }, [ticks, trend]);
  return /* @__PURE__ */ jsx("div", { ref, className, style: { height } });
}
function Terminal() {
  const s = useSession();
  const {
    user
  } = useAuth();
  const sessionDbId = useRef(null);
  const clientRef = useRef(null);
  const tradingRef = useRef(false);
  const [tab, setTab] = useState("chart");
  const [token, setToken] = useState(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [ticks, setTicks] = useState([]);
  const [trend, setTrend] = useState("flat");
  const [lastQuote, setLastQuote] = useState(null);
  const [connState, setConnState] = useState("idle");
  const [error, setError] = useState(null);
  const [signalReason, setSignalReason] = useState("idle");
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("deriv_api_token, deriv_account_id, deriv_currency").eq("id", user.id).maybeSingle().then(({
      data
    }) => {
      setToken(data?.deriv_api_token ?? null);
      if (data?.deriv_account_id) useSession.setState({
        derivAccountId: data.deriv_account_id,
        derivCurrency: data.deriv_currency || "USD"
      });
      setTokenChecked(true);
    });
  }, [user]);
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const c = new DerivClient();
    clientRef.current = c;
    c.onClose = () => setConnState("error");
    c.onBalance = ({
      balance,
      currency
    }) => useSession.setState({
      derivLiveBalance: balance,
      derivCurrency: currency
    });
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
          derivConnected: true,
          derivAuthorized: true,
          derivAccountId: auth.loginid,
          derivCurrency: auth.currency,
          derivLiveBalance: Number(auth.balance)
        });
        setConnState("connected");
      } catch (e) {
        setError(e?.message ?? "Connection failed");
        setConnState("error");
      }
    })();
    return () => {
      cancelled = true;
      c.close();
      clientRef.current = null;
      useSession.setState({
        derivConnected: false,
        derivAuthorized: false
      });
    };
  }, [token]);
  useEffect(() => {
    const durationTicks = Math.max(2, Math.min(5, Math.round(s.config.durationTicks)));
    if (durationTicks !== s.config.durationTicks) s.setConfig({
      durationTicks
    });
  }, [s.config.durationTicks, s.setConfig]);
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
          useSession.setState({
            price: t.quote
          });
          setTicks((prev) => {
            const next = prev.length && prev[prev.length - 1].epoch === t.epoch ? prev.slice(0, -1).concat({
              epoch: t.epoch,
              quote: t.quote
            }) : prev.concat({
              epoch: t.epoch,
              quote: t.quote
            });
            return next.slice(-300);
          });
        });
      } catch (e) {
        toast.error(e?.message ?? "Stream error");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [s.config.market, connState]);
  async function start() {
    if (connState !== "connected") return toast.error("Connect your Deriv token in Settings first.");
    s.startSession(s.derivLiveBalance ?? s.startingBalance ?? 1e3);
    if (user) {
      const {
        data,
        error: dbErr
      } = await supabase.from("trading_sessions").insert({
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
        starting_balance: s.derivLiveBalance ?? 1e3,
        settings: s.config
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
        ended_at: (/* @__PURE__ */ new Date()).toISOString(),
        ending_balance: useSession.getState().balance,
        total_trades: useSession.getState().trades.length,
        wins: useSession.getState().wins,
        losses: useSession.getState().losses,
        pnl: useSession.getState().pnl
      }).eq("id", sessionDbId.current);
      sessionDbId.current = null;
    }
    toast.success("Session saved.");
  }, [s, user]);
  const placeTrade = useCallback(async (direction) => {
    const cur = useSession.getState();
    if (cur.status !== "running") return;
    if (!clientRef.current) return toast.error("Not connected.");
    if (tradingRef.current) return;
    if (cur.config.maxTrades && cur.trades.length >= cur.config.maxTrades) {
      toast.warning("Max trades reached.");
      endSession();
      return;
    }
    if (cur.config.takeProfit && cur.pnl >= cur.config.takeProfit) {
      toast.success("Take-profit hit.");
      endSession();
      return;
    }
    if (cur.config.stopLoss && cur.pnl <= -cur.config.stopLoss) {
      toast.error("Stop-loss hit.");
      endSession();
      return;
    }
    tradingRef.current = true;
    const stake = Number(cur.nextStake.toFixed(2));
    const entry = cur.price;
    try {
      const {
        buy
      } = await clientRef.current.buyOnlyUpsDowns({
        symbol: cur.config.market,
        direction,
        stake,
        ticks: cur.config.durationTicks,
        currency: cur.derivCurrency
      });
      const final = await clientRef.current.watchContract(buy.contract_id);
      const result = final.status === "won" ? "win" : "loss";
      const profit = Number(final.profit ?? (result === "win" ? buy.payout - stake : -stake));
      const exitPrice = Number(final.exit_tick ?? cur.price);
      s.recordTrade({
        direction,
        stake,
        pnl: profit,
        result,
        entry,
        exit: exitPrice,
        level: cur.currentLevel
      });
      const ms = nextStake({
        baseStake: cur.config.baseStake,
        multiplier: cur.config.martingaleMultiplier,
        lastResult: result,
        currentLevel: cur.currentLevel,
        maxLevels: cur.config.maxMartingaleLevels,
        resetOnWin: cur.config.resetOnWin
      });
      s.setNextStake(cur.config.martingaleEnabled ? ms.stake : cur.config.baseStake, cur.config.martingaleEnabled ? ms.level : 0);
      if (sessionDbId.current && user) {
        supabase.from("trades").insert({
          session_id: sessionDbId.current,
          user_id: user.id,
          direction,
          stake,
          pnl: profit,
          payout: Number(final.payout ?? buy.payout ?? 0),
          result,
          martingale_level: cur.currentLevel,
          entry_price: entry,
          exit_price: exitPrice,
          duration_ticks: cur.config.durationTicks
        }).then(() => {
        });
      }
      if (result === "win") toast.success(`WIN +${fmtMoney(profit, cur.derivCurrency + " ")}`);
      else toast.error(`LOSS ${fmtMoney(profit, cur.derivCurrency + " ")}`);
    } catch (e) {
      toast.error(e?.message ?? "Trade failed");
    } finally {
      tradingRef.current = false;
    }
  }, [endSession, s, user]);
  const ticksRef = useRef([]);
  useEffect(() => {
    ticksRef.current = ticks;
  }, [ticks]);
  useEffect(() => {
    if (!s.config.autoTrade || s.status !== "running") return;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled) {
        const cur = useSession.getState();
        if (cur.status !== "running" || !cur.config.autoTrade) break;
        if (tradingRef.current) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        const dir = STRATEGIES.find((x) => x.id === cur.config.strategy).direction;
        const waitStart = Date.now();
        let fired = false;
        while (!cancelled) {
          const st = useSession.getState();
          if (st.status !== "running" || !st.config.autoTrade) return;
          const quotes = ticksRef.current.map((t) => t.quote);
          const sig = evaluateSignal(quotes, {
            mode: cur.config.entryMode,
            streakTicks: cur.config.streakTicks,
            direction: dir
          });
          setSignalReason(sig.reason);
          if (sig.fire) {
            fired = true;
            break;
          }
          if (Date.now() - waitStart > 3e4) {
            setSignalReason("timeout — firing");
            fired = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
        if (cancelled || !fired) return;
        setSignalReason(`entering ${dir.toUpperCase()}`);
        try {
          await placeTrade(dir);
        } catch (e) {
          toast.error(e?.message ?? "Trade error");
          setSignalReason("error — retrying");
        }
        const cool = Math.max(500, useSession.getState().config.cooldownSeconds * 1e3);
        await new Promise((r) => setTimeout(r, cool));
      }
    };
    loop();
    return () => {
      cancelled = true;
      setSignalReason("idle");
    };
  }, [s.config.autoTrade, s.status, placeTrade]);
  STRATEGIES.find((x) => x.id === s.config.strategy);
  const market = DERIV_MARKETS.find((m) => m.symbol === s.config.market) ?? DERIV_MARKETS[2];
  const winRate = s.trades.length ? (s.wins / s.trades.length * 100).toFixed(1) : "0.0";
  const pnlPct = s.startingBalance ? s.pnl / s.startingBalance * 100 : 0;
  if (tokenChecked && !token) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(PageHeader, { title: "Terminal" }),
      /* @__PURE__ */ jsxs(Panel, { className: "text-center", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "mx-auto h-8 w-8 text-warn" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 font-display text-xl font-semibold", children: "Connect your Deriv account" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Add your Deriv DEMO API token to start trading." }),
        /* @__PURE__ */ jsx(Link, { to: "/settings", className: "mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground", children: "Go to Settings" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border border-border/60 bg-surface/40 px-3 py-1.5 rounded-lg overflow-hidden backdrop-blur-sm", children: [
      /* @__PURE__ */ jsx(ConnPill, { state: connState }),
      /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-border/40" }),
      /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: market.name }),
      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60", children: "Balance" }),
          /* @__PURE__ */ jsxs("span", { className: "font-display font-bold tabular-nums text-foreground", children: [
            s.derivLiveBalance != null ? `${s.derivLiveBalance.toFixed(2)}` : "0.00",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-normal text-muted-foreground", children: s.derivCurrency })
          ] })
        ] }),
        s.derivAccountId && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-sm border border-up/30 bg-up/5 px-2 py-0.5", children: [
          /* @__PURE__ */ jsx("div", { className: "h-1 w-1 rounded-full bg-up shadow-[0_0_5px_rgba(var(--up),0.5)]" }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-[9px] font-bold uppercase tracking-widest text-up", children: s.derivAccountId })
        ] })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-down flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3.5 w-3.5" }),
      " ",
      error
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-12 lg:items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-4 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsx(MiniStat, { label: "Spot_Price", value: lastQuote != null ? lastQuote.toFixed(4) : "—", sub: trend === "up" ? "▲ ASCENDING" : trend === "down" ? "▼ DESCENDING" : "— STABLE" }),
          /* @__PURE__ */ jsx(MiniStat, { label: "Net_PnL", value: fmtMoney(s.pnl, ""), accent: s.pnl >= 0 ? "up" : "down", sub: `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}% ROI` }),
          /* @__PURE__ */ jsx(MiniStat, { label: "Win_Rate", value: `${winRate}%`, sub: `${s.wins}W / ${s.losses}L` }),
          /* @__PURE__ */ jsx(MiniStat, { label: "Next_Stake", value: s.nextStake.toFixed(2), sub: `Level_L${s.currentLevel}`, accent: "primary" })
        ] }),
        /* @__PURE__ */ jsxs(Panel, { className: "border-border/60", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground", children: "Execution_Engine" }),
            s.status === "running" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-up animate-pulse" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-[9px] uppercase tracking-widest text-up", children: "Engine_Live" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxs("button", { disabled: connState !== "connected", onClick: async () => {
              s.setConfig({
                strategy: "only_ups",
                autoTrade: true
              });
              if (useSession.getState().status !== "running") await start();
            }, className: `btn-mono flex flex-col items-center justify-center gap-1 py-6 border transition-all ${s.config.autoTrade && s.config.strategy === "only_ups" && s.status === "running" ? "bg-up text-up-foreground border-up shadow-[0_0_20px_rgba(var(--up),0.2)]" : "bg-muted/30 border-border/60 hover:border-up/50 text-muted-foreground hover:text-up"}`, children: [
              /* @__PURE__ */ jsx(TrendingUp, { className: "h-5 w-5 mb-1" }),
              /* @__PURE__ */ jsx("span", { children: "Only_Ups" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] opacity-60", children: "Engine_01" })
            ] }),
            /* @__PURE__ */ jsxs("button", { disabled: connState !== "connected", onClick: async () => {
              s.setConfig({
                strategy: "only_downs",
                autoTrade: true
              });
              if (useSession.getState().status !== "running") await start();
            }, className: `btn-mono flex flex-col items-center justify-center gap-1 py-6 border transition-all ${s.config.autoTrade && s.config.strategy === "only_downs" && s.status === "running" ? "bg-down text-down-foreground border-down shadow-[0_0_20px_rgba(var(--down),0.2)]" : "bg-muted/30 border-border/60 hover:border-down/50 text-muted-foreground hover:text-down"}`, children: [
              /* @__PURE__ */ jsx(TrendingDown, { className: "h-5 w-5 mb-1" }),
              /* @__PURE__ */ jsx("span", { children: "Only_Downs" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] opacity-60", children: "Engine_02" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: s.status !== "running" ? /* @__PURE__ */ jsx("button", { onClick: start, disabled: connState !== "connected", className: "btn-mono w-full bg-primary text-primary-foreground hover:brightness-110 py-3", children: "Initialize_Session" }) : /* @__PURE__ */ jsx("button", { onClick: endSession, className: "btn-mono w-full border border-down bg-down/10 text-down hover:bg-down/20 py-3", children: "Kill_Engine" }) }),
          s.config.autoTrade && s.status === "running" && /* @__PURE__ */ jsx("div", { className: "mt-4 border-t border-border/40 pt-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "font-mono text-[9px] uppercase tracking-widest text-muted-foreground", children: "Signal_Status" }),
            /* @__PURE__ */ jsx("span", { className: "rounded bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-primary", children: signalReason })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(Panel, { className: "border-border/60", children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-4 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground", children: "Kernel_Parameters" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsx(Field, { label: "Base_Stake", children: /* @__PURE__ */ jsx(NumInput, { value: s.config.baseStake, onCommit: (n) => s.setConfig({
                baseStake: n
              }), min: 0.01, step: 0.1 }) }),
              /* @__PURE__ */ jsx(Field, { label: "Tick_Duration", children: /* @__PURE__ */ jsx(NumInput, { value: s.config.durationTicks, onCommit: (n) => s.setConfig({
                durationTicks: Math.max(2, Math.min(5, Math.round(n)))
              }), min: 2, max: 5, step: 1, integer: true }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between rounded border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:border-primary/40 group cursor-pointer", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground", children: "Martingale_Module" }),
                /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.config.martingaleEnabled, onChange: (e) => s.setConfig({
                  martingaleEnabled: e.target.checked
                }), className: "h-3.5 w-3.5 accent-primary" })
              ] }),
              s.config.martingaleEnabled && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 rounded border border-border/40 bg-muted/10 p-3 animate-in fade-in slide-in-from-top-2", children: [
                /* @__PURE__ */ jsx(Field, { label: "Multiplier", children: /* @__PURE__ */ jsx(NumInput, { value: s.config.martingaleMultiplier, onCommit: (n) => s.setConfig({
                  martingaleMultiplier: Math.max(1.1, n)
                }), min: 1.1, step: 0.1 }) }),
                /* @__PURE__ */ jsx(Field, { label: "Max_Steps", children: /* @__PURE__ */ jsx(NumInput, { value: s.config.maxMartingaleLevels, onCommit: (n) => s.setConfig({
                  maxMartingaleLevels: Math.max(1, Math.min(15, Math.round(n)))
                }), min: 1, max: 15, step: 1, integer: true }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between rounded border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:border-primary/40 group cursor-pointer", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground", children: "Auto_Fire_Control" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-mono text-[8px] uppercase tracking-widest text-muted-foreground/40", children: [
                    s.config.cooldownSeconds,
                    "s Cooldown"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.config.autoTrade, onChange: (e) => s.setConfig({
                  autoTrade: e.target.checked
                }), className: "h-3.5 w-3.5 accent-primary" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded border border-border/40 bg-muted/10 p-3 space-y-3", children: [
                /* @__PURE__ */ jsx(Field, { label: "Entry_Logic", children: /* @__PURE__ */ jsxs("select", { value: s.config.entryMode, onChange: (e) => s.setConfig({
                  entryMode: e.target.value
                }), className: "select-base font-mono text-[10px] uppercase tracking-widest", children: [
                  /* @__PURE__ */ jsx("option", { value: "always", children: "Continuous_Fire" }),
                  /* @__PURE__ */ jsx("option", { value: "streak", children: "Momentum_Streak" }),
                  /* @__PURE__ */ jsx("option", { value: "reversal", children: "Mean_Reversion" })
                ] }) }),
                /* @__PURE__ */ jsx(Field, { label: "Streak_Threshold", children: /* @__PURE__ */ jsx("input", { type: "number", min: 2, max: 10, value: s.config.streakTicks, onChange: (e) => s.setConfig({
                  streakTicks: Math.max(2, Math.min(10, +e.target.value))
                }), className: "select-base font-mono text-[10px]", disabled: s.config.entryMode === "always" }) })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-8 space-y-4", children: [
        /* @__PURE__ */ jsxs(Panel, { className: "!p-0 border-border/60 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground", children: "Telemetry_Feed" }),
              /* @__PURE__ */ jsx("select", { value: s.config.market, onChange: (e) => s.setConfig({
                market: e.target.value
              }), className: "bg-transparent border-none font-mono text-[10px] uppercase tracking-widest text-primary focus:ring-0 cursor-pointer", children: DERIV_MARKETS.map((m) => /* @__PURE__ */ jsx("option", { value: m.symbol, children: m.name }, m.symbol)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: `font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded ${trend === "up" ? "bg-up/10 text-up" : trend === "down" ? "bg-down/10 text-down" : "bg-muted text-muted-foreground"}`, children: trend === "up" ? "▲ Tick_Up" : trend === "down" ? "▼ Tick_Dn" : "— Stable" }),
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60", children: [
                ticks.length,
                "_DATA_POINTS"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4", children: ticks.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "grid h-[320px] place-items-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin mb-2 opacity-20" }),
            "Connecting_to_Data_Kernel..."
          ] }) : /* @__PURE__ */ jsx(TickChart, { ticks, trend, height: 340 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs(Panel, { className: "!p-0 border-border/60 overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "border-b border-border/60 bg-muted/30 px-4 py-2", children: /* @__PURE__ */ jsx("h3", { className: "font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground", children: "Recovery_Ladder" }) }),
            /* @__PURE__ */ jsx("div", { className: "max-h-[300px] overflow-y-auto no-scrollbar", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-[10px] font-mono uppercase tracking-widest", children: [
              /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-surface text-muted-foreground/60 border-b border-border/40", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-left font-normal", children: "Step" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right font-normal", children: "Stake" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right font-normal", children: "Risk" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: Array.from({
                length: s.config.maxMartingaleLevels + 1
              }).map((_, i) => {
                const stake = s.config.baseStake * Math.pow(s.config.martingaleMultiplier, i);
                const cum = totalExposure(s.config.baseStake, s.config.martingaleMultiplier, i);
                return /* @__PURE__ */ jsxs("tr", { className: `border-t border-border/20 ${i === s.currentLevel && s.status === "running" ? "bg-primary/5 text-primary" : "text-muted-foreground"}`, children: [
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-2.5", children: [
                    "L",
                    i
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-right tabular-nums", children: stake.toFixed(2) }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-2.5 text-right tabular-nums text-down/60", children: [
                    "-",
                    cum.toFixed(2)
                  ] })
                ] }, i);
              }) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Panel, { className: "!p-0 border-border/60 overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "border-b border-border/60 bg-muted/30 px-4 py-2 flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground", children: "Session_Log" }),
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60", children: [
                s.trades.length,
                "_Trades"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "max-h-[300px] overflow-y-auto no-scrollbar", children: s.trades.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40", children: "No_Active_Logs" }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-[10px] font-mono uppercase tracking-widest", children: [
              /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-surface text-muted-foreground/60 border-b border-border/40", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-left font-normal", children: "Dir" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right font-normal", children: "Stake" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right font-normal", children: "PnL" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: s.trades.map((t) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border/20 group hover:bg-muted/10", children: [
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5", children: /* @__PURE__ */ jsx("span", { className: t.direction === "up" ? "text-up" : "text-down", children: t.direction === "up" ? "▲ UP" : "▼ DN" }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-right tabular-nums text-muted-foreground", children: t.stake.toFixed(2) }),
                /* @__PURE__ */ jsxs("td", { className: `px-4 py-2.5 text-right tabular-nums font-bold ${t.pnl >= 0 ? "text-up" : "text-down"}`, children: [
                  t.pnl >= 0 ? "+" : "",
                  t.pnl.toFixed(2)
                ] })
              ] }, t.id)) })
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `.select-base{width:100%;background:var(--input);border:1px solid var(--border);border-radius:4px;padding:.5rem .75rem;font-size:.75rem;color:var(--foreground);outline:none;appearance:none;cursor:pointer}.select-base:focus{border-color:var(--primary)}` })
  ] });
}
function ConnPill({
  state
}) {
  if (state === "connected") return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 rounded-full bg-up/15 px-2 py-0.5 font-mono uppercase tracking-widest text-up", children: [
    /* @__PURE__ */ jsx(Wifi, { className: "h-3 w-3" }),
    " live"
  ] });
  if (state === "connecting") return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 rounded-full bg-warn/15 px-2 py-0.5 font-mono uppercase tracking-widest text-warn", children: [
    /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }),
    " connecting"
  ] });
  if (state === "error") return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 rounded-full bg-down/15 px-2 py-0.5 font-mono uppercase tracking-widest text-down", children: [
    /* @__PURE__ */ jsx(WifiOff, { className: "h-3 w-3" }),
    " offline"
  ] });
  return /* @__PURE__ */ jsx("span", { className: "flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono uppercase tracking-widest text-muted-foreground", children: "idle" });
}
function MiniStat({
  label,
  value,
  sub,
  accent
}) {
  const cls = accent === "up" ? "text-up" : accent === "down" ? "text-down" : accent === "primary" ? "text-primary" : "";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-surface/40 p-2.5", children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-[9px] uppercase tracking-widest text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `mt-0.5 font-display text-base tabular ${cls}`, children: value }),
    sub && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground tabular", children: sub })
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground", children: label }),
    children
  ] });
}
function NumInput({
  value,
  onCommit,
  min,
  max,
  step = 1,
  integer = false
}) {
  const [text, setText] = useState(String(value));
  const focusedRef = useRef(false);
  useEffect(() => {
    if (!focusedRef.current) setText(String(value));
  }, [value]);
  function commit() {
    const raw = text.trim();
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
      setText(String(value));
      return;
    }
    let n = Number(raw);
    if (!Number.isFinite(n)) {
      setText(String(value));
      return;
    }
    if (integer) n = Math.round(n);
    if (min != null && n < min) n = min;
    if (max != null && n > max) n = max;
    setText(String(n));
    onCommit(n);
  }
  return /* @__PURE__ */ jsx("input", { type: "text", inputMode: integer ? "numeric" : "decimal", value: text, onFocus: (e) => {
    focusedRef.current = true;
    e.currentTarget.select();
  }, onChange: (e) => {
    const v = e.target.value;
    if (v === "" || /^-?\d*\.?\d*$/.test(v)) setText(v);
  }, onBlur: () => {
    focusedRef.current = false;
    commit();
  }, onKeyDown: (e) => {
    if (e.key === "Enter") e.target.blur();
  }, step, className: "select-base" });
}
export {
  Terminal as component
};
