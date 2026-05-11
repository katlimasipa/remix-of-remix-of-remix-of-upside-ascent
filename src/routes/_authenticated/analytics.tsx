import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/lib/store";
import { PageHeader, Panel, StatCard } from "@/components/app-shell";
import { fmtMoney, fmtPct } from "@/lib/trading";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Tickwise" }] }),
  component: Analytics,
});

function Analytics() {
  const s = useSession();
  const winRate = s.trades.length ? (s.wins / s.trades.length) * 100 : 0;
  const roi = s.startingBalance ? (s.pnl / s.startingBalance) * 100 : 0;

  const equity = useMemo(() => {
    let bal = s.startingBalance;
    return [...s.trades].reverse().map((t, i) => {
      bal += t.pnl;
      return { i: i + 1, balance: +bal.toFixed(2), pnl: +t.pnl.toFixed(2) };
    });
  }, [s.trades, s.startingBalance]);

  const distribution = useMemo(() => {
    const buckets: Record<string, number> = { "<-5": 0, "-5..0": 0, "0..5": 0, ">5": 0 };
    for (const t of s.trades) {
      if (t.pnl < -5) buckets["<-5"]++;
      else if (t.pnl < 0) buckets["-5..0"]++;
      else if (t.pnl < 5) buckets["0..5"]++;
      else buckets[">5"]++;
    }
    return Object.entries(buckets).map(([k, v]) => ({ bucket: k, count: v }));
  }, [s.trades]);

  const bestStreak = useMemo(() => {
    let max = 0, cur = 0;
    for (const t of [...s.trades].reverse()) {
      if (t.result === "win") { cur++; max = Math.max(max, cur); } else cur = 0;
    }
    return max;
  }, [s.trades]);
  const worstStreak = useMemo(() => {
    let max = 0, cur = 0;
    for (const t of [...s.trades].reverse()) {
      if (t.result === "loss") { cur++; max = Math.max(max, cur); } else cur = 0;
    }
    return max;
  }, [s.trades]);

  return (
    <>
      <PageHeader title="Analytics" subtitle="Live performance for the current session." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="ROI" value={fmtPct(roi)} accent={roi >= 0 ? "up" : "down"} />
        <StatCard label="Win rate" value={`${winRate.toFixed(1)}%`} />
        <StatCard label="Best streak" value={bestStreak} accent="up" />
        <StatCard label="Worst streak" value={worstStreak} accent="down" />
        <StatCard label="Trades" value={s.trades.length} />
      </div>

      <Panel className="mt-4">
        <h3 className="font-display text-lg font-semibold">Equity curve</h3>
        <div className="mt-3 h-64">
          {equity.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">No trades yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equity}>
                <CartesianGrid stroke="oklch(0.30 0.020 250 / 0.4)" strokeDasharray="3 3" />
                <XAxis dataKey="i" stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <YAxis stroke="oklch(0.68 0.02 250)" fontSize={10} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoney(+v)} />
                <Line type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      <Panel className="mt-4">
        <h3 className="font-display text-lg font-semibold">P&L distribution</h3>
        <div className="mt-3 h-56">
          {distribution.every(d => d.count === 0) ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">No trades yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid stroke="oklch(0.30 0.020 250 / 0.4)" strokeDasharray="3 3" />
                <XAxis dataKey="bucket" stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <YAxis stroke="oklch(0.68 0.02 250)" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>
    </>
  );
}
