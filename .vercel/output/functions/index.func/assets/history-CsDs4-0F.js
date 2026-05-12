import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useAuth, s as supabase } from "./router-BBK6EZ8W.js";
import { P as PageHeader, a as Panel } from "./app-shell-e3Gf78kX.js";
import { f as fmtMoney, a as fmtPct } from "./trading-BeWPgjAV.js";
import { Download, FileText, History as History$1 } from "lucide-react";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "clsx";
import "tailwind-merge";
function History() {
  const {
    user
  } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    supabase.from("trading_sessions").select("*").eq("user_id", user.id).order("started_at", {
      ascending: false
    }).limit(50).then(({
      data,
      error
    }) => {
      if (error) toast.error(error.message);
      setItems(data ?? []);
      setLoading(false);
    });
  }, [user]);
  function exportCsv() {
    const headers = ["id", "market", "strategy", "started_at", "ended_at", "starting_balance", "ending_balance", "pnl", "trades", "wins", "losses"];
    const rows = items.map((s) => [s.id, s.market, s.strategy, s.started_at, s.ended_at ?? "", s.starting_balance, s.ending_balance ?? "", s.pnl, s.total_trades, s.wins, s.losses].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickwise-sessions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportPdf() {
    const html = `
      <html><head><title>Tickwise Sessions Report</title>
      <style>body{font-family:Inter,system-ui;padding:32px;color:#111}h1{font-family:'Space Grotesk',sans-serif}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th,td{padding:8px;text-align:left;border-bottom:1px solid #eee}th{background:#fafafa}</style>
      </head><body>
      <h1>Tickwise · Sessions Report</h1>
      <div style="color:#666">Generated ${(/* @__PURE__ */ new Date()).toLocaleString()}</div>
      <table><thead><tr><th>Started</th><th>Market</th><th>Strategy</th><th>Trades</th><th>Wins</th><th>Losses</th><th>P&amp;L</th></tr></thead>
      <tbody>${items.map((s) => `<tr><td>${new Date(s.started_at).toLocaleString()}</td><td>${s.market}</td><td>${s.strategy}</td><td>${s.total_trades}</td><td>${s.wins}</td><td>${s.losses}</td><td>${fmtMoney(+s.pnl)}</td></tr>`).join("")}</tbody></table>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return toast.error("Pop-ups blocked");
    w.document.write(html);
    w.document.close();
    w.print();
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Session history", subtitle: "Every session you've run, saved and exportable.", action: /* @__PURE__ */ jsxs("div", { className: "hidden gap-2 md:flex", children: [
      /* @__PURE__ */ jsxs("button", { onClick: exportCsv, className: "inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent", children: [
        /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
        " CSV"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: exportPdf, className: "inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent", children: [
        /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
        " PDF"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mb-3 flex gap-2 md:hidden", children: [
      /* @__PURE__ */ jsx("button", { onClick: exportCsv, className: "flex-1 rounded-full border border-border px-4 py-2 text-sm", children: "CSV" }),
      /* @__PURE__ */ jsx("button", { onClick: exportPdf, className: "flex-1 rounded-full border border-border px-4 py-2 text-sm", children: "PDF" })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: Array.from({
      length: 4
    }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-24 animate-pulse rounded-2xl bg-surface/40" }, i)) }) : items.length === 0 ? /* @__PURE__ */ jsxs(Panel, { className: "grid place-items-center py-16 text-center", children: [
      /* @__PURE__ */ jsx(History$1, { className: "h-8 w-8 text-muted-foreground" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 font-display text-lg", children: "No sessions yet" }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 max-w-xs text-sm text-muted-foreground", children: "Sessions you complete in the terminal will be saved here automatically." })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: items.map((s) => {
      const roi = s.starting_balance ? +s.pnl / +s.starting_balance * 100 : 0;
      const winRate = s.total_trades ? s.wins / s.total_trades * 100 : 0;
      return /* @__PURE__ */ jsxs("div", { className: "panel grid grid-cols-2 gap-3 p-4 md:grid-cols-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-widest text-muted-foreground", children: new Date(s.started_at).toLocaleString() }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 font-display text-base", children: s.market }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: s.strategy.replace("_", " / ") })
        ] }),
        /* @__PURE__ */ jsx(Cell, { k: "Trades", v: s.total_trades }),
        /* @__PURE__ */ jsx(Cell, { k: "Win rate", v: `${winRate.toFixed(0)}%` }),
        /* @__PURE__ */ jsx(Cell, { k: "P&L", v: fmtMoney(+s.pnl), tone: +s.pnl >= 0 ? "up" : "down" }),
        /* @__PURE__ */ jsx(Cell, { k: "ROI", v: fmtPct(roi), tone: roi >= 0 ? "up" : "down" })
      ] }, s.id);
    }) })
  ] });
}
function Cell({
  k,
  v,
  tone
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-widest text-muted-foreground", children: k }),
    /* @__PURE__ */ jsx("div", { className: `mt-1 tabular text-sm font-semibold ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""}`, children: v })
  ] });
}
export {
  History as component
};
