// Company / Employer workspace store — backed by backend APIs with localStorage fallback.
import * as companyAuth from "./api/companyAuth";
import * as companyApi from "./api/companyApi";
import { getCompanyToken, setCompanyToken, removeCompanyToken } from "./api/client";

const KEY = "lv360-company-store-v1";

export const ROLES = ["Company Admin", "HR / Recruiter", "Viewer"];

export const PIPELINE_STAGES = [
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview Scheduled",
  "Offer Sent",
  "Hired",
  "Rejected",
];

export const JOB_STATUSES = ["Draft", "Published", "Paused", "Closed"];

export const PLANS = [
  { id: "Freemium", name: "Freemium", price: "0 VND", postingLimit: 3, blurb: "For occasional hiring" },
  { id: "Professional", name: "Professional", price: "2,900,000 VND / mo", postingLimit: 25, blurb: "For growing teams" },
  { id: "Enterprise", name: "Enterprise", price: "Custom", postingLimit: Infinity, blurb: "For high-volume hiring" },
];

// RBAC
const PERMISSIONS = {
  "Company Admin": ["jobs.manage", "candidates.manage", "candidates.view", "team.manage", "billing.manage", "settings.manage", "overview.view"],
  "HR / Recruiter": ["jobs.manage", "candidates.manage", "candidates.view", "overview.view"],
  Viewer: ["candidates.view", "overview.view"],
};

export function can(role, action) {
  return (PERMISSIONS[role] || []).includes(action);
}

export const DEFAULT_REJECTION_TEMPLATES = [
  { id: "RT-1", title: "Not enough experience", body: "Thank you for your interest. After careful review, we've decided to move forward with candidates whose experience more closely matches the requirements for this role. We encourage you to apply again in the future." },
  { id: "RT-2", title: "Position filled", body: "Thank you for taking the time to apply. This position has now been filled. We were impressed by your background and will keep your details on file for similar openings." },
  { id: "RT-3", title: "Skills mismatch", body: "We appreciate your application. For this role we're looking for a different mix of skills, so we won't be progressing your application at this time. We wish you the best in your search." },
];

