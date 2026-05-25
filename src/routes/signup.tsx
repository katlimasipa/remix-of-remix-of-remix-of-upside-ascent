import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
    if (password.length < 8) return toast.error("VALIDATION_ERROR: Access key too short");
    setLoading(true);
    try {
      await signUp(email, password, name);
      // auto-confirm is on, attempt sign-in
      try { await signIn(email, password); } catch {}
      toast.success("INIT_SUCCESS: Unit registered");
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "INIT_ERROR: Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-1">
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter">Register_</h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Initialize_New_Module</p>
      </div>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <Field label="Unit_Handle">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input-base" placeholder="TRADER_ALPHA" />
        </Field>
        <Field label="Identity_Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" placeholder="ACCESS@KERNEL.IO" />
        </Field>
        <Field label="Access_Key">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" placeholder="MIN_08_CHARS" />
        </Field>
        <button disabled={loading} className="btn-primary w-full relative group overflow-hidden">
          <span className="relative z-10">{loading ? "REGISTERING..." : "INITIALIZE_ACCOUNT"}</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </form>
      <div className="mt-8 pt-8 border-t border-border/40">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Existing_Unit? <Link to="/login" className="text-primary hover:text-primary/80 font-bold underline-offset-4 underline">Authorize_Access</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
