import { useEffect, useMemo, useState } from "react";
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
  const normalizedAvatarImageUrl = useMemo(() => {
    const value = avatarImageUrl?.trim();
    if (!value) return null;
    if (
      value.startsWith("/") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("//") ||
      value.startsWith("data:") ||
      value.startsWith("blob:")
    ) {
      return value;
    }
    return `/${value}`;
  }, [avatarImageUrl]);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    setImageLoadError(false);
  }, [normalizedAvatarImageUrl]);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 sketch-border ${className}`}
      style={{ background: "oklch(0.93 0.02 80)" }}
    >
      {normalizedAvatarImageUrl && !imageLoadError ? (
        <img
          src={normalizedAvatarImageUrl}
          alt="User avatar"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImageLoadError(true)}
        />
      ) : (
        <span>{emoji}</span>
      )}
    </div>
  );
}
