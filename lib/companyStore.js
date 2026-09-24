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
      regNumber: "",
      industry: "",
      size: "",
      website: "",
      description: "",
      logo: "",
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
  } catch (e) {}
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("lv360-store"));
  } catch (e) {}
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

const SEED_JOBS = [
  {
    id: "JOB-2001",
    title: "Senior Backend Engineer",
    department: "Engineering",
    type: "Full-time",
    location: "Ho Chi Minh City",
    salary: "25M – 40M VND",
    salary_min: 25000000,
    salary_max: 40000000,
    vacancies: 2,
    deadline: daysAhead(21),
    status: "Published",
    createdAt: daysAgo(3),
    applicantCount: 8,
    skills: ["Python", "FastAPI", "PostgreSQL", "AWS"],
    documents: ["CV / Resume", "Cover Letter"],
    jd: "We are looking for a Senior Backend Engineer to design and scale the services behind our hiring platform. You will own core APIs, mentor engineers and drive technical decisions.",
    aiGenerated: false,
  },
  {
    id: "JOB-2002",
    title: "Product Designer (UI/UX)",
    department: "Design",
    type: "Full-time",
    location: "Remote — Vietnam",
    salary: "18M – 28M VND",
    salary_min: 18000000,
    salary_max: 28000000,
    vacancies: 1,
    deadline: daysAhead(12),
    status: "Published",
    createdAt: daysAgo(6),
    applicantCount: 5,
    skills: ["Figma", "Design systems", "Prototyping", "User research"],
    documents: ["CV / Resume", "Portfolio"],
    jd: "Own the end-to-end design of key product areas, from research through polished UI. Partner closely with product and engineering.",
    aiGenerated: true,
  },
];

