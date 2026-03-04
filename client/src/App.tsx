import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Shells
import PublicShell from "./components/PublicShell";
import AppShell from "./components/AppShell";

// Public pages
import PublicLeaderboard from "./pages/PublicLeaderboard";
import PublicNewGoals from "./pages/PublicNewGoals";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Authenticated pages
import MyBucketList from "./pages/MyBucketList";
import AppLeaderboard from "./pages/AppLeaderboard";
import AppNewGoals from "./pages/AppNewGoals";
import AppAbout from "./pages/AppAbout";
import Settings from "./pages/Settings";

// ─── Auth guard ───────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={32} style={{ color: "oklch(0.45 0.03 70)" }} />
          <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em", fontSize: "1.15rem", color: "oklch(0.45 0.03 70)" }}>
            Loading your list...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

// ─── Router ───────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        <PublicShell>
          <PublicLeaderboard />
        </PublicShell>
      </Route>

      <Route path="/new-goals">
        <PublicShell>
          <PublicNewGoals />
        </PublicShell>
      </Route>

      <Route path="/about">
        <PublicShell>
          <About />
        </PublicShell>
      </Route>

      <Route path="/login">
        <PublicShell>
          <Login />
        </PublicShell>
      </Route>

      <Route path="/signup">
        <PublicShell>
          <Signup />
        </PublicShell>
      </Route>

      {/* Authenticated routes */}
      <Route path="/app">
        <RequireAuth>
          <AppShell>
            <MyBucketList />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route path="/app/leaderboard">
        <RequireAuth>
          <AppShell>
            <AppLeaderboard />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route path="/app/new-goals">
        <RequireAuth>
          <AppShell>
            <AppNewGoals />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route path="/app/about">
        <RequireAuth>
          <AppShell>
            <AppAbout />
          </AppShell>
        </RequireAuth>
      </Route>

      <Route path="/app/settings">
        <RequireAuth>
          <AppShell>
            <Settings />
          </AppShell>
        </RequireAuth>
      </Route>

      {/* Fallback */}
      <Route>
        <PublicShell>
          <div className="py-16 text-center">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
              PAGE_NOT_FOUND
            </h2>
            <p className="text-muted-foreground mb-6" style={{ fontFamily: "'Courier Prime', monospace" }}>
              This page doesn't exist in your bucket list.
            </p>
            <a href="/">
              <button className="sketch-button px-6 py-2 bg-foreground text-background">
                Go home →
              </button>
            </a>
          </div>
        </PublicShell>
      </Route>
    </Switch>
  );
}

// ─── App ──────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.95rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                borderRadius: "4px 8px 6px 7px / 7px 5px 8px 4px",
                boxShadow: "3px 3px 0 oklch(0.22 0.02 60 / 0.2)",
              },
              classNames: {
                error: "!bg-red-100 !text-red-800 !border-2 !border-red-500",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
