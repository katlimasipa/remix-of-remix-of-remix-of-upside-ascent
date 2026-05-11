import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthLayout, Field } from "./login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — Tickwise" }] }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase will set a session from the recovery hash automatically
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) setReady(true);
    else setReady(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    nav({ to: "/dashboard" });
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">New password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Set a strong new password to continue.</p>
      {ready && (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="New password">
            <input type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)} className="input-base" placeholder="Min. 8 characters" />
          </Field>
          <button disabled={loading} className="btn-primary w-full">{loading ? "Updating…" : "Update password"}</button>
        </form>
      )}
    </AuthLayout>
  );
}