export function ensureSeeded() {
  const store = getStore();
  if (store.initialized) return store;

  store.initialized = true;
  store.auth = { loggedIn: true, name: "Lan Tran", email: "lan.tran@abctech.vn", role: "Company Admin" };
  store.company = {
    name: "ABC Technologies",
    regNumber: "0312345678",
    industry: "Technology",
    size: "51–200",
    website: "https://abctech.vn",
    description: "A Vietnamese software company building hiring and workforce products for the region.",
    logo: "",
    verified: true,
    emailVerified: true,
    approvalStatus: "approved",
    plan: "Freemium",
  };
  store.quota = { plan: "Freemium", used: SEED_JOBS.filter((j) => j.status === "Published" || j.status === "Paused").length };
  store.jobs = SEED_JOBS;
  store.candidates = [
    {
      id: "CAND-101",
      jobId: "JOB-2001",
      jobTitle: "Senior Backend Engineer",
      name: "Minh Tran",
      email: "minh.tran@example.com",
      phone: "090 123 4567",
      experienceYears: 4,
      educationLevel: "Bachelor's Degree",
      appliedDate: daysAgo(2),
      stage: "Applied",
      matchScore: 92,
      resumeFileName: "Minh_Tran_CV.pdf",
      notes: [{ id: "NOTE-1", text: "Strong API design experience. Portfolio includes FastAPI projects.", author: "Huy Nguyen", at: daysAgo(1) }],
    },
    {
      id: "CAND-102",
      jobId: "JOB-2001",
      jobTitle: "Senior Backend Engineer",
      name: "Trang Bui",
      email: "trang.bui@example.com",
      phone: "091 234 5678",
      experienceYears: 6,
      educationLevel: "Master's Degree",
      appliedDate: daysAgo(3),
      stage: "Interview Scheduled",
      matchScore: 88,
      resumeFileName: "Trang_Bui_Resume.pdf",
      notes: [],
    },
  ];
  store.team = [
    { id: "TM-1", name: "Lan Tran", email: "lan.tran@abctech.vn", role: "Company Admin", joinDate: daysAgo(240), lastLogin: "Today", status: "Active" },
    { id: "TM-2", name: "Huy Nguyen", email: "huy.nguyen@abctech.vn", role: "HR / Recruiter", joinDate: daysAgo(120), lastLogin: daysAgo(1), status: "Active" },
    { id: "TM-3", name: "Thao Pham", email: "thao.pham@abctech.vn", role: "HR / Recruiter", joinDate: daysAgo(64), lastLogin: daysAgo(3), status: "Active" },
    { id: "TM-4", name: "Quang Le", email: "quang.le@abctech.vn", role: "Viewer", joinDate: daysAgo(20), lastLogin: daysAgo(6), status: "Active" },
  ];
  store.invitations = [
    { id: "INV-1", email: "duc.hoang@abctech.vn", role: "HR / Recruiter", sentDate: daysAgo(2), expiry: daysAhead(5), status: "Pending", message: "Welcome aboard!" },
  ];
  store.notifications = [
    { id: "CN1", type: "application", title: "New application", message: "Minh Tran applied to Senior Backend Engineer.", date: daysAgo(0), read: false },
    { id: "CN2", type: "interview", title: "Interview tomorrow", message: "Interview with Trang Bui for Senior Backend Engineer.", date: daysAgo(1), read: false },
  ];

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
      const me = meRes.value;
      store.auth = {
        loggedIn: true,
        name: me.user_name || store.auth.name,
        email: me.user_email || store.auth.email,
        role: me.role || store.auth.role,
        companyId: me.company_id,
        twoFactorPending: false,
      };
      if (me.approval_status) {
        store.company.approvalStatus = me.approval_status.toLowerCase();
      }
    }

    if (profileRes.status === "fulfilled" && profileRes.value) {
      const p = profileRes.value;
      store.company = {
        id: p.id,
        name: p.name || "",
        regNumber: p.reg_number || "",
        industry: p.industry || "",
        size: p.size || "",
        website: p.website || "",
        description: p.description || "",
        logo: p.logo || "",
        verified: !!p.verified,
        emailVerified: !!p.email_verified,
        approvalStatus: (p.approval_status || "").toLowerCase(),
        plan: p.plan || "Freemium",
      };
      if (p.quota) {
        store.quota = {
          plan: p.quota.plan || "Freemium",
          limit: p.quota.limit,
          used: p.quota.used || 0,
          remaining: p.quota.remaining,
        };
      }
    }

    if (dashRes.status === "fulfilled" && dashRes.value) {
      const d = dashRes.value;
      if (d.quota) {
        store.quota = d.quota;
      }
    }

    if (jobsRes.status === "fulfilled" && Array.isArray(jobsRes.value)) {
      store.jobs = jobsRes.value.map((j) => ({
        id: j.id,
        title: j.title,
        department: j.department || "",
        type: j.type,
        location: j.location,
        salary: j.salary_min && j.salary_max ? `${Math.round(j.salary_min / 1000000)}M – ${Math.round(j.salary_max / 1000000)}M VND` : "Negotiable",
        salary_min: j.salary_min,
        salary_max: j.salary_max,
        vacancies: j.vacancies || 1,
        deadline: j.deadline,
        status: j.status,
        createdAt: j.created_at,
        applicantCount: j.applicant_count || 0,
        skills: j.skills || [],
        documents: j.documents || [],
        jd: j.jd,
        aiGenerated: !!j.ai_generated,
      }));
    }

    if (candRes.status === "fulfilled" && Array.isArray(candRes.value)) {
      store.candidates = candRes.value.map((c) => ({
        id: c.id,
        jobId: c.job_id,
        jobTitle: c.job_title || "",
        name: c.name,
        email: c.email,
        phone: c.phone || "",
        experienceYears: c.experience_years || 2,
        educationLevel: c.education_level || "Bachelor's Degree",
        appliedDate: c.applied_date,
        stage: c.stage,
        matchScore: c.match_score || 80,
        resumeFileName: c.resume_file_name || "",
        notes: (c.notes || []).map((n) => ({ id: n.id, text: n.text, author: n.author, at: n.at })),
        interview: c.interview,
        rejectionTemplateId: c.rejection_template_id,
        rejectionNote: c.rejection_note,
        rejectedAt: c.rejected_at,
      }));
    }

    if (teamRes.status === "fulfilled" && teamRes.value) {
      const t = teamRes.value;
      if (Array.isArray(t.members)) {
        store.team = t.members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          joinDate: m.created_at ? m.created_at.slice(0, 10) : daysAgo(30),
          lastLogin: m.last_login || "Never",
          status: m.status,
        }));
      }
      if (Array.isArray(t.invitations)) {
        store.invitations = t.invitations.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          sentDate: i.sent_date ? i.sent_date.slice(0, 10) : daysAgo(1),
          expiry: i.expiry ? i.expiry.slice(0, 10) : daysAhead(7),
          status: i.status,
          message: i.message || "",
          inviteToken: i.invite_token,
          activationUrl: i.activation_url,
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
      const isNetworkError = !e.status && (
        e.message?.toLowerCase().includes("fetch") ||
        e.message?.toLowerCase().includes("network") ||
        e.name === "TypeError"
      );

      if (isNetworkError && email.toLowerCase() === "lan.tran@abctech.vn" && password === "password123") {
        const store = ensureSeeded();
        store.auth = { ...store.auth, loggedIn: false, twoFactorPending: true, email };
        write(store);
        return {
          status: "2FA_REQUIRED",
          session_token: "mock_token",
          masked_email: "l•••@abctech.vn",
          isMock: true,
        };
      }

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
      const store = getStore();
      store.initialized = true;
      const respData = data?.data || data || {};
      const user = respData.user || {};
      store.auth = {
        loggedIn: true,
        name: user.full_name || respData.user_name || store.auth.name,
        email: user.email || respData.user_email || store.auth.email,
        role: (user.roles && user.roles[0]) || respData.role || store.auth.role,
        companyId: user.company_id || respData.company_id,
        twoFactorPending: false,
      };
      const approvalStatus = respData.approval_status || user.approval_status;
      if (approvalStatus) {
        store.company.approvalStatus = approvalStatus.toLowerCase();
      }
      write(store);
      await syncCompanyWithBackend();
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
  const store = getStore();
  store.auth.loggedIn = false;
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
      console.warn("Backend updateCompanyProfile failed:", e.message);
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
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          negotiable: job.negotiable,
          jd: job.jd,
          skills: job.skills,
          experience: job.experience,
          education: job.education,
          deadline: job.deadline,
          vacancies: job.vacancies,
          documents: job.documents,
          status: job.status,
        });
      } catch (e) {
        console.warn("Backend updateCompanyJob failed:", e.message);
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
        salary_min: job.salary_min || 15000000,
        salary_max: job.salary_max || 30000000,
        negotiable: !!job.negotiable,
        jd: job.jd || "",
        skills: job.skills || [],
        experience: job.experience || "2+ years",
        education: job.education || "Bachelor's Degree",
        deadline: job.deadline || null,
        vacancies: job.vacancies || 1,
        documents: job.documents || ["CV / Resume"],
        status: job.status || "Draft",
        ai_generated: !!job.aiGenerated,
      });
      if (created && created.id) {
        record.id = created.id;
        write(store);
      }
    } catch (e) {
      console.warn("Backend createCompanyJob failed:", e.message);
    }
  }

  return record;
}

