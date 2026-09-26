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
  ROLES,
  ROLE_SUMMARY,
  syncCompanyWithBackend,
} from "../../../lib/companyStore";

const stat = "flex flex-col gap-1 rounded-md bg-sunken p-4";
const statLabel = "text-xs text-faint";
const statValue = "text-2xl leading-[1.1] font-bold";
const th = "whitespace-nowrap border-b border-line bg-sunken px-4 py-3 text-left font-bold text-muted";
const td = "border-b border-line px-4 py-3 align-middle";
const linkBtn = "inline-flex items-center gap-1.5 p-0 text-sm font-semibold text-brand hover:underline";
const stageSelect = "rounded-sm border-[1.5px] border-line bg-card px-2 py-1.5 font-body text-xs text-ink disabled:opacity-60";
const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(21,23,27,0.5)] p-6";
const MODAL = "max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-xl bg-card p-6 shadow-lg";
const MODAL_HEAD = "mb-3 flex items-center justify-between gap-3";
const ICON_BTN = "inline-flex rounded-sm border border-transparent p-1.5 text-muted hover:bg-sunken hover:text-ink";
const HINT = "flex items-start gap-2 rounded-md bg-brand-subtle px-4 py-3 text-sm leading-relaxed text-muted";
const ERRBOX = "rounded-md border border-red-100 bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger-fg";
const ACTIONS = "mt-4 flex gap-3 max-sm:flex-col-reverse [&_button]:max-sm:w-full";

