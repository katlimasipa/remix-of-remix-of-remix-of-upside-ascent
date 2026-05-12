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
      toast.success("AUTH_SUCCESS: Session initialized");
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "AUTH_ERROR: Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-1">
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter">Authorize_</h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Access_Engine_Terminal</p>
      </div>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <Field label="Identity_Email">
          <input
            type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            placeholder="ACCESS@KERNEL.IO"
          />
        </Field>
        <Field label="Access_Key">
          <input
            type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            placeholder="••••••••"
          />
        </Field>
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
          <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-primary" />
            Persist_Session
          </label>
          <Link to="/forgot-password" size="sm" className="text-primary/60 hover:text-primary">Key_Recovery</Link>
        </div>
        <button disabled={loading} className="btn-primary w-full relative group overflow-hidden">
          <span className="relative z-10">{loading ? "INITIALIZING..." : "EXECUTE_SIGN_IN"}</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </form>
      <div className="mt-8 pt-8 border-t border-border/40">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          New_Unit? <Link to="/signup" className="text-primary hover:text-primary/80 font-bold underline-offset-4 underline">Register_Module</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh md:grid-cols-2 bg-background selection:bg-primary/30 selection:text-primary">
      <div className="relative hidden overflow-hidden md:block border-r border-border/40">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative flex h-full flex-col justify-between p-12 bg-muted/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              <Activity className="h-5 w-5" />
            </div>
            <div className="font-display text-2xl font-bold tracking-tighter uppercase">Tickwise</div>
          </Link>
          
          <div className="space-y-4">
            <div className="h-px w-12 bg-primary/40" />
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60">Execution_Telemetry_Live</div>
            <h2 className="max-w-md font-display text-5xl font-black leading-[0.95] tracking-tighter uppercase">
              Speed.<br />
              <span className="text-muted-foreground/20">Discipline.</span><br />
              Result.
            </h2>
            <p className="max-w-xs text-xs font-mono uppercase tracking-widest text-muted-foreground leading-relaxed">
              Industrial-grade tick engine for sub-second speculative execution.
            </p>
          </div>
          
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40">© ACCESS_RESERVED_V1.0</div>
        </div>
      </div>
      <div className="flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-[340px]">
          <Link to="/" className="mb-12 flex items-center gap-3 md:hidden">
            <div className="grid h-10 w-10 place-items-center rounded bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tighter uppercase">Tickwise</span>
          </Link>
          {children}
          <style>{`
            .input-base { width:100%; background: var(--input); border:1px solid var(--border); border-radius: 4px; padding: 0.8rem 1rem; font-size: 0.85rem; color: var(--foreground); outline: none; transition: all .2s; font-family: var(--font-mono); }
            .input-base:focus { border-color: var(--primary); background: var(--surface); }
            .btn-primary { background: var(--primary); color: var(--primary-foreground); border-radius: 4px; padding: 1rem; font-weight: 900; font-size: 0.75rem; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.2em; transition: all .2s; }
            .btn-primary:hover { brightness: 1.1; box-shadow: 0 0 20px color-mix(in oklch, var(--primary) 20%, transparent); } 
            .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
