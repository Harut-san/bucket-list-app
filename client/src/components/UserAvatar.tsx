import { normalizeAvatarEmoji } from "@shared/const";

interface UserAvatarProps {
  avatarEmoji?: string | null;
  avatarImageUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "w-7 h-7 text-sm",
  md: "w-9 h-9 text-lg",
};

export default function UserAvatar({
  avatarEmoji,
  avatarImageUrl,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const emoji = normalizeAvatarEmoji(avatarEmoji);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 sketch-border ${className}`}
      style={{ background: "oklch(0.93 0.02 80)" }}
    >
      {avatarImageUrl ? (
        <img
          src={avatarImageUrl}
          alt="User avatar"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{emoji}</span>
      )}
    </div>
  );
}
