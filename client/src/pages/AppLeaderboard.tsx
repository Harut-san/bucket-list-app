import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Users, Loader2 } from "lucide-react";
import { useState } from "react";

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
  const { data: goalLeaderboard, isLoading: goalsLoading } = trpc.leaderboard.topGoals.useQuery();
  const { data: userLeaderboard, isLoading: usersLoading } = trpc.leaderboard.topUsers.useQuery();
  const { user } = useAuth();
  const statsQuery = trpc.bucketList.stats.useQuery();
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
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
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
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("goals")}
          className={`sketch-button px-4 py-2 transition-colors ${
            activeTab === "goals"
              ? "bg-foreground text-background"
              : "bg-background text-foreground"
          }`}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
        >
          [GOALS]
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`sketch-button px-4 py-2 transition-colors ${
            activeTab === "users"
              ? "bg-foreground text-background"
              : "bg-background text-foreground"
          }`}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
        >
          [USERS]
        </button>
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
                className="flex items-center gap-3 px-4 py-3 sketch-border bg-background/60 hover:bg-background/90 transition-colors"
                style={{
                  borderColor: rank <= 3 ? color : undefined,
                  boxShadow: rank <= 3 ? `2px 2px 0 ${color}40` : undefined,
                }}
              >
                <div className="rank-badge" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {rankEmoji || rank}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold truncate"
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

                <div className="flex items-center gap-2 flex-shrink-0">
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
            const emoji = leader.avatarEmoji ?? "🎯";
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

                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 sketch-border"
                  style={{ background: "oklch(0.93 0.02 80)" }}
                >
                  {emoji}
                </div>

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
                  <span className="font-bold" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                    {leader.achievedCount}
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                    / {leader.totalCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
