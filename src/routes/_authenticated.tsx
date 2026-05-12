import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // Force first-run users through /onboarding until they connect Deriv.
  useEffect(() => {
    if (!user) return;
    if (loc.pathname.startsWith("/onboarding")) return;
    supabase
      .from("profiles")
      .select("deriv_api_token")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.deriv_api_token) navigate({ to: "/onboarding" });
      });
  }, [user, loc.pathname, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-svh place-items-center">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          loading terminal…
        </div>
      </div>
    );
  }
  return <AppShell><Outlet /></AppShell>;
}
