import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/store";
import { DerivClient, DERIV_MARKETS } from "@/lib/deriv";
import { toast } from "sonner";
import { ExternalLink, Loader2, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Setup — Tickwise" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = useAuth();
  const nav = useNavigate();
  const s = useSession();

  const [token, setToken] = useState("");
  const [verified, setVerified] = useState<{ loginid: string; currency: string; balance: number } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Defaults form
  const [market, setMarket] = useState(s.config.market);
  const [baseStake, setBaseStake] = useState(s.config.baseStake);
  const [duration, setDuration] = useState(s.config.durationTicks);
  const [martingale, setMartingale] = useState(s.config.martingaleEnabled);
  const [multiplier, setMultiplier] = useState(s.config.martingaleMultiplier);
  const [maxLevels, setMaxLevels] = useState(s.config.maxMartingaleLevels);
  const [takeProfit, setTakeProfit] = useState(s.config.takeProfit ?? 50);
  const [stopLoss, setStopLoss] = useState(s.config.stopLoss ?? 25);

  // If user already onboarded, skip.
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("deriv_api_token").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.deriv_api_token) nav({ to: "/terminal" });
    });
  }, [user, nav]);

  async function verifyToken() {
    const t = token.trim();
    if (!t) return toast.error("Paste your Deriv API token first.");
    setTesting(true);
    setVerified(null);
    const client = new DerivClient();
    try {
      await client.connect();
      const auth = await client.authorize(t);
      if (!auth.is_virtual) {
        toast.error("That is a REAL-money token. Use a DEMO (Virtual) account token.");
        return;
      }
      setVerified({ loginid: auth.loginid, currency: auth.currency, balance: Number(auth.balance) });
      toast.success(`Verified ${auth.loginid} (${auth.currency})`);
    } catch (e: any) {
      toast.error(e?.message ?? "Token rejected by Deriv.");
    } finally {
      client.close();
      setTesting(false);
    }
  }

  async function finish() {
    if (!user) return;
    if (!verified) return toast.error("Verify your Deriv token before continuing.");
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        deriv_api_token: token.trim(),
        deriv_account_id: verified.loginid,
        deriv_currency: verified.currency,
      }).eq("id", user.id);
      if (error) throw error;

      s.setConfig({
        market,
        baseStake,
        durationTicks: duration,
        martingaleEnabled: martingale,
        martingaleMultiplier: multiplier,
        maxMartingaleLevels: maxLevels,
        takeProfit: takeProfit || null,
        stopLoss: stopLoss || null,
      });
      useSession.setState({ startingBalance: verified.balance });

      toast.success("All set. Welcome to Tickwise.");
      nav({ to: "/terminal" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">One-time setup</h1>
          <p className="text-xs text-muted-foreground">Connect your Deriv DEMO account and configure defaults. You won't see this screen again.</p>
        </div>
      </header>

      {/* Step 1: Token */}
      <section className="rounded-2xl border border-border bg-surface/40 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">1. Connect Deriv</h2>
          {verified && (
            <span className="flex items-center gap-1 rounded-full bg-up/15 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-up">
              <ShieldCheck className="h-3 w-3" /> {verified.loginid}
            </span>
          )}
        </div>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
          <li>Open <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noreferrer" className="text-primary hover:underline">app.deriv.com → API token <ExternalLink className="inline h-3 w-3" /></a></li>
          <li>Switch to a <strong>Virtual / Demo</strong> account (top-right account switcher).</li>
          <li>Create a token with <code>read</code> + <code>trade</code> scopes. Copy &amp; paste below.</li>
        </ol>

        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => { setToken(e.target.value); setVerified(null); }}
            placeholder="paste demo token"
            className="input"
          />
          <button
            onClick={verifyToken}
            disabled={testing || !token.trim()}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {testing ? <Loader2 className="inline h-4 w-4 animate-spin" /> : verified ? "Re-verify" : "Verify token"}
          </button>
        </div>
        {verified && (
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border bg-background/40 p-3 text-xs">
            <Stat k="Account" v={verified.loginid} />
            <Stat k="Balance" v={`${verified.balance.toFixed(2)} ${verified.currency}`} />
            <Stat k="Type" v="DEMO" accent />
          </div>
        )}
      </section>

      {/* Step 2: Defaults */}
      <section className="mt-4 rounded-2xl border border-border bg-surface/40 p-5">
        <h2 className="font-display text-lg font-semibold">2. Trading defaults</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Market">
            <select value={market} onChange={(e) => setMarket(e.target.value)} className="input">
              {DERIV_MARKETS.map((m) => <option key={m.symbol} value={m.symbol}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Base stake ($)">
            <input type="number" step={0.1} min={0.35} value={baseStake} onChange={(e) => setBaseStake(+e.target.value)} className="input" />
          </Field>
          <Field label="Ticks">
            <input type="number" min={5} max={10} value={duration} onChange={(e) => setDuration(+e.target.value)} className="input" />
          </Field>
          <Field label="Take profit ($)">
            <input type="number" min={0} value={takeProfit} onChange={(e) => setTakeProfit(+e.target.value)} className="input" />
          </Field>
          <Field label="Stop loss ($)">
            <input type="number" min={0} value={stopLoss} onChange={(e) => setStopLoss(+e.target.value)} className="input" />
          </Field>
        </div>
      </section>

      {/* Step 3: Martingale */}
      <section className="mt-4 rounded-2xl border border-border bg-surface/40 p-5">
        <h2 className="font-display text-lg font-semibold">3. Martingale</h2>
        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2.5">
          <span className="text-sm font-medium">Enable Martingale recovery</span>
          <input type="checkbox" checked={martingale} onChange={(e) => setMartingale(e.target.checked)} className="h-4 w-4 accent-primary" />
        </label>
        {martingale && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Multiplier">
              <input type="number" step={0.1} min={1.1} value={multiplier} onChange={(e) => setMultiplier(+e.target.value)} className="input" />
            </Field>
            <Field label="Max levels">
              <input type="number" min={1} max={15} value={maxLevels} onChange={(e) => setMaxLevels(+e.target.value)} className="input" />
            </Field>
          </div>
        )}
      </section>

      <div className="sticky bottom-4 mt-6 flex justify-end">
        <button
          onClick={finish}
          disabled={!verified || saving}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enter terminal <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>

      <style>{`.input{width:100%;background:var(--input);border:1px solid var(--border);border-radius:.65rem;padding:.55rem .7rem;font-size:.85rem;color:var(--foreground);outline:none}.input:focus{border-color:var(--primary)}`}</style>
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
function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase text-muted-foreground">{k}</div>
      <div className={`font-semibold tabular ${accent ? "text-up" : ""}`}>{v}</div>
    </div>
  );
}