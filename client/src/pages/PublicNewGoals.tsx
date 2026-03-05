import { trpc } from "@/lib/trpc";
import { Users, Loader2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
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

const ALL_CATEGORIES: Array<{ label: string; value: string | null }> = [
  { label: "All", value: null },
  "Travel",
  "Adventure",
  "Skills",
  "Creative",
  "Fitness",
  "Food",
  "Learning",
  "Career",
  "Service",
  "Personal",
  "Other",
].map((entry) =>
  typeof entry === "string" ? { label: entry, value: entry } : entry
).concat({ label: "None", value: "__none__" });

export default function PublicNewGoals() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"popular" | "createdAt">("popular");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [previewGoal, setPreviewGoal] = useState<{ title: string; category?: string | null; addedCount: number } | null>(null);
  const pageSize = 10;
  const { data: goalsData, isLoading } = trpc.globalGoals.list.useQuery({
    page,
    pageSize,
    category: selectedCategory ?? undefined,
    excludeMine: false,
    sortBy,
    sortDirection,
  });
  const goals = goalsData?.items ?? [];
  const totalPages = goalsData?.totalPages ?? 1;

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h2 className="page-heading text-3xl font-bold" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            [NEW_GOALS]
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Courier Prime', monospace" }}>
            goals added by users
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="sketch-border-dashed p-4 mb-6 flex flex-col items-center justify-center gap-3 text-center">
        <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600, letterSpacing: "0.02em" }}>
          Log in to add these goals to your personal bucket list!
        </p>
        <a href="/signup">
          <button className="sketch-button px-4 py-1.5 bg-foreground text-background text-sm whitespace-nowrap" style={{ fontFamily: "'Space Mono', monospace" }}>
            Start your list →
          </button>
        </a>
      </div>

      {/* Category filters - always visible */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ALL_CATEGORIES.map((cat) => {
          return (
            <button
              key={cat.label}
              className={`category-badge cursor-pointer transition-colors ${
                selectedCategory === cat.value ? "bg-foreground text-background border-foreground" : ""
              }`}
              onClick={() => {
                setSelectedCategory(cat.value);
                setPage(1);
              }}
              style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-xs text-muted-foreground ml-1" style={{ fontFamily: "'Courier Prime', monospace" }}>
          Popular
        </span>
        <button
          type="button"
          className={`category-badge transition-colors ${
            sortBy === "popular" && sortDirection === "desc" ? "bg-foreground text-background border-foreground" : ""
          }`}
          onClick={() => {
            setSortBy("popular");
            setSortDirection("desc");
            setPage(1);
          }}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
        >
          Most
        </button>
        <button
          type="button"
          className={`category-badge transition-colors ${
            sortBy === "popular" && sortDirection === "asc" ? "bg-foreground text-background border-foreground" : ""
          }`}
          onClick={() => {
            setSortBy("popular");
            setSortDirection("asc");
            setPage(1);
          }}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
        >
          Least
        </button>
        <span className="text-xs text-muted-foreground ml-1" style={{ fontFamily: "'Courier Prime', monospace" }}>
          Date
        </span>
        <button
          type="button"
          className={`category-badge transition-colors ${
            sortBy === "createdAt" && sortDirection === "desc" ? "bg-foreground text-background border-foreground" : ""
          }`}
          onClick={() => {
            setSortBy("createdAt");
            setSortDirection("desc");
            setPage(1);
          }}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
        >
          Newest
        </button>
        <button
          type="button"
          className={`category-badge transition-colors ${
            sortBy === "createdAt" && sortDirection === "asc" ? "bg-foreground text-background border-foreground" : ""
          }`}
          onClick={() => {
            setSortBy("createdAt");
            setSortDirection("asc");
            setPage(1);
          }}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
        >
          Oldest
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>
            loading...
          </span>
        </div>
      ) : (
        <>
          {goals.length === 0 ? (
            <div className="sketch-border-dashed p-10 text-center">
              <p className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
                No community goals yet
              </p>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                Try another category or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((goal) => {
                const color = CATEGORY_COLORS[goal.category ?? ""] ?? "oklch(0.45 0.03 70)";
                return (
                  <div
                    key={`${goal.title}-${goal.category ?? "none"}`}
                    className="sketch-border p-4 bg-background/60 hover:bg-background/90 transition-colors relative overflow-hidden"
                    onClick={() => setPreviewGoal({ title: goal.title, category: goal.category, addedCount: goal.addedCount })}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ background: color }}
                    />
                    <div className="pl-3">
                      <p
                        className="font-semibold mb-1 line-clamp-2 text-[0.98rem] md:text-[1.02rem]"
                        title={goal.title}
                        style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}
                      >
                        {goal.title}
                      </p>
                      <div className="flex items-center justify-between">
                        {goal.category && (
                          <span className="category-badge" style={{ borderColor: color, color }}>
                            {goal.category}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <Users size={11} />
                          <span style={{ fontFamily: "'Courier Prime', monospace" }}>
                            {goal.addedCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      href="/login"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      className="ml-3 sketch-button p-2 bg-background hover:bg-foreground hover:text-background transition-colors"
                      aria-label="Log in to add this goal"
                      title="Log in to add this goal"
                    >
                      <Plus size={14} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="sketch-button px-3 py-1.5 bg-background text-sm disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-1">
                  <ChevronLeft size={14} />
                  Prev
                </span>
              </button>
              <span className="text-sm" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="sketch-button px-3 py-1.5 bg-background text-sm disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-1">
                  Next
                  <ChevronRight size={14} />
                </span>
              </button>
            </div>
          )}
        </>
      )}
      <GoalPreviewModal
        open={!!previewGoal}
        onClose={() => setPreviewGoal(null)}
        title={previewGoal?.title ?? ""}
        category={previewGoal?.category}
        subtitle={previewGoal ? `${previewGoal.addedCount.toLocaleString()} users added this` : null}
        accentColor={previewGoal?.category ? CATEGORY_COLORS[previewGoal.category] : undefined}
      />
    </div>
  );
}
