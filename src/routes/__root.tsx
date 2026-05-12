import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs tracking-widest text-muted-foreground">ERR · 404</div>
        <h1 className="mt-4 text-5xl font-semibold">Off the chart.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you tried to load doesn't exist or moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Back to base
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs tracking-widest text-down">SYSTEM ERROR</div>
        <h1 className="mt-4 text-3xl font-semibold">Something didn't load.</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5 text-sm">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1a1c24" },
      { title: "Tickwise — Ups & Downs Trading Terminal" },
      { name: "description", content: "A premium, mobile-first terminal for Ups & Downs trading: martingale engine, session analytics, real-time P&L." },
      { property: "og:title", content: "Tickwise — Ups & Downs Trading Terminal" },
      { property: "og:description", content: "A premium, mobile-first terminal for Ups & Downs trading: martingale engine, session analytics, real-time P&L." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tickwise — Ups & Downs Trading Terminal" },
      { name: "twitter:description", content: "A premium, mobile-first terminal for Ups & Downs trading: martingale engine, session analytics, real-time P&L." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/798395bb-d9a4-4479-88c9-b041febf1c4d/id-preview-825e8642--237d7ec9-6a5a-4622-8446-d1b40e03e1fb.lovable.app-1778597639938.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/798395bb-d9a4-4479-88c9-b041febf1c4d/id-preview-825e8642--237d7ec9-6a5a-4622-8446-d1b40e03e1fb.lovable.app-1778597639938.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-center" theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
