import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { u as useAuth, A as AuthLayout, F as Field } from "./router-BBK6EZ8W.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@supabase/supabase-js";
import "lucide-react";
function Forgot() {
  const {
    resetPassword
  } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Reset link sent if the account exists.");
    } catch (e2) {
      toast.error(e2?.message ?? "Could not send reset link");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs(AuthLayout, { children: [
    /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight", children: "Reset password" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "We'll email you a link to set a new password." }),
    sent ? /* @__PURE__ */ jsx("div", { className: "panel mt-8 p-4 text-sm", children: "Check your inbox for a reset link." }) : /* @__PURE__ */ jsxs("form", { onSubmit, className: "mt-8 space-y-4", children: [
      /* @__PURE__ */ jsx(Field, { label: "Email", children: /* @__PURE__ */ jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "input-base", placeholder: "you@trader.io" }) }),
      /* @__PURE__ */ jsx("button", { disabled: loading, className: "btn-primary w-full", children: loading ? "Sending…" : "Send reset link" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-6 text-sm text-muted-foreground", children: /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-primary hover:underline", children: "Back to sign in" }) })
  ] });
}
export {
  Forgot as component
};
