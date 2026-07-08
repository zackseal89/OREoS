import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, MailCheck, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useSession } from "../context/SessionContext";
import { cn } from "../lib/cn";
import { Field, inputClasses } from "../components/ui/Field";

type Mode = "signin" | "signup";

export function AuthPage() {
  const { session, loading } = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  // Already signed in → bounce to the app.
  if (!loading && session) return <Navigate to="/" replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        // With email confirmation on, there's no session yet.
        if (!data.session) {
          setConfirmSent(true);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        // onAuthStateChange updates the session; the guard redirects.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-accent">O</span>REoS
          </span>
          <p className="mt-1 text-sm text-ink-muted">
            AI Marketing Operating System
          </p>
        </div>

        {confirmSent ? (
          <div className="surface p-8 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
              <MailCheck className="size-6" aria-hidden />
            </span>
            <h1 className="mt-4 text-lg font-semibold">Check your email</h1>
            <p className="mt-1 text-sm text-ink-muted">
              We sent a confirmation link to <span className="font-medium text-ink">{email}</span>.
              Confirm it, then sign in.
            </p>
            <button
              type="button"
              onClick={() => {
                setConfirmSent(false);
                setMode("signin");
              }}
              className="mt-6 text-sm font-medium text-accent-deep hover:underline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <div className="surface p-8">
            {/* Mode toggle */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={cn(
                    "rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                    mode === m ? "bg-card text-ink shadow-card" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <Field label="Name">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                    className={inputClasses}
                  />
                </Field>
              )}
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={inputClasses}
                />
              </Field>
              <Field label="Password" hint={mode === "signup" ? "At least 6 characters." : undefined}>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className={inputClasses}
                />
              </Field>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent-deep"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink-muted">
          By continuing you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
