import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  X,
  LogOut,
  Settings,
  Star,
  ChevronDown,
  Github,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { normalizeAvatarEmoji } from "@shared/const";
import UserAvatar from "@/components/UserAvatar";

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
  compact?: boolean;
  onRankClick?: (() => void) | null;
}

function ProgressBadge({ total, achieved, rank, compact = false, onRankClick = null }: ProgressBadgeProps) {
  const pct = total > 0 ? Math.round((achieved / total) * 100) : 0;

  if (compact) {
    return (
      <div className="sketch-border px-2.5 py-2 bg-background/80">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs opacity-60" style={{ fontFamily: "'Courier Prime', monospace" }}>progress</span>
            <span className="text-2xl font-bold leading-none" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
              {pct}%
            </span>
          </div>
          {rank != null && (
            <button
              type="button"
              onClick={onRankClick ?? undefined}
              className="flex flex-col text-right min-w-[68px]"
              aria-label="Show rank insights"
            >
              <span className="text-xs opacity-60" style={{ fontFamily: "'Courier Prime', monospace" }}>rank</span>
              <span className="text-2xl font-bold leading-none" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                #{rank}
              </span>
            </button>
          )}
        </div>
        <div className="sketch-progress mt-2">
          <div className="sketch-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs opacity-60 mt-1 block" style={{ fontFamily: "'Courier Prime', monospace" }}>
          {achieved}/{total} goals
        </span>
      </div>
    );
  }

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
          <button
            type="button"
            onClick={onRankClick ?? undefined}
            className="flex flex-col items-center min-w-[70px]"
            aria-label="Show rank insights"
          >
            <span className="text-xs opacity-60" style={{ fontFamily: "'Courier Prime', monospace" }}>rank</span>
            <span className="text-lg font-bold leading-none" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
              #{rank}
            </span>
          </button>
        </>
      )}
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