export const ROLE_SUMMARY = {
  "Company Admin": "Full access: company settings, jobs, candidates, interviews, billing and team management.",
  "HR / Recruiter": "Jobs, candidate pipeline, candidate communication and interviews. No billing or team administration.",
  Viewer: "Read-only access. Cannot create jobs, manage candidates or access billing.",
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function emptyStore() {
  return {
    initialized: false,
    auth: { loggedIn: false, name: "", email: "", role: "Company Admin", twoFactorPending: false },
    company: {
      name: "",
      legalName: "",
      regNumber: "",
      taxCode: "",
      industry: "",
      size: "",
      website: "",
      description: "",
      logo: "",
      coverImage: "",
      address: "",
      city: "",
      country: "Vietnam",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      phone: "",
      email: "",
      foundedYear: "",
      linkedinUrl: "",
      facebookUrl: "",
      benefits: "",
      verified: false,
      emailVerified: false,
      approvalStatus: "pending",
      plan: "Freemium",
    },
    quota: { plan: "Freemium", used: 0 },
    jobs: [],
    candidates: [],
    team: [],
    invitations: [],
    notifications: [],
    settings: {
      notifications: { newApplications: true, interviewReminders: true, teamActivity: true, billing: true, marketing: false },
      security: { twoFactor: true },
      pipeline: { autoRejectEmail: true, delayRejectionEmail: false, rejectionTemplates: DEFAULT_REJECTION_TEMPLATES },
      privacy: { contactVisibility: "always", maskEmail: false, maskPhone: false },
      retention: { candidateDataMonths: 12, autoPurge: false, purgeRejectedMonths: 6 },
    },
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function write(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch (e) { }
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("lv360-store"));
  } catch (e) { }
  return store;
}

function migrate(store) {
  if (!store) return store;
  const base = emptyStore();
  store.auth = { ...base.auth, ...store.auth };
  store.company = { ...base.company, ...store.company };
  store.settings = store.settings || {};
  store.settings.notifications = { ...base.settings.notifications, ...store.settings.notifications };
  store.settings.security = { ...base.settings.security, ...store.settings.security };
  store.settings.pipeline = { ...base.settings.pipeline, ...store.settings.pipeline };
  if (!store.settings.pipeline.rejectionTemplates || !store.settings.pipeline.rejectionTemplates.length) {
    store.settings.pipeline.rejectionTemplates = DEFAULT_REJECTION_TEMPLATES;
  }
  store.settings.privacy = { ...base.settings.privacy, ...store.settings.privacy };
  store.settings.retention = { ...base.settings.retention, ...store.settings.retention };
  return store;
}

export function getStore() {
  const existing = read();
  if (existing) return migrate(existing);
  return write(emptyStore());
}

// ---- seed -------------------------------------------------------------------



export function ensureSeeded() {
  const store = getStore();
  if (store.initialized) return store;

  store.initialized = true;
  store.auth = { loggedIn: false };
  store.company = {};
  store.quota = { plan: "Freemium", used: 0 };
  store.jobs = [];
  store.candidates = [];
  store.team = [];
  store.invitations = [];
  store.notifications = [];

  return write(store);
}

// ---- BACKEND SYNC -----------------------------------------------------------

let lastSyncCompanyTime = 0;
let syncCompanyInFlight = null;

export async function syncCompanyWithBackend(force = false) {
  const token = getCompanyToken();
  if (!token) return getStore();

  const now = Date.now();
  if (!force && now - lastSyncCompanyTime < 15000) {
    return getStore();
  }

  if (syncCompanyInFlight) {
    return syncCompanyInFlight;
  }

  syncCompanyInFlight = (async () => {
    const store = getStore();
    try {
      const [meRes, profileRes, dashRes, jobsRes, candRes, teamRes] = await Promise.allSettled([
        companyAuth.getCompanyMe(),
        companyApi.getCompanyProfile(),
        companyApi.getCompanyDashboard(),
        companyApi.listCompanyJobs(),
        companyApi.listCompanyCandidates(),
        companyApi.getCompanyTeam(),
      ]);

      if (meRes.status === "fulfilled" && meRes.value) {
        const me = meRes.value?.data || meRes.value;
        if (me) {
          // If switching between different company tenants, reset scoped data immediately
          if (store.auth.companyId && me.company_id && String(store.auth.companyId) !== String(me.company_id)) {
            store.jobs = [];
            store.candidates = [];
            store.team = [];
            store.invitations = [];
          }

          store.auth = {
            loggedIn: true,
            name: me.user_name || me.full_name || store.auth.name,
            email: me.user_email || me.email || store.auth.email,
            role: me.role || store.auth.role,
            companyId: me.company_id,
            twoFactorPending: false,
          };
          if (me.approval_status) {
            store.company.approvalStatus = me.approval_status.toLowerCase();
          }
        }
      }

      if (profileRes.status === "fulfilled" && profileRes.value) {
        const p = profileRes.value?.data || profileRes.value;
        if (p) {
          store.company = {
            id: p.id,
            name: p.company_name || p.name || "",
            legalName: p.legal_name || "",
            regNumber: p.tax_code || p.reg_number || p.legal_name || "",
            taxCode: p.tax_code || "",
            industry: p.industry || "",
            size: p.company_size || p.size || "",
            website: p.website || "",
            description: p.about || p.description || "",
            logo: p.logo_url || p.logo || "",
            coverImage: p.cover_image_url || "",
            address: p.address || "",
            city: p.city || "",
            country: p.country || "Vietnam",
            contactPerson: p.contact_person || store.auth.name || "",
            contactEmail: p.contact_email || p.email || store.auth.email || "",
            contactPhone: p.contact_phone || p.phone || "",
            phone: p.contact_phone || p.phone || "",
            email: p.contact_email || p.email || "",
            foundedYear: p.founded_year || "",
            linkedinUrl: p.linkedin_url || "",
            facebookUrl: p.facebook_url || "",
            benefits: p.benefits || "",
            verified: p.verification_status === "verified" || !!p.verified,
            emailVerified: !!p.email_verified,
            approvalStatus: (p.verification_status || p.approval_status || "verified").toLowerCase(),
            plan: p.plan || "Freemium",
          };
          if (p.settings && typeof p.settings === "object" && Object.keys(p.settings).length > 0) {
            store.settings = {
              ...store.settings,
              ...p.settings,
              notifications: { ...store.settings.notifications, ...(p.settings.notifications || {}) },
              pipeline: { ...store.settings.pipeline, ...(p.settings.pipeline || {}) },
              privacy: { ...store.settings.privacy, ...(p.settings.privacy || {}) },
              retention: { ...store.settings.retention, ...(p.settings.retention || {}) },
            };
          }
          if (p.quota) {
            store.quota = {
              plan: p.quota.plan || "Freemium",
              limit: p.quota.limit,
              used: p.quota.used || 0,
              remaining: p.quota.remaining,
            };
          }
        }
      }

      if (dashRes.status === "fulfilled" && dashRes.value) {
        const d = dashRes.value?.data || dashRes.value;
        if (d) {
          if (d.quota) {
            store.quota = d.quota;
          }
          if (d.metrics) {
            store.metrics = d.metrics;
          }
        }
      }

      const rawJobs = Array.isArray(jobsRes.value) ? jobsRes.value : (jobsRes.value?.data || []);
      if (jobsRes.status === "fulfilled" && Array.isArray(rawJobs)) {
        store.jobs = rawJobs.map((j) => ({
          id: j.id,
          title: j.title,
          department: j.department || "",
          type: j.type || j.job_type || "Full-time",
          location: j.location || j.city || "Vietnam",
          salary: j.salary || (j.salary_min && j.salary_max ? `${Math.round(j.salary_min / 1000000)}M – ${Math.round(j.salary_max / 1000000)}M VND` : "Negotiable"),
          salary_min: j.salary_min,
          salary_max: j.salary_max,
          vacancies: j.vacancies || 1,
          deadline: j.deadline || "",
          status: j.status ? (j.status.charAt(0).toUpperCase() + j.status.slice(1).toLowerCase()) : "Draft",
          createdAt: j.created_at ? j.created_at.slice(0, 10) : "",
          applicantCount: j.applicant_count ?? (j.applications_count || 0),
          skills: Array.isArray(j.skills) ? j.skills : (typeof j.skills === "string" ? j.skills.split(",").map((s) => s.trim()) : []),
          documents: Array.isArray(j.documents) ? j.documents : [],
          description: j.description || "",
          aiGenerated: !!j.ai_generated,
        }));
      }

      const rawCands = Array.isArray(candRes.value) ? candRes.value : (candRes.value?.data || []);
      if (candRes.status === "fulfilled" && Array.isArray(rawCands)) {
        store.candidates = rawCands.map((c) => ({
          id: c.id,
          jobId: c.job_id,
          jobTitle: c.job_title || "",
          name: c.candidate_name || c.name || "Anonymous",
          email: c.candidate_email || c.email || "",
          phone: c.candidate_phone || c.phone || "",
          experienceYears: c.candidate_experience_years || c.experience_years || 0,
          educationLevel: c.education_level || "Bachelor's Degree",
          appliedDate: c.applied_date || (c.applied_at ? c.applied_at.slice(0, 10) : ""),
          stage: c.stage || (c.status ? (c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase()) : "Applied"),
          matchScore: c.rating ? Math.round(c.rating * 20) : (c.match_score || 80),
          resumeFileName: c.resume_url ? c.resume_url.split("/").pop() : (c.resume_file_name || ""),
          notes: c.recruiter_notes ? [{ id: 1, text: c.recruiter_notes, author: "Recruiter", at: c.applied_at || "" }] : (c.notes || []),
          interview: c.interview || null,
          rejectionTemplateId: c.rejection_template_id,
          rejectionNote: c.rejection_note,
          rejectedAt: c.rejected_at,
        }));
      }

      const rawTeam = teamRes.value?.data || teamRes.value;
      if (teamRes.status === "fulfilled" && rawTeam) {
        if (Array.isArray(rawTeam.members)) {
          store.team = rawTeam.members.map((m) => {
            const rawRole = (m.role || "").toLowerCase();
            let role = m.role || "HR / Recruiter";
            if (rawRole.includes("admin")) role = "Company Admin";
            else if (rawRole.includes("hr") || rawRole.includes("recruit")) role = "HR / Recruiter";
            else if (rawRole.includes("view")) role = "Viewer";

            const rawStatus = (m.status || "").toLowerCase();
            const status = rawStatus === "inactive" || rawStatus === "revoked" ? "Inactive" : "Active";

            return {
              id: m.id,
              name: m.name || m.full_name || "Team Member",
              email: m.email,
              role,
              joinDate: m.joinDate || (m.created_at ? m.created_at.slice(0, 10) : daysAgo(30)),
              lastLogin: m.lastLogin || m.last_login || "Recently",
              status,
            };
          });
        }
        if (Array.isArray(rawTeam.invitations || rawTeam.invites)) {
          const rawInv = rawTeam.invitations || rawTeam.invites;
          store.invitations = rawInv.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role || "HR / Recruiter",
            sentDate: i.sentDate || (i.sent_date ? i.sent_date.slice(0, 10) : daysAgo(1)),
            expiry: i.expiry ? i.expiry.slice(0, 10) : daysAhead(7),
            status: i.status || "Pending",
            message: i.message || "",
            inviteToken: i.inviteToken || i.invite_token,
            activationUrl: i.activationUrl || i.activation_url,
          }));
        }
      }

      store.initialized = true;
      write(store);
      lastSyncCompanyTime = Date.now();
    } catch (err) {
      console.warn("Could not sync company store with backend:", err.message);
    } finally {
      syncCompanyInFlight = null;
    }

    return store;
  })();

  return syncCompanyInFlight;
}

