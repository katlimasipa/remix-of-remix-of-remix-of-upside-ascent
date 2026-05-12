import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { u as useSession } from "./store-BRE9lLtt.js";
import { P as PageHeader, S as StatCard, a as Panel } from "./app-shell-e3Gf78kX.js";
import { a as fmtPct, f as fmtMoney } from "./trading-BeWPgjAV.js";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, BarChart, Bar } from "recharts";
import { useMemo } from "react";
import "zustand";
import "zustand/middleware";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BBK6EZ8W.js";
import "@tanstack/react-query";
import "sonner";
import "@supabase/supabase-js";
import "clsx";
import "tailwind-merge";
function Analytics() {
  const s = useSession();
  const winRate = s.trades.length ? s.wins / s.trades.length * 100 : 0;
  const roi = s.startingBalance ? s.pnl / s.startingBalance * 100 : 0;
  const equity = useMemo(() => {
    let bal = s.startingBalance;
    return [...s.trades].reverse().map((t, i) => {
      bal += t.pnl;
      return {
        i: i + 1,
        balance: +bal.toFixed(2),
        pnl: +t.pnl.toFixed(2)
      };
    });
  }, [s.trades, s.startingBalance]);
  const distribution = useMemo(() => {
    const buckets = {
      "<-5": 0,
      "-5..0": 0,
      "0..5": 0,
      ">5": 0
    };
    for (const t of s.trades) {
      if (t.pnl < -5) buckets["<-5"]++;
      else if (t.pnl < 0) buckets["-5..0"]++;
      else if (t.pnl < 5) buckets["0..5"]++;
      else buckets[">5"]++;
    }
    return Object.entries(buckets).map(([k, v]) => ({
      bucket: k,
      count: v
    }));
  }, [s.trades]);
  const bestStreak = useMemo(() => {
    let max = 0, cur = 0;
    for (const t of [...s.trades].reverse()) {
      if (t.result === "win") {
        cur++;
        max = Math.max(max, cur);
      } else cur = 0;
    }
    return max;
  }, [s.trades]);
  const worstStreak = useMemo(() => {
    let max = 0, cur = 0;
    for (const t of [...s.trades].reverse()) {
      if (t.result === "loss") {
        cur++;
        max = Math.max(max, cur);
      } else cur = 0;
    }
    return max;
  }, [s.trades]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Analytics", subtitle: "Live performance for the current session." }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-5", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "ROI", value: fmtPct(roi), accent: roi >= 0 ? "up" : "down" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Win rate", value: `${winRate.toFixed(1)}%` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Best streak", value: bestStreak, accent: "up" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Worst streak", value: worstStreak, accent: "down" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Trades", value: s.trades.length })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { className: "mt-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-semibold", children: "Equity curve" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 h-64", children: equity.length === 0 ? /* @__PURE__ */ jsx("div", { className: "grid h-full place-items-center text-sm text-muted-foreground", children: "No trades yet." }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: equity, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { stroke: "oklch(0.30 0.020 250 / 0.4)", strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "i", stroke: "oklch(0.68 0.02 250)", fontSize: 10 }),
        /* @__PURE__ */ jsx(YAxis, { stroke: "oklch(0.68 0.02 250)", fontSize: 10, domain: ["auto", "auto"] }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          fontSize: 12
        }, formatter: (v) => fmtMoney(+v) }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "balance", stroke: "var(--primary)", strokeWidth: 2, dot: false })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { className: "mt-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-semibold", children: "P&L distribution" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 h-56", children: distribution.every((d) => d.count === 0) ? /* @__PURE__ */ jsx("div", { className: "grid h-full place-items-center text-sm text-muted-foreground", children: "No trades yet." }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: distribution, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { stroke: "oklch(0.30 0.020 250 / 0.4)", strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "bucket", stroke: "oklch(0.68 0.02 250)", fontSize: 10 }),
        /* @__PURE__ */ jsx(YAxis, { stroke: "oklch(0.68 0.02 250)", fontSize: 10, allowDecimals: false }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          fontSize: 12
        } }),
        /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "var(--primary)", radius: [6, 6, 0, 0] })
      ] }) }) })
    ] })
  ] });
}
export {
  Analytics as component
};
