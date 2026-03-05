import { trpc } from "@/lib/trpc";
import { Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";
import GoalPreviewModal from "@/components/GoalPreviewModal";

const CATEGORY_COLORS: Record<string, string> = {
  Travel: "oklch(0.65 0.1 185)",
  Adventure: "oklch(0.72 0.14 20)",
  Skills: "oklch(0.62 0.12 290)",
  Creative: "oklch(0.78 0.14 75)",
  Fitness: "oklch(0.65 0.12 145)",
  Food: "oklch(0.75 0.12 50)",
  Learning: "oklch(0.62 0.12 290)",
  Career: "oklch(0.45 0.08 60)",
  Service: "oklch(0.65 0.1 185)",
  Personal: "oklch(0.72 0.14 20)",
  Other: "oklch(0.55 0.04 70)",
};

type LeaderboardTab = "goals" | "users";

export default function PublicLeaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("goals");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [introStep, setIntroStep] = useState<0 | 1 | 2>(0);
  const [previewGoal, setPreviewGoal] = useState<{ title: string; category?: string | null; users: number } | null>(null);
  const { data: goalLeaderboard, isLoading: goalsLoading } = trpc.leaderboard.topGoals.useQuery(
    { year: selectedYear ?? undefined },
    {
      enabled: activeTab === "goals",
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }
  );
  const { data: userLeaderboard, isLoading: usersLoading } = trpc.leaderboard.topUsers.useQuery(
    { year: selectedYear ?? undefined },
    {
      enabled: activeTab === "users",
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }
  );
  const { data: availableYears = [] } = trpc.leaderboard.availableYears.useQuery(undefined, {
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const isLoading = activeTab === "goals" ? goalsLoading : usersLoading;
  const data = activeTab === "goals" ? goalLeaderboard : userLeaderboard;
  const introCtaHref = introStep === 1 ? "/login" : "/signup";

  return (
    <div className="py-4">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h2 className="page-heading text-3xl font-bold" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            [LEADERBOARD]
          </h2>
          <p className="page-subtitle text-sm text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
            top achievements
          </p>
        </div>
      </div>

      <div className="sketch-border-dashed p-4 mb-6">
        <p className="text-xs uppercase tracking-wider mb-2 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
          quick start prelude
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {[
            { title: "Pick a vibe", body: "Travel / Skills / Adventure", cta: "Choose" },
            { title: "Claim one mission", body: "Add your first goal in 10s", cta: "Claim" },
            { title: "Compete live", body: "Climb goals + user leaderboard", cta: "Compete" },
          ].map((card, index) => (
            <motion.button
              key={card.title}
              type="button"
              onClick={() => {
                setIntroStep(index as 0 | 1 | 2);
              }}
              whileTap={{ scale: 0.98 }}
              className={`sketch-button relative text-left p-3 transition-all ${introStep === index ? "text-background" : "bg-background"}`}
            >
              {introStep === index && (
                <motion.span
                  layoutId="intro-active-card"
                  className="absolute inset-0 rounded-[6px] bg-foreground"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <p className="text-sm" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{card.title}</p>
              <p className="text-xs opacity-80 mt-1" style={{ fontFamily: "'Courier Prime', monospace" }}>{card.body}</p>
              <span className="text-xs mt-2 block" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>[{card.cta}]</span>
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={introStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="grid w-full gap-3 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <p
              className="text-sm min-h-[42px] flex items-center"
              style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600, letterSpacing: "0.02em" }}
            >
              {introStep === 0 && "Want to appear on the leaderboard? Start your bucket list today."}
              {introStep === 1 && "You can add your first goal in under 10 seconds."}
              {introStep === 2 && "Public goals and users update continuously as people complete missions."}
            </p>
            <a href={introCtaHref}>
              <button
                className="sketch-button px-4 py-1.5 bg-foreground text-background text-sm min-w-[150px]"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {introStep === 2 ? "Join the board ->" : "Get started ->"}
              </button>
            </a>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("goals")}
          className={`sketch-button px-4 py-2 transition-colors ${activeTab === "goals" ? "bg-foreground text-background border-foreground" : "bg-background text-foreground"}`}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
        >
          [GOALS]
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`sketch-button px-4 py-2 transition-colors ${activeTab === "users" ? "bg-foreground text-background border-foreground" : "bg-background text-foreground"}`}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
        >
          [USERS]
        </button>
      </div>
      <div className="flex items-start gap-2 mb-6 flex-wrap">
        <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
          Year:
        </span>
        <button
          type="button"
          onClick={() => setSelectedYear(null)}
          className={`category-badge transition-colors ${selectedYear === null ? "bg-foreground text-background border-foreground" : ""}`}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
        >
          All
        </button>
        {availableYears.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => setSelectedYear(year)}
            className={`category-badge transition-colors ${selectedYear === year ? "bg-foreground text-background border-foreground" : ""}`}
            style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
          >
            {year}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 className="animate-spin" size={20} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>loading...</span>
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>
            no data yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activeTab === "goals" && goalLeaderboard && goalLeaderboard.map((goal: any, index: number) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
            const color = goal.category ? (CATEGORY_COLORS[goal.category] ?? "oklch(0.55 0.04 70)") : undefined;

            return (
              <div
                key={goal.id}
                className="flex flex-wrap md:flex-nowrap items-start md:items-center gap-2 md:gap-3 px-3 md:px-4 py-3 sketch-border bg-background/60 hover:bg-background/90 transition-colors"
                style={{
                  borderColor: rank <= 3 ? color : undefined,
                  boxShadow: rank <= 3 ? `2px 2px 0 ${color}40` : undefined,
                }}
                onClick={() => setPreviewGoal({ title: goal.title, category: goal.category, users: goal.userCount })}
              >
                <div className="rank-badge" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {rankEmoji || rank}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold line-clamp-2 text-[0.96rem] md:text-base"
                    style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                  >
                    {goal.title}
                  </p>
                  {goal.category && (
                    <span className="category-badge" style={{ borderColor: color, color }}>
                      {goal.category}
                    </span>
                  )}
                </div>

                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2 md:flex-shrink-0">
                  <div className="text-left md:text-right md:mr-2">
                    <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                      {selectedYear ? `Year ${selectedYear}` : "All years"}
                    </p>
                  </div>
                  <Users size={14} className="text-muted-foreground" />
                  <span className="font-bold" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                    {goal.userCount}
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                    users
                  </span>
                </div>
              </div>
            );
          })}

          {activeTab === "users" && userLeaderboard && userLeaderboard.map((user: any, index: number) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
            const displayName = user.displayName ?? user.name ?? "Anonymous Explorer";
            return (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3 sketch-border bg-background/60 hover:bg-background/90 transition-colors"
              >
                <div className="rank-badge" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {rankEmoji || rank}
                </div>

                <UserAvatar avatarEmoji={user.avatarEmoji} avatarImageUrl={user.avatarImageUrl} />

                <div className="flex-1 min-w-0">
                  <span
                    className="font-semibold truncate block"
                    style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                  >
                    {displayName}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                      {selectedYear ? `Year ${selectedYear}` : "All years"}
                    </p>
                    <p className="text-xs" style={{ fontFamily: "'Courier Prime', monospace" }}>
                      Achieved: <span className="font-bold">{user.achievedCountInYear}</span>
                    </p>
                    <p className="text-xs" style={{ fontFamily: "'Courier Prime', monospace" }}>
                      Added: <span className="font-bold">{user.addedCountInYear}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <GoalPreviewModal
        open={!!previewGoal}
        onClose={() => setPreviewGoal(null)}
        title={previewGoal?.title ?? ""}
        category={previewGoal?.category}
        subtitle={previewGoal ? `${previewGoal.users} users have this goal` : null}
        accentColor={previewGoal?.category ? CATEGORY_COLORS[previewGoal.category] : undefined}
      />
    </div>
  );
}
