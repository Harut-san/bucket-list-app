import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AVATAR_EMOJIS, DEFAULT_AVATAR_EMOJI, normalizeAvatarEmoji } from "@shared/const";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, Check, Eye, EyeOff, Upload, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import UserAvatar from "@/components/UserAvatar";

const CROPPER_SIZE = 280;
const OUTPUT_SIZE = 512;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

async function createCroppedDataUrl(options: {
  source: string;
  offsetX: number;
  offsetY: number;
  zoom: number;
}) {
  const image = await loadImage(options.source);
  const baseScale = Math.max(CROPPER_SIZE / image.width, CROPPER_SIZE / image.height);
  const effectiveScale = baseScale * options.zoom;
  const drawWidth = image.width * effectiveScale;
  const drawHeight = image.height * effectiveScale;
  const drawX = (CROPPER_SIZE - drawWidth) / 2 + options.offsetX;
  const drawY = (CROPPER_SIZE - drawHeight) / 2 + options.offsetY;
  const ratio = OUTPUT_SIZE / CROPPER_SIZE;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "#f7f2e7";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(
    image,
    drawX * ratio,
    drawY * ratio,
    drawWidth * ratio,
    drawHeight * ratio
  );
  return canvas.toDataURL("image/webp", 0.9);
}

export default function Settings() {
  const { user } = useAuth();
  const { data: settings, isLoading } = trpc.settings.get.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const utils = trpc.useUtils();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState<string>(DEFAULT_AVATAR_EMOJI);
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [saved, setSaved] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropBounds, setCropBounds] = useState({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  const [cropBaseSize, setCropBaseSize] = useState({ width: CROPPER_SIZE, height: CROPPER_SIZE });
  const [uploadedAt, setUploadedAt] = useState(0);
  const cropStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName ?? user?.name ?? "");
      setBio(settings.bio ?? "");
      setAvatarEmoji(normalizeAvatarEmoji(settings.avatarEmoji));
      setAvatarImageUrl(settings.avatarImageUrl ?? null);
      setIsPublic(Boolean(settings.isPublic ?? true));
    } else if (user) {
      setDisplayName(user.name ?? "");
    }
  }, [settings, user]);

  useEffect(() => {
    if (!cropSource) return;
    let active = true;
    loadImage(cropSource)
      .then((image) => {
        if (!active) return;
        const baseScale = Math.max(CROPPER_SIZE / image.width, CROPPER_SIZE / image.height);
        const baseWidth = image.width * baseScale;
        const baseHeight = image.height * baseScale;
        const drawWidth = baseWidth * cropZoom;
        const drawHeight = baseHeight * cropZoom;
        const nextBounds = {
          minX: (drawWidth - CROPPER_SIZE) * -0.5,
          maxX: (drawWidth - CROPPER_SIZE) * 0.5,
          minY: (drawHeight - CROPPER_SIZE) * -0.5,
          maxY: (drawHeight - CROPPER_SIZE) * 0.5,
        };
        setCropBaseSize({ width: baseWidth, height: baseHeight });
        setCropBounds(nextBounds);
        setCropOffset((prev) => ({
          x: clamp(prev.x, nextBounds.minX, nextBounds.maxX),
          y: clamp(prev.y, nextBounds.minY, nextBounds.maxY),
        }));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [cropSource, cropZoom]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      setSaved(true);
      toast.success("Settings saved!");
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error("Failed to save settings"),
  });
  const uploadAvatarMutation = trpc.settings.uploadAvatar.useMutation();
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Account deleted successfully");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 250);
    },
    onError: () => toast.error("Failed to delete account"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      avatarEmoji: normalizeAvatarEmoji(avatarEmoji),
      avatarImageUrl,
      isPublic,
    });
  };

  const handlePickAvatarFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    try {
      const source = await fileToDataUrl(file);
      setCropSource(source);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
    } catch {
      toast.error("Failed to open image");
    }
  };

  const handleApplyAvatarCrop = async () => {
    if (!cropSource) return;
    try {
      const croppedDataUrl = await createCroppedDataUrl({
        source: cropSource,
        offsetX: cropOffset.x,
        offsetY: cropOffset.y,
        zoom: cropZoom,
      });
      const uploaded = await uploadAvatarMutation.mutateAsync({ dataUrl: croppedDataUrl });
      setAvatarImageUrl(uploaded.url);
      await utils.settings.get.invalidate();
      setUploadedAt(Date.now());
      setCropSource(null);
      toast.success("Avatar photo uploaded");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to crop or upload image";
      toast.error(message);
    }
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 className="animate-spin" size={20} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em", fontSize: "1.2rem" }}>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h2 className="text-3xl font-bold" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            Settings
          </h2>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
            manage your profile and preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Profile section */}
        <div className="sketch-border p-5 bg-background/60">
          <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            Profile
          </h3>

          {/* Avatar picker */}
          <div className="mb-4">
            <label className="block text-xs mb-2 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Avatar photo (optional)
            </label>
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <UserAvatar
                avatarEmoji={avatarEmoji}
                avatarImageUrl={avatarImageUrl}
                className="w-14 h-14 text-2xl"
                key={`${avatarImageUrl ?? "emoji"}-${uploadedAt}`}
              />
              <label className="sketch-button px-3 py-2 bg-background inline-flex items-center gap-2 cursor-pointer">
                <Upload size={14} />
                Upload + crop
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    void handlePickAvatarFile(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {avatarImageUrl && (
                <button
                  type="button"
                  className="sketch-button px-3 py-2 bg-background text-destructive inline-flex items-center gap-2"
                  onClick={() => setAvatarImageUrl(null)}
                >
                  <Trash2 size={14} />
                  Remove photo
                </button>
              )}
            </div>
            <label className="block text-xs mb-2 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Avatar emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-10 h-10 text-xl rounded transition-all ${
                    avatarEmoji === emoji
                      ? "sketch-border bg-foreground/10"
                      : "hover:bg-muted"
                  }`}
                  style={{
                    borderColor: avatarEmoji === emoji ? "oklch(0.22 0.02 60)" : "transparent",
                    border: avatarEmoji === emoji ? "2px solid oklch(0.22 0.02 60)" : "2px solid transparent",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div className="mb-4">
            <label className="block text-xs mb-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Display name
            </label>
            <input
              type="text"
              className="sketch-input w-full px-3 py-2 text-sm"
              placeholder={user?.name ?? "Your name"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={128}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs mb-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Bio (optional)
            </label>
            <textarea
              className="sketch-input w-full px-3 py-2 text-sm resize-none"
              placeholder="Tell others about your goals and adventures..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right" style={{ fontFamily: "'Courier Prime', monospace" }}>
              {bio.length}/500
            </p>
          </div>
        </div>

        {/* Account section */}
        <div className="sketch-border p-5 bg-background/60">
          <button
            type="button"
            className="w-full flex items-center justify-between"
            onClick={() => setAccountOpen((open) => !open)}
          >
            <h3 className="text-xl font-bold" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
              ✎ Account
            </h3>
            <ChevronDown
              size={18}
              className={`transition-transform ${accountOpen ? "rotate-180" : ""}`}
            />
          </button>
          {accountOpen ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`flex items-center gap-3 w-full text-left p-3 sketch-border transition-colors ${
                  isPublic ? "bg-green-50/60" : "bg-background"
                }`}
                style={{ borderColor: isPublic ? "oklch(0.65 0.12 145)" : undefined }}
              >
                <div className="flex-shrink-0">
                  {isPublic ? (
                    <Eye size={18} style={{ color: "oklch(0.65 0.12 145)" }} />
                  ) : (
                    <EyeOff size={18} className="text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em", fontSize: "1.1rem" }}>
                    {isPublic ? "Public profile" : "Private profile"}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                    {isPublic
                      ? "You appear on the leaderboard and your goals are visible"
                      : "You are hidden from the leaderboard"}
                  </p>
                </div>
                <div
                  className="ml-auto w-10 h-6 rounded-full transition-colors flex-shrink-0 relative"
                  style={{
                    background: isPublic ? "oklch(0.65 0.12 145)" : "oklch(0.65 0.04 70)",
                    border: "2px solid oklch(0.22 0.02 60)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: isPublic ? "translateX(18px)" : "translateX(2px)" }}
                  />
                </div>
              </button>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>Email</span>
                  <span className="text-sm" style={{ fontFamily: "'Courier Prime', monospace" }}>{user?.email ?? "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>Name</span>
                  <span className="text-sm" style={{ fontFamily: "'Courier Prime', monospace" }}>{user?.name ?? "-"}</span>
                </div>
              </div>
              <div className="pencil-line my-4" />
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteAccountMutation.isPending}
                className="sketch-button px-4 py-2 bg-red-100 text-red-700 border-red-400 disabled:opacity-60 inline-flex items-center gap-2"
                style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
              >
                {deleteAccountMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
                Delete account
              </button>
            </div>
          ) : null}
        </div>

        <div className="pencil-line" />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="sketch-button px-6 py-2.5 bg-foreground text-background flex items-center gap-2 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <Check size={16} />
            ) : null}
            {saved ? "Saved!" : "Save settings"}
          </button>
        </div>
      </form>
      {cropSource ? createPortal(
        <div
          className="fixed inset-0 z-[1300] flex items-start justify-center overflow-y-auto p-4 md:items-center"
          style={{ background: "oklch(0.18 0.02 60 / 0.55)" }}
          onClick={() => setCropSource(null)}
        >
          <div
            className="sketch-card mt-14 w-full max-w-md p-4 md:mt-0"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.04em" }}>
              Crop avatar photo
            </h3>
            <p className="text-xs text-muted-foreground mb-3 sketch-border-dashed px-3 py-2 bg-background/70" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Drag to reposition and use zoom to fit your face.
            </p>
            <div className="flex justify-center mb-3">
              <div
                className="relative overflow-hidden rounded-full sketch-border bg-background"
                style={{ width: CROPPER_SIZE, height: CROPPER_SIZE, touchAction: "none" }}
                onPointerDown={(event) => {
                  (event.target as HTMLElement).setPointerCapture(event.pointerId);
                  cropStart.current = {
                    x: event.clientX,
                    y: event.clientY,
                    offsetX: cropOffset.x,
                    offsetY: cropOffset.y,
                  };
                }}
                onPointerMove={(event) => {
                  if (!cropStart.current) return;
                  const deltaX = event.clientX - cropStart.current.x;
                  const deltaY = event.clientY - cropStart.current.y;
                  setCropOffset({
                    x: clamp(cropStart.current.offsetX + deltaX, cropBounds.minX, cropBounds.maxX),
                    y: clamp(cropStart.current.offsetY + deltaY, cropBounds.minY, cropBounds.maxY),
                  });
                }}
                onPointerUp={() => {
                  cropStart.current = null;
                }}
                onPointerCancel={() => {
                  cropStart.current = null;
                }}
              >
                <img
                  src={cropSource}
                  alt="Avatar crop source"
                  className="absolute top-1/2 left-1/2 select-none pointer-events-none"
                  style={{
                    transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropZoom})`,
                    transformOrigin: "center center",
                    width: cropBaseSize.width,
                    height: cropBaseSize.height,
                  }}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground block mb-1" style={{ fontFamily: "'Courier Prime', monospace" }}>
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={cropZoom}
                onChange={(event) => setCropZoom(Number(event.target.value))}
                className="zoom-range w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="sketch-button px-4 py-2 bg-background" onClick={() => setCropSource(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="sketch-button px-4 py-2 bg-foreground text-background inline-flex items-center gap-2 disabled:opacity-60"
                disabled={uploadAvatarMutation.isPending}
                onClick={() => void handleApplyAvatarCrop()}
              >
                {uploadAvatarMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Apply photo
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sketch-card">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.04em" }}>
              Delete account?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: "'Courier Prime', monospace", lineHeight: 1.55 }}>
              This permanently deletes your account and your bucket list items. Shared goals from other users stay available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="sketch-button bg-background"
              style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="sketch-button bg-red-100 text-red-700 border-red-400 hover:bg-red-200"
              style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
