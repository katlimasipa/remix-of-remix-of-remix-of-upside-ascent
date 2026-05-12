import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/store";
import { DerivClient } from "@/lib/deriv";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, PlugZap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Connect Deriv — Tickwise" }] }),
  component: Onboarding,
});

function friendlyTokenError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid token") || m.includes("authorize")) return "Deriv rejected this token. Copy the token again from your Virtual account and paste it here.";
  if (m.includes("scope")) return message;
  if (m.includes("timed out") || m.includes("not connected")) return "Could not reach Deriv. Check your connection and try again.";
  return message || "Token rejected by Deriv.";
}

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("deriv_api_token")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.deriv_api_token) navigate({ to: "/terminal" });
      });
  }, [user, navigate]);

  async function connectAndSave() {
    const cleanToken = token.trim();
    if (!user) return;
    if (!cleanToken) {
      setError("Paste your Deriv demo API token first.");
      return;
    }

    setSaving(true);
    setError(null);
    const client = new DerivClient();

    try {
      await client.connect();
      const auth = await client.authorize(cleanToken);

      if (!auth.is_virtual) {
        throw new Error("This token belongs to a real-money account. Switch to your Deriv Virtual account and create a demo token.");
      }

      const { error: saveError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Trader",
        deriv_api_token: cleanToken,
        deriv_account_id: auth.loginid,
        deriv_currency: auth.currency ?? "USD",
        starting_balance: Number(auth.balance ?? 1000),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      if (saveError) throw saveError;

      useSession.setState({
        startingBalance: Number(auth.balance ?? 1000),
        derivAccountId: auth.loginid,
        derivCurrency: auth.currency ?? "USD",
        derivLiveBalance: Number(auth.balance ?? 0),
        derivConnected: true,
        derivAuthorized: true,
      });

      toast.success(`Connected and saved: ${auth.loginid}`);
      navigate({ to: "/terminal" });
    } catch (e: any) {
      const msg = friendlyTokenError(e?.message ?? "Token rejected by Deriv.");
      setError(msg);
      toast.error(msg);
    } finally {
      client.close();
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-xl items-center py-6">
      <section className="panel w-full p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <PlugZap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Connect Deriv</h1>
            <p className="mt-1 text-sm text-muted-foreground">Paste one Deriv Virtual API token. Tickwise verifies it and saves it to your account.</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface/50 p-3 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-up" />
            <p>Create the token while switched to your <strong>Virtual</strong> Deriv account. Enable <strong>Read</strong> and <strong>Trade</strong>.</p>
          </div>
          <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary hover:underline">
            Open Deriv API tokens <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">API token</span>
          <div className="flex items-center rounded-xl border border-border bg-input focus-within:border-primary">
            <input
              type={showToken ? "text" : "password"}
              autoComplete="off"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") connectAndSave(); }}
              placeholder="Paste token here"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="grid h-11 w-11 place-items-center text-muted-foreground hover:text-foreground"
              aria-label={showToken ? "Hide token" : "Show token"}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        {error && (
          <div className="mt-3 flex gap-2 rounded-xl border border-down/30 bg-down/10 p-3 text-xs text-down">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={connectAndSave}
          disabled={saving || !token.trim()}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Connect & save <ArrowRight className="h-4 w-4" /></>}
        </button>
      </section>
    </div>
  );
}
