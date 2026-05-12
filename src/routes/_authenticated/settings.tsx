import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/store";
import { PageHeader, Panel } from "@/components/app-shell";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DerivClient } from "@/lib/deriv";
import { ExternalLink, ShieldCheck, Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Tickwise" }] }),
  component: Settings,
});

function Settings() {
  const s = useSession();
  const { user } = useAuth();
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<{ loginid: string; currency: string; balance: number; is_virtual: boolean } | null>(null);

  const tokenInputType = showToken ? "text" : "password";

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("deriv_api_token, deriv_account_id, deriv_currency").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.deriv_api_token) {
        setSavedToken(data.deriv_api_token);
        setToken(data.deriv_api_token);
      }
    });
  }, [user]);

  async function saveAndTest() {
    if (!user) return;
    if (!token.trim()) return toast.error("Paste your Deriv API token first.");
    setTesting(true);
    const client = new DerivClient();
    try {
      await client.connect();
      const auth = await client.authorize(token.trim());
      if (!auth.is_virtual) {
        toast.error("This is a REAL account token. Use a DEMO token only.");
        client.close();
        return;
      }
      setAccountInfo({
        loginid: auth.loginid,
        currency: auth.currency,
        balance: Number(auth.balance),
        is_virtual: auth.is_virtual,
      });
      await supabase.from("profiles").update({
        deriv_api_token: token.trim(),
        deriv_account_id: auth.loginid,
        deriv_currency: auth.currency,
      }).eq("id", user.id);
      setSavedToken(token.trim());
      toast.success(`Connected: ${auth.loginid} (${auth.currency})`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to authorize");
    } finally {
      client.close();
      setTesting(false);
    }
  }

  async function clearToken() {
    if (!user) return;
    await supabase.from("profiles").update({ deriv_api_token: null, deriv_account_id: null, deriv_currency: null }).eq("id", user.id);
    setSavedToken(null); setToken(""); setAccountInfo(null);
    toast.success("Token removed.");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Defaults for new trading sessions." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">Deriv connection</h3>
              <p className="mt-1 text-xs text-muted-foreground">Paste your <strong>DEMO</strong> account API token. Real-money tokens are rejected.</p>
            </div>
            {savedToken && <span className="flex items-center gap-1 rounded-full bg-up/15 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-up"><ShieldCheck className="h-3 w-3" /> Connected</span>}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Deriv API token (read + trade scopes)"
              className="input"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <button onClick={saveAndTest} disabled={testing} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {testing ? <Loader2 className="inline h-4 w-4 animate-spin" /> : savedToken ? "Update & verify" : "Connect"}
              </button>
              {savedToken && <button onClick={clearToken} className="rounded-full border border-border px-3 py-2 text-sm">Disconnect</button>}
            </div>
          </div>
          {accountInfo && (
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface/40 p-3 text-xs">
              <div><div className="font-mono text-[10px] uppercase text-muted-foreground">Account</div><div className="font-semibold tabular">{accountInfo.loginid}</div></div>
              <div><div className="font-mono text-[10px] uppercase text-muted-foreground">Balance</div><div className="font-semibold tabular">{accountInfo.balance.toFixed(2)} {accountInfo.currency}</div></div>
              <div><div className="font-mono text-[10px] uppercase text-muted-foreground">Type</div><div className="font-semibold text-up">DEMO</div></div>
            </div>
          )}
          <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Get a token from Deriv <ExternalLink className="h-3 w-3" />
          </a>
          <p className="mt-1 text-[11px] text-muted-foreground">Required scopes: <code>read</code>, <code>trade</code>. Switch to a Virtual account before generating the token.</p>
        </Panel>

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
