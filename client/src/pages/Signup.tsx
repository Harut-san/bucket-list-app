import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const SIMPLE_EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function mapSignupErrorMessage(rawMessage: string | undefined): string {
  const raw = (rawMessage ?? "").trim();
  const lower = raw.toLowerCase();

  if (lower.includes("already exists") || lower.includes("conflict")) {
    return "An account with this email already exists";
  }
  if (
    lower.includes("invalid email address") ||
    lower.includes("invalid_format") ||
    lower.includes('"format":"email"')
  ) {
    return "Enter a valid email address";
  }

  if (raw.startsWith("[") || raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      const issues = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { issues?: unknown }).issues)
          ? (parsed as { issues: Array<{ message?: string }> }).issues
          : [];

      const firstMessage = issues[0]?.message?.trim();
      if (firstMessage) {
        if (firstMessage.toLowerCase().includes("invalid email")) {
          return "Enter a valid email address";
        }
        return firstMessage;
      }
    } catch {
      // Ignore JSON parse errors and fall through to fallback
    }
  }

  return raw || "Unable to create account";
}

export default function Signup() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await refresh();
      navigate("/app");
    },
    onError: (mutationError) => {
      const message = mapSignupErrorMessage(mutationError.message);
      toast.error(message);
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, loading, navigate]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const missingEmail = !normalizedEmail;
    const missingPassword = !password;
    const missingConfirmPassword = !confirmPassword;

    if (missingEmail && missingPassword && missingConfirmPassword) {
      const message = "Email, password, and confirm password are required";
      toast.error(message);
      return;
    }
    if (missingEmail && missingPassword) {
      const message = "Email and password are required";
      toast.error(message);
      return;
    }
    if (missingEmail && missingConfirmPassword) {
      const message = "Email and confirm password are required";
      toast.error(message);
      return;
    }
    if (missingPassword && missingConfirmPassword) {
      const message = "Password and confirm password are required";
      toast.error(message);
      return;
    }
    if (missingEmail) {
      const message = "Email is required";
      toast.error(message);
      return;
    }
    if (!SIMPLE_EMAIL_REGEX.test(normalizedEmail)) {
      const message = "Enter a valid email address";
      toast.error(message);
      return;
    }
    if (missingPassword) {
      const message = "Password is required";
      toast.error(message);
      return;
    }
    if (missingConfirmPassword) {
      const message = "Confirm password is required";
      toast.error(message);
      return;
    }

    if (password.length < 8) {
      const message = "Password must have at least 8 characters";
      toast.error(message);
      return;
    }

    if (password !== confirmPassword) {
      const message = "Passwords do not match";
      toast.error(message);
      return;
    }

    await registerMutation.mutateAsync({
      email: normalizedEmail,
      password,
      name: name.trim() || undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="py-8 max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h2
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}
        >
          Start your list!
        </h2>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
          create an account to begin your journey
        </p>
      </div>

      <div className="sketch-card p-6 space-y-4">
        <div className="tape" />

        <form className="pt-2 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label className="block text-xs mb-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Name (optional)
            </label>
            <input
              type="text"
              className="w-full sketch-input px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Email
            </label>
            <input
              type="email"
              className="w-full sketch-input px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Password
            </label>
            <input
              type="password"
              className="w-full sketch-input px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
              Confirm password
            </label>
            <input
              type="password"
              className="w-full sketch-input px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            className="sketch-button w-full py-3 bg-foreground text-background flex items-center justify-center gap-2 text-lg disabled:opacity-60"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
            <span>Create account</span>
            <span>→</span>
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
          Already have an account?{" "}
          <Link href="/login">
            <span className="underline cursor-pointer hover:text-foreground transition-colors">Log in</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