if (typeof window !== "undefined") {
  setTimeout(() => {
    if (getCompanyToken()) {
      syncCompanyWithBackend();
    }
  }, 100);
}

// ---- AUTH ACTIONS -----------------------------------------------------------

export async function beginLogin(email, password) {
  if (email && password) {
    try {
      const res = await companyAuth.initiateCompanyLogin({ email, password });
      const payload = res?.data || res || {};
      const store = getStore();
      store.auth.email = email;
      write(store);
      return {
        ...res,
        ...payload,
        session_token: payload.session_token || res?.session_token,
        status: payload.status || res?.status || "2FA_REQUIRED",
        masked_email: payload.masked_email || res?.masked_email,
        message: payload.message || res?.message,
      };
    } catch (e) {
      // Offline fallback: ONLY when backend server is completely unreachable (network error)
      // AND credentials match the demo employer credentials.


      // Propagate API errors (401, 403, 400, etc.) and invalid offline credentials
      throw e;
    }
  }

  const store = ensureSeeded();
  store.auth = { ...store.auth, loggedIn: false, twoFactorPending: true };
  return write(store).auth;
}

export async function completeLogin(sessionToken, code = "123456") {
  if (sessionToken && sessionToken !== "mock_token") {
    try {
      const data = await companyAuth.verifyCompanyOtp({ session_token: sessionToken, code });
      const respData = data?.data || data || {};
      const user = respData.user || {};

      // Wipe previous tenant's cached data on new login
      const store = emptyStore();
      store.initialized = true;
      store.auth = {
        loggedIn: true,
        name: user.full_name || respData.user_name || "",
        email: user.email || respData.user_email || "",
        role: (user.roles && user.roles[0]) || respData.role || "Company Admin",
        companyId: user.company_id || respData.company_id,
        twoFactorPending: false,
      };
      if (user.company_name) {
        store.company.name = user.company_name;
      }
      const approvalStatus = respData.approval_status || user.approval_status;
      if (approvalStatus) {
        store.company.approvalStatus = approvalStatus.toLowerCase();
      }
      write(store);
      await syncCompanyWithBackend(true);
      return store.auth;
    } catch (err) {
      console.warn("Backend 2FA verification error:", err.message);
      throw err;
    }
  }

  // Fallback demo account
  const store = ensureSeeded();
  store.auth = { ...store.auth, loggedIn: true, twoFactorPending: false };
  return write(store).auth;
}

