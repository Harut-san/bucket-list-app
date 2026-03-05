import { trpc } from "@/lib/trpc";
import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/_core/hooks/useAuth";
import { normalizeAvatarEmoji } from "@shared/const";
import GoalPreviewModal from "@/components/GoalPreviewModal";
import {
  QUIZ_QUESTIONS,
  buildQuizResult,
  type QuizAnswerMap,
  type QuizResult,
} from "@/lib/quiz/personalityQuiz";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  defaultAnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Pencil,
  X,
  Check,
  Loader2,
  Share2,
  Link2,
  ImageDown,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
// BucketItem type inline
type BucketItem = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  category: string | null;
  achieved: boolean;
  sortOrder: number;
  achievedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type GoalPreviewState = {
  title: string;
  category?: string | null;
  description?: string | null;
  subtitle?: string | null;
  meta?: string | null;
  accentColor?: string;
};

// ─── Category options ─────────────────────────────────────────────
const CATEGORIES = [
  "Travel", "Adventure", "Skills", "Creative", "Fitness",
  "Food", "Learning", "Career", "Service", "Personal", "Other",
];

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

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 120;

const CONFETTI_COLORS = [
  "oklch(0.78 0.14 75)",
  "oklch(0.72 0.14 20)",
  "oklch(0.62 0.12 290)",
  "oklch(0.65 0.12 145)",
  "oklch(0.65 0.1 185)",
];

