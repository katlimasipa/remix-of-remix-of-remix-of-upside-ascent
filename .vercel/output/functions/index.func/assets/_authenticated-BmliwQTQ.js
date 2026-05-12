import { jsx } from "react/jsx-runtime";
import { useNavigate, useLocation, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { u as useAuth, s as supabase } from "./router-BBK6EZ8W.js";
import { A as AppShell } from "./app-shell-e3Gf78kX.js";
import "@tanstack/react-query";
import "sonner";
import "@supabase/supabase-js";
import "lucide-react";
import "clsx";
import "tailwind-merge";
function AuthLayout() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const isOnboarding = loc.pathname.startsWith("/onboarding");
  useEffect(() => {
    if (!loading && !user && !isOnboarding) navigate({
      to: "/login"
    });
  }, [user, loading, navigate, isOnboarding]);
  useEffect(() => {
    if (!user) return;
    if (isOnboarding) return;
    supabase.from("profiles").select("deriv_api_token").eq("id", user.id).maybeSingle().then(({
      data
    }) => {
      if (!data?.deriv_api_token) navigate({
        to: "/onboarding"
      });
    });
  }, [user, isOnboarding, navigate]);
  if (isOnboarding) {
    return /* @__PURE__ */ jsx(Outlet, {});
  }
  if (loading || !user) {
    return /* @__PURE__ */ jsx("div", { className: "grid min-h-svh place-items-center", children: /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-muted-foreground", children: "loading terminal…" }) });
  }
  return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(Outlet, {}) });
}
export {
  AuthLayout as component
};
