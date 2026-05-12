import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { A as AuthLayout, F as Field, s as supabase } from "./router-BBK6EZ8W.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@supabase/supabase-js";
import "lucide-react";
function Reset() {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) setReady(true);
    else setReady(true);
  }, []);
  async function onSubmit(e) {
    e.preventDefault();
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    const {
      error
    } = await supabase.auth.updateUser({
      password: pwd
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    nav({
      to: "/dashboard"
    });
  }
  return /* @__PURE__ */ jsxs(AuthLayout, { children: [
    /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight", children: "New password" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Set a strong new password to continue." }),
    ready && /* @__PURE__ */ jsxs("form", { onSubmit, className: "mt-8 space-y-4", children: [
      /* @__PURE__ */ jsx(Field, { label: "New password", children: /* @__PURE__ */ jsx("input", { type: "password", required: true, value: pwd, onChange: (e) => setPwd(e.target.value), className: "input-base", placeholder: "Min. 8 characters" }) }),
      /* @__PURE__ */ jsx("button", { disabled: loading, className: "btn-primary w-full", children: loading ? "Updating…" : "Update password" })
    ] })
  ] });
}
export {
  Reset as component
};