export function login() {
  const store = ensureSeeded();
  store.auth.loggedIn = true;
  return write(store);
}

export function logout() {
  removeCompanyToken();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(KEY);
    } catch (e) { }
  }
  const store = emptyStore();
  return write(store);
}

export function isLoggedIn() {
  return !!(getStore().auth.loggedIn || getCompanyToken());
}

export function getAuth() {
  const store = getStore();
  if (!store.initialized) return ensureSeeded().auth;
  return store.auth;
}

export function setRole(role) {
  const store = getStore();
  store.auth.role = role;
  return write(store).auth;
}

// ---- COMPANY / PLAN ---------------------------------------------------------

export function getCompany() {
  const store = getStore();
  if (!store.initialized) return ensureSeeded().company;
  return store.company;
}

export async function saveCompany(patch) {
  const store = getStore();
  store.company = { ...store.company, ...patch };
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile(patch);
    } catch (e) {
      throw e;
    }
  }
  return store.company;
}

export function getPlan() {
  const store = getStore();
  const co = store.initialized ? store.company : ensureSeeded().company;
  return PLANS.find((p) => p.id === co.plan) || PLANS[0];
}

export function setPlan(planId) {
  const store = getStore();
  store.company.plan = planId;
  store.quota.plan = planId;
  return write(store).company;
}

