"use client";
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Avatar } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import Toast, { useToast } from "../../../components/ds/Toast";
import StatusBadge from "../../../components/company/StatusBadge";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
import {
  listTeam,
  listInvitations,
  updateMemberRole,
  revokeMember,
  reactivateMember,
  addInvitation,
  resendInvitation,
  revokeInvitation,
  listCompanyRoles,
  saveCustomRole,
  AVAILABLE_PERMISSIONS,
  CORE_COMPANY_ROLES,
  getRoleBadgeStyle,
  getRoleDisplayName,
  normalizeRole,
  can,
  getAuth,
  syncCompanyWithBackend,
} from "../../../lib/companyStore";

const stat = "flex flex-col gap-1 rounded-md bg-sunken p-4";
const statLabel = "text-xs text-faint";
const statValue = "text-2xl leading-[1.1] font-bold";
const th = "whitespace-nowrap border-b border-line bg-sunken px-4 py-3 text-left font-bold text-muted";
const td = "border-b border-line px-4 py-3 align-middle";
const linkBtn = "inline-flex items-center gap-1.5 p-0 text-sm font-semibold text-brand hover:underline";
const stageSelect = "rounded-sm border-[1.5px] border-line bg-card px-2 py-1.5 font-body text-xs text-ink disabled:opacity-60 cursor-pointer";
const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(21,23,27,0.5)] p-6";
const MODAL = "max-h-[88vh] w-full max-w-[580px] overflow-y-auto rounded-xl bg-card p-6 shadow-lg";
const MODAL_HEAD = "mb-3 flex items-center justify-between gap-3";
const ICON_BTN = "inline-flex rounded-sm border border-transparent p-1.5 text-muted hover:bg-sunken hover:text-ink cursor-pointer";
const HINT = "flex items-start gap-2 rounded-md bg-brand-subtle px-4 py-3 text-sm leading-relaxed text-muted";
const ERRBOX = "rounded-md border border-red-100 bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger-fg";
const ACTIONS = "mt-5 flex gap-3 max-sm:flex-col-reverse [&_button]:max-sm:w-full";

