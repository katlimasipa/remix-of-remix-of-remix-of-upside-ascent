import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/lib/store";
import { PageHeader, Panel } from "@/components/app-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Tickwise" }] }),
  component: Settings,
});

function Settings() {
  const s = useSession();

  return (
    <>
      <PageHeader title="Settings" subtitle="Defaults for new trading sessions." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h3 className="font-display text-lg font-semibold">Risk</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Take profit ($)">
              <input type="number" min={0} value={s.config.takeProfit ?? 0} onChange={(e) => s.setConfig({ takeProfit: +e.target.value || null })} className="input" />
            </Field>
            <Field label="Stop loss ($)">
              <input type="number" min={0} value={s.config.stopLoss ?? 0} onChange={(e) => s.setConfig({ stopLoss: +e.target.value || null })} className="input" />
            </Field>
            <Field label="Max trades">
              <input type="number" min={0} value={s.config.maxTrades ?? 0} onChange={(e) => s.setConfig({ maxTrades: +e.target.value || null })} className="input" />
            </Field>
            <Field label="Cooldown (sec)">
              <input type="number" min={0} value={s.config.cooldownSeconds} onChange={(e) => s.setConfig({ cooldownSeconds: +e.target.value })} className="input" />
            </Field>
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display text-lg font-semibold">Martingale</h3>
          <div className="mt-4 space-y-3">
            <Toggle label="Enabled" v={s.config.martingaleEnabled} onChange={(v) => s.setConfig({ martingaleEnabled: v })} />
            <Toggle label="Reset on win" v={s.config.resetOnWin} onChange={(v) => s.setConfig({ resetOnWin: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Multiplier">
                <input type="number" step={0.1} min={1.1} value={s.config.martingaleMultiplier} onChange={(e) => s.setConfig({ martingaleMultiplier: +e.target.value })} className="input" />
              </Field>
              <Field label="Max levels">
                <input type="number" min={1} max={15} value={s.config.maxMartingaleLevels} onChange={(e) => s.setConfig({ maxMartingaleLevels: +e.target.value })} className="input" />
              </Field>
            </div>
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display text-lg font-semibold">Trade defaults</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Base stake ($)">
              <input type="number" step={0.1} min={0.1} value={s.config.baseStake} onChange={(e) => s.setConfig({ baseStake: +e.target.value })} className="input" />
            </Field>
            <Field label="Duration (ticks)">
              <input type="number" min={1} max={30} value={s.config.durationTicks} onChange={(e) => s.setConfig({ durationTicks: +e.target.value })} className="input" />
            </Field>
            <Field label="Starting balance ($)">
              <input type="number" min={1} value={s.startingBalance} onChange={(e) => useSession.setState({ startingBalance: +e.target.value })} className="input" />
            </Field>
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display text-lg font-semibold">Session</h3>
          <p className="mt-2 text-sm text-muted-foreground">Reset the active in-memory session. History is preserved.</p>
          <button
            onClick={() => { s.reset(); toast.success("Session reset."); }}
            className="mt-4 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Reset current session
          </button>
        </Panel>
      </div>

      <style>{`.input{width:100%;background:var(--input);border:1px solid var(--border);border-radius:.65rem;padding:.55rem .7rem;font-size:.85rem;color:var(--foreground);outline:none}.input:focus{border-color:var(--primary)}`}</style>
    </>
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
function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface/40 px-3 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
    </label>
  );
}
