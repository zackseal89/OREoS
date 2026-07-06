import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../../context/SessionContext";

/** Gate for the internal app: waits for the initial session check, then either
 * renders the routed pages or redirects to the auth screen. */
export function RequireAuth() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="size-6 animate-spin text-ink-muted" aria-label="Loading" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
}