function Team() {
  const [lang] = useLang();
  const [ready, setReady] = useState(false);
  const [team, setTeam] = useState([]);
  const [invites, setInvites] = useState([]);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "HR / Recruiter", message: "" });
  const [inviteErr, setInviteErr] = useState("");
  const [roleEdit, setRoleEdit] = useState(null);
  const [revoke, setRevoke] = useState(null);
  const [toast, setToast] = useToast();

  const refresh = () => {
    setTeam(listTeam());
    setInvites(listInvitations());
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

  const filtered = team.filter(
    (m) =>
      (!q || m.name.toLowerCase().includes(q.toLowerCase()) || m.email.toLowerCase().includes(q.toLowerCase())) &&
      (!roleF || m.role === roleF) &&
      (!statusF || m.status === statusF)
  );

  const copyInviteLink = (inv) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3002";
    const activationPath = inv.activationUrl || (inv.inviteToken ? `/employee-activation?token=${inv.inviteToken}` : "");
    const url = activationPath.startsWith("http") ? activationPath : `${origin}${activationPath.startsWith("/") ? "" : "/"}${activationPath}`;
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
      setToast(t(lang, "Invitation email sent!"));
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
      setToast(t(lang, "Role updated"));
    } catch (e) {
      setToast(e.message || t(lang, "Failed to update role"));
    }
  };

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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1.5 text-2xl font-extrabold">{t(lang, "Team Management")}</h1>
          <p className="text-sm text-muted">{t(lang, "Invite colleagues and control what each person can do.")}</p>
        </div>
        <Button variant="primary" onClick={() => setInviteOpen(true)}>
          <Icon name="user-plus" size={16} /> {t(lang, "Invite Employee")}
        </Button>
      </div>

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
          <span className={statLabel}>{t(lang, "Pending Invitations")}</span>
          <strong className={statValue}>{summary.pending}</strong>
        </div>
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Inactive / Revoked")}</span>
          <strong className={statValue}>{summary.inactive}</strong>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="min-w-[200px] flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "Search name or email")} size="sm" />
        </div>
        <div className="min-w-[150px]">
          <Select value={roleF} onChange={(e) => setRoleF(e.target.value)} placeholder={t(lang, "All roles")} options={ROLES.map((r) => ({ value: r, label: t(lang, r) }))} />
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

      <div className="overflow-x-auto rounded-lg border border-line bg-card shadow-xs">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className={th}>{t(lang, "Name")}</th>
              <th className={th}>{t(lang, "Role")}</th>
              <th className={th}>{t(lang, "Join Date")}</th>
              <th className={th}>{t(lang, "Last Login")}</th>
              <th className={th}>{t(lang, "Status")}</th>
              <th className={th} aria-label={t(lang, "Actions")} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td className={td}>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} size={32} />
                    <div>
                      <strong className="block text-[13px]">{m.name}</strong>
                      <span className="text-xs text-faint">{m.email}</span>
                    </div>
                  </div>
                </td>
                <td className={td}>
                  <select
                    className={stageSelect}
                    value={ROLES.includes(m.role) ? m.role : "Company Admin"}
                    disabled={m.role === "Company Admin" && summary.active > 0 && team.filter((x) => x.role === "Company Admin").length === 1}
                    onChange={(e) => setRoleEdit({ member: m, nextRole: e.target.value })}
                    aria-label={t(lang, "Role for") + " " + m.name}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(lang, r)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={td}>{m.joinDate}</td>
                <td className={td}>{m.lastLogin}</td>
                <td className={td}>
                  <StatusBadge kind="member" value={m.status} lang={lang} />
                </td>
                <td className={`${td} text-right`}>
                  {m.status === "Active" ? (
                    <button className={`${linkBtn} text-danger`} onClick={() => setRevoke(m)}>
                      {t(lang, "Revoke")}
                    </button>
                  ) : (
                    <button
                      className={linkBtn}
                      onClick={async () => {
                        try {
                          await reactivateMember(m.id);
                          refresh();
                          setToast(t(lang, "Access restored"));
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
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-faint">
                  {t(lang, "No members match your filters")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-4 mt-9 text-lg font-bold">{t(lang, "Pending Invitations")}</h2>
      {invites.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted">
          <h3 className="text-lg">{t(lang, "No invitations")}</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-card shadow-xs">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>{t(lang, "Email")}</th>
                <th className={th}>{t(lang, "Role")}</th>
                <th className={th}>{t(lang, "Sent")}</th>
                <th className={th}>{t(lang, "Expiry")}</th>
                <th className={th}>{t(lang, "Status")}</th>
                <th className={th} aria-label={t(lang, "Actions")} />
              </tr>
            </thead>
            <tbody>
              {invites.map((i) => (
                <tr key={i.id}>
                  <td className={td}>{i.email}</td>
                  <td className={td}>{t(lang, i.role)}</td>
                  <td className={td}>{i.sentDate}</td>
                  <td className={td}>{i.expiry}</td>
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
                              setToast(t(lang, "Invitation email resent!"));
                            } catch (e) {
                              setToast(e.message || t(lang, "Failed to resend invitation."));
                            }
                          }}
                        >
                          {t(lang, "Resend")}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inviteOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Invite Employee")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-md">{t(lang, "Invite Employee")}</strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setInviteOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="text-sm text-muted">
              {t(lang, "They'll get an activation link to join this workspace — no separate company registration needed.")}
            </p>
            <div className="mt-4 flex flex-col gap-3.5">
              <Input label={t(lang, "Employee Email")} type="email" value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@company.com" error={inviteErr} />
              <Select label={t(lang, "Role")} value={inviteForm.role} onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))} options={ROLES.map((r) => ({ value: r, label: t(lang, r) }))} />
              <p className={HINT}>
                <Icon name="info" size={16} style={{ color: "var(--color-brand)", marginTop: 2 }} />
                <span>{t(lang, ROLE_SUMMARY[inviteForm.role] || "Permissions configured for this role.")}</span>
              </p>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">
                  {t(lang, "Invitation Message")} <span className="font-normal text-faint">({t(lang, "optional")})</span>
                </label>
                <textarea
                  className="min-h-[72px] w-full resize-y rounded-md border-[1.5px] border-line px-3.5 py-[11px] font-body text-base text-ink focus:border-line-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder={t(lang, "Add a short welcome note…")}
                />
              </div>
            </div>
            <div className={ACTIONS}>
              <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="primary" onClick={sendInvite}>
                <Icon name="send" size={14} /> {t(lang, "Send Invitation")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {roleEdit && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Change role")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-md">{t(lang, "Change role for")} {roleEdit.member.name}</strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setRoleEdit(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="text-sm text-muted">
              {t(lang, "New role")}: <strong>{t(lang, roleEdit.nextRole)}</strong>
            </p>
            <p className={`${HINT} mt-3`}>
              <Icon name="shield" size={16} style={{ color: "var(--color-brand)", marginTop: 2 }} />
              <span>{t(lang, ROLE_SUMMARY[roleEdit.nextRole] || "Permissions configured for this role.")}</span>
            </p>
            <div className={ACTIONS}>
              <Button variant="secondary" onClick={() => setRoleEdit(null)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="primary" onClick={applyRoleChange}>
                {t(lang, "Confirm change")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {revoke && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Revoke access")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-md">{t(lang, "Revoke access for")} {revoke.name}?</strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setRevoke(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className={ERRBOX} role="alert">
              {t(lang, "Their account becomes inactive and they lose access to this workspace immediately. You can reactivate them later.")}
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
                {t(lang, "Revoke access")}
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