export function getQuota() {
  const store = getStore();
  if (store.quota && store.quota.limit !== undefined) {
    return store.quota;
  }
  const co = store.initialized ? store.company : ensureSeeded().company;
  const plan = PLANS.find((p) => p.id === co.plan) || PLANS[0];
  const used = (store.jobs || []).filter((j) => j.status === "Published" || j.status === "Paused").length;
  return {
    plan: plan.id,
    limit: plan.postingLimit,
    used,
    remaining: plan.postingLimit === Infinity ? Infinity : Math.max(0, plan.postingLimit - used),
  };
}

// ---- JOBS -------------------------------------------------------------------

export function listJobs() {
  const store = getStore();
  const jobs = store.initialized ? store.jobs : ensureSeeded().jobs;
  return jobs.slice().sort((a, b) => ((a.createdAt || "") < (b.createdAt || "") ? 1 : -1));
}

export function getJob(id) {
  const store = getStore();
  const jobs = store.initialized ? store.jobs : ensureSeeded().jobs;
  return jobs.find((j) => String(j.id) === String(id)) || null;
}

export async function saveJob(job) {
  console.log(job, 2312)
  const store = getStore();
  let record = null;

  if (job.id && store.jobs.some((j) => String(j.id) === String(job.id))) {
    store.jobs = store.jobs.map((j) => (String(j.id) === String(job.id) ? { ...j, ...job } : j));
    record = store.jobs.find((j) => String(j.id) === String(job.id));
    write(store);

    if (getCompanyToken()) {
      try {
        await companyApi.updateCompanyJob(job.id, {
          title: job.title,
          department: job.department,
          type: job.type,
          location: job.location,
          salary_min: job.salary_min !== undefined ? job.salary_min : (job.salaryMin ? Number(job.salaryMin) : null),
          salary_max: job.salary_max !== undefined ? job.salary_max : (job.salaryMax ? Number(job.salaryMax) : null),
          negotiable: !!job.negotiable,
          description: job.description,
          skills: Array.isArray(job.skills) ? job.skills : [],
          experience: job.experience,
          education: job.education,
          deadline: job.deadline,
          vacancies: Number(job.vacancies) || 1,
          documents: Array.isArray(job.documents) ? job.documents : [],
          status: job.status,
        });
      } catch (e) {
        throw e;
      }
    }
    return record;
  }

  const id = "JOB-" + (2100 + store.jobs.length + Math.floor(Math.random() * 100));
  record = {
    id,
    status: job.status || "Draft",
    createdAt: new Date().toISOString().slice(0, 10),
    aiGenerated: false,
    applicantCount: 0,
    ...job,
  };
  store.jobs = [record, ...store.jobs];
  write(store);

  if (getCompanyToken()) {
    try {
      const created = await companyApi.createCompanyJob({
        title: job.title,
        department: job.department || "",
        type: job.type || "Full-time",
        location: job.location || "Ho Chi Minh City",
        salary_min: job.salary_min !== undefined ? job.salary_min : (job.salaryMin ? Number(job.salaryMin) : 15000000),
        salary_max: job.salary_max !== undefined ? job.salary_max : (job.salaryMax ? Number(job.salaryMax) : 30000000),
        negotiable: !!job.negotiable,
        description: job.description || "",
        skills: Array.isArray(job.skills) ? job.skills : [],
        experience: job.experience || "2+ years",
        education: job.education || "Bachelor's Degree",
        deadline: job.deadline || null,
        vacancies: Number(job.vacancies) || 1,
        documents: Array.isArray(job.documents) ? job.documents : ["CV / Resume"],
        status: job.status ? job.status.toLowerCase() : "published",
        ai_generated: !!job.aiGenerated,
      });
      const createdData = created?.data || created;
      if (createdData && createdData.id) {
        record.id = createdData.id;
        write(store);
      }
    } catch (e) {
      throw e;
    }
  }

  return record;
}