export async function setJobStatus(id, status) {
  const store = getStore();
  store.jobs = store.jobs.map((j) => (String(j.id) === String(id) ? { ...j, status } : j));
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.setCompanyJobStatus(id, status);
    } catch (e) {
      console.warn("Backend setCompanyJobStatus failed:", e.message);
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
      if (created && created.id) {
        copy.id = created.id;
        write(store);
      }
    } catch (e) {
      console.warn("Backend duplicateCompanyJob failed:", e.message);
    }
  }

  return copy;
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
      console.warn("Backend updateCandidateStage failed:", e.message);
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
      console.warn("Backend bulkUpdateCandidateStage failed:", e.message);
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
      console.warn("Backend addCandidateNote failed:", e.message);
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
      console.warn("Backend scheduleCandidateInterview failed:", e.message);
    }
  }
  return store.candidates.find((c) => String(c.id) === String(id));
}

// ---- TEAM / INVITATIONS -----------------------------------------------------

export function listTeam() {
  const store = getStore();
  return (store.initialized ? store.team : ensureSeeded().team).slice();
}

export function updateMemberRole(id, role) {
  const store = getStore();
  store.team = store.team.map((m) => (String(m.id) === String(id) ? { ...m, role } : m));
  return write(store).team;
}

export function revokeMember(id) {
  const store = getStore();
  store.team = store.team.map((m) => (String(m.id) === String(id) ? { ...m, status: "Inactive" } : m));
  return write(store).team;
}

