import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter, useLocation, Link } from "@tanstack/react-router";
import { Activity, LayoutDashboard, LineChart, History, Settings, LogOut } from "lucide-react";
import { u as useAuth } from "./router-BBK6EZ8W.js";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/terminal", label: "Terminal", icon: Activity },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings }
];
function AppShell({ children }) {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const loc = useLocation();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-svh bg-background text-foreground selection:bg-primary/30 selection:text-primary", children: [
    /* @__PURE__ */ jsxs("aside", { className: "fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/40 bg-surface/60 backdrop-blur-2xl md:flex md:flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-6 py-8", children: [
        /* @__PURE__ */ jsx("div", { className: "relative grid h-9 w-9 place-items-center rounded bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.2)]", children: /* @__PURE__ */ jsx(Activity, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-display text-xl font-bold tracking-tighter uppercase leading-none", children: "Tickwise" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-primary/60", children: "System_V1.0" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "mt-4 flex-1 space-y-1 px-4", children: NAV.map((n) => {
        const active = loc.pathname.startsWith(n.to);
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: n.to,
            className: cn(
              "flex items-center gap-3 rounded px-3 py-2.5 text-[11px] font-mono uppercase tracking-widest transition-all",
              active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            ),
            children: [
              /* @__PURE__ */ jsx(n.icon, { className: "h-4 w-4" }),
              n.label
            ]
          },
          n.to
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-auto border-t border-border/40 p-4 bg-muted/10", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/profile",
            className: "group flex items-center gap-3 rounded border border-transparent p-2 hover:border-border/60 hover:bg-muted/30 transition-all",
            children: [
              /* @__PURE__ */ jsx("div", { className: "grid h-8 w-8 place-items-center rounded bg-muted font-mono text-xs font-bold text-muted-foreground group-hover:text-foreground", children: user?.email?.[0]?.toUpperCase() ?? "?" }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("div", { className: "truncate font-mono text-[10px] uppercase tracking-widest font-bold text-foreground", children: user?.email?.split("@")[0] ?? "TRADER_00" }),
                /* @__PURE__ */ jsx("div", { className: "text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60", children: "Profile_Admin" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: async () => {
              await signOut();
              router.navigate({ to: "/" });
            },
            className: "mt-3 flex w-full items-center gap-3 px-3 py-2 text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-down transition-colors",
            children: [
              /* @__PURE__ */ jsx(LogOut, { className: "h-3.5 w-3.5" }),
              " Log_out_Engine"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-40 flex items-center justify-between border-b border-border/40 bg-background/80 px-6 py-4 backdrop-blur-xl md:hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-8 w-8 place-items-center rounded bg-primary text-primary-foreground", children: /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsx("span", { className: "font-display text-lg font-bold tracking-tighter uppercase", children: "Tickwise" })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/profile", className: "grid h-8 w-8 place-items-center rounded bg-muted font-mono text-xs font-bold", children: user?.email?.[0]?.toUpperCase() ?? "?" })
    ] }),
    /* @__PURE__ */ jsx("main", { className: "md:pl-64", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-6 pb-32 pt-8 md:px-10 md:py-10", children }) }),
    /* @__PURE__ */ jsx("nav", { className: "fixed inset-x-4 bottom-4 z-50 md:hidden", children: /* @__PURE__ */ jsx("div", { className: "mx-auto flex max-w-md items-center justify-around rounded-lg border border-border/60 bg-surface/80 p-1 backdrop-blur-2xl shadow-2xl", children: NAV.map((n) => {
      const active = loc.pathname.startsWith(n.to);
      return /* @__PURE__ */ jsxs(
        Link,
        {
          to: n.to,
          className: cn(
            "flex flex-1 flex-col items-center gap-1 rounded py-2 transition-all",
            active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground"
          ),
          children: [
            /* @__PURE__ */ jsx(n.icon, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "font-mono text-[8px] font-bold uppercase tracking-widest", children: n.label })
          ]
        },
        n.to
      );
    }) }) })
  ] });
}
function PageHeader({ title, subtitle, action }) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-end justify-between gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-black uppercase tracking-tighter sm:text-4xl", children: title }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: subtitle })
    ] }),
    action
  ] });
}
function Panel({ children, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("panel p-6", className), children });
}
function StatCard({
  label,
  value,
  delta,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "panel p-5", children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: cn(
      "mt-2 font-display text-3xl font-bold tabular-nums tracking-tight",
      accent === "up" && "text-up",
      accent === "down" && "text-down",
      accent === "primary" && "text-primary"
    ), children: value }),
    delta && /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60", children: delta })
  ] });
}
export {
  AppShell as A,
  PageHeader as P,
  StatCard as S,
  Panel as a
};
