import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  LogOut,
  Settings,
  Star,
  ChevronDown,
  Github,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const appNavItems = [
  { label: "My List", href: "/app" },
  { label: "Leaderboard", href: "/app/leaderboard" },
  { label: "New Goals", href: "/app/new-goals" },
  { label: "About", href: "/app/about" },
];

interface ProgressBadgeProps {
  total: number;
  achieved: number;
  rank?: number | null;
}

function ProgressBadge({ total, achieved, rank }: ProgressBadgeProps) {
  const pct = total > 0 ? Math.round((achieved / total) * 100) : 0;
  return (
    <div className="sketch-border px-3 h-16 flex items-center gap-3 bg-background/80">
      <div className="flex flex-col items-center">
        <span className="text-xs opacity-60" style={{ fontFamily: "'Courier Prime', monospace" }}>progress</span>
        <span className="text-lg font-bold leading-none" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
          {pct}%
        </span>
      </div>
      <div className="w-px h-8 bg-border opacity-50" />
      <div className="flex flex-col">
        <div className="sketch-progress w-24">
          <div className="sketch-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs opacity-50 mt-0.5" style={{ fontFamily: "'Courier Prime', monospace" }}>
          {achieved}/{total} goals
        </span>
      </div>
      {rank != null && (
        <>
          <div className="w-px h-8 bg-border opacity-50" />
          <div className="flex flex-col items-center">
            <span className="text-xs opacity-60" style={{ fontFamily: "'Courier Prime', monospace" }}>rank</span>
            <span className="text-lg font-bold leading-none" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
              #{rank}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const creditsRef = useRef<HTMLDivElement | null>(null);
  const { user, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  const statsQuery = trpc.bucketList.stats.useQuery(undefined, {
    enabled: !!user,
  });

  const stats = statsQuery.data;

  const displayName = user?.name?.split(" ")[0] ?? "Explorer";
  const initials = (user?.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeIfOutside = (event: MouseEvent | TouchEvent) => {
      if (!accountMenuRef.current) return;
      if (!accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("touchstart", closeIfOutside);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("touchstart", closeIfOutside);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!creditsOpen) return;
    const closeIfOutside = (event: MouseEvent | TouchEvent) => {
      if (!creditsRef.current) return;
      if (!creditsRef.current.contains(event.target as Node)) {
        setCreditsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("touchstart", closeIfOutside);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("touchstart", closeIfOutside);
    };
  }, [creditsOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setAccountMenuOpen(false);
      setCreditsOpen(false);
      setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-6 px-4">
      <div
        className="w-full max-w-3xl sketch-card thin-typography relative flex flex-col overflow-hidden"
        style={{ minHeight: "80vh" }}
      >
        {/* Header */}
        <div className="relative z-30 px-4 md:px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            {/* Title */}
            <Link href="/app">
              <div className="flex flex-col cursor-pointer">
                <span
                  className="app-brand-title text-3xl font-bold leading-tight tracking-wider"
                  style={{ fontFamily: "'Space Mono', monospace", color: "oklch(0.18 0.02 60)", fontWeight: 700 }}
                >
                  [BUCKET_LIST]
                </span>
              </div>
            </Link>

            {/* Desktop right side */}
            <div className="hidden md:flex items-stretch gap-3">
              {stats && (
                <ProgressBadge
                  total={stats.total}
                  achieved={stats.achieved}
                  rank={stats.rank}
                />
              )}

              {/* Profile popover */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className="sketch-button h-16 flex items-center gap-2 px-2.5 bg-background min-w-[5.5rem] justify-center"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                  aria-expanded={accountMenuOpen}
                  aria-label="Account menu"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: "oklch(0.78 0.14 75)",
                      color: "oklch(0.18 0.02 60)",
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 700,
                    }}
                  >
                    {initials}
                  </div>
                  <ChevronDown size={14} className="opacity-60" />
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="sketch-border absolute right-0 top-[calc(100%+0.5rem)] w-52 p-2 z-[120] bg-[oklch(0.97_0.018_82)]"
                    >
                      <div className="px-3 py-2">
                        <p
                          className="text-base leading-none truncate"
                          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                        >
                          {displayName}
                        </p>
                        <p
                          className="text-xs mt-1 opacity-60 truncate"
                          style={{ fontFamily: "'Courier Prime', monospace" }}
                        >
                          {user?.email}
                        </p>
                      </div>
                      <div className="pencil-line my-1" />
                      <Link href="/app/settings">
                        <button
                          type="button"
                          onClick={() => setAccountMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
                          style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.25rem", fontWeight: 700 }}
                        >
                          <Settings size={16} />
                          Settings
                        </button>
                      </Link>
                      <div className="pencil-line my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          logoutMutation.mutate();
                        }}
                        className="w-full text-left px-3 py-2 rounded hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                        style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.25rem", fontWeight: 700 }}
                      >
                        <LogOut size={16} />
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden sketch-button p-2 bg-background mt-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 mt-4">
            {appNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`nav-link px-3 py-1 rounded transition-colors ${
                    location === item.href
                      ? "active text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <span className="nav-link-label">{item.label}</span>
                </span>
              </Link>
            ))}
          </nav>

          {/* Mobile nav */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="md:hidden absolute right-0 top-[calc(100%+0.4rem)] z-[120] w-1/2 overflow-visible"
              >
                <div className="sketch-border mt-2 p-2 bg-[oklch(0.97_0.018_82)]">
                  <div className="px-3 py-2">
                    <p
                      className="text-base leading-none truncate"
                      style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                    >
                      {displayName}
                    </p>
                    <p
                      className="text-xs mt-1 opacity-60 truncate"
                      style={{ fontFamily: "'Courier Prime', monospace" }}
                    >
                      {user?.email}
                    </p>
                  </div>
                  <div className="pencil-line my-1" />
                  {stats && (
                    <div className="px-2 pb-2">
                      <ProgressBadge total={stats.total} achieved={stats.achieved} rank={stats.rank} />
                    </div>
                  )}
                  {appNavItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <span
                        className={`nav-link block px-2 py-2 rounded ${
                          location === item.href ? "active" : "text-muted-foreground"
                        }`}
                        onClick={() => setMobileOpen(false)}
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        <span className="nav-link-label">{item.label}</span>
                      </span>
                    </Link>
                  ))}
                  <div className="pencil-line my-2" />
                  <Link href="/app/settings">
                    <button
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
                      style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.05rem", fontWeight: 700 }}
                    >
                      <Settings size={15} />
                      Settings
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logoutMutation.mutate();
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                    style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.05rem", fontWeight: 700 }}
                  >
                    <LogOut size={15} />
                    Log out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pencil-line mt-5" />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 px-4 md:px-6 pb-6 flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="relative z-10 px-4 md:px-6 pb-4 mt-auto">
          <div className="pencil-line mb-3" />
          <div className="flex justify-between items-center text-xs opacity-50" style={{ fontFamily: "'Courier Prime', monospace" }}>
            <span>© {new Date().getFullYear()} My Bucket List</span>
            <span className="flex items-center gap-1">
              <Star size={10} fill="currentColor" /> dream big
            </span>
          </div>
        </div>
      </div>

      {/* Bottom-right credits */}
      <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2" ref={creditsRef}>
        <AnimatePresence>
          {creditsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="sketch-card px-4 py-3 w-[260px]"
            >
              <p
                className="text-sm font-bold"
                style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.04em" }}
              >
                Built by harut-san
              </p>
              <p
                className="text-xs mt-1 opacity-70"
                style={{ fontFamily: "'Courier Prime', monospace" }}
              >
                Crafted with sketch vibes and clean interactions.
              </p>
              <a
                href="https://github.com/harut-san"
                target="_blank"
                rel="noreferrer"
                className="sketch-button inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-background text-xs"
                style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
              >
                <Github size={13} />
                GitHub profile
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          aria-label={creditsOpen ? "Hide credits" : "Show credits"}
          onClick={() => setCreditsOpen((prev) => !prev)}
          className="sketch-button h-10 w-10 flex items-center justify-center bg-background/95"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <Star size={16} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
