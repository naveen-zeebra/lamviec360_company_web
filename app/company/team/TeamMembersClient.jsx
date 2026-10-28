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
  AVAILABLE_PERMISSIONS,
  getRoleBadgeStyle,
  normalizeRole,
  getAuth,
  getCompany,
  syncCompanyWithBackend,
} from "../../../lib/companyStore";

const stat = "flex flex-col gap-1 rounded-xl bg-card border border-line p-4 shadow-2xs";
const statLabel = "text-xs font-semibold text-faint";
const statValue = "text-2xl leading-[1.1] font-extrabold text-ink";
const th = "whitespace-nowrap border-b border-line bg-sunken/60 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted";
const td = "border-b border-line px-4 py-3.5 align-middle text-sm";
const linkBtn = "inline-flex items-center gap-1.5 p-0 text-xs font-semibold text-brand hover:underline cursor-pointer";
const stageSelect = "rounded-md border-[1.5px] border-line bg-card px-2.5 py-1 font-body text-xs text-ink disabled:opacity-60 cursor-pointer focus:border-brand focus:outline-none";
const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(21,23,27,0.55)] p-4 backdrop-blur-xs";
const MODAL = "max-h-[90vh] w-full max-w-[580px] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-line";
const MODAL_HEAD = "mb-4 flex items-center justify-between gap-3 border-b border-line pb-3.5";
const ICON_BTN = "inline-flex rounded-lg border border-transparent p-1.5 text-muted hover:bg-sunken hover:text-ink cursor-pointer transition-colors";
const HINT = "flex items-start gap-2.5 rounded-lg bg-blue-50/70 border border-blue-100 px-3.5 py-2.5 text-xs leading-relaxed text-blue-900";
const ERRBOX = "rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-800 flex items-start gap-2";
const ACTIONS = "mt-6 flex items-center justify-end gap-3 max-sm:flex-col-reverse [&_button]:max-sm:w-full";

const PAGE_SIZE = 10;

