import { jsxs, jsx } from "react/jsx-runtime";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { u as useAuth } from "./router-BBK6EZ8W.js";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import "@tanstack/react-query";
import "@supabase/supabase-js";
function Login() {
  const {
    signIn
  } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("AUTH_SUCCESS: Session initialized");
      nav({
        to: "/dashboard"
      });
    } catch (e2) {
      toast.error(e2?.message ?? "AUTH_ERROR: Invalid credentials");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs(AuthLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-4xl font-black uppercase tracking-tighter", children: "Authorize_" }),
      /* @__PURE__ */ jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: "Access_Engine_Terminal" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit, className: "mt-10 space-y-5", children: [
      /* @__PURE__ */ jsx(Field, { label: "Identity_Email", children: /* @__PURE__ */ jsx("input", { type: "email", required: true, autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "input-base", placeholder: "ACCESS@KERNEL.IO" }) }),
      /* @__PURE__ */ jsx(Field, { label: "Access_Key", children: /* @__PURE__ */ jsx("input", { type: "password", required: true, autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), className: "input-base", placeholder: "••••••••" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] font-mono uppercase tracking-widest", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: remember, onChange: (e) => setRemember(e.target.checked), className: "accent-primary" }),
          "Persist_Session"
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/forgot-password", size: "sm", className: "text-primary/60 hover:text-primary", children: "Key_Recovery" })
      ] }),
      /* @__PURE__ */ jsxs("button", { disabled: loading, className: "btn-primary w-full relative group overflow-hidden", children: [
        /* @__PURE__ */ jsx("span", { className: "relative z-10", children: loading ? "INITIALIZING..." : "EXECUTE_SIGN_IN" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 pt-8 border-t border-border/40", children: /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground", children: [
      "New_Unit? ",
      /* @__PURE__ */ jsx(Link, { to: "/signup", className: "text-primary hover:text-primary/80 font-bold underline-offset-4 underline", children: "Register_Module" })
    ] }) })
  ] });
}
function AuthLayout({
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "grid min-h-svh md:grid-cols-2 bg-background selection:bg-primary/30 selection:text-primary", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative hidden overflow-hidden md:block border-r border-border/40", children: [
      /* @__PURE__ */ jsx("div", { className: "grid-bg absolute inset-0 opacity-40" }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex h-full flex-col justify-between p-12 bg-muted/5", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "relative grid h-10 w-10 place-items-center rounded bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]", children: /* @__PURE__ */ jsx(Activity, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("div", { className: "font-display text-2xl font-bold tracking-tighter uppercase", children: "Tickwise" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-px w-12 bg-primary/40" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60", children: "Execution_Telemetry_Live" }),
          /* @__PURE__ */ jsxs("h2", { className: "max-w-md font-display text-5xl font-black leading-[0.95] tracking-tighter uppercase", children: [
            "Speed.",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/20", children: "Discipline." }),
            /* @__PURE__ */ jsx("br", {}),
            "Result."
          ] }),
          /* @__PURE__ */ jsx("p", { className: "max-w-xs text-xs font-mono uppercase tracking-widest text-muted-foreground leading-relaxed", children: "Industrial-grade tick engine for sub-second speculative execution." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40", children: "© ACCESS_RESERVED_V1.0" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center px-8 py-12", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-[340px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "mb-12 flex items-center gap-3 md:hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-10 w-10 place-items-center rounded bg-primary text-primary-foreground", children: /* @__PURE__ */ jsx(Activity, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-display text-2xl font-bold tracking-tighter uppercase", children: "Tickwise" })
      ] }),
      children,
      /* @__PURE__ */ jsx("style", { children: `
            .input-base { width:100%; background: var(--input); border:1px solid var(--border); border-radius: 4px; padding: 0.8rem 1rem; font-size: 0.85rem; color: var(--foreground); outline: none; transition: all .2s; font-family: var(--font-mono); }
            .input-base:focus { border-color: var(--primary); background: var(--surface); }
            .btn-primary { background: var(--primary); color: var(--primary-foreground); border-radius: 4px; padding: 1rem; font-weight: 900; font-size: 0.75rem; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.2em; transition: all .2s; }
            .btn-primary:hover { brightness: 1.1; box-shadow: 0 0 20px color-mix(in oklch, var(--primary) 20%, transparent); } 
            .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
          ` })
    ] }) })
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block space-y-2", children: [
    /* @__PURE__ */ jsx("span", { className: "block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground", children: label }),
    children
  ] });
}
export {
  AuthLayout,
  Field,
  Login as component
};
