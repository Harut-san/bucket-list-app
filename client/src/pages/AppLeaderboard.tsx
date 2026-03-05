import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Users, Loader2 } from "lucide-react";
import { useState } from "react";
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
};

type LeaderboardTab = "goals" | "users";

export default function AppLeaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("goals");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
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
  const { user } = useAuth();
  const statsQuery = trpc.bucketList.stats.useQuery(undefined, {
    enabled: activeTab === "users",
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const myRank = statsQuery.data?.rank;

  const isLoading = activeTab === "goals" ? goalsLoading : usersLoading;
  const data = activeTab === "goals" ? goalLeaderboard : userLeaderboard;

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
        {activeTab === "users" && myRank && (
          <div className="ml-auto sketch-border px-3 py-1.5 text-center">
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>your rank</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>#{myRank}</p>
          </div>
        )}
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

          {activeTab === "users" && userLeaderboard && userLeaderboard.map((leader: any, index: number) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
            const displayName = leader.displayName ?? leader.name ?? "Anonymous Explorer";
            const isMe = leader.id === user?.id;

            return (
              <div
                key={leader.id}
                className={`flex items-center gap-3 px-4 py-3 sketch-border transition-colors ${
                  isMe ? "bg-amber-50/80" : "bg-background/60 hover:bg-background/90"
                }`}
                style={{
                  borderColor: isMe
                    ? "oklch(0.78 0.14 75)"
                    : rank <= 3
                    ? (rank === 1 ? "oklch(0.78 0.14 75)" : rank === 2 ? "oklch(0.75 0.05 220)" : "oklch(0.72 0.12 45)")
                    : undefined,
                  boxShadow: isMe
                    ? "2px 2px 0 oklch(0.78 0.14 75 / 0.3)"
                    : rank <= 3
                    ? `2px 2px 0 ${rank === 1 ? "oklch(0.78 0.14 75)" : rank === 2 ? "oklch(0.75 0.05 220)" : "oklch(0.72 0.12 45)"}40`
                    : undefined,
                }}
              >
                <div className="rank-badge" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {rankEmoji || rank}
                </div>

                <UserAvatar avatarEmoji={leader.avatarEmoji} avatarImageUrl={leader.avatarImageUrl} />

                <div className="flex-1 min-w-0">
                  <span
                    className="font-semibold truncate block"
                    style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                  >
                    {displayName}
                    {isMe && (
                      <span
                        className="ml-2 text-xs"
                        style={{ color: "oklch(0.78 0.14 75)", fontFamily: "'Courier Prime', monospace" }}
                      >
                        (you)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                      {selectedYear ? `Year ${selectedYear}` : "All years"}
                    </p>
                    <p className="text-xs" style={{ fontFamily: "'Courier Prime', monospace" }}>
                      Achieved: <span className="font-bold">{leader.achievedCountInYear}</span>
                    </p>
                    <p className="text-xs" style={{ fontFamily: "'Courier Prime', monospace" }}>
                      Added: <span className="font-bold">{leader.addedCountInYear}</span>
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
