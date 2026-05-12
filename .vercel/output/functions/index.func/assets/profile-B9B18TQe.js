import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { u as useAuth } from "./router-BBK6EZ8W.js";
import { P as PageHeader, a as Panel } from "./app-shell-e3Gf78kX.js";
import { LogOut } from "lucide-react";
import "@tanstack/react-query";
import "sonner";
import "react";
import "@supabase/supabase-js";
import "clsx";
import "tailwind-merge";
function Profile() {
  const {
    user,
    signOut
  } = useAuth();
  const nav = useNavigate();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Profile", subtitle: "Your trader identity." }),
    /* @__PURE__ */ jsxs(Panel, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-16 w-16 place-items-center rounded-full bg-accent font-display text-2xl", children: user?.email?.[0]?.toUpperCase() ?? "T" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-display text-xl", children: user?.user_metadata?.display_name ?? "Trader" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: user?.email })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: async () => {
        await signOut();
        nav({
          to: "/"
        });
      }, className: "mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent", children: [
        /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" }),
        " Sign out"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { className: "mt-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-semibold", children: "About this terminal" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Tickwise is a focused workspace for Ups & Downs-style trading strategies. All price action is locally simulated for education and strategy testing." })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "mt-8 text-center text-xs text-muted-foreground", children: [
      "Built by",
      " ",
      /* @__PURE__ */ jsx("a", { href: "https://architeq.co.za", target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: "Architeq Web Agency" })
    ] })
  ] });
}
export {
  Profile as component
};
