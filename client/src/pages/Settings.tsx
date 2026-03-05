import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AVATAR_EMOJIS, DEFAULT_AVATAR_EMOJI, normalizeAvatarEmoji } from "@shared/const";
import { useState, useEffect } from "react";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";
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

export default function Settings() {
  const { user } = useAuth();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState<string>(DEFAULT_AVATAR_EMOJI);
  const [isPublic, setIsPublic] = useState(true);
  const [saved, setSaved] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName ?? user?.name ?? "");
      setBio(settings.bio ?? "");
      setAvatarEmoji(normalizeAvatarEmoji(settings.avatarEmoji));
      setIsPublic(settings.isPublic ?? true);
    } else if (user) {
      setDisplayName(user.name ?? "");
    }
  }, [settings, user]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      setSaved(true);
      toast.success("Settings saved!");
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error("Failed to save settings"),
  });
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Account deleted");
      window.location.href = "/";
    },
    onError: () => toast.error("Failed to delete account"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      avatarEmoji: normalizeAvatarEmoji(avatarEmoji),
      isPublic,
    });
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

        {/* Privacy section */}
        <div className="sketch-border p-5 bg-background/60">
          <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            ★ Privacy
          </h3>

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
        </div>

        {/* Account info */}
        <div className="sketch-border p-5 bg-background/60">
          <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            ✎ Account
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>Email</span>
              <span className="text-sm" style={{ fontFamily: "'Courier Prime', monospace" }}>{user?.email ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>Name</span>
              <span className="text-sm" style={{ fontFamily: "'Courier Prime', monospace" }}>{user?.name ?? "—"}</span>
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

        <div className="pencil-line" />

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
      </form>
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