export async function setJobStatus(id, status) {
  const store = getStore();
  const normalizedDisplay = status ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) : "Published";
  const apiStatus = status ? status.toLowerCase() : "published";
  store.jobs = store.jobs.map((j) => (String(j.id) === String(id) ? { ...j, status: normalizedDisplay } : j));
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.setCompanyJobStatus(id, apiStatus);
    } catch (e) {
      throw e;
    }
  }
  return store.jobs;
}

export async function duplicateJob(id) {
  const store = getStore();
  const src = store.jobs.find((j) => String(j.id) === String(id));
  if (!src) return null;

  const copy = {
    ...src,
    id: "JOB-" + (2100 + store.jobs.length + Math.floor(Math.random() * 100)),
    title: src.title + " (Copy)",
    status: "Draft",
    applicantCount: 0,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  store.jobs = [copy, ...store.jobs];
  write(store);

  if (getCompanyToken()) {
    try {
      const created = await companyApi.duplicateCompanyJob(id);
      const createdData = created?.data || created;
      if (createdData && createdData.id) {
        copy.id = createdData.id;
        write(store);
      }
    } catch (e) {
      throw e;
    }
  }

  return copy;
}

export async function deleteJob(id) {
  const store = getStore();
  store.jobs = store.jobs.filter((j) => String(j.id) !== String(id));
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.deleteCompanyJob(id);
    } catch (e) {
      console.warn("deleteCompanyJob API warning:", e.message);
    }
  }
  return store.jobs;
}

// ---- CANDIDATES -------------------------------------------------------------

export function listCandidates() {
  const store = getStore();
  return (store.initialized ? store.candidates : ensureSeeded().candidates).slice();
}

export function getCandidate(id) {
  const store = getStore();
  const list = store.initialized ? store.candidates : ensureSeeded().candidates;
  return list.find((c) => String(c.id) === String(id)) || null;
}

function applyStage(c, stage, reason) {
  const next = { ...c, stage };
  if (stage === "Rejected" && reason) {
    next.rejectionTemplateId = reason.templateId || "";
    next.rejectionNote = reason.note || "";
    next.rejectedAt = new Date().toISOString().slice(0, 10);
  }
  return next;
}

export async function setCandidateStage(id, stage, reason) {
  const store = getStore();
  store.candidates = store.candidates.map((c) => (String(c.id) === String(id) ? applyStage(c, stage, reason) : c));
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCandidateStage(id, {
        stage,
        rejectionTemplateId: reason?.templateId,
        rejectionNote: reason?.note,
      });
    } catch (e) {
      throw e;
    }
  }
  return store.candidates;
}

export async function bulkSetCandidateStage(ids, stage, reason) {
  const store = getStore();
  store.candidates = store.candidates.map((c) => (ids.includes(c.id) ? applyStage(c, stage, reason) : c));
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.bulkUpdateCandidateStage({
        applicationIds: ids,
        stage,
        rejectionTemplateId: reason?.templateId,
        rejectionNote: reason?.note,
      });
    } catch (e) {
      throw e;
    }
  }
  return store.candidates;
}

export async function addCandidateNote(id, text, author) {
  const store = getStore();
  const newNote = { id: "NOTE-" + Date.now(), text, author, at: new Date().toISOString().slice(0, 10) };
  store.candidates = store.candidates.map((c) =>
    String(c.id) === String(id) ? { ...c, notes: [...(c.notes || []), newNote] } : c
  );
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.addCandidateNote(id, text);
    } catch (e) {
      throw e;
    }
  }
  return store.candidates.find((c) => String(c.id) === String(id));
}

export async function scheduleCandidateInterview(id, interviewData) {
  const store = getStore();
  store.candidates = store.candidates.map((c) =>
    String(c.id) === String(id)
      ? {
        ...c,
        stage: "Interview Scheduled",
        interview: {
          round: interviewData.roundName || interviewData.round || "First Round",
          at: interviewData.scheduledAt || interviewData.at,
          status: "invited",
          mode: interviewData.mode || "video",
          location: interviewData.locationOrLink || "",
        },
      }
      : c
  );
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.scheduleCandidateInterview(id, interviewData);
    } catch (e) {
      throw e;
    }
  }
  return store.candidates.find((c) => String(c.id) === String(id));
}

