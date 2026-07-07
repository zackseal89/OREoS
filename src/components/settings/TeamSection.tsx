import { useCallback, useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { initialsOf, useSession } from "../../context/SessionContext";
import { Badge } from "../ui/Badge";
import { inputClasses } from "../ui/Field";
import type { Database } from "../../types/database";

type Role = Database["public"]["Enums"]["team_role"];

interface Member {
  user_id: string;
  name: string;
  email: string;
  role: Role;
  added_at: string;
}

const ASSIGNABLE_ROLES: Role[] = ["editor", "viewer"];

export function TeamSection({ onSave }: { onSave: (message: string) => void }) {
  const { activeWorkspace, role: myRole, session } = useSession();
  const wsId = activeWorkspace?.id ?? null;
  const myId = session?.user.id;
  const isOwner = myRole === "owner";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");

  const load = useCallback(async () => {
    if (!wsId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("list_workspace_members", { ws: wsId });
    setLoading(false);
    if (error) {
      onSave(error.message);
      return;
    }
    setMembers((data ?? []) as Member[]);
  }, [wsId, onSave]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeRole = async (userId: string, role: Role) => {
    if (!wsId) return;
    const { error } = await supabase
      .from("workspace_members")
      .update({ role })
      .eq("workspace_id", wsId)
      .eq("user_id", userId);
    if (error) {
      onSave(error.message);
      return;
    }
    onSave("Role updated.");
    void load();
  };

  const removeMember = async (userId: string, name: string) => {
    if (!wsId) return;
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", wsId)
      .eq("user_id", userId);
    if (error) {
      onSave(error.message);
      return;
    }
    onSave(`Removed ${name}.`);
    void load();
  };

  const invite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      onSave("Enter a valid email address to invite.");
      return;
    }
    // Real email invitations need the admin invite flow (service-role) — a
    // dedicated Edge Function in a later sprint.
    onSave("Email invitations arrive with the invite flow (a later sprint).");
    setInviteEmail("");
  };

  return (
    <section className="surface p-6">
      <h2 className="text-[17px] font-semibold">Team</h2>
      <p className="mt-1 text-sm text-ink-muted">
        People with access to this workspace and what they can do.
      </p>

      {isOwner && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") invite();
            }}
            placeholder="teammate@company.com"
            className={`${inputClasses} max-w-xs flex-1`}
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as Role)}
            aria-label="Role for the invited teammate"
            className={`${inputClasses} w-auto`}
          >
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={invite}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep"
          >
            <UserPlus className="size-4" aria-hidden />
            Invite
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-ink-muted">Loading team…</p>
      ) : (
        <ul className="mt-6 divide-y divide-line">
          {members.map((member) => {
            const canManage = isOwner && member.user_id !== myId && member.role !== "owner";
            return (
              <li key={member.user_id} className="flex items-center gap-3.5 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-deep">
                  {initialsOf(member.name || member.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold">
                    {member.name}
                    {member.user_id === myId && <Badge tone="neutral" label="You" />}
                  </p>
                  <p className="truncate text-[13px] text-ink-muted">{member.email}</p>
                </div>
                {canManage ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(event) => changeRole(member.user_id, event.target.value as Role)}
                      aria-label={`Role for ${member.name}`}
                      className="rounded-xl border border-line bg-card px-2.5 py-2 text-[13px] focus:border-accent focus:outline-2 focus:outline-accent/30"
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label={`Remove ${member.name}`}
                      onClick={() => removeMember(member.user_id, member.name)}
                      className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-red-50 hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </>
                ) : (
                  <Badge
                    tone={member.role === "owner" ? "success" : "neutral"}
                    label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
