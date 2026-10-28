"use client";
import { useEffect, useMemo, useState } from "react";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
import {
  listTeam,
  listCompanyRoles,
  AVAILABLE_PERMISSIONS,
  CORE_COMPANY_ROLES,
  getRoleBadgeStyle,
  normalizeRole,
  syncCompanyWithBackend,
} from "../../../lib/companyStore";

const th = "whitespace-nowrap border-b border-line bg-sunken/60 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted";

function RolesInner() {
  const [lang] = useLang();
  const [ready, setReady] = useState(false);
  const [team, setTeam] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolesViewMode, setRolesViewMode] = useState("cards"); // "cards" | "matrix"

  const refresh = () => {
    setTeam(listTeam());
    setRoles(listCompanyRoles());
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

  // Group permissions by module
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
      <div className="flex flex-col gap-4">
        <Skeleton width={260} height={32} />
        <Skeleton height={280} />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">{t(lang, "Roles & Permissions")}</h1>
        <p className="text-sm text-muted mt-0.5">
          {t(lang, "Predefined roles, granular permission governance, and access control.")}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Information & Predefined Roles Notice */}
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4 max-md:flex-col">
            <div className="flex items-start gap-3.5">
              <div className="rounded-lg bg-blue-50 p-2.5 text-brand shrink-0">
                <Icon name="shield-check" size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">
                  {t(lang, "Predefined Organizational Roles & Access Control")}
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed max-w-2xl">
                  {t(
                    lang,
                    "All company workspaces operate under standardized system roles (Company Admin, HR / Recruiter, and Viewer). Roles cannot be deleted or altered to guarantee consistent security standards across the ecosystem."
                  )}
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-line bg-sunken/60 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setRolesViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  rolesViewMode === "cards"
                    ? "bg-card text-ink shadow-2xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Icon name="layout-grid" size={13} />
                <span>{t(lang, "Role Cards")}</span>
              </button>
              <button
                type="button"
                onClick={() => setRolesViewMode("matrix")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  rolesViewMode === "matrix"
                    ? "bg-card text-ink shadow-2xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Icon name="table" size={13} />
                <span>{t(lang, "Permissions Matrix")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* VIEW MODE 1: ROLE CARDS */}
        {rolesViewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CORE_COMPANY_ROLES.map((r) => {
              const badgeStyle = getRoleBadgeStyle(r.code, CORE_COMPANY_ROLES);
              const membersWithRole = team.filter(
                (m) => normalizeRole(m.role) === r.code || m.role === r.name
              );
              const isRootAdmin = r.code === "company_admin" || r.permissions?.includes("*");

              return (
                <div
                  key={r.code}
                  className="flex flex-col rounded-xl border border-line bg-card p-6 shadow-xs hover:border-line-strong transition-all"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${badgeStyle.dot}`} />
                        <h4 className="text-base font-bold text-ink">{r.name}</h4>
                      </div>
                      <span className="text-[11px] font-mono text-faint">code: {r.code}</span>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                      {t(lang, "System Predefined")}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mb-4 text-xs text-muted leading-relaxed min-h-[38px]">
                    {r.description}
                  </p>

                  {/* Assigned Members Counter */}
                  <div className="mb-4 flex items-center justify-between border-y border-line py-2.5 text-xs">
                    <span className="text-faint">{t(lang, "Assigned Members")}:</span>
                    <strong className="text-ink font-semibold">
                      {membersWithRole.length} {membersWithRole.length === 1 ? "member" : "members"}
                    </strong>
                  </div>

                  {/* Permissions Checklist */}
                  <div className="flex-1">
                    <h5 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">
                      {t(lang, "Granted Permissions")}
                    </h5>
                    <div className="flex flex-col gap-1.5">
                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const hasPerm = isRootAdmin || r.permissions?.includes(perm.key);
                        return (
                          <div
                            key={perm.key}
                            className={`flex items-center justify-between rounded px-2.5 py-1 text-xs transition-colors ${
                              hasPerm ? "bg-emerald-50/70 text-emerald-950 font-medium" : "text-faint/60"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
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
        )}

        {/* VIEW MODE 2: INTERACTIVE PERMISSIONS MATRIX */}
        {rolesViewMode === "matrix" && (
          <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-xs">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className={`${th} w-[35%]`}>{t(lang, "Capability & Module")}</th>
                  <th className={`${th} text-center`}>{t(lang, "Company Admin")}</th>
                  <th className={`${th} text-center`}>{t(lang, "HR / Recruiter")}</th>
                  <th className={`${th} text-center`}>{t(lang, "Viewer")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                  <tr key={moduleName} className="group">
                    <td colSpan={4} className="p-0">
                      <div className="bg-sunken/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-faint border-b border-line">
                        {moduleName} Module
                      </div>
                      <table className="w-full border-collapse">
                        <tbody>
                          {perms.map((p) => {
                            const adminHas = true;
                            const recruiterHas = [
                              "overview.view",
                              "jobs.view",
                              "jobs.manage",
                              "candidates.view",
                              "candidates.manage",
                              "candidates.notes",
                              "candidates.documents",
                            ].includes(p.key);
                            const viewerHas = ["overview.view", "jobs.view", "candidates.view"].includes(p.key);

                            return (
                              <tr key={p.key} className="border-b border-line/60 hover:bg-surface/50 transition-colors">
                                <td className="w-[35%] px-4 py-2.5 text-xs">
                                  <strong className="block text-ink font-semibold">{p.name}</strong>
                                  <span className="text-[11px] text-faint leading-tight block">
                                    {p.description}
                                  </span>
                                </td>

                                <td className="text-center px-4 py-2.5">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                    <Icon name="check" size={13} />
                                  </span>
                                </td>

                                <td className="text-center px-4 py-2.5">
                                  {recruiterHas ? (
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                      <Icon name="check" size={13} />
                                    </span>
                                  ) : (
                                    <span className="text-faint font-bold">—</span>
                                  )}
                                </td>

                                <td className="text-center px-4 py-2.5">
                                  {viewerHas ? (
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                      <Icon name="check" size={13} />
                                    </span>
                                  ) : (
                                    <span className="text-faint font-bold">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FUTURE ENHANCEMENT: CUSTOM ROLE MANAGEMENT ROADMAP SHOWCASE */}
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-6 shadow-xs">
          <div className="flex items-start gap-4 max-md:flex-col">
            <div className="rounded-xl bg-indigo-600 text-white p-3 shadow-md shrink-0">
              <Icon name="sparkles" size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                  {t(lang, "Future Release Roadmap")}
                </span>
                <h4 className="text-base font-extrabold text-indigo-950">
                  {t(lang, "Custom Role Management & Granular Enterprise RBAC")}
                </h4>
              </div>
              <p className="text-xs text-indigo-900/80 leading-relaxed mb-4">
                {t(
                  lang,
                  "In an upcoming platform release, workspace administrators will have full governance to configure custom departmental roles with custom permission matrices tailored to your hiring workflows."
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="rounded-lg border border-indigo-100 bg-white/80 p-3 shadow-2xs">
                  <strong className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                    <Icon name="plus-circle" size={13} className="text-indigo-600" />
                    {t(lang, "Create Custom Roles")}
                  </strong>
                  <p className="text-[11px] text-indigo-900/70">
                    {t(lang, "Add organization-specific titles such as 'Hiring Manager' or 'Interviewer'.")}
                  </p>
                </div>

                <div className="rounded-lg border border-indigo-100 bg-white/80 p-3 shadow-2xs">
                  <strong className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                    <Icon name="sliders" size={13} className="text-indigo-600" />
                    {t(lang, "Granular Capabilities")}
                  </strong>
                  <p className="text-[11px] text-indigo-900/70">
                    {t(lang, "Check or uncheck individual capabilities per custom role.")}
                  </p>
                </div>

                <div className="rounded-lg border border-indigo-100 bg-white/80 p-3 shadow-2xs">
                  <strong className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                    <Icon name="shield-alert" size={13} className="text-indigo-600" />
                    {t(lang, "Safe Deletion & Usage Checks")}
                  </strong>
                  <p className="text-[11px] text-indigo-900/70">
                    {t(lang, "Prevents accidental deletion of roles that are currently assigned to team members.")}
                  </p>
                </div>

                <div className="rounded-lg border border-indigo-100 bg-white/80 p-3 shadow-2xs">
                  <strong className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                    <Icon name="lock" size={13} className="text-indigo-600" />
                    {t(lang, "System Role Protection")}
                  </strong>
                  <p className="text-[11px] text-indigo-900/70">
                    {t(lang, "Built-in core roles remain immutable to safeguard tenant operations.")}
                  </p>
                </div>

                <div className="rounded-lg border border-indigo-100 bg-white/80 p-3 shadow-2xs">
                  <strong className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                    <Icon name="history" size={13} className="text-indigo-600" />
                    {t(lang, "RBAC Audit Logging")}
                  </strong>
                  <p className="text-[11px] text-indigo-900/70">
                    {t(lang, "Complete traceability records for every role creation, update, and member assignment.")}
                  </p>
                </div>

                <div className="rounded-lg border border-indigo-100 bg-white/80 p-3 shadow-2xs">
                  <strong className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                    <Icon name="check-circle-2" size={13} className="text-indigo-600" />
                    {t(lang, "Enterprise Compliance")}
                  </strong>
                  <p className="text-[11px] text-indigo-900/70">
                    {t(lang, "Pre-mapped to Vietnam PDPA candidate privacy and data protection standards.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RolesClient() {
  return (
    <RequirePermission action="team.manage">
      <RolesInner />
    </RequirePermission>
  );
}