function burstConfettiFromBottom() {
  if (typeof document === "undefined") return;

  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  const count = 44;
  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.bottom = `${-12 - Math.random() * 20}px`;
    piece.style.background = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 320}px`);
    piece.style.setProperty("--dy", `${-190 - Math.random() * 260}px`);
    piece.style.setProperty("--rot", `${Math.random() * 540}deg`);
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    piece.style.animationDuration = `${0.8 + Math.random() * 0.9}s`;
    container.appendChild(piece);
  }

  window.setTimeout(() => {
    container.remove();
  }, 1700);
}

async function renderGoalsSnapshot(options: {
  displayName: string;
  avatarEmoji: string;
  yearLabel: string;
  addedCount: number;
  achievedCount: number;
  items: BucketItem[];
}) {
  const width = 1080;
  const rowHeight = 92;
  const listTop = 500;
  const contentBottom = listTop + options.items.length * rowHeight;
  const height = Math.max(1920, contentBottom + 180);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#f7f0e2";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#2c2117";
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  ctx.fillStyle = "#efe5d1";
  ctx.fillRect(68, 68, width - 136, height - 136);

  ctx.fillStyle = "#211911";
  ctx.font = "700 62px 'Space Mono'";
  ctx.fillText("[BUCKET_LIST]", 108, 156);

  ctx.font = "600 36px 'Space Mono'";
  ctx.fillText(`${options.avatarEmoji} ${options.displayName}`, 108, 232);

  ctx.font = "500 30px 'Courier Prime'";
  ctx.fillStyle = "#4e4b45";
  ctx.fillText(`${options.yearLabel}`, 108, 286);
  ctx.fillText(`Added ${options.addedCount} · Achieved ${options.achievedCount}`, 108, 332);

  ctx.strokeStyle = "#211911";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(108, 372);
  ctx.lineTo(width - 108, 372);
  ctx.stroke();

  ctx.font = "700 34px 'Space Mono'";
  ctx.fillStyle = "#211911";
  ctx.fillText("Filtered goals", 108, 436);

  ctx.font = "600 30px 'Space Mono'";
  options.items.forEach((item, index) => {
    const rowY = listTop + index * rowHeight;
    ctx.fillStyle = "#f9f2e7";
    ctx.strokeStyle = "#2c2117";
    ctx.lineWidth = 2;
    ctx.strokeRect(100, rowY - 52, width - 200, 74);
    ctx.fillRect(100, rowY - 52, width - 200, 74);
    ctx.fillStyle = item.achieved ? "#716e68" : "#211911";
    const marker = item.achieved ? "✓" : "◻";
    const text = `${marker} ${item.title}`;
    ctx.fillText(text.slice(0, 42), 126, rowY - 2);

    if (item.category) {
      ctx.font = "600 24px 'Courier Prime'";
      ctx.fillStyle = "#5a5650";
      ctx.fillText(item.category, width - 340, rowY - 2);
      ctx.font = "600 30px 'Space Mono'";
    }
  });

  ctx.font = "500 24px 'Courier Prime'";
  ctx.fillStyle = "#4e4b45";
  ctx.fillText("Shared from bucket list app", 108, height - 112);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to render snapshot"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}


// ─── Goal Form Modal ──────────────────────────────────────────────
interface GoalFormProps {
  initial?: Partial<BucketItem>;
  onSave: (data: { title: string; description?: string; category?: string }) => void;
  onCancel: () => void;
  onDelete?: (() => void) | null;
  deleting?: boolean;
  saving?: boolean;
}

function GoalForm({ initial, onSave, onCancel, onDelete = null, deleting = false, saving }: GoalFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedTitle = title.trim();
    if (normalizedTitle.length < TITLE_MIN_LENGTH) {
      toast.error(`Title must be at least ${TITLE_MIN_LENGTH} characters`);
      return;
    }
    if (normalizedTitle.length > TITLE_MAX_LENGTH) {
      toast.error(`Title must be ${TITLE_MAX_LENGTH} characters or fewer`);
      return;
    }
    onSave({ title: normalizedTitle, description: description.trim() || undefined, category: category || undefined });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "oklch(0.18 0.02 60 / 0.5)" }}
      onClick={onCancel}
    >
      <div className="sketch-card w-full max-w-md p-6 relative" onClick={(event) => event.stopPropagation()}>
        <div className="tape" />
        <h3
          className="text-2xl font-bold mb-4 pt-2"
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}
        >
          {initial?.id ? "Edit goal" : "Add new goal"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Goal title *
            </label>
            <input
              className="sketch-input w-full px-3 py-2 text-sm"
              placeholder="e.g. See the Northern Lights"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              maxLength={TITLE_MAX_LENGTH}
            />
            <p className="text-xs mt-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              {title.trim().length}/{TITLE_MAX_LENGTH} chars · min {TITLE_MIN_LENGTH}
            </p>
          </div>

          <div>
            <label className="block text-xs mb-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Description (optional)
            </label>
            <textarea
              className="sketch-input w-full px-3 py-2 text-sm resize-none"
              placeholder="Add some details about this goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Category (optional)
            </label>
            <select
              className="sketch-input w-full px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">- none -</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="pencil-line" />

          <div className="flex gap-3 justify-between items-center flex-wrap">
            {initial?.id && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirmDelete) {
                    onDelete();
                    return;
                  }
                  setConfirmDelete(true);
                }}
                disabled={deleting}
                className={`sketch-button px-4 py-2 text-sm ${
                  confirmDelete
                    ? "bg-destructive text-background border-destructive"
                    : "bg-background text-destructive border-destructive"
                } disabled:opacity-60`}
              >
                {deleting ? "Deleting..." : confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
            <div className="flex gap-3 justify-end ml-auto">
            <button
              type="button"
              onClick={onCancel}
              className="sketch-button px-4 py-2 bg-background text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={title.trim().length < TITLE_MIN_LENGTH || title.trim().length > TITLE_MAX_LENGTH || saving}
              className="sketch-button px-4 py-2 bg-foreground text-background text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {initial?.id ? "Save" : "Add goal"}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Sortable Goal Item ───────────────────────────────────────────
interface GoalItemProps {
  item: BucketItem;
  onToggle: (id: number) => void;
  onEdit: (item: BucketItem) => void;
  onOpen: (item: BucketItem) => void;
  isDragging?: boolean;
}

function GoalItem({ item, onToggle, onEdit, onOpen, isDragging }: GoalItemProps) {
  const sortable = useSortable({
    id: item.id,
    animateLayoutChanges: (args) => {
      if (args.isSorting || args.wasDragging) return false;
      return defaultAnimateLayoutChanges(args);
    },
  });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = sortable;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const color = item.category ? (CATEGORY_COLORS[item.category] ?? "oklch(0.55 0.04 70)") : undefined;

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (!isSortableDragging) onOpen(item);
      }}
      {...attributes}
      {...listeners}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className={`sketch-border flex items-start gap-3 p-3 bg-background/70 hover:bg-background/90 transition-colors group relative overflow-hidden ${
        isSortableDragging ? "dragging-item" : ""
      } ${item.achieved ? "opacity-70" : ""}`}
    >
      {/* Category accent */}
      {color && (
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />
      )}

      {/* Drag handle */}
      <div
        className="drag-handle drag-zone flex-shrink-0 mt-0.5 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      {/* Achieved toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(item.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="goal-checkbox-button flex-shrink-0 mt-0.5"
        aria-label={item.achieved ? "Mark as unachieved" : "Mark as achieved"}
        aria-pressed={item.achieved}
      >
        <span className={`goal-checkbox ${item.achieved ? "checked" : ""}`} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 13.5L10 18L19 7" />
          </svg>
        </span>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 pl-1">
        <p
          className={`font-semibold leading-tight line-clamp-2 text-[0.98rem] md:text-[1.08rem] ${item.achieved ? "line-through opacity-60" : ""}`}
          title={item.title}
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.035em" }}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 line-clamp-2" style={{ fontFamily: "'Courier Prime', monospace" }}>
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.category && (
            <span className="category-badge" style={{ borderColor: color, color }}>
              {item.category}
            </span>
          )}
          {item.achieved && item.achievedAt && (
            <span className="text-xs opacity-50" style={{ fontFamily: "'Courier Prime', monospace" }}>
              ✓ {new Date(item.achievedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          aria-label="Edit goal"
        >
          <Pencil size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function MyBucketList() {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const { data: items = [], isLoading } = trpc.bucketList.list.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BucketItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [quickShareCopied, setQuickShareCopied] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerMap>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [addingQuizSuggestions, setAddingQuizSuggestions] = useState(false);
  const [goalPreview, setGoalPreview] = useState<GoalPreviewState | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [dragOverlayWidth, setDragOverlayWidth] = useState<number | null>(null);
  const [snapshotPreview, setSnapshotPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [snapshotZoom, setSnapshotZoom] = useState(1);
  const [addingQuizGoalTitles, setAddingQuizGoalTitles] = useState<string[]>([]);
  const [addedQuizGoalTitles, setAddedQuizGoalTitles] = useState<string[]>([]);
  const displayItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;
  const shareSnapshotItems = displayItems.filter((item) => {
    if (selectedYear == null) return true;
    return new Date(item.createdAt).getFullYear() === selectedYear;
  });
  const yearlySummaryQuery = trpc.bucketList.yearlySummary.useQuery({
    year: selectedYear ?? undefined,
  });

  const addMutation = trpc.bucketList.add.useMutation({
    onSuccess: () => {
      utils.bucketList.list.invalidate();
      utils.bucketList.stats.invalidate();
      setShowForm(false);
      toast.success("Goal added!");
    },
    onError: () => toast.error("Failed to add goal"),
  });

  const updateMutation = trpc.bucketList.update.useMutation({
    onSuccess: () => {
      utils.bucketList.list.invalidate();
      setEditItem(null);
      toast.success("Goal updated!");
    },
    onError: () => toast.error("Failed to update goal"),
  });

  const deleteMutation = trpc.bucketList.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.bucketList.list.cancel();
      const prev = utils.bucketList.list.getData();
      utils.bucketList.list.setData(undefined, (old) => old?.filter((i) => i.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.bucketList.list.setData(undefined, ctx.prev);
      toast.error("Failed to delete goal");
    },
    onSettled: () => {
      utils.bucketList.list.invalidate();
      utils.bucketList.stats.invalidate();
    },
  });

  const toggleMutation = trpc.bucketList.toggleAchieved.useMutation({
    onMutate: async ({ id }) => {
      await utils.bucketList.list.cancel();
      const prev = utils.bucketList.list.getData();
      utils.bucketList.list.setData(undefined, (old) =>
        old?.map((i) =>
          i.id === id
            ? { ...i, achieved: !i.achieved, achievedAt: !i.achieved ? new Date() : null }
            : i
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.bucketList.list.setData(undefined, ctx.prev);
      toast.error("Failed to update goal");
    },
    onSettled: () => {
      utils.bucketList.list.invalidate();
      utils.bucketList.stats.invalidate();
    },
  });

  const reorderMutation = trpc.bucketList.reorder.useMutation({
    onMutate: async ({ orderedIds }) => {
      await utils.bucketList.list.cancel();
      const prev = utils.bucketList.list.getData();
      utils.bucketList.list.setData(undefined, (old) => {
        if (!old) return old;
        const map = new Map(old.map((item) => [item.id, item]));
        return orderedIds.map((id) => map.get(id)).filter((item): item is BucketItem => !!item);
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.bucketList.list.setData(undefined, ctx.prev);
      toast.error("Failed to save order");
    },
    onSettled: () => {
      utils.bucketList.list.invalidate();
    },
  });
  const addGoalSilently = trpc.bucketList.add.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
    setDragOverlayWidth(event.active.rect.current.initial?.width ?? null);
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setDragOverlayWidth(null);

      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);

      utils.bucketList.list.setData(undefined, reordered);
      reorderMutation.mutate({ orderedIds: reordered.map((i) => i.id) });
    },
    [items, reorderMutation, utils.bucketList.list]
  );
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDragOverlayWidth(null);
  }, []);

  const activeItem = activeId ? displayItems.find((i) => i.id === activeId) : null;

  const achieved = displayItems.filter((i) => i.achieved).length;
  const total = displayItems.length;
  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    if (!item.category) return acc;
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});
  const sortedCategories = Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b));
  const avatarEmoji = normalizeAvatarEmoji(settings?.avatarEmoji);
  const displayName = settings?.displayName ?? user?.name ?? "Explorer";
  const selectedYearStats = yearlySummaryQuery.data?.selectedYearStats ?? {
    addedCount: 0,
    achievedCount: 0,
    completionRate: 0,
  };
  const availableYears = yearlySummaryQuery.data?.availableYears ?? [];

  const handleToggleGoal = useCallback((id: number) => {
    const current = items.find((item) => item.id === id);
    if (current && !current.achieved) {
      burstConfettiFromBottom();
    }
    toggleMutation.mutate({ id });
  }, [items, toggleMutation]);

  const handleCopyShareLink = async () => {
    if (!user?.id) {
      toast.error("Unable to generate share link");
      return;
    }

    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedYear != null) params.set("year", String(selectedYear));
    const query = params.toString();
    const url = `${window.location.origin}/share/${user.id}${query ? `?${query}` : ""}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch {
      toast.error("Failed to copy link");
    } finally {
      setShareOpen(false);
    }
  };

  const handleShareButtonClick = async () => {
    if (items.length === 0) {
      try {
        await navigator.clipboard.writeText("https://bucketlist.harut.pl");
        setQuickShareCopied(true);
        window.setTimeout(() => setQuickShareCopied(false), 2000);
      } catch {
        toast.error("Failed to copy app link");
      }
      return;
    }
    setShareOpen(true);
  };

  const handleQuizClose = useCallback(() => {
    setQuizOpen(false);
    setQuizStep(0);
    setQuizAnswers({});
    setQuizResult(null);
    setAddingQuizGoalTitles([]);
    setAddedQuizGoalTitles([]);
  }, []);

  const handleQuizAnswer = (choice: "A" | "B") => {
    const question = QUIZ_QUESTIONS[quizStep];
    if (!question) return;
    const nextAnswers = { ...quizAnswers, [question.id]: choice };
    setQuizAnswers(nextAnswers);
    if (quizStep === QUIZ_QUESTIONS.length - 1) {
      setQuizResult(buildQuizResult(nextAnswers));
      return;
    }
    setQuizStep((prev) => prev + 1);
  };

  const handleAddQuizSuggestions = async () => {
    if (!quizResult || quizResult.bucket_list.length === 0) return;
    setAddingQuizSuggestions(true);
    try {
      const results = await Promise.allSettled(
        quizResult.bucket_list.map((goal) =>
          addGoalSilently.mutateAsync({
            title: goal.title,
            category: goal.category,
          })
        )
      );
      const successCount = results.filter((result) => result.status === "fulfilled").length;
      if (successCount > 0) {
        await utils.bucketList.list.invalidate();
        await utils.bucketList.stats.invalidate();
        toast.success(`${successCount} goals added`);
      }
      if (successCount !== quizResult.bucket_list.length) {
        toast.error("Some goals failed to add");
      }
      handleQuizClose();
    } finally {
      setAddingQuizSuggestions(false);
    }
  };

  const handleAddSingleQuizSuggestion = async (goal: { title: string; category: string }) => {
    const goalKey = goal.title.trim().toLowerCase();
    if (addingQuizGoalTitles.includes(goalKey) || addedQuizGoalTitles.includes(goalKey)) return;
    setAddingQuizGoalTitles((prev) => [...prev, goalKey]);
    try {
      await addGoalSilently.mutateAsync({
        title: goal.title,
        category: goal.category,
      });
      await utils.bucketList.list.invalidate();
      await utils.bucketList.stats.invalidate();
      setAddedQuizGoalTitles((prev) => [...prev, goalKey]);
      toast.success("Goal added");
    } catch {
      toast.error("Failed to add goal");
    } finally {
      setAddingQuizGoalTitles((prev) => prev.filter((entry) => entry !== goalKey));
    }
  };

  const handleCloseSnapshotPreview = () => {
    if (snapshotPreview) {
      URL.revokeObjectURL(snapshotPreview.url);
    }
    setSnapshotPreview(null);
    setSnapshotZoom(1);
  };

  const handleConfirmCopySnapshot = async () => {
    if (!snapshotPreview) return;
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": snapshotPreview.blob })]);
        toast.success("Snapshot copied to clipboard");
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(snapshotPreview.blob);
        link.download = "bucket-list-snapshot.png";
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success("Snapshot downloaded");
      }
      handleCloseSnapshotPreview();
    } catch {
      toast.error("Failed to copy snapshot");
    }
  };

  const handleCopySnapshot = async () => {
    try {
      const yearLabel = selectedYear ? `Year ${selectedYear}` : "All years";
      const categoryLabel = selectedCategory ?? "All categories";
      const achievedCount = shareSnapshotItems.filter((item) => item.achieved).length;
      const snapshotBlob = await renderGoalsSnapshot({
        displayName,
        avatarEmoji,
        yearLabel: `${yearLabel} · ${categoryLabel}`,
        addedCount: shareSnapshotItems.length,
        achievedCount,
        items: shareSnapshotItems,
      });
      setShareOpen(false);
      if (snapshotPreview) {
        URL.revokeObjectURL(snapshotPreview.url);
      }
      setSnapshotPreview({ blob: snapshotBlob, url: URL.createObjectURL(snapshotBlob) });
      setSnapshotZoom(1);
    } catch {
      toast.error("Failed to create snapshot");
    }
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="page-heading text-3xl font-bold" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            [MY_BUCKET_LIST]
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Courier Prime', monospace" }}>
            {total === 0
              ? "no goals yet - add your first one!"
              : `${achieved} of ${total} goals achieved`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleShareButtonClick()}
            className={`sketch-button px-3 py-2 flex items-center gap-2 ${quickShareCopied ? "bg-green-100 text-green-800 border-green-600" : "bg-background"}`}
          >
            <Share2 size={15} />
            {quickShareCopied ? "Copied" : "Share"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="sketch-button px-4 py-2 bg-foreground text-background flex items-center gap-2"
          >
            <Plus size={16} />
            Add goal
          </button>
        </div>
      </div>

      <div className="sketch-border p-4 bg-background/60 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
            Yearly summary:
          </span>
          <button
            type="button"
            className={`category-badge transition-colors ${selectedYear === null ? "bg-foreground text-background border-foreground" : ""}`}
            onClick={() => setSelectedYear(null)}
            style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
          >
            All years
          </button>
          {availableYears.map((year) => (
            <button
              key={year}
              type="button"
              className={`category-badge transition-colors ${selectedYear === year ? "bg-foreground text-background border-foreground" : ""}`}
              onClick={() => setSelectedYear(year)}
              style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
            >
              {year}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm" style={{ fontFamily: "'Courier Prime', monospace" }}>
          <span>Added: <b>{selectedYearStats.addedCount}</b></span>
          <span>Achieved: <b>{selectedYearStats.achievedCount}</b></span>
          <span>Completion: <b>{selectedYearStats.completionRate}%</b></span>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-5">
          <div className="sketch-progress">
            <div
              className="sketch-progress-fill"
              style={{ width: `${Math.round((achieved / total) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Courier Prime', monospace" }}>
            {Math.round((achieved / total) * 100)}% complete
          </p>
        </div>
      )}

      {/* Category filters */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            className={`category-badge transition-colors ${selectedCategory === null ? "bg-foreground text-background border-foreground" : ""}`}
            onClick={() => setSelectedCategory(null)}
            style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}
          >
            All ({items.length})
          </button>
          {sortedCategories.map((category) => (
            (() => {
              const color = CATEGORY_COLORS[category] ?? "oklch(0.55 0.04 70)";
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  className="category-badge transition-colors"
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontWeight: 600,
                    borderColor: color,
                    color: isSelected ? "oklch(0.18 0.02 60)" : color,
                    background: isSelected ? "oklch(0.94 0.02 82)" : undefined,
                    boxShadow: isSelected ? `inset 0 0 0 1px ${color}` : undefined,
                  }}
                >
                  {category} ({categoryCounts[category]})
                </button>
              );
            })()
          ))}
        </div>
      )}

      <motion.div layout transition={{ layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}>
      {isLoading ? (
        <motion.div layout className="flex items-center justify-center py-16 gap-3">
          <Loader2 className="animate-spin" size={20} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em", fontSize: "1.2rem" }}>Loading your list...</span>
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div layout className="sketch-border-dashed p-10 text-center">
          <div className="text-6xl mb-4">✦</div>
          <p className="text-2xl font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            Your bucket list is empty
          </p>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Courier Prime', monospace" }}>
            Start adding goals you want to achieve in your lifetime
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="sketch-button px-6 py-2 bg-foreground text-background whitespace-nowrap"
          >
            Add your first goal -&gt;
          </button>
          <button
            type="button"
            onClick={() => setQuizOpen(true)}
            className="sketch-button px-6 py-2 bg-background mt-2"
          >
            Quick quiz
          </button>
        </motion.div>
      ) : selectedCategory ? (
        displayItems.length === 0 ? (
          <motion.div layout className="sketch-border-dashed p-8 text-center">
            <p className="text-lg font-bold mb-1" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
              No goals in {selectedCategory}
            </p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Pick another category or add a new goal.
            </p>
          </motion.div>
        ) : (
          <motion.div layout className="flex flex-col gap-2">
            {displayItems.map((item) => (
              <GoalItem
                key={item.id}
                item={item}
                onToggle={handleToggleGoal}
                onEdit={(item) => {
                  setEditItem(item);
                }}
                onOpen={(item) =>
                  setGoalPreview({
                    title: item.title,
                    category: item.category,
                    description: item.description,
                    subtitle: item.achieved
                      ? `Achieved ${item.achievedAt ? new Date(item.achievedAt).toLocaleDateString() : ""}`.trim()
                      : "In progress",
                    accentColor: item.category ? CATEGORY_COLORS[item.category] : undefined,
                  })
                }
              />
            ))}
          </motion.div>
        )
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={displayItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <motion.div layout className="flex flex-col gap-2">
              {displayItems.map((item) => (
                <GoalItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggleGoal}
                  onEdit={(item) => {
                    setEditItem(item);
                  }}
                  onOpen={(item) =>
                    setGoalPreview({
                      title: item.title,
                      category: item.category,
                      description: item.description,
                      subtitle: item.achieved
                        ? `Achieved ${item.achievedAt ? new Date(item.achievedAt).toLocaleDateString() : ""}`.trim()
                        : "In progress",
                      accentColor: item.category ? CATEGORY_COLORS[item.category] : undefined,
                    })
                  }
                />
              ))}
            </motion.div>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeItem && (
              <div
                className="sketch-border flex items-start gap-3 p-3 bg-background shadow-lg rotate-1 opacity-90"
                style={{ width: dragOverlayWidth ?? undefined, maxWidth: "100%" }}
              >
                <GripVertical size={16} className="text-muted-foreground mt-0.5" />
                <span className={`goal-checkbox ${activeItem.achieved ? "checked" : ""}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 13.5L10 18L19 7" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0 pl-1">
                  <p
                    className={`font-semibold leading-tight truncate ${activeItem.achieved ? "line-through opacity-60" : ""}`}
                    title={activeItem.title}
                    style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em", fontSize: "1.15rem" }}
                  >
                    {activeItem.title}
                  </p>
                  {activeItem.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" style={{ fontFamily: "'Courier Prime', monospace" }}>
                      {activeItem.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {activeItem.category && (
                      <span
                        className="category-badge"
                        style={{
                          borderColor: CATEGORY_COLORS[activeItem.category] ?? "oklch(0.55 0.04 70)",
                          color: CATEGORY_COLORS[activeItem.category] ?? "oklch(0.55 0.04 70)",
                        }}
                      >
                        {activeItem.category}
                      </span>
                    )}
                    {activeItem.achieved && activeItem.achievedAt && (
                      <span className="text-xs opacity-50" style={{ fontFamily: "'Courier Prime', monospace" }}>
                        ✓ {new Date(activeItem.achievedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-[46px] flex-shrink-0" aria-hidden="true" />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
      </motion.div>

      {/* Hint */}
      {total > 1 && (
        <p className="text-xs text-muted-foreground mt-3 text-center" style={{ fontFamily: "'Courier Prime', monospace" }}>
          ↕ drag the ⠿ handle to reorder · click the checkbox to mark as achieved
        </p>
      )}

      {/* Add form modal */}
      {showForm && (
        <GoalForm
          onSave={(data) => addMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          saving={addMutation.isPending}
        />
      )}

      {/* Edit form modal */}
      {editItem && (
        <GoalForm
          initial={editItem}
          onSave={(data) => updateMutation.mutate({ id: editItem.id, ...data })}
          onCancel={() => setEditItem(null)}
          onDelete={() => {
            deleteMutation.mutate({ id: editItem.id });
            setEditItem(null);
          }}
          deleting={deleteMutation.isPending}
          saving={updateMutation.isPending}
        />
      )}
      {quizOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[140] flex items-center justify-center p-4"
            style={{ background: "oklch(0.18 0.02 60 / 0.55)" }}
            onClick={handleQuizClose}
          >
            <div className="sketch-card w-full max-w-lg p-4" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h3 style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.04em", fontSize: "1.25rem" }}>
                  Personality Quiz
                </h3>
                <button
                  type="button"
                  onClick={handleQuizClose}
                  className="sketch-button h-9 w-9 p-0 bg-background flex items-center justify-center leading-none"
                  aria-label="Close quiz"
                >
                  <X size={17} />
                </button>
              </div>
              {!quizResult ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                    Step {quizStep + 1}/{QUIZ_QUESTIONS.length}
                  </p>
                  <div className="sketch-border-dashed p-3 bg-background/60">
                    <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                      {QUIZ_QUESTIONS[quizStep]?.text}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {QUIZ_QUESTIONS[quizStep]?.answers.map((answer) => (
                      <button
                        key={answer.key}
                        type="button"
                        onClick={() => handleQuizAnswer(answer.key)}
                        className="w-full sketch-button px-3 py-3 bg-background text-left"
                        style={{ fontFamily: "'Courier Prime', monospace" }}
                      >
                        <span className="font-bold mr-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                          {answer.key}:
                        </span>
                        {answer.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setQuizStep((prev) => Math.max(0, prev - 1))}
                      className="sketch-button px-3 py-2 bg-background disabled:opacity-50"
                      disabled={quizStep === 0}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleQuizClose}
                      className="sketch-button px-3 py-2 bg-background"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-3 mt-2" style={{ fontFamily: "'Courier Prime', monospace" }}>
                    {quizResult.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    {quizResult.bucket_list.map((goal) => (
                      <div key={goal.title} className="sketch-border px-3 py-2 bg-background/70 flex items-start justify-between gap-3">
                        <div>
                          <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{goal.title}</p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                            {goal.category}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="sketch-button px-3 py-1.5 bg-background text-xs disabled:opacity-50"
                          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                          disabled={
                            addingQuizGoalTitles.includes(goal.title.trim().toLowerCase()) ||
                            addedQuizGoalTitles.includes(goal.title.trim().toLowerCase()) ||
                            items.some((item) => item.title.trim().toLowerCase() === goal.title.trim().toLowerCase())
                          }
                          onClick={() => void handleAddSingleQuizSuggestion(goal)}
                        >
                          {addingQuizGoalTitles.includes(goal.title.trim().toLowerCase())
                            ? "Adding..."
                            : addedQuizGoalTitles.includes(goal.title.trim().toLowerCase()) ||
                              items.some((item) => item.title.trim().toLowerCase() === goal.title.trim().toLowerCase())
                            ? "Added"
                            : "Add"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuizResult(null);
                        setQuizStep(0);
                        setQuizAnswers({});
                      }}
                      className="sketch-button px-4 py-2 bg-background"
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAddQuizSuggestions()}
                      disabled={addingQuizSuggestions}
                      className="sketch-button px-4 py-2 bg-foreground text-background disabled:opacity-60"
                    >
                      {addingQuizSuggestions ? "Adding..." : "Add all 6 goals"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      <GoalPreviewModal
        open={!!goalPreview}
        onClose={() => setGoalPreview(null)}
        title={goalPreview?.title ?? ""}
        category={goalPreview?.category}
        description={goalPreview?.description}
        subtitle={goalPreview?.subtitle}
        meta={goalPreview?.meta}
        accentColor={goalPreview?.accentColor}
      />
      {shareOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            style={{ background: "oklch(0.18 0.02 60 / 0.55)" }}
            onClick={() => setShareOpen(false)}
          >
            <div
              className="sketch-card w-full max-w-sm p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.04em", fontSize: "1.25rem" }}
                >
                  Share
                </h3>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="sketch-button h-9 w-9 p-0 bg-background flex items-center justify-center leading-none"
                  aria-label="Close share options"
                >
                  <X size={17} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed" style={{ fontFamily: "'Courier Prime', monospace" }}>
                Uses current filters: {selectedYear ? `Year ${selectedYear}` : "All years"} · {selectedCategory ?? "All categories"}
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="w-full sketch-button text-left px-3 py-3 bg-background text-sm flex items-center gap-2"
                  style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                >
                  <Link2 size={14} />
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={handleCopySnapshot}
                  className="w-full sketch-button text-left px-3 py-3 bg-background text-sm flex items-center gap-2"
                  style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                >
                  <ImageDown size={14} />
                  Copy snapshot
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {snapshotPreview &&
        createPortal(
          <div
            className="fixed inset-0 z-[125] flex items-center justify-center p-4"
            style={{ background: "oklch(0.18 0.02 60 / 0.55)" }}
            onClick={handleCloseSnapshotPreview}
          >
            <div
              className="sketch-card w-full max-w-3xl p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.04em", fontSize: "1.25rem" }}>
                  Snapshot preview
                </h3>
                <button
                  type="button"
                  onClick={handleCloseSnapshotPreview}
                  className="sketch-button h-9 w-9 p-0 bg-background flex items-center justify-center leading-none"
                  aria-label="Close snapshot preview"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  className="sketch-button px-3 py-1.5 bg-background"
                  onClick={() => setSnapshotZoom((zoom) => Math.max(0.5, Number((zoom - 0.1).toFixed(2))))}
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                  Zoom {Math.round(snapshotZoom * 100)}%
                </span>
                <button
                  type="button"
                  className="sketch-button px-3 py-1.5 bg-background"
                  onClick={() => setSnapshotZoom((zoom) => Math.min(2.5, Number((zoom + 0.1).toFixed(2))))}
                >
                  <ZoomIn size={14} />
                </button>
              </div>
              <div className="sketch-border bg-background/70 p-3 max-h-[65vh] overflow-auto flex justify-center">
                <img
                  src={snapshotPreview.url}
                  alt="Bucket list snapshot preview"
                  style={{ transform: `scale(${snapshotZoom})`, transformOrigin: "top center", maxWidth: "100%", height: "auto" }}
                />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseSnapshotPreview}
                  className="sketch-button px-4 py-2 bg-background"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmCopySnapshot()}
                  className="sketch-button px-4 py-2 bg-foreground text-background flex items-center gap-2"
                >
                  <ImageDown size={14} />
                  Copy snapshot
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
