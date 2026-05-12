import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { u as useAuth, A as AuthLayout, F as Field } from "./router-BBK6EZ8W.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@supabase/supabase-js";
import "lucide-react";
function Signup() {
  const {
    signUp,
    signIn
  } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 8) return toast.error("VALIDATION_ERROR: Access key too short");
    setLoading(true);
    try {
      await signUp(email, password, name);
      try {
        await signIn(email, password);
      } catch {
      }
      toast.success("INIT_SUCCESS: Unit registered");
      nav({
        to: "/dashboard"
      });
    } catch (e2) {
      toast.error(e2?.message ?? "INIT_ERROR: Registration failed");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs(AuthLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-4xl font-black uppercase tracking-tighter", children: "Register_" }),
      /* @__PURE__ */ jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: "Initialize_New_Module" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit, className: "mt-10 space-y-5", children: [
      /* @__PURE__ */ jsx(Field, { label: "Unit_Handle", children: /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), required: true, className: "input-base", placeholder: "TRADER_ALPHA" }) }),
      /* @__PURE__ */ jsx(Field, { label: "Identity_Email", children: /* @__PURE__ */ jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "input-base", placeholder: "ACCESS@KERNEL.IO" }) }),
      /* @__PURE__ */ jsx(Field, { label: "Access_Key", children: /* @__PURE__ */ jsx("input", { type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "input-base", placeholder: "MIN_08_CHARS" }) }),
      /* @__PURE__ */ jsxs("button", { disabled: loading, className: "btn-primary w-full relative group overflow-hidden", children: [
        /* @__PURE__ */ jsx("span", { className: "relative z-10", children: loading ? "REGISTERING..." : "INITIALIZE_ACCOUNT" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 pt-8 border-t border-border/40", children: /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground", children: [
      "Existing_Unit? ",
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-primary hover:text-primary/80 font-bold underline-offset-4 underline", children: "Authorize_Access" })
    ] }) })
  ] });
}
export {
  Signup as component
};
