import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { u as useSession } from "./store-BRE9lLtt.js";
import { P as PageHeader, a as Panel } from "./app-shell-e3Gf78kX.js";
import { toast } from "sonner";
import { u as useAuth, s as supabase } from "./router-BBK6EZ8W.js";
import { D as DerivClient } from "./deriv-BWHyOL7-.js";
import { ShieldCheck, EyeOff, Eye, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import "zustand";
import "zustand/middleware";
import "clsx";
import "tailwind-merge";
import "@tanstack/react-query";
import "@supabase/supabase-js";
function Settings() {
  const s = useSession();
  const {
    user
  } = useAuth();
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const tokenInputType = showToken ? "text" : "password";
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("deriv_api_token, deriv_account_id, deriv_currency").eq("id", user.id).maybeSingle().then(({
      data
    }) => {
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
    setTokenError(null);
    const client = new DerivClient();
    try {
      await client.connect();
      const auth = await client.authorize(token.trim());
      if (!auth.is_virtual) {
        const msg = "This is a real-money token. Switch to your Deriv Virtual account and create a demo token.";
        setTokenError(msg);
        toast.error(msg);
        client.close();
        return;
      }
      setAccountInfo({
        loginid: auth.loginid,
        currency: auth.currency,
        balance: Number(auth.balance),
        is_virtual: auth.is_virtual
      });
      const {
        error
      } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Trader",
        deriv_api_token: token.trim(),
        deriv_account_id: auth.loginid,
        deriv_currency: auth.currency,
        starting_balance: Number(auth.balance ?? 1e3),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, {
        onConflict: "id"
      });
      if (error) throw error;
      setSavedToken(token.trim());
      useSession.setState({
        derivAccountId: auth.loginid,
        derivCurrency: auth.currency,
        derivLiveBalance: Number(auth.balance),
        startingBalance: Number(auth.balance ?? 1e3)
      });
      toast.success(`Connected: ${auth.loginid} (${auth.currency})`);
    } catch (e) {
      const msg = e?.message ?? "Failed to authorize";
      setTokenError(msg);
      toast.error(msg);
    } finally {
      client.close();
      setTesting(false);
    }
  }
  async function clearToken() {
    if (!user) return;
    await supabase.from("profiles").update({
      deriv_api_token: null,
      deriv_account_id: null,
      deriv_currency: null
    }).eq("id", user.id);
    setSavedToken(null);
    setToken("");
    setAccountInfo(null);
    toast.success("Token removed.");
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Settings", subtitle: "Defaults for new trading sessions." }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Panel, { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-semibold", children: "Deriv connection" }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
              "Paste your ",
              /* @__PURE__ */ jsx("strong", { children: "DEMO" }),
              " account API token. Real-money tokens are rejected."
            ] })
          ] }),
          savedToken && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 rounded-full bg-up/15 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-up", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "h-3 w-3" }),
            " Connected"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-[1fr_auto]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center rounded-xl border border-border bg-input focus-within:border-primary", children: [
            /* @__PURE__ */ jsx("input", { type: tokenInputType, value: token, onChange: (e) => {
              setToken(e.target.value);
              setTokenError(null);
            }, placeholder: "Paste Deriv demo token", className: "min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none", autoComplete: "off" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowToken((v) => !v), className: "grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground", "aria-label": showToken ? "Hide token" : "Show token", children: showToken ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: saveAndTest, disabled: testing, className: "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: testing ? /* @__PURE__ */ jsx(Loader2, { className: "inline h-4 w-4 animate-spin" }) : savedToken ? "Update & verify" : "Connect" }),
            savedToken && /* @__PURE__ */ jsx("button", { onClick: clearToken, className: "rounded-full border border-border px-3 py-2 text-sm", children: "Disconnect" })
          ] })
        ] }),
        tokenError && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-2 rounded-xl border border-down/30 bg-down/10 p-3 text-xs text-down", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 shrink-0" }),
          tokenError
        ] }),
        accountInfo && /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface/40 p-3 text-xs", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase text-muted-foreground", children: "Account" }),
            /* @__PURE__ */ jsx("div", { className: "font-semibold tabular", children: accountInfo.loginid })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase text-muted-foreground", children: "Balance" }),
            /* @__PURE__ */ jsxs("div", { className: "font-semibold tabular", children: [
              accountInfo.balance.toFixed(2),
              " ",
              accountInfo.currency
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase text-muted-foreground", children: "Type" }),
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-up", children: "DEMO" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("a", { href: "https://app.deriv.com/account/api-token", target: "_blank", rel: "noreferrer", className: "mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline", children: [
          "Get a token from Deriv ",
          /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/onboarding", className: "ml-3 inline-flex items-center gap-1 text-xs text-primary hover:underline", children: "Open simple connector" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-[11px] text-muted-foreground", children: [
          "Required scopes: ",
          /* @__PURE__ */ jsx("code", { children: "read" }),
          ", ",
          /* @__PURE__ */ jsx("code", { children: "trade" }),
          ". Switch to a Virtual account before generating the token."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-semibold", children: "Risk" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsx(Field, { label: "Take profit ($)", children: /* @__PURE__ */ jsx("input", { type: "number", min: 0, value: s.config.takeProfit ?? 0, onChange: (e) => s.setConfig({
            takeProfit: +e.target.value || null
          }), className: "input" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Stop loss ($)", children: /* @__PURE__ */ jsx("input", { type: "number", min: 0, value: s.config.stopLoss ?? 0, onChange: (e) => s.setConfig({
            stopLoss: +e.target.value || null
          }), className: "input" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Max trades", children: /* @__PURE__ */ jsx("input", { type: "number", min: 0, value: s.config.maxTrades ?? 0, onChange: (e) => s.setConfig({
            maxTrades: +e.target.value || null
          }), className: "input" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Cooldown (sec)", children: /* @__PURE__ */ jsx("input", { type: "number", min: 0, value: s.config.cooldownSeconds, onChange: (e) => s.setConfig({
            cooldownSeconds: +e.target.value
          }), className: "input" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-semibold", children: "Martingale" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
          /* @__PURE__ */ jsx(Toggle, { label: "Enabled", v: s.config.martingaleEnabled, onChange: (v) => s.setConfig({
            martingaleEnabled: v
          }) }),
          /* @__PURE__ */ jsx(Toggle, { label: "Reset on win", v: s.config.resetOnWin, onChange: (v) => s.setConfig({
            resetOnWin: v
          }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsx(Field, { label: "Multiplier", children: /* @__PURE__ */ jsx("input", { type: "number", step: 0.1, min: 1.1, value: s.config.martingaleMultiplier, onChange: (e) => s.setConfig({
              martingaleMultiplier: +e.target.value
            }), className: "input" }) }),
            /* @__PURE__ */ jsx(Field, { label: "Max levels", children: /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 15, value: s.config.maxMartingaleLevels, onChange: (e) => s.setConfig({
              maxMartingaleLevels: +e.target.value
            }), className: "input" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-semibold", children: "Trade defaults" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsx(Field, { label: "Base stake ($)", children: /* @__PURE__ */ jsx("input", { type: "number", step: 0.1, min: 0.1, value: s.config.baseStake, onChange: (e) => s.setConfig({
            baseStake: +e.target.value
          }), className: "input" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Duration (ticks)", children: /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 30, value: s.config.durationTicks, onChange: (e) => s.setConfig({
            durationTicks: +e.target.value
          }), className: "input" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Starting balance ($)", children: /* @__PURE__ */ jsx("input", { type: "number", min: 1, value: s.startingBalance, onChange: (e) => useSession.setState({
            startingBalance: +e.target.value
          }), className: "input" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-semibold", children: "Session" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Reset the active in-memory session. History is preserved." }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          s.reset();
          toast.success("Session reset.");
        }, className: "mt-4 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent", children: "Reset current session" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `.input{width:100%;background:var(--input);border:1px solid var(--border);border-radius:.65rem;padding:.55rem .7rem;font-size:.85rem;color:var(--foreground);outline:none}.input:focus{border-color:var(--primary)}` })
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
function Toggle({
  label,
  v,
  onChange
}) {
  return /* @__PURE__ */ jsxs("label", { className: "flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface/40 px-3 py-2.5", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: label }),
    /* @__PURE__ */ jsx("input", { type: "checkbox", checked: v, onChange: (e) => onChange(e.target.checked), className: "h-4 w-4 accent-primary" })
  ] });
}
export {
  Settings as component
};