// ---- TEAM / INVITATIONS -----------------------------------------------------

export function listTeam() {
  const store = getStore();
  return (store.initialized ? store.team : ensureSeeded().team).slice();
}

export async function updateMemberRole(id, role) {
  const store = getStore();
  store.team = store.team.map((m) => (String(m.id) === String(id) ? { ...m, role } : m));
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateTeamMemberRole(id, role);
    } catch (e) {
      console.warn("Failed to update team member role on backend:", e.message || e);
    }
  }
  return store.team;
}

export async function revokeMember(id) {
  const store = getStore();
  store.team = store.team.map((m) => (String(m.id) === String(id) ? { ...m, status: "Inactive" } : m));
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.setTeamMemberStatus(id, "Inactive");
    } catch (e) {
      console.warn("Failed to revoke member on backend:", e.message || e);
    }
  }
  return store.team;
}

export async function reactivateMember(id) {
  const store = getStore();
  store.team = store.team.map((m) => (String(m.id) === String(id) ? { ...m, status: "Active" } : m));
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.setTeamMemberStatus(id, "Active");
    } catch (e) {
      console.warn("Failed to reactivate member on backend:", e.message || e);
    }
  }
  return store.team;
}

export function listInvitations() {
  const store = getStore();
  return (store.initialized ? store.invitations : ensureSeeded().invitations).slice();
}

export async function addInvitation({ email, role, message }) {
  const store = getStore();

  let inviteRecord = {
    id: "INV-" + Date.now(),
    email: email.trim(),
    role,
    message: message || "",
    sentDate: new Date().toISOString().slice(0, 10),
    expiry: daysAhead(7),
    status: "Pending",
  };

  if (getCompanyToken()) {
    try {
      const res = await companyApi.inviteTeamMember({ email, role, message });
      const created = res?.data;
      if (created) {
        inviteRecord = {
          ...inviteRecord,
          ...created,
          id: created.id || inviteRecord.id,
        };
      }
    } catch (e) {
      throw e;
    }
  }

  store.invitations = [inviteRecord, ...(store.invitations || []).filter((i) => i.email !== email.trim())];
  write(store);
  return inviteRecord;
}

export async function resendInvitation(id) {
  const store = getStore();
  store.invitations = (store.invitations || []).map((i) =>
    String(i.id) === String(id)
      ? { ...i, sentDate: new Date().toISOString().slice(0, 10), expiry: daysAhead(7), status: "Pending" }
      : i
  );
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.resendTeamInvitation(id);
    } catch (e) {
      console.warn("Failed to resend invitation on backend:", e.message || e);
    }
  }
  return store.invitations;
}

export async function revokeInvitation(id) {
  const store = getStore();
  store.invitations = (store.invitations || []).map((i) =>
    String(i.id) === String(id) ? { ...i, status: "Revoked" } : i
  );
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.revokeTeamInvitation(id);
    } catch (e) {
      console.warn("Failed to revoke invitation on backend:", e.message || e);
    }
  }
  return store.invitations;
}

// ---- NOTIFICATIONS ----------------------------------------------------------

export function listNotifications() {
  const store = getStore();
  return (store.initialized ? store.notifications : ensureSeeded().notifications).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function unreadNotificationCount() {
  const store = getStore();
  return (store.initialized ? store.notifications : ensureSeeded().notifications).filter((n) => !n.read).length;
}

export function markNotificationRead(id) {
  const store = getStore();
  store.notifications = (store.notifications || []).map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n));
  return write(store).notifications;
}

export function markAllNotificationsRead() {
  const store = getStore();
  store.notifications = (store.notifications || []).map((n) => ({ ...n, read: true }));
  return write(store).notifications;
}

// ---- SETTINGS ---------------------------------------------------------------

export function getSettings() {
  const store = getStore();
  return (store.initialized ? store.settings : ensureSeeded().settings);
}

export async function saveSettings(patch) {
  const store = getStore();
  store.settings = { ...store.settings, ...patch };
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ settings: store.settings });
    } catch (e) {
      console.warn("Could not sync settings to backend:", e.message);
    }
  }
  return store.settings;
}

