import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Star, Github } from "lucide-react";

const publicNavItems = [
  { label: "Leaderboard", href: "/" },
  { label: "New Goals", href: "/new-goals" },
  { label: "About", href: "/about" },
];

function SketchDecoration() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 0 }}
    >
      {/* Corner marks */}
      <line x1="0" y1="12" x2="12" y2="0" stroke="oklch(0.22 0.02 60)" strokeWidth="1.5" strokeOpacity="0.3" />
      <line x1="0" y1="20" x2="20" y2="0" stroke="oklch(0.22 0.02 60)" strokeWidth="1" strokeOpacity="0.15" />
    </svg>
  );
}

interface PublicShellProps {
  children: React.ReactNode;
}

export default function PublicShell({ children }: PublicShellProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const creditsRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-6 px-4">
      {/* Main card */}
      <div
        className="w-full max-w-3xl sketch-card thin-typography relative"
        style={{ minHeight: "80vh" }}
      >
        <SketchDecoration />

        {/* Header */}
        <div className="relative z-20 px-4 md:px-6 pt-6 pb-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <Link href="/">
              <div className="flex flex-col cursor-pointer group">
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

            {/* Desktop nav */}
            <nav className="hidden md:flex flex-1 min-w-0 items-start justify-end gap-2">
              <div className="flex items-center gap-0.5 min-w-0">
                {publicNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`nav-link px-2 py-1 rounded transition-colors ${
                        location === item.href ? "active text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      <span className="nav-link-label">{item.label}</span>
                    </span>
                  </Link>
                ))}
              </div>
              <div className="w-px h-10 bg-border opacity-60 mt-0.5 mx-1.5 shrink-0" />
              <div className="flex flex-col items-end gap-1 w-[104px] shrink-0">
                <Link href="/login" className="block w-full">
                  <button
                    className="sketch-button auth-stack-button w-full h-8 px-2 text-xs"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      background: "oklch(0.95 0.015 82)",
                      color: "oklch(0.18 0.02 60)",
                    }}
                  >
                    [LOG_IN]
                  </button>
                </Link>
                <Link href="/signup" className="block w-full">
                  <button
                    className="sketch-button auth-stack-button w-full h-8 px-2 text-xs"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      background: "oklch(0.18 0.02 60)",
                      color: "oklch(0.97 0.015 85)",
                    }}
                  >
                    [SIGN_UP]
                  </button>
                </Link>
              </div>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden sketch-button p-2 bg-background mt-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Mobile nav */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="md:hidden absolute right-2 top-[calc(100%+0.02rem)] z-[120] w-[70%] overflow-visible"
              >
                <div className="sketch-border p-2 bg-[oklch(0.97_0.018_82)]">
                  {publicNavItems.map((item) => (
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
                  <Link href="/login" className="block">
                  <button
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      className="sketch-button auth-stack-button w-full h-8 px-2 text-xs mb-2"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        background: "oklch(0.95 0.015 82)",
                        color: "oklch(0.18 0.02 60)",
                      }}
                    >
                      [LOG_IN]
                    </button>
                  </Link>
                  <Link href="/signup" className="block">
                    <button
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      className="sketch-button auth-stack-button w-full h-8 px-2 text-xs"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        background: "oklch(0.18 0.02 60)",
                        color: "oklch(0.97 0.015 85)",
                      }}
                    >
                      [SIGN_UP]
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pencil divider */}
          <div className="pencil-line mt-3" />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 px-4 md:px-6 pb-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="relative z-10 px-4 md:px-6 pb-4 mt-auto">
          <div className="pencil-line mb-3" />
          <div className="flex justify-between items-center text-xs opacity-50" style={{ fontFamily: "'Courier Prime', monospace" }}>
            <span>© {new Date().getFullYear()} BUCKET_LIST_APP</span>
            <span>dream big</span>
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
