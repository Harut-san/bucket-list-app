import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const SIMPLE_EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function mapLoginErrorMessage(rawMessage: string | undefined): string {
  const raw = (rawMessage ?? "").trim();
  const lower = raw.toLowerCase();

  if (lower.includes("invalid email or password")) {
    return "Incorrect email or password";
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

  return raw || "Unable to sign in";
}

export default function Login() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await refresh();
      navigate("/app");
    },
    onError: (mutationError) => {
      const message = mapLoginErrorMessage(mutationError.message);
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

    if (missingEmail && missingPassword) {
      const message = "Email and password are required";
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
    if (!password) {
      const message = "Password is required";
      toast.error(message);
      return;
    }
    await loginMutation.mutateAsync({
      email: normalizedEmail,
      password,
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
          Welcome back!
        </h2>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
          log in to access your bucket list
        </p>
      </div>

      <div className="sketch-card p-6 space-y-4">
        <div className="tape" />

        <form className="pt-2 space-y-4" onSubmit={onSubmit} noValidate>
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
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="sketch-button star-pop-button relative w-full py-3 bg-foreground text-background flex items-center justify-center gap-2 text-lg disabled:opacity-60"
            disabled={loginMutation.isPending}
          >
            <span className="star-pop-spark star-pop-spark-1">✦</span>
            <span className="star-pop-spark star-pop-spark-2">✦</span>
            <span className="star-pop-spark star-pop-spark-3">✦</span>
            <span className="star-pop-spark star-pop-spark-4">✦</span>
            {loginMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
            <span>Sign in</span>
            <span>→</span>
          </button>
        </form>

        <div className="pencil-line" />

        <p className="text-center text-xs text-muted-foreground" style={{ fontFamily: "'Courier Prime', monospace" }}>
          Don't have an account?{" "}
          <Link href="/signup">
            <span className="underline cursor-pointer hover:text-foreground transition-colors">Sign up</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
