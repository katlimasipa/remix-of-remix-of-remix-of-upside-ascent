import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthLayout, Field } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Tickwise" }] }),
  component: Signup,
});

function Signup() {
  const { signUp, signIn } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await signUp(email, password, name);
      // auto-confirm is on, attempt sign-in
      try { await signIn(email, password); } catch {}
      toast.success("Account created. Welcome aboard.");
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Two minutes to set up your trader profile.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Display name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input-base" placeholder="Trader handle" />
        </Field>
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" placeholder="you@trader.io" />
        </Field>
        <Field label="Password">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" placeholder="Min. 8 characters" />
        </Field>
        <button disabled={loading} className="btn-primary w-full">{loading ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Already a member? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