function currentTemplates(store) {
  return (store.settings?.pipeline && store.settings.pipeline.rejectionTemplates) || DEFAULT_REJECTION_TEMPLATES;
}

export function listRejectionTemplates() {
  const store = getStore();
  return currentTemplates(store).slice();
}

export async function addRejectionTemplate({ title, body }) {
  const store = getStore();
  const record = { id: "RT-" + Date.now(), title: title || "Untitled", body: body || "" };
  store.settings.pipeline = { ...store.settings.pipeline, rejectionTemplates: [...currentTemplates(store), record] };
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ settings: store.settings });
    } catch (e) { }
  }
  return record;
}

export async function updateRejectionTemplate(id, patch) {
  const store = getStore();
  store.settings.pipeline = {
    ...store.settings.pipeline,
    rejectionTemplates: currentTemplates(store).map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ settings: store.settings });
    } catch (e) { }
  }
  return store.settings.pipeline.rejectionTemplates;
}

export async function deleteRejectionTemplate(id) {
  const store = getStore();
  store.settings.pipeline = {
    ...store.settings.pipeline,
    rejectionTemplates: currentTemplates(store).filter((t) => t.id !== id),
  };
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ settings: store.settings });
    } catch (e) { }
  }
  return store.settings.pipeline.rejectionTemplates;
}

export async function purgeRejectedCandidates(months) {
  const store = getStore();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - (months || 6));
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const before = store.candidates.length;
  store.candidates = (store.candidates || []).filter(
    (c) => !(c.stage === "Rejected" && (c.rejectedAt || c.appliedDate) < cutoffStr)
  );
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.purgeCompanyData(months);
    } catch (e) {
      throw e;
    }
  }
  return before - store.candidates.length;
}

// ---- VERIFICATION & APPROVAL ------------------------------------------------

export function setRegisteredAuth(user, companyData) {
  const store = getStore();
  store.initialized = true;
  const email = user?.email || companyData?.email || "";
  const name = user?.full_name || companyData?.name || companyData?.contact_name || "";
  store.auth = {
    ...store.auth,
    loggedIn: true,
    email,
    name,
    role: "Company Admin",
  };
  store.company = {
    ...store.company,
    ...companyData,
    email,
    emailVerified: false,
    approvalStatus: "pending",
  };
  write(store);
  if (typeof window !== "undefined") {
    localStorage.setItem("lv360_company_email", email);
  }
  return store;
}

export async function verifyCompanyEmail(email, code = "123456") {
  const store = getStore();
  const targetEmail =
    email ||
    (typeof window !== "undefined" ? localStorage.getItem("lv360_company_email") : "") ||
    store.company?.email ||
    store.auth?.email;

  const res = await companyAuth.verifyCompanyEmail({ email: targetEmail, code });

  store.company = { ...store.company, emailVerified: true };
  if (store.auth) {
    store.auth.emailVerified = true;
  }
  write(store);
  return res || store.company;
}

export async function resendVerificationCode(email) {
  const store = getStore();
  const targetEmail =
    email ||
    (typeof window !== "undefined" ? localStorage.getItem("lv360_company_email") : "") ||
    store.company?.email ||
    store.auth?.email;

  return companyAuth.sendCompanyVerificationEmail({ email: targetEmail });
}

export function setApprovalStatus(status) {
  const store = getStore();
  store.company = { ...store.company, approvalStatus: status };
  return write(store).company;
}

// ---- DASHBOARD ROLLUPS ------------------------------------------------------

export function getDashboard() {
  const store = getStore();
  const jobs = store.initialized ? store.jobs : ensureSeeded().jobs;
  const candidates = store.initialized ? store.candidates : ensureSeeded().candidates;
  const activeJobs = jobs.filter((j) => j.status === "Published").length;
  const quota = getQuota();
  const applications = candidates.length;
  const interviewsThisWeek = candidates.filter((c) => c.stage === "Interview Scheduled").length;
  const filledMtd = candidates.filter((c) => c.stage === "Hired").length;
  return { activeJobs, quota, applications, interviewsThisWeek, filledMtd, plan: getPlan() };
}

export function resetAll() {
  removeCompanyToken();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(KEY);
    } catch (e) { }
  }
  write(emptyStore());
}
