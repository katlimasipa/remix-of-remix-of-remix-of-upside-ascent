import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/app-shell";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Tickwise" }] }),
  component: Profile,
});

function Profile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <>
      <PageHeader title="Profile" subtitle="Your trader identity." />
      <Panel>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-accent font-display text-2xl">
            {user?.email?.[0]?.toUpperCase() ?? "T"}
          </div>
          <div>
            <div className="font-display text-xl">{user?.user_metadata?.display_name ?? "Trader"}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={async () => { await signOut(); nav({ to: "/" }); }}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </Panel>

      <Panel className="mt-4">
        <h3 className="font-display text-lg font-semibold">About this terminal</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tickwise is a focused workspace for Ups & Downs-style trading strategies. All price action is locally simulated for education and strategy testing.
        </p>
      </Panel>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Built by{" "}
        <a href="https://architeq.co.za" target="_blank" rel="noreferrer" className="text-primary hover:underline">
          Architeq Web Agency
        </a>
      </p>
    </>
  );
}