function Team() {
  const [lang] = useLang();
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState("members"); // "members" | "roles"
  const [team, setTeam] = useState([]);
  const [invites, setInvites] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentAuth, setCurrentAuth] = useState({ email: "", role: "Company Admin" });

  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("");
  const [statusF, setStatusF] = useState("");

  // Modals state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "HR / Recruiter", message: "" });
  const [inviteErr, setInviteErr] = useState("");
  const [roleEdit, setRoleEdit] = useState(null);
  const [revoke, setRevoke] = useState(null);

  // Custom Role creation modal state
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: "",
    code: "",
    description: "",
    color_tone: "indigo",
    permissions: ["overview.view", "jobs.view"],
  });
  const [createRoleErr, setCreateRoleErr] = useState("");

  const [toast, setToast] = useToast();

  const refresh = () => {
    setTeam(listTeam());
    setInvites(listInvitations());
    setRoles(listCompanyRoles());
    setCurrentAuth(getAuth());
  };

  useEffect(() => {
    refresh();
    setReady(true);
    syncCompanyWithBackend().then(refresh).catch(console.warn);
    if (typeof window !== "undefined") {
      window.addEventListener("lv360-store", refresh);
      return () => window.removeEventListener("lv360-store", refresh);
    }
  }, []);

  const summary = useMemo(() => {
    const pending = invites.filter((i) => i.status === "Pending").length;
    return {
      total: team.length,
      active: team.filter((m) => m.status === "Active").length,
      pending,
      inactive: team.filter((m) => m.status === "Inactive").length,
    };
  }, [team, invites]);

  // Sole admin check
  const activeAdminsCount = useMemo(() => {
    return team.filter((m) => {
      const norm = normalizeRole(m.role);
      return (norm === "company_admin" || m.role === "Company Admin") && m.status === "Active";
    }).length;
  }, [team]);

  const filtered = useMemo(() => {
    return team.filter((m) => {
      const matchQ =
        !q ||
        m.name?.toLowerCase().includes(q.toLowerCase()) ||
        m.email?.toLowerCase().includes(q.toLowerCase());
      const matchRole = !roleF || m.role === roleF || normalizeRole(m.role) === normalizeRole(roleF);
      const matchStatus = !statusF || m.status === statusF;
      return matchQ && matchRole && matchStatus;
    });
  }, [team, q, roleF, statusF]);

  const copyInviteLink = (inv) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3002";
    const activationPath =
      inv.activationUrl || (inv.inviteToken ? `/employee-activation?token=${inv.inviteToken}` : "");
    const url = activationPath.startsWith("http")
      ? activationPath
      : `${origin}${activationPath.startsWith("/") ? "" : "/"}${activationPath}`;
    if (url && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setToast(t(lang, "Invitation link copied to clipboard!"));
    } else if (url) {
      setToast(url);
    } else {
      setToast(t(lang, "No activation link available."));
    }
  };

  const sendInvite = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email.trim())) {
      setInviteErr(t(lang, "Enter a valid email address."));
      return;
    }
    try {
      await addInvitation(inviteForm);
      refresh();
      setInviteOpen(false);
      setInviteForm({ email: "", role: "HR / Recruiter", message: "" });
      setInviteErr("");
      setToast(t(lang, "Invitation email sent (valid for 72 hours)!"));
    } catch (e) {
      setInviteErr(e.message || t(lang, "Failed to send invitation."));
    }
  };

  const applyRoleChange = async () => {
    if (!roleEdit) return;
    try {
      await updateMemberRole(roleEdit.member.id, roleEdit.nextRole);
      refresh();
      setRoleEdit(null);
      setToast(t(lang, `Role updated to ${roleEdit.nextRole}`));
    } catch (e) {
      setToast(e.message || t(lang, "Failed to update role"));
    }
  };

  const handleCreateCustomRole = async () => {
    if (!newRoleForm.name.trim()) {
      setCreateRoleErr(t(lang, "Role name is required."));
      return;
    }
    const cleanCode =
      newRoleForm.code.trim() ||
      newRoleForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!cleanCode) {
      setCreateRoleErr(t(lang, "Valid role identifier is required."));
      return;
    }
    if (["company_admin", "recruiter", "viewer", "admin"].includes(cleanCode)) {
      setCreateRoleErr(t(lang, "Cannot use reserved built-in role identifier."));
      return;
    }
    if (roles.some((r) => r.code === cleanCode)) {
      setCreateRoleErr(t(lang, `Role code '${cleanCode}' already exists.`));
      return;
    }
    if (!newRoleForm.permissions || newRoleForm.permissions.length === 0) {
      setCreateRoleErr(t(lang, "Please select at least one permission."));
      return;
    }

    try {
      const rolePayload = {
        name: newRoleForm.name.trim(),
        code: cleanCode,
        description: newRoleForm.description.trim() || "Custom organizational role",
        color_tone: newRoleForm.color_tone || "indigo",
        permissions: newRoleForm.permissions,
      };
      await saveCustomRole(rolePayload);
      refresh();
      setCreateRoleOpen(false);
      setNewRoleForm({
        name: "",
        code: "",
        description: "",
        color_tone: "indigo",
        permissions: ["overview.view", "jobs.view"],
      });
      setCreateRoleErr("");
      setToast(t(lang, `Custom role '${rolePayload.name}' created successfully!`));
    } catch (e) {
      setCreateRoleErr(e.message || t(lang, "Failed to create custom role."));
    }
  };

  const togglePermission = (permKey) => {
    setNewRoleForm((prev) => {
      const current = prev.permissions || [];
      if (current.includes(permKey)) {
        return { ...prev, permissions: current.filter((k) => k !== permKey) };
      } else {
        return { ...prev, permissions: [...current, permKey] };
      }
    });
  };

  const selectAllPermissions = () => {
    setNewRoleForm((prev) => ({
      ...prev,
      permissions: AVAILABLE_PERMISSIONS.map((p) => p.key),
    }));
  };

  const clearAllPermissions = () => {
    setNewRoleForm((prev) => ({
      ...prev,
      permissions: ["overview.view"],
    }));
  };

  // Group permissions by module for the permissions view
  const permissionsByModule = useMemo(() => {
    const map = {};
    for (const p of AVAILABLE_PERMISSIONS) {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    }
    return map;
  }, []);

  if (!ready) {
    return (
      <>
        <Skeleton width={240} height={30} style={{ marginBottom: 24 }} />
        <Skeleton height={320} />
      </>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1.5 text-2xl font-extrabold">{t(lang, "Team & Role Governance")}</h1>
          <p className="text-sm text-muted">
            {t(lang, "Manage team members, dynamic company roles, and granular permission-based access.")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {activeTab === "roles" ? (
            <Button variant="primary" onClick={() => setCreateRoleOpen(true)}>
              <Icon name="plus" size={16} /> {t(lang, "Add Custom Role")}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setInviteOpen(true)}>
              <Icon name="user-plus" size={16} /> {t(lang, "Invite Employee")}
            </Button>
          )}
        </div>
      </div>

      {/* Primary Sub-Tabs */}
      <div className="mb-6 flex border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "members"
              ? "text-brand border-b-2 border-brand"
              : "text-muted hover:text-ink border-b-2 border-transparent"
          }`}
        >
          <Icon name="users" size={16} />
          <span>{t(lang, "Team Members & Invitations")}</span>
          <span className="ml-1 rounded-full bg-sunken px-2 py-0.5 text-xs font-bold text-faint">
            {summary.total + summary.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roles")}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "roles"
              ? "text-brand border-b-2 border-brand"
              : "text-muted hover:text-ink border-b-2 border-transparent"
          }`}
        >
          <Icon name="shield" size={16} />
          <span>{t(lang, "Roles & Permissions")}</span>
          <span className="ml-1 rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-bold text-brand">
            {roles.length}
          </span>
        </button>
      </div>

      {/* TAB 1: TEAM MEMBERS & INVITATIONS */}
      {activeTab === "members" && (
        <>
          {/* Summary KPI Cards */}
          <div className="mb-7 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
            <div className={stat}>
              <span className={statLabel}>{t(lang, "Total Members")}</span>
              <strong className={statValue}>{summary.total}</strong>
            </div>
            <div className={stat}>
              <span className={statLabel}>{t(lang, "Active Members")}</span>
              <strong className={statValue}>{summary.active}</strong>
            </div>
            <div className={stat}>
              <span className={statLabel}>{t(lang, "Pending Invitations (72h)")}</span>
              <strong className={statValue}>{summary.pending}</strong>
            </div>
            <div className={stat}>
              <span className={statLabel}>{t(lang, "Inactive / Revoked")}</span>
              <strong className={statValue}>{summary.inactive}</strong>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="mb-5 flex flex-wrap gap-3">
            <div className="min-w-[200px] flex-1">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t(lang, "Search name or email")}
                size="sm"
              />
            </div>
            <div className="min-w-[170px]">
              <Select
                value={roleF}
                onChange={(e) => setRoleF(e.target.value)}
                placeholder={t(lang, "All roles")}
                options={roles.map((r) => ({ value: r.name, label: t(lang, r.name) }))}
              />
            </div>
            <div className="min-w-[150px]">
              <Select
                value={statusF}
                onChange={(e) => setStatusF(e.target.value)}
                placeholder={t(lang, "All statuses")}
                options={["Active", "Inactive"].map((s) => ({ value: s, label: t(lang, s) }))}
              />
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto rounded-lg border border-line bg-card shadow-xs">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className={th}>{t(lang, "Member")}</th>
                  <th className={th}>{t(lang, "Assigned Role")}</th>
                  <th className={th}>{t(lang, "Join Date")}</th>
                  <th className={th}>{t(lang, "Last Login")}</th>
                  <th className={th}>{t(lang, "Status")}</th>
                  <th className={th} aria-label={t(lang, "Actions")} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isCurrent =
                    m.email &&
                    currentAuth.email &&
                    m.email.toLowerCase() === currentAuth.email.toLowerCase();
                  const isSoleAdmin =
                    (normalizeRole(m.role) === "company_admin" || m.role === "Company Admin") &&
                    activeAdminsCount === 1 &&
                    m.status === "Active";
                  const badgeStyle = getRoleBadgeStyle(m.role, roles);

                  return (
                    <tr key={m.id} className="hover:bg-sunken/40 transition-colors">
                      <td className={td}>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} size={34} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <strong className="block text-[13px]">{m.name}</strong>
                              {isCurrent && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                  {t(lang, "You")}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-faint">{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <select
                            className={stageSelect}
                            value={m.role}
                            disabled={isSoleAdmin}
                            title={
                              isSoleAdmin
                                ? t(lang, "Cannot demote the only Company Administrator")
                                : t(lang, "Change member role")
                            }
                            onChange={(e) => setRoleEdit({ member: m, nextRole: e.target.value })}
                            aria-label={t(lang, "Role for") + " " + m.name}
                          >
                            {roles.map((r) => (
                              <option key={r.code} value={r.name}>
                                {t(lang, r.name)}
                              </option>
                            ))}
                          </select>
                          <span
                            className={`hidden sm:inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border ${badgeStyle.bg}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badgeStyle.dot}`} />
                            {badgeStyle.label}
                          </span>
                        </div>
                      </td>
                      <td className={td}>{m.joinDate}</td>
                      <td className={td}>{m.lastLogin}</td>
                      <td className={td}>
                        <StatusBadge kind="member" value={m.status} lang={lang} />
                      </td>
                      <td className={`${td} text-right`}>
                        {m.status === "Active" ? (
                          <button
                            className={`${linkBtn} text-danger disabled:opacity-40 disabled:cursor-not-allowed`}
                            disabled={isSoleAdmin}
                            title={
                              isSoleAdmin
                                ? t(lang, "Cannot revoke the only active Company Administrator")
                                : t(lang, "Revoke access")
                            }
                            onClick={() => setRevoke(m)}
                          >
                            {t(lang, "Revoke")}
                          </button>
                        ) : (
                          <button
                            className={linkBtn}
                            onClick={async () => {
                              try {
                                await reactivateMember(m.id);
                                refresh();
                                setToast(t(lang, "Access restored successfully"));
                              } catch (e) {
                                setToast(e.message || t(lang, "Failed to restore access"));
                              }
                            }}
                          >
                            {t(lang, "Reactivate")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-faint">
                      {t(lang, "No members match your search filters.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pending Invitations Section */}
          <div className="mt-9 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{t(lang, "Pending Invitations")}</h2>
              <p className="text-xs text-muted">
                {t(lang, "Invitations are strictly valid for 72 hours per enterprise security policy (BR-007).")}
              </p>
            </div>
            {invites.length > 0 && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {invites.filter((i) => i.status === "Pending").length} {t(lang, "active tokens")}
              </span>
            )}
          </div>

          {invites.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-card px-6 py-10 text-center text-muted">
              <Icon name="mail" size={24} style={{ color: "var(--color-faint)", margin: "0 auto 8px" }} />
              <h3 className="text-sm font-semibold">{t(lang, "No pending invitations")}</h3>
              <p className="mt-1 text-xs text-faint">
                {t(lang, "Invite colleagues to collaborate in this workspace.")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line bg-card shadow-xs">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={th}>{t(lang, "Invitee Email")}</th>
                    <th className={th}>{t(lang, "Role Assigned")}</th>
                    <th className={th}>{t(lang, "Sent Date")}</th>
                    <th className={th}>{t(lang, "Expiry (72h)")}</th>
                    <th className={th}>{t(lang, "Status")}</th>
                    <th className={th} aria-label={t(lang, "Actions")} />
                  </tr>
                </thead>
                <tbody>
                  {invites.map((i) => {
                    const badgeStyle = getRoleBadgeStyle(i.role, roles);
                    return (
                      <tr key={i.id} className="hover:bg-sunken/40 transition-colors">
                        <td className={td}>
                          <strong className="block text-[13px]">{i.email}</strong>
                          {i.message && (
                            <span className="text-xs text-faint italic line-clamp-1">
                              "{i.message}"
                            </span>
                          )}
                        </td>
                        <td className={td}>
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border ${badgeStyle.bg}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badgeStyle.dot}`} />
                            {badgeStyle.label}
                          </span>
                        </td>
                        <td className={td}>{i.sentDate}</td>
                        <td className={td}>
                          <div className="flex items-center gap-1.5">
                            <Icon name="clock" size={13} className="text-amber-500" />
                            <span className="font-medium text-ink">{i.expiry}</span>
                          </div>
                        </td>
                        <td className={td}>
                          <StatusBadge kind="member" value={i.status} lang={lang} />
                        </td>
                        <td className={`${td} whitespace-nowrap text-right`}>
                          {i.status !== "Revoked" && (
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                className={`${linkBtn} text-muted hover:text-ink`}
                                onClick={() => copyInviteLink(i)}
                                title={t(lang, "Copy invitation link")}
                              >
                                <Icon name="link" size={13} />
                                {t(lang, "Copy Link")}
                              </button>
                              <button
                                type="button"
                                className={linkBtn}
                                onClick={async () => {
                                  try {
                                    await resendInvitation(i.id);
                                    refresh();
                                    setToast(t(lang, "Invitation renewed for 72 hours and resent!"));
                                  } catch (e) {
                                    setToast(e.message || t(lang, "Failed to resend invitation."));
                                  }
                                }}
                              >
                                {t(lang, "Resend (72h)")}
                              </button>
                              <button
                                type="button"
                                className={`${linkBtn} text-danger`}
                                onClick={async () => {
                                  try {
                                    await revokeInvitation(i.id);
                                    refresh();
                                    setToast(t(lang, "Invitation revoked"));
                                  } catch (e) {
                                    setToast(e.message || t(lang, "Failed to revoke invitation."));
                                  }
                                }}
                              >
                                {t(lang, "Revoke")}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: ROLES & PERMISSIONS */}
      {activeTab === "roles" && (
        <>
          {/* Information Banner */}
          <div className="mb-6 rounded-lg border border-line bg-card p-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="rounded-md bg-brand-subtle p-2 text-brand">
                <Icon name="shield" size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">
                  {t(lang, "Dynamic Roles & Granular Permission RBAC")}
                </h3>
                <p className="mt-1 text-sm text-muted leading-relaxed">
                  {t(
                    lang,
                    "Three core roles (Company Admin, HR / Recruiter, Viewer) are standard. Workspace authorization is enforced strictly at the permission level rather than role titles, allowing you to add custom organizational roles at any time."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Roles Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((r) => {
              const badgeStyle = getRoleBadgeStyle(r.code, roles);
              const membersWithRole = team.filter(
                (m) => normalizeRole(m.role) === r.code || m.role === r.name
              );
              const isRootAdmin = r.code === "company_admin" || r.permissions?.includes("*");

              return (
                <div
                  key={r.code}
                  className="flex flex-col rounded-xl border border-line bg-card p-5 shadow-xs hover:border-line-strong transition-all"
                >
                  {/* Card Header */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${badgeStyle.dot}`} />
                        <h4 className="text-base font-bold text-ink">{r.name}</h4>
                      </div>
                      <span className="text-[11px] font-mono text-faint">code: {r.code}</span>
                    </div>
                    {r.is_system ? (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                        {t(lang, "Fixed Core")}
                      </span>
                    ) : (
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                        {t(lang, "Custom")}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mb-4 text-xs text-muted leading-relaxed min-h-[36px]">
                    {r.description}
                  </p>

                  {/* Member count pill */}
                  <div className="mb-4 flex items-center justify-between border-y border-line py-2 text-xs">
                    <span className="text-faint">{t(lang, "Assigned Members")}:</span>
                    <strong className="text-ink font-semibold">
                      {membersWithRole.length} {membersWithRole.length === 1 ? "member" : "members"}
                    </strong>
                  </div>

                  {/* Permissions Checklist */}
                  <div className="flex-1">
                    <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">
                      {t(lang, "Granted Permissions")}
                    </h5>
                    <div className="flex flex-col gap-1.5">
                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const hasPerm = isRootAdmin || r.permissions?.includes(perm.key);
                        return (
                          <div
                            key={perm.key}
                            className={`flex items-center justify-between rounded px-2 py-1 text-xs transition-colors ${
                              hasPerm ? "bg-emerald-50/70 text-emerald-900" : "text-faint/60"
                            }`}
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              {hasPerm ? (
                                <Icon name="check" size={13} className="text-emerald-600 flex-shrink-0" />
                              ) : (
                                <span className="w-3 text-center text-faint">—</span>
                              )}
                              <span>{perm.name}</span>
                            </span>
                            <span className="text-[10px] text-faint font-mono">{perm.module}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MODAL 1: Invite Employee (Screen e15) */}
      {inviteOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Invite Employee")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-md font-bold">{t(lang, "Invite Employee to Workspace")}</strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setInviteOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="text-sm text-muted">
              {t(
                lang,
                "They will receive an activation email with a secure registration link valid for 72 hours."
              )}
            </p>

            <div className="mt-4 flex flex-col gap-3.5">
              <Input
                label={t(lang, "Employee Email")}
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="colleague@company.com"
                error={inviteErr}
              />

              <Select
                label={t(lang, "Assigned Role")}
                value={inviteForm.role}
                onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                options={roles.map((r) => ({ value: r.name, label: `${r.name} (${r.is_system ? "Core" : "Custom"})` }))}
              />

              {/* Dynamic live permission preview for selected role */}
              <div className="rounded-lg border border-line bg-sunken/60 p-3">
                <span className="block mb-2 text-xs font-semibold text-muted">
                  {t(lang, "Permissions granted to")} <strong>{inviteForm.role}</strong>:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_PERMISSIONS.map((p) => {
                    const normSelected = normalizeRole(inviteForm.role);
                    const selRoleObj = roles.find(
                      (r) => r.code === normSelected || r.name.toLowerCase() === inviteForm.role.toLowerCase()
                    );
                    const granted =
                      normSelected === "company_admin" ||
                      selRoleObj?.permissions?.includes("*") ||
                      selRoleObj?.permissions?.includes(p.key);

                    if (!granted) return null;
                    return (
                      <span
                        key={p.key}
                        className="inline-flex items-center gap-1 rounded-sm bg-card px-2 py-0.5 text-[11px] font-medium text-ink border border-line shadow-2xs"
                      >
                        <Icon name="check" size={11} className="text-emerald-600" />
                        {p.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 72h Token Notice */}
              <p className={HINT}>
                <Icon name="clock" size={16} className="text-brand flex-shrink-0 mt-0.5" />
                <span>
                  {t(lang, "Invitation link expires automatically after 72 hours. You can resend at any time.")}
                </span>
              </p>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">
                  {t(lang, "Invitation Welcome Message")}{" "}
                  <span className="font-normal text-faint">({t(lang, "optional")})</span>
                </label>
                <textarea
                  className="min-h-[72px] w-full resize-y rounded-md border-[1.5px] border-line px-3.5 py-[11px] font-body text-base text-ink focus:border-line-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder={t(lang, "Welcome to our hiring team! Let's get started…")}
                />
              </div>
            </div>

            <div className={ACTIONS}>
              <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="primary" onClick={sendInvite}>
                <Icon name="send" size={14} /> {t(lang, "Send Invitation (72h)")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Member Role (Screen e16) */}
      {roleEdit && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Change role")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-md font-bold">
                {t(lang, "Change Role for")} {roleEdit.member.name}
              </strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setRoleEdit(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-sm text-muted">
              {t(lang, "Current role")}: <strong>{roleEdit.member.role}</strong>
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <Select
                label={t(lang, "New Role")}
                value={roleEdit.nextRole}
                onChange={(e) => setRoleEdit({ ...roleEdit, nextRole: e.target.value })}
                options={roles.map((r) => ({ value: r.name, label: r.name }))}
              />

              {normalizeRole(roleEdit.nextRole) === "company_admin" && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                  <Icon name="alert-triangle" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {t(
                      lang,
                      "Caution: Company Admin grants full authority including managing company billing, settings, and other team members."
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className={ACTIONS}>
              <Button variant="secondary" onClick={() => setRoleEdit(null)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="primary" onClick={applyRoleChange}>
                {t(lang, "Confirm Role Change")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Revoke Member Access */}
      {revoke && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Revoke access")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-md font-bold">
                {t(lang, "Revoke access for")} {revoke.name}?
              </strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setRevoke(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className={ERRBOX} role="alert">
              {t(
                lang,
                "Their account status will be marked Inactive and they will immediately lose access to this workspace. You can restore access later if needed."
              )}
            </p>
            <div className={ACTIONS}>
              <Button variant="secondary" onClick={() => setRevoke(null)}>
                {t(lang, "Cancel")}
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await revokeMember(revoke.id);
                    refresh();
                    setRevoke(null);
                    setToast(t(lang, "Access revoked"));
                  } catch (e) {
                    setToast(e.message || t(lang, "Failed to revoke access"));
                  }
                }}
              >
                {t(lang, "Revoke Access")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Custom Role */}
      {createRoleOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Add Custom Role")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-md font-bold">{t(lang, "Create Custom Company Role")}</strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setCreateRoleOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="text-sm text-muted">
              {t(
                lang,
                "Configure a custom organizational role by selecting exact granular permissions."
              )}
            </p>

            {createRoleErr && (
              <div className="mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                {createRoleErr}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3.5">
              <Input
                label={t(lang, "Role Name")}
                value={newRoleForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
                  setNewRoleForm((prev) => ({ ...prev, name: val, code: autoSlug }));
                }}
                placeholder="e.g. Hiring Manager"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t(lang, "Role Identifier Code")}
                  value={newRoleForm.code}
                  onChange={(e) => setNewRoleForm((prev) => ({ ...prev, code: e.target.value.toLowerCase() }))}
                  placeholder="e.g. hiring_manager"
                />

                <Select
                  label={t(lang, "Badge Color Tone")}
                  value={newRoleForm.color_tone}
                  onChange={(e) => setNewRoleForm((prev) => ({ ...prev, color_tone: e.target.value }))}
                  options={[
                    { value: "indigo", label: "Indigo" },
                    { value: "blue", label: "Blue" },
                    { value: "emerald", label: "Emerald (Green)" },
                    { value: "purple", label: "Purple" },
                    { value: "amber", label: "Amber (Orange)" },
                    { value: "slate", label: "Slate (Gray)" },
                  ]}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">
                  {t(lang, "Role Description")}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-[1.5px] border-line px-3 py-2 text-sm text-ink focus:border-line-brand focus:outline-none"
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Briefly describe what this role is responsible for…"
                />
              </div>

              {/* Granular Permissions Picker */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-ink">
                    {t(lang, "Granular Permissions")} ({newRoleForm.permissions.length}/{AVAILABLE_PERMISSIONS.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                    >
                      {t(lang, "Select all")}
                    </button>
                    <span className="text-faint">·</span>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="text-xs font-semibold text-muted hover:text-ink cursor-pointer"
                    >
                      {t(lang, "Clear")}
                    </button>
                  </div>
                </div>

                <div className="max-h-[200px] overflow-y-auto rounded-md border border-line bg-sunken/40 p-2.5 flex flex-col gap-2">
                  {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                    <div key={moduleName} className="border-b border-line/60 pb-1.5 last:border-b-0 last:pb-0">
                      <span className="block mb-1 text-[11px] font-bold uppercase tracking-wider text-faint">
                        {moduleName}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {perms.map((p) => {
                          const checked = newRoleForm.permissions.includes(p.key);
                          return (
                            <label
                              key={p.key}
                              className="flex items-center gap-2 text-xs text-ink cursor-pointer hover:bg-card p-1 rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(p.key)}
                                className="h-3.5 w-3.5 rounded border-line text-brand focus:ring-brand"
                              />
                              <span className="font-medium">{p.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={ACTIONS}>
              <Button variant="secondary" onClick={() => setCreateRoleOpen(false)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="primary" onClick={handleCreateCustomRole}>
                <Icon name="check" size={14} /> {t(lang, "Create Role")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast} />
    </>
  );
}

export default function TeamClient() {
  return (
    <RequirePermission action="team.manage">
      <Team />
    </RequirePermission>
  );
}
