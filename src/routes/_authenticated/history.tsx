import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/app-shell";
import { fmtMoney, fmtPct } from "@/lib/trading";
import { Download, FileText, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Session History — Tickwise" }] }),
  component: History,
});

type Session = {
  id: string; name: string | null; market: string; strategy: string;
  starting_balance: number; ending_balance: number | null; pnl: number;
  total_trades: number; wins: number; losses: number;
  started_at: string; ended_at: string | null; status: string;
};

function History() {
  const { user } = useAuth();
  const [items, setItems] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("trading_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setItems((data as Session[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  function exportCsv() {
    const headers = ["id", "market", "strategy", "started_at", "ended_at", "starting_balance", "ending_balance", "pnl", "trades", "wins", "losses"];
    const rows = items.map((s) => [s.id, s.market, s.strategy, s.started_at, s.ended_at ?? "", s.starting_balance, s.ending_balance ?? "", s.pnl, s.total_trades, s.wins, s.losses].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `tickwise-sessions-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const html = `
      <html><head><title>Tickwise Sessions Report</title>
      <style>body{font-family:Inter,system-ui;padding:32px;color:#111}h1{font-family:'Space Grotesk',sans-serif}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th,td{padding:8px;text-align:left;border-bottom:1px solid #eee}th{background:#fafafa}</style>
      </head><body>
      <h1>Tickwise · Sessions Report</h1>
      <div style="color:#666">Generated ${new Date().toLocaleString()}</div>
      <table><thead><tr><th>Started</th><th>Market</th><th>Strategy</th><th>Trades</th><th>Wins</th><th>Losses</th><th>P&amp;L</th></tr></thead>
      <tbody>${items.map((s) => `<tr><td>${new Date(s.started_at).toLocaleString()}</td><td>${s.market}</td><td>${s.strategy}</td><td>${s.total_trades}</td><td>${s.wins}</td><td>${s.losses}</td><td>${fmtMoney(+s.pnl)}</td></tr>`).join("")}</tbody></table>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return toast.error("Pop-ups blocked");
    w.document.write(html); w.document.close(); w.print();
  }

  return (
    <>
      <PageHeader
        title="Session history"
        subtitle="Every session you've run, saved and exportable."
        action={
          <div className="hidden gap-2 md:flex">
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"><Download className="h-4 w-4" /> CSV</button>
            <button onClick={exportPdf} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"><FileText className="h-4 w-4" /> PDF</button>
          </div>
        }
      />
      <div className="mb-3 flex gap-2 md:hidden">
        <button onClick={exportCsv} className="flex-1 rounded-full border border-border px-4 py-2 text-sm">CSV</button>
        <button onClick={exportPdf} className="flex-1 rounded-full border border-border px-4 py-2 text-sm">PDF</button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface/40" />)}
        </div>
      ) : items.length === 0 ? (
        <Panel className="grid place-items-center py-16 text-center">
          <HistoryIcon className="h-8 w-8 text-muted-foreground" />
          <div className="mt-3 font-display text-lg">No sessions yet</div>
          <div className="mt-1 max-w-xs text-sm text-muted-foreground">Sessions you complete in the terminal will be saved here automatically.</div>
        </Panel>
      ) : (
        <div className="grid gap-3">
          {items.map((s) => {
            const roi = s.starting_balance ? (+s.pnl / +s.starting_balance) * 100 : 0;
            const winRate = s.total_trades ? (s.wins / s.total_trades) * 100 : 0;
            return (
              <div key={s.id} className="panel grid grid-cols-2 gap-3 p-4 md:grid-cols-6">
                <div className="md:col-span-2">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{new Date(s.started_at).toLocaleString()}</div>
                  <div className="mt-1 font-display text-base">{s.market}</div>
                  <div className="text-xs text-muted-foreground">{s.strategy.replace("_", " / ")}</div>
                </div>
                <Cell k="Trades" v={s.total_trades} />
                <Cell k="Win rate" v={`${winRate.toFixed(0)}%`} />
                <Cell k="P&L" v={fmtMoney(+s.pnl)} tone={+s.pnl >= 0 ? "up" : "down"} />
                <Cell k="ROI" v={fmtPct(roi)} tone={roi >= 0 ? "up" : "down"} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Cell({ k, v, tone }: { k: string; v: React.ReactNode; tone?: "up" | "down" }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className={`mt-1 tabular text-sm font-semibold ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""}`}>{v}</div>
    </div>
  );
}