function SketchDecoration() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 0 }}
    >
      <line x1="0" y1="12" x2="12" y2="0" stroke="oklch(0.22 0.02 60)" strokeWidth="1.5" strokeOpacity="0.3" />
      <line x1="0" y1="20" x2="20" y2="0" stroke="oklch(0.22 0.02 60)" strokeWidth="1" strokeOpacity="0.15" />
      <line x1="100%" y1="98.8%" x2="98.8%" y2="100%" stroke="oklch(0.22 0.02 60)" strokeWidth="1.5" strokeOpacity="0.3" />
      <line x1="100%" y1="98.2%" x2="98.2%" y2="100%" stroke="oklch(0.22 0.02 60)" strokeWidth="1" strokeOpacity="0.15" />
    </svg>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [rankInsightsOpen, setRankInsightsOpen] = useState(false);
  const [pendingOpenAddGoal, setPendingOpenAddGoal] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const creditsRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  const statsQuery = trpc.bucketList.stats.useQuery(undefined, {
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const stats = statsQuery.data;
  const usersCountQuery = trpc.leaderboard.usersCount.useQuery(undefined, {
    enabled: !!user && !!stats?.rank,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const displayName = user?.name?.split(" ")[0] ?? "Explorer";
  const avatarEmoji = normalizeAvatarEmoji(settingsQuery.data?.avatarEmoji);
  const usersCount = usersCountQuery.data?.count ?? null;
  const percentile =
    stats?.rank && usersCount ? Math.max(1, Math.round((stats.rank / usersCount) * 100)) : null;

  const cohortLabel = (() => {
    if (percentile == null) return "Goal Getter";
    if (percentile <= 5) return "Top Achiever";
    if (percentile <= 20) return "Goal Getter";
    if (percentile <= 50) return "Steady Climber";
    return "New Starter";
  })();

  const emitAddGoalEvent = () => {
    window.dispatchEvent(new CustomEvent("bucketlist:add-goal"));
  };

  const handleMobileAddGoal = () => {
    setMobileOpen(false);
    if (location === "/app") {
      emitAddGoalEvent();
      return;
    }
    setPendingOpenAddGoal(true);
    navigate("/app");
  };

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
    if (!mobileOpen) return;
    const closeIfOutside = (event: MouseEvent | TouchEvent) => {
      if (!mobileMenuRef.current) return;
      if (!mobileMenuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("touchstart", closeIfOutside);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("touchstart", closeIfOutside);
    };
  }, [mobileOpen]);

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

  useEffect(() => {
    if (!pendingOpenAddGoal || location !== "/app") return;
    const timeout = window.setTimeout(() => {
      emitAddGoalEvent();
      setPendingOpenAddGoal(false);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [location, pendingOpenAddGoal]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-5 md:p-[70px]">
      <motion.div
        layout
        transition={{ layout: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }}
        className="w-full max-w-3xl sketch-card thin-typography relative flex flex-col overflow-hidden"
        style={{ minHeight: "80vh" }}
      >
        <SketchDecoration />
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
                <span
                  className="app-brand-subtitle text-xs tracking-widest uppercase opacity-60"
                  style={{ fontFamily: "'Courier Prime', monospace", color: "oklch(0.35 0.04 70)" }}
                >
                  your life goals
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
                  onRankClick={() => setRankInsightsOpen(true)}
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
                  <UserAvatar avatarEmoji={avatarEmoji} avatarImageUrl={settingsQuery.data?.avatarImageUrl} size="sm" />
                  <ChevronDown size={14} className="opacity-60" />
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <>
                      <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="hidden md:block fixed inset-0 z-[110] bg-[oklch(0.18_0.02_60_/_0.22)]"
                        onClick={() => setAccountMenuOpen(false)}
                        aria-label="Close account menu overlay"
                      />
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
                            className="w-full sketch-button text-left px-3 py-2 transition-colors flex items-center gap-2 bg-background hover:bg-muted"
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
                          className="w-full sketch-button text-left px-3 py-2 text-destructive transition-colors flex items-center gap-2 bg-background hover:bg-destructive/10"
                          style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.25rem", fontWeight: 700 }}
                        >
                          <LogOut size={16} />
                          Log out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden relative" ref={mobileMenuRef}>
              <button
                className={`sketch-button p-2 bg-background mt-1 hamburger-button ${mobileOpen ? "open" : ""}`}
                onClick={() => setMobileOpen((open) => !open)}
                aria-label="Toggle menu"
              >
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
              </button>

              <AnimatePresence>
                {mobileOpen && (
                  <>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="fixed inset-0 z-[210] bg-[oklch(0.18_0.02_60_/_0.35)]"
                      onClick={() => setMobileOpen(false)}
                      aria-label="Close mobile menu overlay"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-[220] w-[18rem] max-w-[90vw]"
                    >
                      <div className="sketch-border p-2 bg-[oklch(0.97_0.018_82)]">
                      <div className="px-3 py-2">
                        <p className="text-base leading-none truncate" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                          {displayName}
                        </p>
                        <p className="text-xs mt-1 opacity-60 truncate" style={{ fontFamily: "'Courier Prime', monospace" }}>
                          {user?.email}
                        </p>
                      </div>
                      <div className="pencil-line my-1" />
                      {stats && (
                        <div className="px-2 pb-2">
                          <ProgressBadge
                            total={stats.total}
                            achieved={stats.achieved}
                            rank={stats.rank}
                            compact
                            onRankClick={() => {
                              setMobileOpen(false);
                              setRankInsightsOpen(true);
                            }}
                          />
                        </div>
                      )}
                      <div className="px-2 pb-2">
                        <button
                          type="button"
                          onClick={handleMobileAddGoal}
                          className="w-full sketch-button text-left px-3 py-2 my-[2px] bg-foreground text-background border-foreground"
                          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                        >
                          Add goal
                        </button>
                      </div>
                      <div className="pencil-line my-1" />
                      <div className="space-y-[2px]">
                        {appNavItems.map((item) => (
                          <Link key={item.href} href={item.href}>
                            <button
                              type="button"
                              className={`w-full sketch-button text-left px-3 py-2 my-[2px] ${
                                location === item.href ? "bg-foreground text-background border-foreground" : "text-foreground bg-background"
                              }`}
                              onClick={() => setMobileOpen(false)}
                              style={{ fontFamily: "'Space Mono', monospace" }}
                            >
                              {item.label}
                            </button>
                          </Link>
                        ))}
                      </div>
                      <div className="pencil-line my-2" />
                      <div className="space-y-[2px] pt-1">
                        <Link href="/app/settings">
                          <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="w-full sketch-button text-left px-3 py-2 my-[2px] transition-colors flex items-center gap-2 bg-background"
                            style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
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
                          className="w-full sketch-button text-left px-3 py-2 my-[2px] text-destructive transition-colors flex items-center gap-2 bg-background hover:bg-destructive/10"
                          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                        >
                          <LogOut size={15} />
                          Log out
                        </button>
                      </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
      </motion.div>

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

      <AnimatePresence>
        {rankInsightsOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="fixed inset-0 z-[240] bg-[oklch(0.18_0.02_60_/_0.42)]"
              onClick={() => setRankInsightsOpen(false)}
              aria-label="Close rank insights"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-[250] flex items-center justify-center p-4"
            >
              <div className="sketch-card w-full max-w-sm p-4">
                <div className="flex items-center justify-between">
                  <h3 style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.04em", fontSize: "1.2rem" }}>
                    Rank KPI
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRankInsightsOpen(false)}
                    className="sketch-button h-9 w-9 p-0 bg-background flex items-center justify-center leading-none"
                    aria-label="Close rank insights"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="pencil-line my-3" />
                <div className="space-y-2 text-sm" style={{ fontFamily: "'Courier Prime', monospace" }}>
                  <p><Trophy size={14} className="inline mr-1" /> Rank: <b>#{stats?.rank ?? "-"}</b></p>
                  <p>Total public users: <b>{usersCount ?? "-"}</b></p>
                  <p>
                    {percentile == null
                      ? "Ranking percentile unavailable yet."
                      : `You are in the top ${percentile}% of users.`}
                  </p>
                  <p>
                    Group: <b>{cohortLabel}</b>
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
