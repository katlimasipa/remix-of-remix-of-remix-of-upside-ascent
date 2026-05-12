import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { u as useSession } from "./store-BRE9lLtt.js";
import { P as PageHeader, S as StatCard, a as Panel } from "./app-shell-e3Gf78kX.js";
import { f as fmtMoney } from "./trading-BeWPgjAV.js";
import { a as DERIV_MARKETS } from "./deriv-BWHyOL7-.js";
import { ArrowUpRight, Timer, Activity, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import "zustand";
import "zustand/middleware";
import "./router-BBK6EZ8W.js";
import "@tanstack/react-query";
import "sonner";
import "@supabase/supabase-js";
import "clsx";
import "tailwind-merge";
function Dashboard() {
  const s = useSession();
  const market = DERIV_MARKETS.find((m) => m.symbol === s.config.market);
  const winRate = s.trades.length ? s.wins / s.trades.length * 100 : 0;
  const roi = s.startingBalance ? s.pnl / s.startingBalance * 100 : 0;
  const elapsed = useMemo(() => {
    if (!s.startedAt) return "—";
    const ms = (s.endedAt ?? Date.now()) - s.startedAt;
    const m = Math.floor(ms / 6e4);
    const sec = Math.floor(ms % 6e4 / 1e3);
    return `${m}m ${sec}s`;
  }, [s.startedAt, s.endedAt, s.trades.length]);
  const recent = s.trades.slice(0, 6);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Command_Center", subtitle: `${market?.name ?? "NULL_MARKET"} // ${s.config.strategy.toUpperCase()}_ENGINE`, action: /* @__PURE__ */ jsxs(Link, { to: "/terminal", className: "hidden items-center gap-2 rounded bg-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110 active:scale-95 md:inline-flex", children: [
      "Engage_Terminal ",
      /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-3 w-3" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Live_Balance", value: fmtMoney(s.balance, ""), delta: `Start_Ref: ${fmtMoney(s.startingBalance, "")}` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Net_Session_PnL", value: fmtMoney(s.pnl, ""), accent: s.pnl >= 0 ? "up" : "down", delta: `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}% ROI` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Win_Probability", value: `${winRate.toFixed(1)}%`, delta: `${s.wins}W // ${s.losses}L` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Execution_Count", value: s.trades.length, delta: `Quota: ${s.config.maxTrades ?? "Unlimited"}` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Max_Win_Streak", value: s.consecutiveWins, accent: "up" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Max_Loss_Streak", value: s.consecutiveLosses, accent: "down" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Martingale_Step", value: `L${s.currentLevel}`, delta: `Ceiling: L${s.config.maxMartingaleLevels}`, accent: "primary" })
    ] }),
    /* @__PURE__ */ jsx(Panel, { className: "border-border/60 bg-surface/40 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground", children: "System_Runtime_State" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: `h-2.5 w-2.5 rounded-full ${s.status === "running" ? "bg-up shadow-[0_0_10px_rgba(var(--up),0.5)]" : s.status === "paused" ? "bg-warn" : "bg-muted-foreground/40"}` }),
            s.status === "running" && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-up/40" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "font-display text-2xl font-black uppercase tracking-tighter", children: [
            s.status,
            "_"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground", children: "Session_Chronometer" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 font-display text-2xl font-black tabular-nums tracking-tighter", children: [
          /* @__PURE__ */ jsx(Timer, { className: "h-5 w-5 text-muted-foreground/60" }),
          elapsed.toUpperCase()
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-12", children: [
      /* @__PURE__ */ jsx("div", { className: "md:col-span-7", children: /* @__PURE__ */ jsxs(Panel, { className: "!p-0 border-border/60 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border/60 bg-muted/30 px-6 py-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground", children: "Recent_Executions" }),
          /* @__PURE__ */ jsx(Link, { to: "/history", className: "font-mono text-[9px] uppercase tracking-widest text-primary/60 hover:text-primary", children: "View_Archive_" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-2", children: recent.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: Activity, title: "NO_ACTIVE_TELEMETRY", body: "The execution engine is idle. Initiate a session in the terminal to begin data capture.", cta: {
          to: "/terminal",
          label: "Open_Terminal"
        } }) : /* @__PURE__ */ jsx("div", { className: "space-y-1", children: recent.map((t) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded border border-transparent p-3 hover:border-border/40 hover:bg-muted/10 transition-all group", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: `grid h-8 w-8 place-items-center rounded-sm font-mono text-[10px] font-bold ${t.direction === "up" ? "bg-up text-up-foreground" : "bg-down text-down-foreground"}`, children: t.direction === "up" ? "UP" : "DN" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "font-mono text-[11px] font-bold uppercase tracking-tight", children: [
                t.direction.toUpperCase(),
                " @ ",
                fmtMoney(t.stake, "")
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60", children: [
                "Step_L",
                t.level,
                " // ",
                t.result.toUpperCase()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: `font-display text-lg font-bold tabular-nums tracking-tighter ${t.pnl >= 0 ? "text-up" : "text-down"}`, children: [
            t.pnl >= 0 ? "+" : "",
            fmtMoney(t.pnl, "")
          ] })
        ] }, t.id)) }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "md:col-span-5", children: /* @__PURE__ */ jsxs(Panel, { className: "!p-0 border-border/60 overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "border-b border-border/60 bg-muted/30 px-6 py-3", children: /* @__PURE__ */ jsx("h3", { className: "font-display text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground", children: "Strategy_Snapshot" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-3", children: [
          /* @__PURE__ */ jsxs("dl", { className: "grid grid-cols-1 gap-2", children: [
            /* @__PURE__ */ jsx(Item, { k: "Engine_Base_Stake", v: fmtMoney(s.config.baseStake) }),
            /* @__PURE__ */ jsx(Item, { k: "Temporal_Duration", v: `${s.config.durationTicks} Ticks` }),
            /* @__PURE__ */ jsx(Item, { k: "Recovery_Multiplier", v: `${s.config.martingaleMultiplier}×` }),
            /* @__PURE__ */ jsx(Item, { k: "Max_Recovery_Steps", v: s.config.maxMartingaleLevels }),
            /* @__PURE__ */ jsx(Item, { k: "Target_Take_Profit", v: s.config.takeProfit ? fmtMoney(s.config.takeProfit) : "DISABLED" }),
            /* @__PURE__ */ jsx(Item, { k: "Threshold_Stop_Loss", v: s.config.stopLoss ? fmtMoney(s.config.stopLoss) : "DISABLED" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 rounded border border-primary/20 bg-primary/5 p-4 group", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.1em] text-primary/80", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { children: "Modify core parameters in " }),
            /* @__PURE__ */ jsx(Link, { to: "/settings", className: "font-black text-primary hover:underline underline-offset-4", children: "Kernel_Settings" })
          ] }) })
        ] })
      ] }) })
    ] })
  ] });
}
function Item({
  k,
  v
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border/20 py-2.5 last:border-0", children: [
    /* @__PURE__ */ jsx("dt", { className: "font-mono text-[9px] uppercase tracking-widest text-muted-foreground", children: k }),
    /* @__PURE__ */ jsx("dd", { className: "font-mono text-[10px] font-bold tabular-nums uppercase tracking-tight text-foreground", children: v })
  ] });
}
function EmptyState({
  icon: Icon,
  title,
  body,
  cta
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4 py-16 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "grid h-12 w-12 place-items-center rounded border border-dashed border-border text-muted-foreground/40", children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("div", { className: "font-mono text-xs font-black uppercase tracking-[0.2em] text-muted-foreground", children: title }),
      /* @__PURE__ */ jsx("div", { className: "max-w-[240px] font-mono text-[9px] uppercase leading-relaxed tracking-widest text-muted-foreground/40", children: body })
    ] }),
    cta && /* @__PURE__ */ jsx(Link, { to: cta.to, className: "mt-2 rounded bg-muted px-6 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-foreground hover:bg-muted/80", children: cta.label })
  ] });
}
export {
  Dashboard as component
};
