import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Tickwise" }] }),
  component: Login,
});

function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back.");
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Continue your trading session.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email">
          <input
            type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            placeholder="you@trader.io"
          />
        </Field>
        <Field label="Password">
          <input
            type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            placeholder="••••••••"
          />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-primary" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </div>
        <button disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh md:grid-cols-2">
      <div className="relative hidden overflow-hidden md:block">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Activity className="h-4 w-4" /></div>
            <span className="font-display text-lg font-semibold">Tickwise</span>
          </Link>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">a focused trading terminal</div>
            <h2 className="mt-3 max-w-md font-display text-3xl font-semibold leading-tight">Ups, downs, and the discipline between them.</h2>
          </div>
          <div className="font-mono text-xs text-muted-foreground">© {new Date().getFullYear()} Tickwise</div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 md:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Activity className="h-4 w-4" /></div>
            <span className="font-display text-lg font-semibold">Tickwise</span>
          </Link>
          {children}
          <style>{`
            .input-base { width:100%; background: var(--input); border:1px solid var(--border); border-radius: 0.75rem; padding: 0.7rem 0.9rem; font-size: 0.9rem; color: var(--foreground); outline: none; transition: border-color .15s; }
            .input-base:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 25%, transparent); }
            .btn-primary { background: var(--primary); color: var(--primary-foreground); border-radius: 9999px; padding: 0.7rem 1rem; font-weight: 600; font-size: 0.9rem; transition: opacity .15s; }
            .btn-primary:hover { opacity: 0.9; } .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