function TeamMembersInner() {
  const [lang] = useLang();
  const [ready, setReady] = useState(false);
  const [team, setTeam] = useState([]);
  const [invites, setInvites] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentAuth, setCurrentAuth] = useState({ email: "", role: "Company Admin" });
  const [company, setCompanyState] = useState({ name: "Company" });

  // Filter & Search states
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [page, setPage] = useState(1);

  // Modals state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "HR / Recruiter", message: "" });
  const [inviteErr, setInviteErr] = useState("");
  const [roleEdit, setRoleEdit] = useState(null);
  const [revokeMemberTarget, setRevokeMemberTarget] = useState(null);
  const [revokeInviteTarget, setRevokeInviteTarget] = useState(null);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  const [toast, setToast] = useToast();

  const refresh = () => {
    setTeam(listTeam());
    setInvites(listInvitations());
    setRoles(listCompanyRoles());
    setCurrentAuth(getAuth());
    setCompanyState(getCompany());
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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, roleF, statusF]);

  // Combined records: members + invitations
  const combinedRecords = useMemo(() => {
    const memberRows = team.map((m) => ({
      kind: "member",
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status || "Active",
      dateLabel: t(lang, "Joined"),
      dateValue: m.joinDate || "—",
      lastLogin: m.lastLogin || "—",
      raw: m,
    }));

    const inviteRows = invites.map((i) => ({
      kind: "invitation",
      id: i.id,
      name: t(lang, "Invited Colleague"),
      email: i.email,
      role: i.role,
      status: i.status || "Pending",
      dateLabel: t(lang, "Sent"),
      dateValue: i.sentDate || "—",
      expiry: i.expiry || "—",
      message: i.message,
      token: i.inviteToken,
      activationUrl: i.activationUrl,
      raw: i,
    }));

    return [...memberRows, ...inviteRows];
  }, [team, invites, lang]);

  const summary = useMemo(() => {
    const pending = invites.filter((i) => i.status === "Pending").length;
    const expired = invites.filter((i) => i.status === "Expired").length;
    return {
      total: team.length + pending,
      active: team.filter((m) => m.status === "Active").length,
      pending,
      expired,
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

  const filteredRecords = useMemo(() => {
    return combinedRecords.filter((rec) => {
      const matchQ =
        !q ||
        rec.name?.toLowerCase().includes(q.toLowerCase()) ||
        rec.email?.toLowerCase().includes(q.toLowerCase()) ||
        rec.raw?.message?.toLowerCase().includes(q.toLowerCase());

      const matchRole =
        !roleF ||
        rec.role === roleF ||
        normalizeRole(rec.role) === normalizeRole(roleF);

      let matchStatus = true;
      if (statusF) {
        if (statusF === "Inactive") {
          matchStatus = rec.status === "Inactive" || rec.status === "Revoked";
        } else {
          matchStatus = rec.status === statusF;
        }
      }

      return matchQ && matchRole && matchStatus;
    });
  }, [combinedRecords, q, roleF, statusF]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  const copyInviteLink = (inv) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3002";
    const activationPath =
      inv.activationUrl || (inv.inviteToken ? `/employee-activation?token=${inv.inviteToken}` : `/employee-activation?token=${inv.id}`);
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

  const handleSendInvite = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email.trim())) {
      setInviteErr(t(lang, "Please enter a valid email address."));
      return;
    }
    setInviteErr("");
    try {
      await addInvitation(inviteForm);
      refresh();
      setInviteOpen(false);
      setInviteForm({ email: "", role: "HR / Recruiter", message: "" });
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

  const handleConfirmRevokeMember = async () => {
    if (!revokeMemberTarget) return;
    try {
      await revokeMember(revokeMemberTarget.id);
      refresh();
      setRevokeMemberTarget(null);
      setToast(t(lang, "Member access has been revoked."));
    } catch (e) {
      setToast(e.message || t(lang, "Failed to revoke member access."));
    }
  };

  const handleConfirmRevokeInvite = async () => {
    if (!revokeInviteTarget) return;
    try {
      await revokeInvitation(revokeInviteTarget.id);
      refresh();
      setRevokeInviteTarget(null);
      setToast(t(lang, "Invitation has been revoked."));
    } catch (e) {
      setToast(e.message || t(lang, "Failed to revoke invitation."));
    }
  };

  if (!ready) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton width={260} height={32} />
        <Skeleton height={280} />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t(lang, "Team Members")}</h1>
          <p className="text-sm text-muted mt-0.5">
            {t(lang, "Invite team members, assign predefined roles, and manage company access.")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="primary" onClick={() => setInviteOpen(true)}>
            <Icon name="user-plus" size={15} style={{ marginRight: 6 }} />
            {t(lang, "Invite Member")}
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Total Workspace Size")}</span>
          <strong className={statValue}>{summary.total}</strong>
        </div>
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Active Members")}</span>
          <strong className="text-2xl leading-[1.1] font-extrabold text-emerald-600">
            {summary.active}
          </strong>
        </div>
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Pending Invitations")}</span>
          <strong className="text-2xl leading-[1.1] font-extrabold text-amber-600">
            {summary.pending}
          </strong>
        </div>
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Inactive / Expired")}</span>
          <strong className="text-2xl leading-[1.1] font-extrabold text-slate-500">
            {summary.inactive + summary.expired}
          </strong>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border border-line shadow-2xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="min-w-[220px] flex-1">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t(lang, "Search by name, email, or message...")}
              size="sm"
            />
          </div>
          <div className="min-w-[160px]">
            <Select
              value={roleF}
              onChange={(e) => setRoleF(e.target.value)}
              placeholder={t(lang, "All roles")}
              options={[
                { value: "", label: t(lang, "All roles") },
                ...roles.map((r) => ({ value: r.name, label: t(lang, r.name) })),
              ]}
            />
          </div>
          <div className="min-w-[150px]">
            <Select
              value={statusF}
              onChange={(e) => setStatusF(e.target.value)}
              placeholder={t(lang, "All statuses")}
              options={[
                { value: "", label: t(lang, "All statuses") },
                { value: "Active", label: t(lang, "Active") },
                { value: "Pending", label: t(lang, "Pending") },
                { value: "Expired", label: t(lang, "Expired") },
                { value: "Inactive", label: t(lang, "Inactive") },
              ]}
            />
          </div>
        </div>

        {(q || roleF || statusF) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setRoleF("");
              setStatusF("");
            }}
            className="text-xs font-semibold text-muted hover:text-danger cursor-pointer px-2 py-1"
          >
            {t(lang, "Clear filters")}
          </button>
        )}
      </div>

      {/* Members & Invitations Table */}
      <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-xs">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr>
              <th className={th}>{t(lang, "Member / Invitee")}</th>
              <th className={th}>{t(lang, "Assigned Role")}</th>
              <th className={th}>{t(lang, "Status")}</th>
              <th className={th}>{t(lang, "Activity / Expiry")}</th>
              <th className={`${th} text-right`} aria-label={t(lang, "Actions")}>
                {t(lang, "Actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((rec) => {
              const isCurrent =
                rec.email &&
                currentAuth.email &&
                rec.email.toLowerCase() === currentAuth.email.toLowerCase();

              const isSoleAdmin =
                (normalizeRole(rec.role) === "company_admin" || rec.role === "Company Admin") &&
                activeAdminsCount === 1 &&
                rec.status === "Active";

              const badgeStyle = getRoleBadgeStyle(rec.role, roles);

              return (
                <tr key={`${rec.kind}-${rec.id}`} className="hover:bg-sunken/40 transition-colors">
                  {/* Name & Email */}
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={rec.name} size={36} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="block text-sm text-ink">{rec.name}</strong>
                          {isCurrent && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                              {t(lang, "You")}
                            </span>
                          )}
                          {rec.kind === "invitation" && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                              {t(lang, "Invitation")}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-faint block">{rec.email}</span>
                        {rec.message && (
                          <span className="text-[11px] text-muted italic line-clamp-1 mt-0.5">
                            "{rec.message}"
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Assigned Role */}
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      {rec.kind === "member" && rec.status === "Active" ? (
                        <select
                          className={stageSelect}
                          value={rec.role}
                          disabled={isSoleAdmin}
                          title={
                            isSoleAdmin
                              ? t(lang, "Cannot demote the only Company Administrator")
                              : t(lang, "Change member role")
                          }
                          onChange={(e) => setRoleEdit({ member: rec.raw, nextRole: e.target.value })}
                          aria-label={t(lang, "Role for") + " " + rec.name}
                        >
                          {roles.map((r) => (
                            <option key={r.code} value={r.name}>
                              {t(lang, r.name)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border ${badgeStyle.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badgeStyle.dot}`} />
                          {badgeStyle.label}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className={td}>
                    <StatusBadge kind="member" value={rec.status} lang={lang} />
                  </td>

                  {/* Date / Expiry */}
                  <td className={td}>
                    <div className="flex flex-col text-xs">
                      {rec.kind === "member" ? (
                        <>
                          <span className="text-ink font-medium">
                            {rec.dateLabel}: {rec.dateValue}
                          </span>
                          <span className="text-faint text-[11px]">
                            {t(lang, "Last Login")}: {rec.lastLogin}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-ink font-medium">
                            {rec.dateLabel}: {rec.dateValue}
                          </span>
                          <span className={`text-[11px] font-semibold flex items-center gap-1 mt-0.5 ${rec.status === "Expired" ? "text-danger" : "text-amber-700"
                            }`}>
                            <Icon name="clock" size={11} />
                            {rec.status === "Expired"
                              ? t(lang, "Expired")
                              : `${t(lang, "Expires")}: ${rec.expiry}`}
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className={`${td} text-right whitespace-nowrap`}>
                    {rec.kind === "member" ? (
                      rec.status === "Active" ? (
                        <button
                          type="button"
                          className={`${linkBtn} text-danger hover:text-danger-fg disabled:opacity-40 disabled:cursor-not-allowed`}
                          disabled={isSoleAdmin}
                          title={
                            isSoleAdmin
                              ? t(lang, "Cannot revoke the only active Company Administrator")
                              : t(lang, "Revoke access")
                          }
                          onClick={() => setRevokeMemberTarget(rec.raw)}
                        >
                          <Icon name="user-x" size={13} />
                          {t(lang, "Revoke Access")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={linkBtn}
                          onClick={async () => {
                            try {
                              await reactivateMember(rec.id);
                              refresh();
                              setToast(t(lang, "Access restored successfully"));
                            } catch (e) {
                              setToast(e.message || t(lang, "Failed to restore access"));
                            }
                          }}
                        >
                          <Icon name="rotate-ccw" size={13} />
                          {t(lang, "Reactivate")}
                        </button>
                      )
                    ) : (
                      // Invitation Actions
                      <div className="inline-flex items-center gap-2.5">
                        {rec.status !== "Revoked" && (
                          <>
                            <button
                              type="button"
                              className={`${linkBtn} text-muted hover:text-ink`}
                              onClick={() => copyInviteLink(rec.raw)}
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
                                  await resendInvitation(rec.id);
                                  refresh();
                                  setToast(t(lang, "Invitation renewed for 72 hours and resent!"));
                                } catch (e) {
                                  setToast(e.message || t(lang, "Failed to resend invitation."));
                                }
                              }}
                            >
                              <Icon name="send" size={13} />
                              {t(lang, "Resend (72h)")}
                            </button>
                            <button
                              type="button"
                              className={`${linkBtn} text-danger hover:text-danger-fg`}
                              onClick={() => setRevokeInviteTarget(rec.raw)}
                            >
                              <Icon name="x" size={13} />
                              {t(lang, "Cancel")}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-muted">
                  <Icon name="users" size={28} className="text-faint mx-auto mb-2 opacity-50" />
                  <strong className="block text-sm text-ink">{t(lang, "No records found")}</strong>
                  <span className="text-xs text-faint">
                    {t(lang, "Try adjusting your search criteria or invite a new colleague.")}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredRecords.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted">
          <div>
            {t(lang, "Showing")}{" "}
            <strong>
              {Math.min((page - 1) * PAGE_SIZE + 1, filteredRecords.length)}–
              {Math.min(page * PAGE_SIZE, filteredRecords.length)}
            </strong>{" "}
            {t(lang, "of")} <strong>{filteredRecords.length}</strong> {t(lang, "records")}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <Icon name="chevron-left" size={13} />
              <span>{t(lang, "Previous")}</span>
            </Button>

            <div className="px-2 font-bold text-ink">
              {page} / {totalPages}
            </div>

            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>{t(lang, "Next")}</span>
              <Icon name="chevron-right" size={13} />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INVITE EMPLOYEE                                                    */}
      {/* ========================================================================= */}
      {inviteOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Invite Member")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <div>
                <strong className="text-base font-bold text-ink">
                  {t(lang, "Invite Colleague to Workspace")}
                </strong>
                <p className="text-xs text-muted mt-0.5">
                  {t(lang, "Send an official invitation with a secure 72-hour activation token.")}
                </p>
              </div>
              <button
                type="button"
                className={ICON_BTN}
                aria-label={t(lang, "Close")}
                onClick={() => setInviteOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {inviteErr && (
              <div className={`${ERRBOX} mb-4`}>
                <Icon name="alert-circle" size={16} className="text-danger shrink-0 mt-0.5" />
                <span>{inviteErr}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Input
                label={t(lang, "Colleague Email Address")}
                type="email"
                value={inviteForm.email}
                onChange={(e) => {
                  setInviteForm((f) => ({ ...f, email: e.target.value }));
                  if (inviteErr) setInviteErr("");
                }}
                placeholder="colleague@company.com"
              />

              <Select
                label={t(lang, "Assigned Role")}
                placeholder={t(lang, "Select Role")}
                value={inviteForm.role}
                onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                options={roles.map((r) => ({ value: r.name, label: r.name }))}
              />

              {/* Dynamic live permission preview for selected role */}
              <div className="rounded-xl border border-line bg-sunken/40 p-3.5">
                <span className="block mb-2 text-xs font-bold text-ink">
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
                        className="inline-flex items-center gap-1 rounded bg-card px-2 py-1 text-[11px] font-medium text-ink border border-line shadow-2xs"
                      >
                        <Icon name="check" size={11} className="text-emerald-600" />
                        {p.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 72h Token Notice */}
              <div className={HINT}>
                <Icon name="clock" size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  {t(
                    lang,
                    "Invitation link expires automatically after 72 hours per enterprise security policy. You can renew or resend at any time."
                  )}
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  {t(lang, "Custom Welcome Message")}{" "}
                  <span className="font-normal text-faint">({t(lang, "optional")})</span>
                </label>
                <textarea
                  className="min-h-[72px] w-full resize-y rounded-lg border-[1.5px] border-line px-3.5 py-2 font-body text-sm text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder={t(lang, "Welcome to our hiring team! Let's get started…")}
                />
              </div>

              {/* Preview Email Link */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setEmailPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  <Icon name="mail" size={13} />
                  <span>{t(lang, "Preview Invitation Email Template")}</span>
                </button>
              </div>
            </div>

            <div className={ACTIONS}>
              <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="primary" onClick={handleSendInvite}>
                <Icon name="send" size={14} style={{ marginRight: 6 }} />
                {t(lang, "Send Invitation (72h)")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INVITATION EMAIL TEMPLATE PREVIEW                                  */}
      {/* ========================================================================= */}
      {emailPreviewOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Email Preview")}>
          <div className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl border border-line">
            <div className={MODAL_HEAD}>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 text-blue-700 p-1.5">
                  <Icon name="mail" size={16} />
                </div>
                <div>
                  <strong className="text-base font-bold text-ink">
                    {t(lang, "Invitation Email Preview")}
                  </strong>
                  <span className="text-xs text-muted block">
                    {t(lang, "Exact representation of the email delivered to the recipient")}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={ICON_BTN}
                onClick={() => setEmailPreviewOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Email Container Card */}
            <div className="rounded-xl border border-line bg-slate-50 p-4 text-ink">
              <div className="bg-white rounded-xl border border-line shadow-sm overflow-hidden">
                {/* Email Header */}
                <div className="bg-[#0f172a] p-5 text-center text-white">
                  <div className="text-lg font-extrabold text-[#3b82f6] tracking-tight">
                    LàmViệc360
                  </div>
                  <span className="text-[11px] text-white/70 block mt-0.5">
                    {company.name || "Employer Workspace"}
                  </span>
                </div>

                {/* Email Body */}
                <div className="p-6">
                  <span className="inline-block rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700 mb-3">
                    &#128101; Workspace Team Invitation
                  </span>
                  <h3 className="text-lg font-bold text-ink mb-2">Hello,</h3>
                  <p className="text-sm text-muted leading-relaxed mb-3">
                    <strong>{currentAuth.name || "A workspace administrator"}</strong> has invited you to collaborate in the <strong>{company.name || "Employer Organization"}</strong> hiring team on <strong>LàmViệc360</strong>.
                  </p>
                  <p className="text-sm text-muted leading-relaxed mb-4">
                    You have been assigned the <strong>{inviteForm.role}</strong> role, granting you access to manage hiring pipelines and job applications.
                  </p>

                  {inviteForm.message && (
                    <div className="my-4 rounded-lg border-l-4 border-blue-500 bg-slate-100 p-3.5 text-xs text-slate-800 italic">
                      "{inviteForm.message}"
                      <span className="block text-[11px] font-semibold text-slate-500 mt-1 not-italic">
                        — {currentAuth.name || "Administrator"}
                      </span>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="my-6 text-center">
                    <span className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md cursor-default">
                      Accept Invitation & Join Team &rarr;
                    </span>
                  </div>

                  {/* 72h Alert */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed mb-4 flex items-start gap-2">
                    <Icon name="clock" size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>72-Hour Security Expiration:</strong> This invitation token is unique and will expire in 72 hours.
                    </span>
                  </div>

                  {/* Steps */}
                  <div className="rounded-lg border border-line bg-slate-50 p-4 text-xs text-muted mb-4">
                    <strong className="block text-ink font-bold mb-2">
                      Quick instructions to get started:
                    </strong>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Click the Accept Invitation button to open the secure activation portal.</li>
                      <li>Set up your password and confirm your profile details.</li>
                      <li>Sign in to your hiring workspace and start collaborating.</li>
                    </ol>
                  </div>

                  <p className="text-[11px] text-faint">
                    Need assistance? Contact support at support@lamviec360.vn.
                  </p>
                </div>

                {/* Email Footer */}
                <div className="border-t border-line bg-slate-50 p-4 text-center text-[11px] text-faint leading-relaxed">
                  Security Notice: If you did not expect this invitation, you can safely ignore this email. No account will be activated without your confirmation.
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setEmailPreviewOpen(false)}>
                {t(lang, "Close Preview")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE ROLE                                                        */}
      {/* ========================================================================= */}
      {roleEdit && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Change Role")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-base font-bold text-ink">
                {t(lang, "Change Role for")} {roleEdit.member.name}
              </strong>
              <button
                type="button"
                className={ICON_BTN}
                onClick={() => setRoleEdit(null)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-xs text-muted mb-4">
              {t(lang, "Current role")}: <strong>{roleEdit.member.role}</strong>
            </p>

            <div className="flex flex-col gap-4">
              <Select
                label={t(lang, "New Role")}
                value={roleEdit.nextRole}
                onChange={(e) => setRoleEdit({ ...roleEdit, nextRole: e.target.value })}
                options={roles.map((r) => ({ value: r.name, label: r.name }))}
              />

              {normalizeRole(roleEdit.nextRole) === "company_admin" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                  <Icon name="alert-triangle" size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    {t(
                      lang,
                      "Caution: Company Admins have full access including billing, settings, and team management."
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

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM REVOKE MEMBER ACCESS                                       */}
      {/* ========================================================================= */}
      {revokeMemberTarget && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Revoke Access")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-base font-bold text-danger">
                {t(lang, "Revoke Team Member Access")}
              </strong>
              <button
                type="button"
                className={ICON_BTN}
                onClick={() => setRevokeMemberTarget(null)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-sm text-ink mb-3 leading-relaxed">
              Are you sure you want to revoke access for <strong>{revokeMemberTarget.name}</strong> ({revokeMemberTarget.email})?
            </p>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Their active session will be invalidated immediately and they will no longer be able to access this workspace until reactivated.
            </p>

            <div className={ACTIONS}>
              <Button variant="secondary" onClick={() => setRevokeMemberTarget(null)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="danger" onClick={handleConfirmRevokeMember}>
                {t(lang, "Revoke Access")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM REVOKE INVITATION                                          */}
      {/* ========================================================================= */}
      {revokeInviteTarget && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Cancel Invitation")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-base font-bold text-danger">
                {t(lang, "Cancel Invitation")}
              </strong>
              <button
                type="button"
                className={ICON_BTN}
                onClick={() => setRevokeInviteTarget(null)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-sm text-ink mb-3 leading-relaxed">
              Are you sure you want to cancel the invitation sent to <strong>{revokeInviteTarget.email}</strong>?
            </p>
            <p className="text-xs text-muted leading-relaxed mb-4">
              The secure activation link will be deactivated immediately and cannot be used to register.
            </p>

            <div className={ACTIONS}>
              <Button variant="secondary" onClick={() => setRevokeInviteTarget(null)}>
                {t(lang, "Keep Invitation")}
              </Button>
              <Button variant="danger" onClick={handleConfirmRevokeInvite}>
                {t(lang, "Cancel Invitation")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </>
  );
}

export default function TeamMembersClient() {
  return (
    <RequirePermission action="team.manage">
      <TeamMembersInner />
    </RequirePermission>
  );
}

