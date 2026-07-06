import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { teamMembers as seedMembers } from "../../data/settings";
import { Badge } from "../ui/Badge";
import { inputClasses } from "../ui/Field";
import type { TeamMember, TeamRole } from "../../types";

const ASSIGNABLE_ROLES: TeamRole[] = ["editor", "viewer"];

function initialsOf(email: string): string {
  const namePart = email.split("@")[0] ?? "";
  return namePart.slice(0, 2).toUpperCase() || "??";
}

export function TeamSection({ onSave }: { onSave: (message: string) => void }) {
  const [members, setMembers] = useState<TeamMember[]>(seedMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("editor");

  const invite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      onSave("Enter a valid email address to send an invite.");
      return;
    }
    if (members.some((member) => member.email === email)) {
      onSave("That person is already on the team.");
      return;
    }
    setMembers((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: email.split("@")[0] ?? email,
        email,
        role: inviteRole,
        initials: initialsOf(email),
        invited: true,
      },
    ]);
    setInviteEmail("");
    onSave(`Invite sent to ${email}.`);
  };

  const setRole = (id: string, role: TeamRole) => {
    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, role } : member)),
    );
    onSave("Role updated.");
  };

  const remove = (id: string) => {
    const member = members.find((m) => m.id === id);
    setMembers((current) => current.filter((m) => m.id !== id));
    onSave(`Removed ${member?.name ?? "member"} from the workspace.`);
  };

  return (
    <section className="surface p-6">
      <h2 className="text-[17px] font-semibold">Team</h2>
      <p className="mt-1 text-sm text-ink-muted">
        People with access to this workspace and what they can do.
      </p>

      {/* Invite row */}
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
          onChange={(event) => setInviteRole(event.target.value as TeamRole)}
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

      {/* Members */}
      <ul className="mt-6 divide-y divide-line">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3.5 py-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-deep">
              {member.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-semibold">
                {member.name}
                {member.invited && <Badge tone="info" label="Invited" />}
              </p>
              <p className="truncate text-[13px] text-ink-muted">{member.email}</p>
            </div>
            {member.role === "owner" ? (
              <Badge tone="success" label="Owner" />
            ) : (
              <>
                <select
                  value={member.role}
                  onChange={(event) => setRole(member.id, event.target.value as TeamRole)}
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
                  onClick={() => remove(member.id)}
                  className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-red-50 hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
