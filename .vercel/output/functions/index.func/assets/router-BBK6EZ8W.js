import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, useRouter, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { Toaster as Toaster$1 } from "sonner";
import { useState, useEffect, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { Activity } from "lucide-react";
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function createSupabaseClient() {
  const SUPABASE_URL = "https://hcyudblctbertmrjfytn.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeXVkYmxjdGJlcnRtcmpmeXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODQwNTgsImV4cCI6MjA5NDE2MDA1OH0.VTp7n3qtaaxKGamI-twVbYimlVxoLuTKz3awiPRDnpI";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
const Ctx = createContext(null);
function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fallback = window.setTimeout(() => setLoading(false), 3e3);
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => {
      window.clearTimeout(fallback);
      sub.subscription.unsubscribe();
    };
  }, []);
  const value = {
    session,
    user: session?.user ?? null,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password, displayName) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : void 0,
          data: { display_name: displayName }
        }
      });
      if (error) throw error;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : void 0
      });
      if (error) throw error;
    }
  };
  return /* @__PURE__ */ jsx(Ctx.Provider, { value, children });
}
function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
const appCss = "/assets/styles-D20w5XOz.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-xs tracking-widest text-muted-foreground", children: "ERR · 404" }),
    /* @__PURE__ */ jsx("h1", { className: "mt-4 text-5xl font-semibold", children: "Off the chart." }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "The page you tried to load doesn't exist or moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90",
        children: "Back to base"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-xs tracking-widest text-down", children: "SYSTEM ERROR" }),
    /* @__PURE__ */ jsx("h1", { className: "mt-4 text-3xl font-semibold", children: "Something didn't load." }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: error.message }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground",
          children: "Retry"
        }
      ),
      /* @__PURE__ */ jsx("a", { href: "/", className: "rounded-full border border-border px-5 py-2.5 text-sm", children: "Home" })
    ] })
  ] }) });
}
const Route$d = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1a1c24" },
      { title: "Tickwise — Ups & Downs Trading Terminal" },
      { name: "description", content: "A premium, mobile-first terminal for Ups & Downs trading: martingale engine, session analytics, real-time P&L." },
      { property: "og:title", content: "Tickwise — Ups & Downs Trading Terminal" },
      { property: "og:description", content: "Premium mobile-first terminal for Ups & Downs trading." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [{ rel: "stylesheet", href: appCss }]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$d.useRouteContext();
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(Toaster, { richColors: true, position: "top-center", theme: "dark" })
  ] }) });
}
const $$splitComponentImporter$c = () => import("./signup-DHruylm2.js");
const Route$c = createFileRoute("/signup")({
  head: () => ({
    meta: [{
      title: "Create account — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./reset-password-DKzBKKWQ.js");
const Route$b = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{
      title: "Set new password — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./login-BtwFzDcG.js");
const Route$a = createFileRoute("/login")({
  head: () => ({
    meta: [{
      title: "Sign in — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
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
const $$splitComponentImporter$9 = () => import("./forgot-password-Dc97LKvH.js");
const Route$9 = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{
      title: "Reset password — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./_authenticated-BmliwQTQ.js");
const Route$8 = createFileRoute("/_authenticated")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./index-uURt0ykV.js");
const Route$7 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Tickwise — Ups & Downs Trading Terminal"
    }, {
      name: "description",
      content: "A premium, mobile-first terminal for Ups & Downs trading: martingale engine, session analytics, real-time P&L."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./terminal-B_CorLQS.js");
const Route$6 = createFileRoute("/_authenticated/terminal")({
  head: () => ({
    meta: [{
      title: "Terminal — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./settings-k4tR86Ob.js");
const Route$5 = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{
      title: "Settings — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./profile-B9B18TQe.js");
const Route$4 = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{
      title: "Profile — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./onboarding-CAMxEgsP.js");
const Route$3 = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [{
      title: "Connect Deriv — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./history-CsDs4-0F.js");
const Route$2 = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [{
      title: "Session History — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./dashboard-CAzraEQR.js");
const Route$1 = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{
      title: "Dashboard — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./analytics-Bi95_EJJ.js");
const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [{
      title: "Analytics — Tickwise"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SignupRoute = Route$c.update({
  id: "/signup",
  path: "/signup",
  getParentRoute: () => Route$d
});
const ResetPasswordRoute = Route$b.update({
  id: "/reset-password",
  path: "/reset-password",
  getParentRoute: () => Route$d
});
const LoginRoute = Route$a.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$d
});
const ForgotPasswordRoute = Route$9.update({
  id: "/forgot-password",
  path: "/forgot-password",
  getParentRoute: () => Route$d
});
const AuthenticatedRoute = Route$8.update({
  id: "/_authenticated",
  getParentRoute: () => Route$d
});
const IndexRoute = Route$7.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$d
});
const AuthenticatedTerminalRoute = Route$6.update({
  id: "/terminal",
  path: "/terminal",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedSettingsRoute = Route$5.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedProfileRoute = Route$4.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedOnboardingRoute = Route$3.update({
  id: "/onboarding",
  path: "/onboarding",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedHistoryRoute = Route$2.update({
  id: "/history",
  path: "/history",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDashboardRoute = Route$1.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAnalyticsRoute = Route.update({
  id: "/analytics",
  path: "/analytics",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedRouteChildren = {
  AuthenticatedAnalyticsRoute,
  AuthenticatedDashboardRoute,
  AuthenticatedHistoryRoute,
  AuthenticatedOnboardingRoute,
  AuthenticatedProfileRoute,
  AuthenticatedSettingsRoute,
  AuthenticatedTerminalRoute
};
const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  ForgotPasswordRoute,
  LoginRoute,
  ResetPasswordRoute,
  SignupRoute
};
const routeTree = Route$d._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  AuthLayout as A,
  Field as F,
  router as r,
  supabase as s,
  useAuth as u
};
