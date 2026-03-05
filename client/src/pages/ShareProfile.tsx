import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface ShareProfileProps {
  userId: number;
}

export default function ShareProfile({ userId }: ShareProfileProps) {
  const { data, isLoading } = trpc.share.profile.useQuery(
    { userId },
    { enabled: Number.isFinite(userId) && userId > 0 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 className="animate-spin" size={20} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>loading profile...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
          PROFILE_NOT_AVAILABLE
        </h2>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
          This user profile is private or does not exist.
        </p>
      </div>
    );
  }

  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const categoryFilter = search?.get("category")?.trim() || null;
  const yearFilter = Number(search?.get("year") ?? "");
  const hasYearFilter = Number.isFinite(yearFilter);
  const filteredGoals = data.goals.filter((goal) => {
    const categoryMatches = categoryFilter ? goal.category === categoryFilter : true;
    const yearMatches = hasYearFilter ? new Date(goal.createdAt).getFullYear() === yearFilter : true;
    return categoryMatches && yearMatches;
  });
  const filteredAchievedCount = filteredGoals.filter((goal) => goal.achieved).length;

  return (
    <div className="py-4">
      <div className="sketch-border p-5 bg-background/70 mb-5">
        <div className="flex items-center gap-3">
          <UserAvatar avatarEmoji={data.avatarEmoji} avatarImageUrl={data.avatarImageUrl} className="w-12 h-12 text-2xl" />
          <div>
            <h2 style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em", fontSize: "1.6rem" }}>
              {data.displayName}
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              {filteredAchievedCount}/{filteredGoals.length} goals achieved
            </p>
          </div>
        </div>
        {(categoryFilter || hasYearFilter) && (
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed" style={{ fontFamily: "'Courier Prime', monospace" }}>
            Filters: {hasYearFilter ? `Year ${yearFilter}` : "All years"} · {categoryFilter ?? "All categories"}
          </p>
        )}
      </div>

      {filteredGoals.length === 0 ? (
        <div className="sketch-border-dashed p-8 text-center">
          <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            No goals shared yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredGoals.map((goal) => (
            <div key={goal.id} className="sketch-border p-3 bg-background/60">
              <p
                className={`font-semibold ${goal.achieved ? "line-through opacity-70" : ""}`}
                style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
              >
                {goal.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Courier Prime', monospace" }}>
                {goal.category ?? "Uncategorized"} · {goal.achieved ? "Achieved" : "In progress"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
