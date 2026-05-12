import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { u as useAuth, s as supabase } from "./router-BBK6EZ8W.js";
import { u as useSession } from "./store-BRE9lLtt.js";
import { D as DerivClient } from "./deriv-BWHyOL7-.js";
import { toast } from "sonner";
import { PlugZap, CheckCircle2, ExternalLink, EyeOff, Eye, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import "@tanstack/react-query";
import "@supabase/supabase-js";
import "zustand";
import "zustand/middleware";
function friendlyTokenError(message) {
  const m = message.toLowerCase();
  if (m.includes("invalid token") || m.includes("authorize")) return "Deriv rejected this token. Copy the token again from your Virtual account and paste it here.";
  if (m.includes("scope")) return message;
  if (m.includes("timed out") || m.includes("not connected")) return "Could not reach Deriv. Check your connection and try again.";
  return message || "Token rejected by Deriv.";
}
function Onboarding() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("deriv_api_token").eq("id", user.id).maybeSingle().then(({
      data
    }) => {
      if (data?.deriv_api_token) navigate({
        to: "/terminal"
      });
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
      const {
        error: saveError
      } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Trader",
        deriv_api_token: cleanToken,
        deriv_account_id: auth.loginid,
        deriv_currency: auth.currency ?? "USD",
        starting_balance: Number(auth.balance ?? 1e3),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, {
        onConflict: "id"
      });
      if (saveError) throw saveError;
      useSession.setState({
        startingBalance: Number(auth.balance ?? 1e3),
        derivAccountId: auth.loginid,
        derivCurrency: auth.currency ?? "USD",
        derivLiveBalance: Number(auth.balance ?? 0),
        derivConnected: true,
        derivAuthorized: true
      });
      toast.success(`Connected and saved: ${auth.loginid}`);
      navigate({
        to: "/terminal"
      });
    } catch (e) {
      const msg = friendlyTokenError(e?.message ?? "Token rejected by Deriv.");
      setError(msg);
      toast.error(msg);
    } finally {
      client.close();
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "mx-auto flex min-h-[calc(100svh-8rem)] max-w-xl items-center py-6", children: /* @__PURE__ */ jsxs("section", { className: "panel w-full p-5 md:p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground", children: /* @__PURE__ */ jsx(PlugZap, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-semibold", children: "Connect Deriv" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Paste one Deriv Virtual API token. Tickwise verifies it and saves it to your account." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl border border-border bg-surface/50 p-3 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-4 w-4 shrink-0 text-up" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Create the token while switched to your ",
          /* @__PURE__ */ jsx("strong", { children: "Virtual" }),
          " Deriv account. Enable ",
          /* @__PURE__ */ jsx("strong", { children: "Read" }),
          " and ",
          /* @__PURE__ */ jsx("strong", { children: "Trade" }),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("a", { href: "https://app.deriv.com/account/api-token", target: "_blank", rel: "noreferrer", className: "mt-2 inline-flex items-center gap-1 text-primary hover:underline", children: [
        "Open Deriv API tokens ",
        /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "mt-5 block", children: [
      /* @__PURE__ */ jsx("span", { className: "mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground", children: "API token" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center rounded-xl border border-border bg-input focus-within:border-primary", children: [
        /* @__PURE__ */ jsx("input", { type: showToken ? "text" : "password", autoComplete: "off", value: token, onChange: (e) => {
          setToken(e.target.value);
          setError(null);
        }, onKeyDown: (e) => {
          if (e.key === "Enter") connectAndSave();
        }, placeholder: "Paste token here", className: "min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowToken((v) => !v), className: "grid h-11 w-11 place-items-center text-muted-foreground hover:text-foreground", "aria-label": showToken ? "Hide token" : "Show token", children: showToken ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" }) })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-2 rounded-xl border border-down/30 bg-down/10 p-3 text-xs text-down", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "mt-0.5 h-4 w-4 shrink-0" }),
      /* @__PURE__ */ jsx("p", { children: error })
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: connectAndSave, disabled: saving || !token.trim(), className: "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: saving ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      "Connect & save ",
      /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
    ] }) })
  ] }) });
}
export {
  Onboarding as component
};