export function reactivateMember(id) {
  const store = getStore();
  store.team = store.team.map((m) => (String(m.id) === String(id) ? { ...m, status: "Active" } : m));
  return write(store).team;
}

export function listInvitations() {
  const store = getStore();
  return (store.initialized ? store.invitations : ensureSeeded().invitations).slice();
}

export async function addInvitation({ email, role, message }) {
  const store = getStore();

  if (getCompanyToken()) {
    try {
      const res = await companyApi.inviteTeamMember({ email, role, message });
      await syncCompanyWithBackend(true);
      return res?.data;
    } catch (e) {
      console.warn("Backend inviteTeamMember failed:", e.message);
      throw e;
    }
  }

  const record = {
    id: "INV-" + Date.now(),
    email,
    role,
    message: message || "",
    sentDate: new Date().toISOString().slice(0, 10),
    expiry: daysAhead(7),
    status: "Pending",
  };
  store.invitations = [record, ...(store.invitations || [])];
  write(store);
  return record;
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
      const res = await companyApi.resendTeamInvitation(id);
      await syncCompanyWithBackend(true);
      return res?.data;
    } catch (e) {
      console.warn("Backend resendTeamInvitation failed:", e.message);
      throw e;
    }
  }
  return store.invitations;
}


export async function revokeInvitation(id) {
  const store = getStore();
  store.invitations = (store.invitations || []).map((i) => (String(i.id) === String(id) ? { ...i, status: "Revoked" } : i));
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.revokeTeamInvitation(id);
    } catch (e) {
      console.warn("Backend revokeTeamInvitation failed:", e.message);
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

export function saveSettings(patch) {
  const store = getStore();
  store.settings = { ...store.settings, ...patch };
  return write(store).settings;
}

function currentTemplates(store) {
  return (store.settings?.pipeline && store.settings.pipeline.rejectionTemplates) || DEFAULT_REJECTION_TEMPLATES;
}

export function listRejectionTemplates() {
  const store = getStore();
  return currentTemplates(store).slice();
}

export function addRejectionTemplate({ title, body }) {
  const store = getStore();
  const record = { id: "RT-" + Date.now(), title: title || "Untitled", body: body || "" };
  store.settings.pipeline = { ...store.settings.pipeline, rejectionTemplates: [...currentTemplates(store), record] };
  write(store);
  return record;
}

export function updateRejectionTemplate(id, patch) {
  const store = getStore();
  store.settings.pipeline = {
    ...store.settings.pipeline,
    rejectionTemplates: currentTemplates(store).map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
  return write(store).settings.pipeline.rejectionTemplates;
}

export function deleteRejectionTemplate(id) {
  const store = getStore();
  store.settings.pipeline = {
    ...store.settings.pipeline,
    rejectionTemplates: currentTemplates(store).filter((t) => t.id !== id),
  };
  return write(store).settings.pipeline.rejectionTemplates;
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
      console.warn("Backend purgeCompanyData failed:", e.message);
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
  write(emptyStore());
}
