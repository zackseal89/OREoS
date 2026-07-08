import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type Role = Database["public"]["Enums"]["team_role"];

export interface WorkspaceMembership {
  workspace: WorkspaceRow;
  role: Role;
}

interface SessionValue {
  session: Session | null;
  profile: ProfileRow | null;
  workspaces: WorkspaceMembership[];
  activeWorkspace: WorkspaceRow | null;
  role: Role | null;
  loading: boolean;
  setActiveWorkspace: (workspaceId: string) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrapBrandIfNeeded = useCallback(async (workspaceId: string) => {
    try {
      const { data: existingBrands } = await supabase
        .from("brands")
        .select("id")
        .eq("workspace_id", workspaceId)
        .limit(1);
      if (!existingBrands || existingBrands.length === 0) {
        await supabase.from("brands").insert({
          workspace_id: workspaceId,
          name: "Kafe iko Coffee",
          logo_url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=96&q=70",
          industry: "Beverages",
          colors: ["#6F4E37", "#ECE0D1", "#3B2F2F", "#D5B895"],
          typography_headline: "Playfair Display",
          voice_summary: "Warm, authentic, and passionate about the craft of coffee. We speak to coffee enthusiasts and casual drinkers alike, emphasizing heritage and quality."
        });
      }
    } catch (e) {
      console.error("Failed to bootstrap brand:", e);
    }
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    const [{ data: prof }, { data: memberships }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("workspace_members").select("role, workspaces(*)").eq("user_id", userId),
    ]);
    setProfile(prof);
    const list: WorkspaceMembership[] = (memberships ?? [])
      .filter((m): m is typeof m & { workspaces: WorkspaceRow } => m.workspaces !== null)
      .map((m) => ({ role: m.role, workspace: m.workspaces }));
    setWorkspaces(list);
    setActiveId((current) => current ?? list[0]?.workspace.id ?? null);
  }, []);

  useEffect(() => {
    if (activeId) {
      bootstrapBrandIfNeeded(activeId);
    }
  }, [activeId, bootstrapBrandIfNeeded]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadUserData(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!active) return;
      setSession(next);
      if (next) {
        await loadUserData(next.user.id);
      } else {
        setProfile(null);
        setWorkspaces([]);
        setActiveId(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const activeWorkspace =
    workspaces.find((w) => w.workspace.id === activeId)?.workspace ?? null;
  const role = workspaces.find((w) => w.workspace.id === activeId)?.role ?? null;

  const value: SessionValue = {
    session,
    profile,
    workspaces,
    activeWorkspace,
    role,
    loading,
    setActiveWorkspace: setActiveId,
    refresh: async () => {
      if (session) await loadUserData(session.user.id);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}

/** Initials from a display name, e.g. "Zack Mwangi" → "ZM". */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
