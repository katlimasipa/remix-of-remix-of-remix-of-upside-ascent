import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, Zap, BarChart3, ShieldCheck } from "lucide-react";
function Landing() {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-svh selection:bg-primary/30 selection:text-primary", children: [
    /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-6 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]", children: [
          /* @__PURE__ */ jsx(Activity, { className: "h-5 w-5" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-background bg-up" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "font-display text-xl font-bold tracking-tighter uppercase", children: "Tickwise" })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "hidden items-center gap-8 md:flex", children: ["Terminal", "Analytics", "Strategy"].map((item) => /* @__PURE__ */ jsx("a", { href: "#", className: "text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors", children: item }, item)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(Link, { to: "/login", className: "hidden text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground sm:inline-flex", children: "Log_in" }),
        /* @__PURE__ */ jsx(Link, { to: "/signup", className: "rounded-sm bg-primary px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110 active:scale-95 transition-all", children: "Initialize" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { children: [
      /* @__PURE__ */ jsxs("section", { className: "relative border-b border-border/40 overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "grid-bg absolute inset-0" }),
        /* @__PURE__ */ jsx("div", { className: "relative mx-auto max-w-7xl px-6 py-24 lg:py-32", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-12 lg:flex-row lg:items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary", children: [
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" }),
              "System Status: Operational"
            ] }),
            /* @__PURE__ */ jsxs("h1", { className: "max-w-3xl font-display text-5xl font-black leading-[0.9] tracking-tighter sm:text-7xl lg:text-8xl", children: [
              "TICK_BASED ",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/30", children: "EXECUTION" }),
              " ",
              /* @__PURE__ */ jsx("br", {}),
              "ENGINE_V1"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "max-w-xl text-lg leading-relaxed text-muted-foreground/80 font-medium", children: "A high-frequency workspace for speculative tick strategies. Real-time Martingale logic, sub-second latency, and industrial-grade session analytics." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4 pt-4", children: [
              /* @__PURE__ */ jsx(Link, { to: "/signup", className: "btn-mono relative overflow-hidden bg-foreground px-8 py-4 text-background group", children: /* @__PURE__ */ jsxs("span", { className: "relative z-10 flex items-center gap-2", children: [
                "Start_Trading ",
                /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" })
              ] }) }),
              /* @__PURE__ */ jsx(Link, { to: "/login", className: "btn-mono border border-border bg-background px-8 py-4 text-foreground hover:bg-muted transition-colors", children: "Access_Terminal" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 lg:pl-12", children: /* @__PURE__ */ jsxs("div", { className: "panel relative overflow-hidden border-border/60 bg-surface/80 p-1 shadow-2xl", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "h-2.5 w-2.5 rounded-full bg-destructive/40" }),
                /* @__PURE__ */ jsx("div", { className: "h-2.5 w-2.5 rounded-full bg-warn/40" }),
                /* @__PURE__ */ jsx("div", { className: "h-2.5 w-2.5 rounded-full bg-up/40" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "font-mono text-[9px] uppercase tracking-widest text-muted-foreground", children: "LIVE_SESSION_MONITOR" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4 p-6", children: [
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4", children: [{
                label: "NET_PNL",
                value: "+$412.80",
                color: "text-up"
              }, {
                label: "WIN_RATE",
                value: "68.2%",
                color: "text-primary"
              }, {
                label: "EXPOSURE",
                value: "$1.00",
                color: ""
              }, {
                label: "STEP_LVL",
                value: "L0",
                color: ""
              }].map((s) => /* @__PURE__ */ jsxs("div", { className: "border-l-2 border-border/40 pl-4 py-1", children: [
                /* @__PURE__ */ jsx("div", { className: "font-mono text-[9px] uppercase tracking-widest text-muted-foreground", children: s.label }),
                /* @__PURE__ */ jsx("div", { className: `mt-1 font-display text-2xl font-bold tabular-nums ${s.color}`, children: s.value })
              ] }, s.label)) }),
              /* @__PURE__ */ jsx("div", { className: "h-32 rounded bg-muted/20 border border-border/20 flex items-end gap-1 p-2", children: Array.from({
                length: 24
              }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "flex-1 bg-primary/20 rounded-t-sm transition-all hover:bg-primary/40", style: {
                height: `${20 + Math.random() * 80}%`
              } }, i)) }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 h-10 rounded-sm bg-up/90 flex items-center justify-center font-mono text-[10px] font-bold text-up-foreground uppercase tracking-widest", children: "Buy_Ups" }),
                /* @__PURE__ */ jsx("div", { className: "flex-1 h-10 rounded-sm bg-down/90 flex items-center justify-center font-mono text-[10px] font-bold text-down-foreground uppercase tracking-widest", children: "Buy_Downs" })
              ] })
            ] })
          ] }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-6 py-24", children: /* @__PURE__ */ jsx("div", { className: "grid gap-1 bg-border/40 p-1 md:grid-cols-3", children: [{
        icon: Zap,
        title: "MARTINGALE_ENGINE",
        body: "Configurable multiplier, max-level caps, and reset-on-win logic enforced at the kernel level."
      }, {
        icon: BarChart3,
        title: "DATA_VISUALS",
        body: "Live ROI, win rate, and average duration metrics tracked via sub-second tick telemetry."
      }, {
        icon: ShieldCheck,
        title: "RISK_CONTROL",
        body: "Automated take-profit and stop-loss guardrails designed for disciplined session management."
      }].map((f) => /* @__PURE__ */ jsxs("div", { className: "bg-background p-8 space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex h-10 w-10 items-center justify-center rounded-sm bg-muted text-primary", children: /* @__PURE__ */ jsx(f.icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold tracking-tight uppercase", children: f.title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted-foreground", children: f.body }),
        /* @__PURE__ */ jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsx("div", { className: "h-px w-8 bg-primary/30" }) })
      ] }, f.title)) }) })
    ] }),
    /* @__PURE__ */ jsx("footer", { className: "border-t border-border/40 bg-muted/10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4 md:items-start", children: [
        /* @__PURE__ */ jsx("div", { className: "font-display text-lg font-bold tracking-tighter uppercase", children: "Tickwise" }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-mono uppercase tracking-widest text-muted-foreground", children: [
          "© ",
          (/* @__PURE__ */ new Date()).getFullYear(),
          " TERMINAL_ACCESS_AUTHORIZED"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-8", children: ["Privacy", "Terms", "Documentation"].map((l) => /* @__PURE__ */ jsx("a", { href: "#", className: "text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground", children: l }, l)) }),
      /* @__PURE__ */ jsx("a", { href: "https://architeq.co.za", target: "_blank", rel: "noreferrer", className: "font-mono text-[10px] uppercase tracking-widest text-primary/60 hover:text-primary", children: "Built_by_Architeq" })
    ] }) })
  ] });
}
export {
  Landing as component
};
