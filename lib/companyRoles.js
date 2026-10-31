// ─────────────────────────────────────────────────────────────────────────────
// File    : lib/companyRoles.js
// Purpose : Isolated dynamic roles & granular permission registry for Company Web
// ─────────────────────────────────────────────────────────────────────────────

export const AVAILABLE_PERMISSIONS = [
  {
    key: "overview.view",
    name: "View Dashboard",
    module: "Dashboard",
    description: "Access overview KPIs, charts, and workspace activity feeds.",
  },
  {
    key: "jobs.view",
    name: "View Jobs",
    module: "Jobs",
    description: "View published, paused, draft, and closed job postings.",
  },
  {
    key: "jobs.manage",
    name: "Manage Jobs",
    module: "Jobs",
    description: "Create, edit, pause, resume, duplicate, and archive job postings.",
  },
  {
    key: "candidates.view",
    name: "View Candidates",
    module: "ATS",
    description: "View applicant lists, resumes, application history, and candidate profiles.",
  },
  {
    key: "candidates.manage",
    name: "Manage Candidates",
    module: "ATS",
    description: "Move candidates between pipeline stages, rate, and schedule interviews.",
  },
  {
    key: "candidates.notes",
    name: "Candidate Notes",
    module: "ATS",
    description: "Add and read private internal hiring team evaluation notes.",
  },
  {
    key: "candidates.documents",
    name: "Verification Documents",
    module: "ATS",
    description: "View-only access to confidential verification documents (PDPD compliant).",
  },
  {
    key: "team.manage",
    name: "Manage Team",
    module: "Team",
    description: "Invite employees, assign roles, change statuses, and configure roles.",
  },
  {
    key: "settings.manage",
    name: "Manage Settings",
    module: "Settings",
    description: "Configure company profile, hiring stages, notifications, and preferences.",
  },
  {
    key: "billing.manage",
    name: "Manage Billing",
    module: "Billing",
    description: "View subscriptions, upgrade packages, invoices, and posting quotas.",
  },
];

// The exactly three fixed core roles per business specification
export const CORE_COMPANY_ROLES = [
  {
    id: "company_admin",
    code: "company_admin",
    name: "Company Admin",
    description: "Full access: company settings, team management, billing, jobs, and candidate pipelines.",
    is_system: true,
    color_tone: "purple",
    permissions: ["*"],
  },
  {
    id: "recruiter",
    code: "recruiter",
    name: "HR / Recruiter",
    description: "Manage job postings, candidate pipelines, interview scheduling, and team notes.",
    is_system: true,
    color_tone: "blue",
    permissions: [
      "overview.view",
      "jobs.view",
      "jobs.manage",
      "candidates.view",
      "candidates.manage",
      "candidates.notes",
      "candidates.documents",
    ],
  },
  {
    id: "viewer",
    code: "viewer",
    name: "Viewer",
    description: "Read-only access to published job listings and applicant pipelines. Cannot modify data.",
    is_system: true,
    color_tone: "slate",
    permissions: [
      "overview.view",
      "jobs.view",
      "candidates.view",
    ],
  },
];

export const ROLES = CORE_COMPANY_ROLES.map((r) => r.name);

export const ROLE_SUMMARY = {
  "Company Admin": "Full access: company settings, jobs, candidates, interviews, billing and team management.",
  "HR / Recruiter": "Jobs, candidate pipeline, candidate communication and interviews. No billing or team administration.",
  Viewer: "Read-only access. Cannot create jobs, manage candidates or access billing.",
  company_admin: "Full access: company settings, jobs, candidates, interviews, billing and team management.",
  recruiter: "Jobs, candidate pipeline, candidate communication and interviews. No billing or team administration.",
  viewer: "Read-only access. Cannot create jobs, manage candidates or access billing.",
  hiring_manager: "Jobs, candidate pipeline, candidate communication and interviews. No billing or team administration.",
  interviewer: "Jobs, candidate pipeline, candidate communication and interviews. No billing or team administration.",
};

export function normalizeRole(roleInput) {
  if (!roleInput) return "company_admin";
  const clean = String(roleInput).toLowerCase().replace(/[\s\/\_]+/g, "");
  if (["companyadmin", "admin", "owner", "superadmin", "company"].includes(clean)) {
    return "company_admin";
  }
  if (["hrrecruiter", "recruiter", "hr"].includes(clean)) {
    return "recruiter";
  }
  if (["viewer", "readonly", "read_only"].includes(clean)) {
    return "viewer";
  }
  return String(roleInput).toLowerCase().replace(/\s+/g, "_");
}

export function getRoleDisplayName(roleInput) {
  const norm = normalizeRole(roleInput);
  const found = CORE_COMPANY_ROLES.find((r) => r.code === norm);
  if (found) return found.name;
  return String(roleInput)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getCompanyRolesList(customRoles = []) {
  const combined = [...CORE_COMPANY_ROLES];
  if (Array.isArray(customRoles)) {
    for (const cr of customRoles) {
      if (cr && cr.code && !combined.some((r) => r.code === cr.code)) {
        combined.push({
          id: cr.code,
          code: cr.code,
          name: cr.name || cr.code,
          description: cr.description || "Custom company role",
          is_system: false,
          color_tone: cr.color_tone || "indigo",
          permissions: Array.isArray(cr.permissions) ? cr.permissions : ["overview.view"],
        });
      }
    }
  }
  return combined;
}

/**
 * Permission-level check: Verify whether a given role holds the requested permission key.
 * Evaluates strictly at the permission level, not hardcoded role names.
 */
export function can(roleOrUser, permissionKey, customRoles = []) {
  if (!roleOrUser || !permissionKey) return false;

  let roleStr = typeof roleOrUser === "object" ? roleOrUser.role : roleOrUser;
  if (!roleStr) return false;

  const norm = normalizeRole(roleStr);

  // Full root permission
  if (norm === "company_admin") {
    return true;
  }

  const allRoles = getCompanyRolesList(customRoles);
  const matched = allRoles.find((r) => r.code === norm || r.name.toLowerCase() === String(roleStr).toLowerCase());

  if (!matched) {
    return false;
  }

  const perms = matched.permissions || [];
  if (perms.includes("*")) {
    return true;
  }

  return perms.includes(permissionKey);
}

/**
 * Returns UI color classes for role badges.
 */
export function getRoleBadgeStyle(roleInput, customRoles = []) {
  const norm = normalizeRole(roleInput);
  const allRoles = getCompanyRolesList(customRoles);
  const role = allRoles.find((r) => r.code === norm || r.name.toLowerCase() === String(roleInput).toLowerCase());

  const tone = role?.color_tone || "slate";

  switch (tone) {
    case "purple":
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        dot: "bg-purple-600",
        label: role?.name || "Company Admin",
      };
    case "blue":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-600",
        label: role?.name || "HR / Recruiter",
      };
    case "indigo":
      return {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dot: "bg-indigo-600",
        label: role?.name || getRoleDisplayName(roleInput),
      };
    case "emerald":
    case "green":
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-600",
        label: role?.name || getRoleDisplayName(roleInput),
      };
    case "amber":
    case "orange":
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-600",
        label: role?.name || getRoleDisplayName(roleInput),
      };
    case "slate":
    default:
      return {
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-500",
        label: role?.name || "Viewer",
      };
  }
}
