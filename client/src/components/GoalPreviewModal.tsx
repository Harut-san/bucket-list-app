import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface GoalPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  category?: string | null;
  description?: string | null;
  subtitle?: string | null;
  meta?: string | null;
  accentColor?: string;
}

export default function GoalPreviewModal({
  open,
  onClose,
  title,
  category,
  description,
  subtitle,
  meta,
  accentColor,
}: GoalPreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-4"
      style={{ background: "oklch(0.18 0.02 60 / 0.55)" }}
      onClick={onClose}
    >
      <div
        className="sketch-card w-full max-w-md p-4 relative overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {accentColor && (
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accentColor }} />
        )}
        <button
          type="button"
          onClick={onClose}
          className="sketch-button absolute top-3 right-3 h-8 w-8 p-0 bg-background flex items-center justify-center"
          aria-label="Close goal preview"
        >
          <X size={14} />
        </button>

        <h3
          className="text-xl pr-10 break-words"
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.04em" }}
        >
          {title}
        </h3>

        {(category || subtitle) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {category && (
              <span className="category-badge" style={accentColor ? { borderColor: accentColor, color: accentColor } : undefined}>
                {category}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
                {subtitle}
              </span>
            )}
          </div>
        )}

        <div className="pencil-line my-3" />

        {description?.trim() ? (
          <p className="text-sm leading-relaxed break-words" style={{ fontFamily: "'Courier Prime', monospace" }}>
            {description.trim()}
          </p>
        ) : null}

        {meta && (
          <p className="text-xs mt-3 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
            {meta}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
