// Company / Employer workspace store — backed by backend APIs with localStorage fallback.
import * as companyAuth from "./api/companyAuth";
import * as companyApi from "./api/companyApi";
import { getCompanyToken, setCompanyToken, removeCompanyToken } from "./api/client";
import {
  AVAILABLE_PERMISSIONS,
  CORE_COMPANY_ROLES,
  ROLES,
  ROLE_SUMMARY,
  can as evaluateCan,
  getCompanyRolesList,
  normalizeRole,
  getRoleBadgeStyle,
  getRoleDisplayName,
} from "./companyRoles";

export {
  AVAILABLE_PERMISSIONS,
  CORE_COMPANY_ROLES,
  ROLES,
  ROLE_SUMMARY,
  getCompanyRolesList,
  normalizeRole,
  getRoleBadgeStyle,
  getRoleDisplayName,
};

/**
 * Resolves company logo URL properly:
 * - returns base64 data URLs as-is
 * - returns external http(s) URLs as-is
 * - normalizes relative /uploads paths to work with Next.js rewrites and direct serving
 */
export function resolveCompanyLogoUrl(logo) {
  if (!logo || typeof logo !== "string") return "";
  const trimmed = logo.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const KEY = "lv360-company-store-v1";

export const STATIC_PIPELINE_STAGES = [
  { id: "applied", label: "Applied", description: "New candidate applications", required: true, defaultEnabled: true },
  { id: "screening", label: "Screening", description: "Initial resume and profile review", required: true, defaultEnabled: true },
  { id: "phone_screening", label: "Phone Screening", description: "15-30 min pre-interview screen (Standard)", required: false, defaultEnabled: true },
  { id: "shortlisted", label: "Shortlisted", description: "Qualified candidates moved to hiring pool", required: true, defaultEnabled: true },
  { id: "interview_scheduled", label: "Interview Scheduled", description: "Technical and panel interview rounds", required: true, defaultEnabled: true },
  { id: "offer_sent", label: "Offer Sent", description: "Formal job offer issued to candidate", required: true, defaultEnabled: true },
  { id: "hired", label: "Hired", description: "Accepted offer and contract signed", required: true, defaultEnabled: true },
  { id: "post_hire_tracking", label: "Post-Hire Tracking", description: "Probation and onboarding checkpoint tracking", required: false, defaultEnabled: true },
  { id: "rejected", label: "Rejected", description: "Applications declined with structured feedback", required: true, defaultEnabled: true },
];

export const PIPELINE_STAGES = STATIC_PIPELINE_STAGES.map((s) => s.label);

export function getPipelineStages() {
  const store = getStore();
  const configured = store?.settings?.pipeline?.stages;
  if (Array.isArray(configured) && configured.length > 0) {
    return configured.filter((s) => s.enabled !== false).map((s) => s.label);
  }
  return STATIC_PIPELINE_STAGES.filter((s) => s.defaultEnabled).map((s) => s.label);
}

export function getAllConfiguredStages() {
  const store = getStore();
  const configured = store?.settings?.pipeline?.stages;
  if (Array.isArray(configured) && configured.length > 0) {
    return configured;
  }
  return STATIC_PIPELINE_STAGES.map((s) => ({ ...s, enabled: s.defaultEnabled }));
}

export async function saveConfiguredStages(stages) {
  const store = getStore();
  store.settings = store.settings || {};
  store.settings.pipeline = store.settings.pipeline || {};
  store.settings.pipeline.stages = stages;
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ settings: store.settings });
    } catch (e) {
      console.warn("Could not sync stage configuration to backend:", e.message);
    }
  }
  return stages;
}

export async function resetPipelineStagesToDefault() {
  const defaultStages = STATIC_PIPELINE_STAGES.map((s) => ({ ...s, enabled: s.defaultEnabled }));
  return saveConfiguredStages(defaultStages);
}

export function getContactVisibilityStage() {
  const store = getStore();
  return store?.settings?.pipeline?.contactVisibilityStage || "Screening";
}

export const JOB_STATUSES = ["Draft", "Published", "Paused", "Closed"];

export const PLANS = [
  {
    id: "Freemium",
    name: "Freemium",
    tier: "Freemium",
    enabled: true,
    isCurrentPhase: true,
    price: "0 VND",
    priceMonthly: "0 ₫",
    priceAnnual: "0 ₫",
    priceMonthlyRaw: 0,
    priceAnnualRaw: 0,
    postingLimit: 999, // Phase 1 unlimited free postings
    standardPostingLimit: 3,
    retentionMonths: 6, // Candidate data retention period
    aiFeatures: false,
    seats: 1,
    blurb: "Phase 1 Early Access — Unlimited Free Postings",
    features: [
      "Up to 3 active jobs (999 during Phase 1)",
      "Basic candidate pipeline management",
      "1 team member seat",
      "Standard verified company profile",
      "Standard email support",
    ],
  },
  {
    id: "Professional",
    name: "Professional",
    tier: "Professional",
    enabled: false, // Phase 2 only
    isCurrentPhase: false,
    phase: 2,
    price: "2,900,000 VND / mo",
    priceMonthly: "2.900.000 ₫",
    priceAnnual: "2.320.000 ₫",
    priceMonthlyRaw: 2900000,
    priceAnnualRaw: 2320000,
    annualTotal: "27.840.000 ₫/năm",
    postingLimit: 25,
    standardPostingLimit: 25,
    retentionMonths: 12,
    aiFeatures: true,
    seats: "Unlimited",
    blurb: "Phase 2 Commercial Tier (Coming Soon)",
    features: [
      "Up to 25 active job postings",
      "AI candidate screening & fit scoring",
      "AI job description assistant",
      "Unlimited team members & roles",
      "Verified Employer badge",
      "Priority customer support",
    ],
  },
  {
    id: "Enterprise",
    name: "Enterprise",
    tier: "Enterprise",
    enabled: false, // Phase 2 only
    isCurrentPhase: false,
    phase: 2,
    price: "Custom",
    priceMonthly: "Liên hệ",
    priceAnnual: "Liên hệ",
    priceMonthlyRaw: null,
    priceAnnualRaw: null,
    postingLimit: Infinity,
    standardPostingLimit: Infinity,
    retentionMonths: 36,
    aiFeatures: true,
    seats: "Unlimited",
    blurb: "Phase 2 Enterprise Tier (Coming Soon)",
    features: [
      "Unlimited active job postings",
      "Full AI suite & recruitment analytics",
      "SSO authentication & enterprise security",
      "Custom data exports & audit logs",
      "Dedicated 24/7 account manager & SLA",
    ],
  },
];

/**
 * Permission-level check: Verify whether a given role holds the requested permission key.
 * Evaluates dynamically against custom roles and core roles.
 */
export function can(role, action) {
  const store = getStore();
  const customRoles = store?.settings?.custom_roles || [];
  return evaluateCan(role, action, customRoles);
}

export function listCompanyRoles() {
  const store = getStore();
  const customRoles = store?.settings?.custom_roles || [];
  return getCompanyRolesList(customRoles);
}

export async function saveCustomRole(roleData) {
  const store = getStore();
  store.settings = store.settings || {};
  const customRoles = Array.isArray(store.settings.custom_roles) ? [...store.settings.custom_roles] : [];

  const existingIdx = customRoles.findIndex((r) => r.code === roleData.code);
  if (existingIdx >= 0) {
    customRoles[existingIdx] = roleData;
  } else {
    customRoles.push(roleData);
  }
  store.settings.custom_roles = customRoles;
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.createCustomRole(roleData);
    } catch (e) {
      console.warn("Could not sync custom role to backend:", e.message);
      throw e;
    }
  }
  return customRoles;
}

export const DEFAULT_EMAIL_TEMPLATES = [
  {
    id: "RT-1",
    category: "rejection",
    title: "Profile does not match requirements",
    subject: "Cập nhật về hồ sơ ứng tuyển {{job_title}} tại {{company_name}}",
    body: `Kính gửi {{candidate_name}},

Cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí {{job_title}} tại {{company_name}}.

Sau khi cân nhắc kỹ lưỡng hồ sơ và đối chiếu các yêu cầu hiện tại của vị trí, chúng tôi rất tiếc phải thông báo hiện tại công ty chưa thể chọn bạn đi tiếp trong quy trình tuyển dụng lần này.

Hồ sơ của bạn đã được lưu trữ an toàn trong hệ thống dữ liệu nhân tài của chúng tôi để ưu tiên liên hệ cho các cơ hội phù hợp hơn trong tương lai.

Chúc bạn luôn gặt hái nhiều thành công và may mắn trên con đường sự nghiệp!

Trân trọng,
Đội ngũ Tuyển dụng {{company_name}}`,
    isDefault: true,
  },
  {
    id: "RT-2",
    category: "rejection",
    title: "Role filled internally",
    subject: "Thông báo về vị trí {{job_title}} tại {{company_name}}",
    body: `Kính gửi {{candidate_name}},

Cảm ơn bạn đã dành thời gian quý báu ứng tuyển vào vị trí {{job_title}} tại {{company_name}}.

Chúng tôi xin thông báo rằng vị trí tuyển dụng này đã được bổ nhiệm từ nguồn lực nội bộ của công ty.

Chúng tôi rất ấn tượng với năng lực chuyên môn cùng kinh nghiệm của bạn. Bộ phận Nhân sự sẽ chủ động kết nối lại với bạn ngay khi có các vị trí mới phù hợp với thế mạnh của bạn.

Chúc bạn nhiều thành công!

Trân trọng,
Phòng Nhân sự {{company_name}}`,
    isDefault: false,
  },
  {
    id: "RT-3",
    category: "rejection",
    title: "More experienced candidate selected",
    subject: "Kết quả tuyển dụng vị trí {{job_title}} - {{company_name}}",
    body: `Kính gửi {{candidate_name}},

Cảm ơn bạn đã tham gia ứng tuyển và trao đổi về vị trí {{job_title}} tại {{company_name}}.

Chúng tôi đã nhận được nhiều hồ sơ chất lượng cao và sau các vòng đánh giá, hội đồng tuyển dụng đã quyết định lựa chọn ứng viên có kinh nghiệm chuyên sâu hơn trong lĩnh vực cụ thể của dự án lần này.

Chúng tôi rất trân trọng thời gian và sự chuẩn bị chu đáo của bạn. Rất mong sẽ có cơ hội hợp tác cùng bạn trong các dự án sắp tới.

Trân trọng,
Hội đồng Tuyển dụng {{company_name}}`,
    isDefault: false,
  },
  {
    id: "RT-4",
    category: "rejection",
    title: "Position put on hold",
    subject: "Tạm dừng tuyển dụng vị trí {{job_title}} tại {{company_name}}",
    body: `Kính gửi {{candidate_name}},

Cảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí {{job_title}} tại {{company_name}}.

Do có sự điều chỉnh trong kế hoạch kinh doanh và cơ cấu dự án, công ty chúng tôi tạm thời dừng kế hoạch tuyển dụng cho vị trí này trong giai đoạn hiện tại.

Hồ sơ của bạn vẫn được lưu giữ cẩn thận và chúng tôi sẽ kích hoạt lại liên hệ ngay khi dự án mở lại đợt tuyển mới. Cảm ơn sự thông cảm và đồng hành của bạn.

Trân trọng,
Đội ngũ Nhân sự {{company_name}}`,
    isDefault: false,
  },
  {
    id: "IT-1",
    category: "interview",
    title: "Technical Interview Invitation",
    subject: "Thư mời phỏng vấn kỹ thuật: {{job_title}} tại {{company_name}}",
    body: `Kính gửi {{candidate_name}},

Chúng tôi rất ấn tượng với hồ sơ của bạn và trân trọng kính mời bạn tham gia vòng Phỏng vấn Kỹ thuật cho vị trí {{job_title}} tại {{company_name}}.

Thông tin chi tiết buổi phỏng vấn:
- Thời gian: {{interview_date}} lúc {{interview_time}}
- Hình thức: Phỏng vấn trực tuyến qua Google Meet
- Đường dẫn tham gia: {{interview_link}}
- Thời lượng dự kiến: 45 - 60 phút

Vui lòng phản hồi email này để xác nhận thời gian có phù hợp với bạn không, hoặc đề xuất khung giờ thuận tiện khác.

Chúc bạn có một buổi phỏng vấn thật tự tin và thành công!

Trân trọng,
Đội ngũ Tuyển dụng {{company_name}}`,
    isDefault: true,
  },
  {
    id: "IT-2",
    category: "interview",
    title: "HR Screening Round Invitation",
    subject: "Thư mời trao đổi sơ bộ (HR Screening): {{job_title}} - {{company_name}}",
    body: `Kính gửi {{candidate_name}},

Cảm ơn bạn đã ứng tuyển vào vị trí {{job_title}} tại {{company_name}}.

Bộ phận Tuyển dụng muốn mời bạn tham gia một buổi trao đổi ngắn (khoảng 20 - 30 phút) để giới thiệu tổng quan về dự án, môi trường làm việc cũng như trao đổi về định hướng và mong muốn của bạn.

- Thời gian: {{interview_date}} lúc {{interview_time}}
- Địa điểm / Đường dẫn: {{interview_location}}

Vui lòng xác nhận qua email nếu khung giờ trên phù hợp với bạn. Hẹn gặp lại bạn trong buổi trao đổi!

Trân trọng,
{{sender_name}}
Phòng Nhân sự {{company_name}}`,
    isDefault: false,
  },
  {
    id: "OT-1",
    category: "offer",
    title: "Formal Job Offer Letter",
    subject: "Thư mời nhận việc (Job Offer): {{job_title}} - {{company_name}}",
    body: `Kính gửi {{candidate_name}},

Thay mặt Ban Lãnh đạo {{company_name}}, chúng tôi vô cùng vui mừng gửi tới bạn Thư mời nhận việc (Job Offer) cho vị trí {{job_title}}.

Chúng tôi đánh giá rất cao năng lực và tinh thần làm việc của bạn trong suốt các vòng tuyển dụng vừa qua, và tin tưởng rằng bạn sẽ là một mảnh ghép xuất sắc đóng góp vào sự phát triển của công ty.

Chi tiết về mức lương, chế độ đãi ngộ, thời gian thử việc và ngày bắt đầu công việc đã được đính kèm chi tiết.

Vui lòng xem xét và gửi phản hồi xác nhận trước ngày {{date}}. Nếu bạn có bất kỳ câu hỏi nào, xin đừng ngần ngại liên hệ trực tiếp với chúng tôi.

Chào mừng bạn gia nhập đại gia đình {{company_name}}!

Trân trọng,
Ban Giám đốc {{company_name}}`,
    isDefault: true,
  },
  {
    id: "GT-1",
    category: "general",
    title: "Application Acknowledgment",
    subject: "Xác nhận đã nhận hồ sơ ứng tuyển {{job_title}} - {{company_name}}",
    body: `Kính gửi {{candidate_name}},

{{company_name}} xin xác nhận đã nhận được hồ sơ ứng tuyển của bạn cho vị trí {{job_title}}.

Hội đồng tuyển dụng đang tiến hành đánh giá chi tiết hồ sơ của bạn. Chúng tôi sẽ thông báo kết quả sàng lọc và các bước tiếp theo trong vòng 3 - 5 ngày làm việc.

Cảm ơn sự quan tâm và tình cảm bạn dành cho {{company_name}}.

Trân trọng,
Phòng Tuyển dụng {{company_name}}`,
    isDefault: true,
  },
  {
    id: "GT-2",
    category: "general",
    title: "Document Verification Request",
    subject: "Yêu cầu bổ sung tài liệu xác minh: {{job_title}} - {{company_name}}",
    body: `Kính gửi {{candidate_name}},

Để hoàn thiện thủ tục đánh giá ứng viên vào vị trí {{job_title}}, {{company_name}} kính đề nghị bạn tải lên các tài liệu xác thực kinh nghiệm (bảng lương 3 tháng gần nhất, quyết định thôi việc hoặc hợp đồng lao động trước đây) qua cổng ứng viên LàmViec360.

Toàn bộ tài liệu được mã hóa chuẩn AES-256 và bảo mật nghiêm ngặt theo Nghị định 13/2023/NĐ-CP (PDPD), chỉ phục vụ mục đích thẩm định tuyển dụng nội bộ.

Trân trọng,
Phòng Nhân sự {{company_name}}`,
    isDefault: false,
  },
];

export const DEFAULT_REJECTION_TEMPLATES = DEFAULT_EMAIL_TEMPLATES.filter((t) => t.category === "rejection");

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
      tagline: "",
      workplaceModel: "Hybrid",
      workingHours: "Monday – Friday (9:00 AM – 6:00 PM)",
      cultureValues: [
        { title: "Innovation & Impact", description: "Building scalable digital platforms that solve real problems." },
        { title: "People & Growth", description: "Continuous mentorship, career growth, and merit-based teamwork." },
        { title: "Integrity & Excellence", description: "Transparent communication and high delivery standards." }
      ],
      isPublic: true,
      featuredOnHomepage: true,
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
      pipeline: { autoRejectEmail: true, delayRejectionEmail: false, rejectionDelayHours: 24, emailTemplates: DEFAULT_EMAIL_TEMPLATES, rejectionTemplates: DEFAULT_REJECTION_TEMPLATES },
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
  if (!store.settings.pipeline.emailTemplates || !store.settings.pipeline.emailTemplates.length) {
    store.settings.pipeline.emailTemplates = DEFAULT_EMAIL_TEMPLATES;
  }
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
        companyApi.listCompanyJobs({ pageSize: 100 }),
        companyApi.listCompanyCandidates({ pageSize: 100 }),
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

          const resolvedRole = getRoleDisplayName(me.role_code || me.role || store.auth.role);

          store.auth = {
            loggedIn: true,
            name: me.user_name || me.full_name || store.auth.name,
            email: me.user_email || me.email || store.auth.email,
            role: resolvedRole,
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
            tagline: p.tagline || (p.settings && p.settings.tagline) || store.company.tagline || "",
            workplaceModel: (p.settings && p.settings.workplace_model) || store.company.workplaceModel || "Hybrid",
            workingHours: (p.settings && p.settings.working_hours) || store.company.workingHours || "Monday – Friday (9:00 AM – 6:00 PM)",
            cultureValues: (p.settings && p.settings.culture_values) || store.company.cultureValues || [],
            isPublic: p.is_public !== undefined ? p.is_public : (p.isPublic !== undefined ? p.isPublic : (store.company.isPublic !== undefined ? store.company.isPublic : true)),
            featuredOnHomepage: p.is_featured !== undefined ? p.is_featured : (store.company.featuredOnHomepage !== undefined ? store.company.featuredOnHomepage : true),
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
          salaryMin: j.salaryMin !== undefined && j.salaryMin !== null ? String(j.salaryMin) : (j.salary_min ? String(j.salary_min).split(".")[0] : ""),
          salaryMax: j.salaryMax !== undefined && j.salaryMax !== null ? String(j.salaryMax) : (j.salary_max ? String(j.salary_max).split(".")[0] : ""),
          negotiable: !!j.is_negotiable || !!j.negotiable,
          vacancies: j.vacancies !== undefined && j.vacancies !== null ? String(j.vacancies) : "1",
          education: j.education || "Bachelor's Degree",
          experience: j.experience || j.experience_level || "2+ years",
          deadline: j.deadline ? j.deadline.slice(0, 10) : (j.expires_at ? j.expires_at.slice(0, 10) : ""),
          status: j.status ? (j.status.charAt(0).toUpperCase() + j.status.slice(1).toLowerCase()) : "Draft",
          createdAt: j.created_at ? j.created_at.slice(0, 10) : "",
          applicantCount: j.applicant_count ?? (j.applications_count || 0),
          skills: Array.isArray(j.skills) ? j.skills : (typeof j.skills === "string" ? j.skills.split(",").map((s) => s.trim()).filter(Boolean) : (typeof j.required_skills === "string" ? j.required_skills.split(",").map((s) => s.trim()).filter(Boolean) : [])),
          documents: Array.isArray(j.documents) ? j.documents : (typeof j.documents === "string" && j.documents ? j.documents.split(",").map((s) => s.trim()).filter(Boolean) : ["CV / Resume"]),
          description: j.description || j.jd || "",
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
          resumeUrl: c.resume_url || c.resumeUrl || "",
          resume_url: c.resume_url || c.resumeUrl || "",
          resumeFileName: c.resume_file_name || c.resumeFileName || (c.resume_url ? c.resume_url.split("/").pop() : "Candidate_Resume.pdf"),
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
            const role = getRoleDisplayName(m.role || "HR / Recruiter");
            const rawStatus = (m.status || "").toLowerCase();
            const status = rawStatus === "inactive" || rawStatus === "revoked" ? "Inactive" : "Active";

            return {
              id: m.id,
              name: m.name || m.full_name || "Team Member",
              email: m.email,
              role,
              role_code: normalizeRole(m.role || role),
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
            role: getRoleDisplayName(i.role || "HR / Recruiter"),
            role_code: normalizeRole(i.role || "recruiter"),
            sentDate: i.sentDate || (i.sent_date ? i.sent_date.slice(0, 10) : daysAgo(1)),
            expiry: i.expiry ? i.expiry.slice(0, 10) : daysAhead(3),
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

      // Non-admin users (HR / Recruiter, Viewer, Interviewer, etc.) do NOT require 2FA - direct login
      if (payload.requires_2fa === false || payload.status === "DIRECT_LOGIN" || payload.access_token) {
        if (payload.access_token) {
          setCompanyToken(payload.access_token);
        }
        const user = payload.user || {};
        const newStore = emptyStore();
        newStore.initialized = true;

        const rawRole = (user.role || (user.roles && user.roles[0]) || payload.role || "").toLowerCase();
        let normalizedRole = "HR / Recruiter";
        if (rawRole.includes("admin")) normalizedRole = "Company Admin";
        else if (rawRole.includes("view")) normalizedRole = "Viewer";
        else if (rawRole.includes("hr") || rawRole.includes("recruit")) normalizedRole = "HR / Recruiter";

        newStore.auth = {
          loggedIn: true,
          name: user.full_name || payload.user_name || "",
          email: user.email || payload.user_email || email,
          role: normalizedRole,
          companyId: user.company_id || payload.company_id,
          twoFactorPending: false,
        };
        if (user.company_name) {
          newStore.company.name = user.company_name;
        }
        const approvalStatus = payload.approval_status || user.approval_status;
        if (approvalStatus) {
          newStore.company.approvalStatus = approvalStatus.toLowerCase();
        }
        write(newStore);
        await syncCompanyWithBackend(true);
        return {
          ...payload,
          requires_2fa: false,
          direct: true,
          role: normalizedRole,
        };
      }

      return {
        ...res,
        ...payload,
        session_token: payload.session_token || res?.session_token,
        status: payload.status || res?.status || "2FA_REQUIRED",
        masked_email: payload.masked_email || res?.masked_email,
        message: payload.message || res?.message,
        requires_2fa: true,
        role: "Company Admin",
        dev_otp: payload.dev_otp || res?.dev_otp,
      };
    } catch (e) {
      // Offline fallback: check if team member in local store
      const store = getStore();
      const cleanEmail = email.trim().toLowerCase();
      const teamMember = (store.team || []).find((m) => (m.email || "").toLowerCase() === cleanEmail);
      if (teamMember) {
        const rawRole = (teamMember.role || "").toLowerCase();
        const isTeamAdmin = rawRole.includes("admin");
        if (!isTeamAdmin) {
          let normalizedRole = "HR / Recruiter";
          if (rawRole.includes("view")) normalizedRole = "Viewer";
          store.auth = {
            loggedIn: true,
            name: teamMember.name || "Team Member",
            email: teamMember.email,
            role: normalizedRole,
            companyId: store.company.id || 1,
            twoFactorPending: false,
          };
          write(store);
          return {
            requires_2fa: false,
            status: "DIRECT_LOGIN",
            role: normalizedRole,
            direct: true,
            user: store.auth,
          };
        }
      }

      // Propagate API errors (401, 403, 400, etc.) and invalid offline credentials
      throw e;
    }
  }

  const store = ensureSeeded();
  store.auth = { ...store.auth, loggedIn: false, twoFactorPending: true };
  return write(store).auth;
}

export async function resendLoginOtp(sessionToken, email) {
  if (sessionToken && sessionToken !== "mock_token") {
    try {
      const data = await companyAuth.resendCompanyOtp({ session_token: sessionToken, email });
      return data?.data || data || {};
    } catch (e) {
      console.warn("Failed to resend 2FA OTP via API:", e.message);
      throw e;
    }
  }
  return { status: "OTP_SENT" };
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
      const rawRole = (user.role || (user.roles && user.roles[0]) || respData.role || "Company Admin").toLowerCase();
      let normalizedRole = "Company Admin";
      if (rawRole.includes("view")) normalizedRole = "Viewer";
      else if (rawRole.includes("hr") || rawRole.includes("recruit")) normalizedRole = "HR / Recruiter";

      store.auth = {
        loggedIn: true,
        name: user.full_name || respData.user_name || "",
        email: user.email || respData.user_email || "",
        role: normalizedRole,
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

export async function directLoginCompany(email, password) {
  const data = await companyAuth.standardCompanyLogin({ email, password });
  const respData = data?.data || data || {};
  const user = respData.user || {};
  const store = emptyStore();
  store.initialized = true;
  store.auth = {
    loggedIn: true,
    name: user.full_name || respData.user_name || "",
    email: user.email || respData.user_email || email,
    role: (user.roles && user.roles[0]) || user.role || "company_admin",
    companyId: user.company_id || respData.company_id,
    twoFactorPending: false,
  };
  if (user.company_name) {
    store.company.name = user.company_name;
  }
  write(store);
  await syncCompanyWithBackend(true);
  return store.auth;
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

export function parseJwt(token) {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function getAuth() {
  const store = getStore();
  let auth = store.initialized ? store.auth : ensureSeeded().auth;
  const token = getCompanyToken();
  if (token) {
    try {
      const payload = parseJwt(token);
      if (payload && payload.role) {
        const tokenRole = getRoleDisplayName(payload.role);
        if (auth.role !== tokenRole) {
          auth.role = tokenRole;
          store.auth.role = tokenRole;
          write(store);
        }
      }
    } catch (_) { }
  }
  return auth;
}

export function setRole(role) {
  // Deprecated: Role switching is disabled per security & RBAC guidelines.
  // Role is strictly determined by authentication token.
  return getStore().auth;
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
      const apiPayload = {
        ...patch,
        cover_image_url: patch.coverImage !== undefined ? patch.coverImage : patch.cover_image_url,
        is_public: patch.isPublic !== undefined ? patch.isPublic : patch.is_public,
        is_featured: patch.featuredOnHomepage !== undefined ? patch.featuredOnHomepage : patch.is_featured,
        settings: {
          ...(store.settings || {}),
          culture_values: patch.cultureValues !== undefined ? patch.cultureValues : store.company.cultureValues,
          workplace_model: patch.workplaceModel !== undefined ? patch.workplaceModel : store.company.workplaceModel,
          working_hours: patch.workingHours !== undefined ? patch.workingHours : store.company.workingHours,
          tagline: patch.tagline !== undefined ? patch.tagline : store.company.tagline,
          is_public: patch.isPublic !== undefined ? patch.isPublic : store.company.isPublic,
          is_featured: patch.featuredOnHomepage !== undefined ? patch.featuredOnHomepage : (store.company.featuredOnHomepage !== undefined ? store.company.featuredOnHomepage : true),
        },
      };
      const res = await companyApi.updateCompanyProfile(apiPayload);
      const data = res?.data || res;
      if (data && typeof data === "object") {
        if (data.logo_url || data.logo) {
          store.company.logo = data.logo_url || data.logo;
        }
        if (data.cover_image_url || data.coverImage) {
          store.company.coverImage = data.cover_image_url || data.coverImage;
        }
        if (data.company_name || data.name) {
          store.company.name = data.company_name || data.name;
        }
        write(store);
      }
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

export async function setPlan(planId = "Freemium", options = {}) {
  const store = getStore();
  store.company = store.company || {};
  // Enforce Freemium as the only active plan in Phase 1 (FSD-003 BR-002)
  const targetPlan = PLANS.find((p) => p.id === planId && p.enabled);
  const activePlanId = targetPlan ? targetPlan.id : "Freemium";
  store.company.plan = activePlanId;
  store.quota = store.quota || {};
  store.quota.plan = activePlanId;
  store.company.billingCycle = options.billingCycle || store.company.billingCycle || "monthly";
  store.company.subscriptionRenewsAt = options.renewsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  store.company.subscriptionStatus = options.status || "active";
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ subscription_tier: planId });
    } catch (e) {
      console.warn("Could not sync subscription plan to backend:", e.message);
    }
  }
  return store.company;
}

export function getBillingInfo() {
  const store = getStore();
  const co = store.company || {};
  return {
    vatTaxCode: store.billingInfo?.vatTaxCode || co.taxCode || co.tax_code || "0312345678",
    vatCompanyName: store.billingInfo?.vatCompanyName || co.legalName || co.legal_name || co.name || "TechCorp Vietnam Co., Ltd",
    vatAddress: store.billingInfo?.vatAddress || co.address || "Tòa nhà Innovation, 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    vatEmail: store.billingInfo?.vatEmail || co.billingEmail || co.contactEmail || "accounting@company.vn",
    autoRenew: store.billingInfo?.autoRenew !== false,
    billingCycle: co.billingCycle || "monthly",
    renewsAt: co.subscriptionRenewsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: co.subscriptionStatus || "active",
    invoices: store.billingInfo?.invoices || [
      {
        id: "HD-2026-0042",
        date: "2026-10-01",
        plan: "Professional",
        cycle: "Monthly",
        amountVnd: "2.900.000 ₫",
        vatAmount: "290.000 ₫",
        totalAmount: "3.190.000 ₫",
        status: "Completed",
        pdfUrl: "/uploads/resumes/Candidate_Resume.pdf",
      },
      {
        id: "HD-2026-0018",
        date: "2026-09-01",
        plan: "Professional",
        cycle: "Monthly",
        amountVnd: "2.900.000 ₫",
        vatAmount: "290.000 ₫",
        totalAmount: "3.190.000 ₫",
        status: "Completed",
        pdfUrl: "/uploads/resumes/Candidate_Resume.pdf",
      },
    ],
  };
}

export function saveBillingInfo(patch) {
  const store = getStore();
  store.billingInfo = {
    ...getBillingInfo(),
    ...patch,
  };
  write(store);
  return store.billingInfo;
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

  const rawStatus = (job.status || "published").toLowerCase();
  const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  const skillsArr = Array.isArray(job.skills)
    ? job.skills
    : (typeof job.skills === "string" && job.skills ? job.skills.split(",").map((s) => s.trim()) : []);

  const salMin = job.salaryMin !== undefined && job.salaryMin !== ""
    ? Number(job.salaryMin)
    : (job.salary_min !== undefined && job.salary_min !== null && job.salary_min !== "" ? Number(job.salary_min) : null);

  const salMax = job.salaryMax !== undefined && job.salaryMax !== ""
    ? Number(job.salaryMax)
    : (job.salary_max !== undefined && job.salary_max !== null && job.salary_max !== "" ? Number(job.salary_max) : null);

  const outgoingPayload = {
    title: (job.title || "").trim(),
    department: (job.department || "").trim(),
    type: job.type || "Full-time",
    job_type: job.type || "Full-time",
    location: (job.location || "").trim(),
    city: (job.location || "").trim(),
    country: job.country || "Vietnam",
    salary_min: salMin,
    salary_max: salMax,
    salaryMin: salMin,
    salaryMax: salMax,
    salary_currency: job.salary_currency || "VND",
    negotiable: !!job.negotiable,
    is_negotiable: !!job.negotiable,
    description: job.description || "",
    skills: skillsArr,
    required_skills: skillsArr.join(", "),
    experience: job.experience || "2+ years",
    experience_level: job.experience || "Mid-level",
    education: job.education || "Bachelor's Degree",
    deadline: job.deadline || null,
    expires_at: job.deadline ? `${job.deadline}T23:59:59` : null,
    vacancies: Number(job.vacancies) || 1,
    documents: Array.isArray(job.documents) ? job.documents : ["CV / Resume"],
    status: rawStatus,
    ai_generated: Boolean(job.aiGenerated || job.ai_generated),
    salary_type: job.salaryType || job.salary_type || "Gross",
    salaryType: job.salaryType || job.salary_type || "Gross",
    attitude_type: job.attitudeType || job.attitude_type || "",
    attitudeType: job.attitudeType || job.attitude_type || "",
    social_type: job.socialType || job.social_type || "",
    socialType: job.socialType || job.social_type || "",
    personality_type: job.personalityType || job.personality_type || "",
    personalityType: job.personalityType || job.personality_type || "",
    overtime_willingness: job.overtimeWillingness || job.overtime_willingness || "",
    overtimeWillingness: job.overtimeWillingness || job.overtime_willingness || "",
    project_work_reqs: job.projectWorkReqs || job.project_work_reqs || "",
    projectWorkReqs: job.projectWorkReqs || job.project_work_reqs || "",
  };

  if (job.id) {
    const isMockId = String(job.id).startsWith("JOB-");
    const existingIndex = store.jobs.findIndex((j) => String(j.id) === String(job.id));
    const mergedRecord = {
      ...(existingIndex >= 0 ? store.jobs[existingIndex] : {}),
      ...job,
      ...outgoingPayload,
      id: job.id,
      status: displayStatus,
    };

    if (existingIndex >= 0) {
      store.jobs[existingIndex] = mergedRecord;
    } else {
      store.jobs = [mergedRecord, ...store.jobs];
    }
    record = mergedRecord;
    write(store);

    if (getCompanyToken() && !isMockId) {
      try {
        const updated = await companyApi.updateCompanyJob(job.id, outgoingPayload);
        const updatedData = updated?.data || updated;
        if (updatedData && updatedData.id) {
          const finalRecord = {
            ...mergedRecord,
            ...updatedData,
            status: displayStatus,
          };
          store.jobs = store.jobs.map((j) => (String(j.id) === String(job.id) ? finalRecord : j));
          record = finalRecord;
          write(store);
        }
      } catch (e) {
        throw e;
      }
    }
    return record;
  }

  const id = "JOB-" + (2100 + store.jobs.length + Math.floor(Math.random() * 100));
  record = {
    id,
    status: displayStatus,
    createdAt: new Date().toISOString().slice(0, 10),
    aiGenerated: false,
    applicantCount: 0,
    ...job,
    ...outgoingPayload,
  };
  store.jobs = [record, ...store.jobs];
  write(store);

  if (getCompanyToken()) {
    try {
      const created = await companyApi.createCompanyJob(outgoingPayload);
      const createdData = created?.data || created;
      if (createdData && createdData.id) {
        store.jobs = store.jobs.map((j) => (String(j.id) === String(id) ? {
          ...j,
          ...createdData,
          id: createdData.id,
          status: displayStatus,
        } : j));
        record = store.jobs.find((j) => String(j.id) === String(createdData.id)) || { ...record, id: createdData.id };
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
  const previousJobs = [...store.jobs];
  const isMockId = String(id).startsWith("JOB-");

  store.jobs = store.jobs.filter((j) => String(j.id) !== String(id));
  write(store);

  if (getCompanyToken() && !isMockId) {
    try {
      await companyApi.deleteCompanyJob(id);
    } catch (e) {
      // Rollback store if delete API failed
      store.jobs = previousJobs;
      write(store);
      throw e;
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
      let backendStatus = (stage || "").toLowerCase();
      if (stage === "Interview Scheduled") backendStatus = "interviewing";
      else if (stage === "Offer Sent") backendStatus = "offer_sent";
      else if (stage === "Post-Hire Tracking") backendStatus = "post_hire_tracking";
      else if (stage === "Phone Screening") backendStatus = "phone_screening";

      await companyApi.updateCandidateStage(id, {
        stage: backendStatus,
        status: backendStatus,
        recruiter_notes: reason?.note || reason?.rejectionNote || "",
        rejectionTemplateId: reason?.templateId,
        rejectionNote: reason?.note,
      });
    } catch (e) {
      console.warn("Backend updateCandidateStage notice (persisted in local store):", e.message);
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
      console.warn('Backend bulkUpdateCandidateStage error (persisted in local store):', e.message);
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
  const scheduledAt = interviewData.scheduledAt || interviewData.at || new Date().toISOString();
  store.candidates = store.candidates.map((c) =>
    String(c.id) === String(id)
      ? {
        ...c,
        stage: "Interview Scheduled",
        interview: {
          round: interviewData.roundName || interviewData.round || "First Round",
          at: scheduledAt,
          status: "invited",
          mode: interviewData.mode || "video",
          location: interviewData.locationOrLink || interviewData.meetingLink || interviewData.location || "",
        },
      }
      : c
  );
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.scheduleCandidateInterview(id, interviewData);
    } catch (e) {
      console.warn("Backend scheduleCandidateInterview notice (persisted in local store):", e.message);
    }
  }
  return store.candidates.find((c) => String(c.id) === String(id));
}

export async function setCandidateRating(id, rating) {
  const store = getStore();
  store.candidates = store.candidates.map((c) =>
    String(c.id) === String(id) ? { ...c, rating, matchScore: rating * 20 } : c
  );
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCandidateRating(id, rating);
    } catch (e) {
      console.warn("setCandidateRating error:", e.message);
    }
  }
  return store.candidates.find((c) => String(c.id) === String(id));
}

export async function fetchCandidatesPaginated(options = {}) {
  if (getCompanyToken()) {
    try {
      const res = await companyApi.listCompanyCandidates(options);
      const data = res?.data || res?.items || (Array.isArray(res) ? res : []);
      const pagination = res?.pagination || {
        total_items: data.length,
        total_pages: 1,
        page: options.page || 1,
        page_size: options.pageSize || 25,
      };

      const mapped = data.map((c) => ({
        id: c.id,
        jobId: c.job_id || c.jobId,
        jobTitle: c.job_title || c.jobTitle || "",
        name: c.candidate_name || c.name || "Anonymous",
        email: c.candidate_email || c.email || "",
        phone: c.candidate_phone || c.phone || "",
        experienceYears: c.candidate_experience_years || c.experience_years || c.experienceYears || 0,
        educationLevel: c.education_level || c.educationLevel || "Bachelor's Degree",
        appliedDate: c.applied_date || (c.applied_at ? c.applied_at.slice(0, 10) : "") || c.appliedDate,
        stage: c.stage || (c.status ? (c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase()) : "Applied"),
        rating: c.rating || 4,
        matchScore: c.matchScore || (c.rating ? Math.round(c.rating * 20) : (c.match_score || 85)),
        skills: c.candidate_skills || c.skills || [],
        coverLetter: c.cover_letter || c.coverLetter || "",
        resumeUrl: c.resume_url || c.resumeUrl || "",
        resumeFileName: c.resume_url ? c.resume_url.split("/").pop() : (c.resume_file_name || c.resumeFileName || "Resume.pdf"),
        notes: c.recruiter_notes ? [{ id: 1, text: c.recruiter_notes, author: "Recruiter", at: c.applied_at || "" }] : (c.notes || []),
        rejectionTemplateId: c.rejection_template_id || c.rejectionTemplateId,
        rejectionNote: c.rejection_note || c.rejectionNote,
        rejectedAt: c.rejected_at || c.rejectedAt,
      }));

      return {
        candidates: mapped,
        pagination: {
          total: pagination.total_items ?? pagination.total ?? mapped.length,
          totalPages: pagination.total_pages ?? pagination.totalPages ?? 1,
          page: pagination.page || 1,
          pageSize: pagination.page_size || options.pageSize || 25,
          hasNext: pagination.has_next,
          hasPrev: pagination.has_prev,
        }
      };
    } catch (err) {
      console.warn("fetchCandidatesPaginated backend error, falling back to local store:", err.message);
    }
  }

  // Fallback to local store
  const store = getStore();
  let list = (store.initialized ? store.candidates : ensureSeeded().candidates).slice();

  if (options.jobId) {
    list = list.filter((c) => String(c.jobId) === String(options.jobId));
  }
  if (options.stage && options.stage !== "All") {
    list = list.filter((c) => (c.stage || "").toLowerCase() === options.stage.toLowerCase());
  }
  if (options.search) {
    const s = options.search.toLowerCase();
    list = list.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s) ||
        (c.jobTitle || "").toLowerCase().includes(s)
    );
  }
  if (options.minScore) {
    list = list.filter((c) => (c.matchScore || 0) >= options.minScore);
  }
  if (options.minExperience !== undefined && options.minExperience !== null) {
    list = list.filter((c) => (c.experienceYears || 0) >= options.minExperience);
  }
  if (options.maxExperience !== undefined && options.maxExperience !== null) {
    list = list.filter((c) => (c.experienceYears || 0) <= options.maxExperience);
  }

  // Sort
  list.sort((a, b) => {
    if (options.sortBy === "score" || options.sortBy === "rating") {
      return (b.matchScore || 0) - (a.matchScore || 0);
    }
    if (options.sortBy === "experience") {
      return (b.experienceYears || 0) - (a.experienceYears || 0);
    }
    if (options.sortBy === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return (a.appliedDate || "") < (b.appliedDate || "") ? 1 : -1;
  });

  const page = options.page || 1;
  const pageSize = options.pageSize || 25;
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const offset = (page - 1) * pageSize;
  const pagedList = list.slice(offset, offset + pageSize);

  return {
    candidates: pagedList,
    pagination: {
      total,
      totalPages,
      page,
      pageSize,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  };
}

export async function fetchStageCounts(jobId = null) {
  if (getCompanyToken()) {
    try {
      const res = await companyApi.getCompanyCandidateCounts({ jobId });
      if (res?.data) {
        return res.data;
      }
    } catch (e) {
      console.warn("fetchStageCounts backend error, calculating from local store:", e.message);
    }
  }

  // Fallback to local store counts
  const store = getStore();
  let list = (store.initialized ? store.candidates : ensureSeeded().candidates).slice();
  if (jobId) {
    list = list.filter((c) => String(c.jobId) === String(jobId));
  }

  const counts = {
    Total: list.length,
    Applied: 0,
    Screening: 0,
    Shortlisted: 0,
    "Interview Scheduled": 0,
    "Offer Sent": 0,
    Hired: 0,
    Rejected: 0,
  };

  list.forEach((c) => {
    if (counts[c.stage] !== undefined) {
      counts[c.stage]++;
    } else {
      counts.Applied++;
    }
  });

  return counts;
}

// ---- TEAM / INVITATIONS -----------------------------------------------------

export function listTeam() {
  const store = getStore();
  return (store.initialized ? store.team : ensureSeeded().team).slice();
}

export async function updateMemberRole(id, role) {
  const store = getStore();
  const target = (store.team || []).find((m) => String(m.id) === String(id));
  if (target && target.status === "Active") {
    const isSoleAdmin =
      (normalizeRole(target.role) === "company_admin" || target.role === "Company Admin") &&
      (store.team || []).filter(
        (m) => (normalizeRole(m.role) === "company_admin" || m.role === "Company Admin") && m.status === "Active"
      ).length <= 1;
    if (isSoleAdmin && normalizeRole(role) !== "company_admin") {
      throw new Error("Cannot demote the sole active Company Administrator.");
    }
  }
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
  const target = (store.team || []).find((m) => String(m.id) === String(id));
  if (target) {
    const isSoleAdmin =
      (normalizeRole(target.role) === "company_admin" || target.role === "Company Admin") &&
      (store.team || []).filter(
        (m) => (normalizeRole(m.role) === "company_admin" || m.role === "Company Admin") && m.status === "Active"
      ).length <= 1;
    if (isSoleAdmin) {
      throw new Error("Cannot revoke the sole active Company Administrator.");
    }
  }
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
  const raw = (store.initialized ? store.invitations : ensureSeeded().invitations) || [];
  const now = new Date().toISOString().slice(0, 10);
  return raw.map((inv) => {
    if (inv.status === "Pending" && inv.expiry && inv.expiry < now) {
      return { ...inv, status: "Expired" };
    }
    return inv;
  });
}

export async function addInvitation({ email, role, message }) {
  const store = getStore();
  const normalizedEmail = (email || "").trim().toLowerCase();

  // 1. Check if email already belongs to an active team member
  const isExistingMember = (store.team || []).some(
    (m) => (m.email || "").trim().toLowerCase() === normalizedEmail && m.status === "Active"
  );
  if (isExistingMember) {
    throw new Error(`User with email "${email.trim()}" is already an active member of this workspace.`);
  }

  // 2. Check if there is already an active pending invitation
  const hasActiveInvite = (store.invitations || []).some(
    (i) => (i.email || "").trim().toLowerCase() === normalizedEmail && i.status === "Pending"
  );
  if (hasActiveInvite) {
    throw new Error(`An active pending invitation has already been sent to "${email.trim()}". You can resend or revoke it from the table.`);
  }

  let inviteRecord = {
    id: "INV-" + Date.now(),
    email: email.trim(),
    role,
    message: message || "",
    sentDate: new Date().toISOString().slice(0, 10),
    expiry: daysAhead(3),
    status: "Pending",
  };

  if (getCompanyToken()) {
    try {
      const res = await companyApi.inviteTeamMember({ email: email.trim(), role, message });
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
      ? { ...i, sentDate: new Date().toISOString().slice(0, 10), expiry: daysAhead(3), status: "Pending" }
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

function currentEmailTemplates(store) {
  return (
    (store.settings?.pipeline && store.settings.pipeline.emailTemplates) ||
    DEFAULT_EMAIL_TEMPLATES
  );
}

export function listEmailTemplates(category = "all") {
  const store = getStore();
  const all = currentEmailTemplates(store);
  if (!category || category === "all") return all.slice();
  return all.filter((t) => (t.category || "rejection") === category).slice();
}

export function getEmailTemplate(id) {
  const store = getStore();
  const all = currentEmailTemplates(store);
  return all.find((t) => String(t.id) === String(id)) || null;
}

export async function saveEmailTemplate(tpl) {
  const store = getStore();
  let list = currentEmailTemplates(store).slice();
  const isNew = !tpl.id || !list.some((x) => String(x.id) === String(tpl.id));
  const id = isNew ? "TPL-" + Date.now() : tpl.id;
  const record = {
    id,
    title: tpl.title || "Untitled Template",
    category: tpl.category || "rejection",
    subject: tpl.subject || "Thông báo từ {{company_name}}",
    body: tpl.body || "",
    isDefault: Boolean(tpl.isDefault),
    updatedAt: new Date().toISOString(),
  };

  if (record.isDefault) {
    list = list.map((item) =>
      item.category === record.category ? { ...item, isDefault: false } : item
    );
  }

  if (isNew) {
    list.push(record);
  } else {
    list = list.map((item) => (String(item.id) === String(id) ? { ...item, ...record } : item));
  }

  store.settings.pipeline = {
    ...store.settings.pipeline,
    emailTemplates: list,
    rejectionTemplates: list.filter((t) => (t.category || "rejection") === "rejection"),
  };
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ settings: store.settings });
    } catch (e) {}
  }
  return record;
}

export async function deleteEmailTemplate(id) {
  const store = getStore();
  let list = currentEmailTemplates(store).slice();
  list = list.filter((t) => String(t.id) !== String(id));

  store.settings.pipeline = {
    ...store.settings.pipeline,
    emailTemplates: list,
    rejectionTemplates: list.filter((t) => (t.category || "rejection") === "rejection"),
  };
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ settings: store.settings });
    } catch (e) {}
  }
  return list;
}

export async function setDefaultEmailTemplate(id, category) {
  const store = getStore();
  let list = currentEmailTemplates(store).slice();
  list = list.map((t) => {
    if (t.category === category) {
      return { ...t, isDefault: String(t.id) === String(id) };
    }
    return t;
  });

  store.settings.pipeline = {
    ...store.settings.pipeline,
    emailTemplates: list,
    rejectionTemplates: list.filter((t) => (t.category || "rejection") === "rejection"),
  };
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ settings: store.settings });
    } catch (e) {}
  }
  return list;
}

export async function resetEmailTemplatesToDefault() {
  const store = getStore();
  store.settings.pipeline = {
    ...store.settings.pipeline,
    emailTemplates: DEFAULT_EMAIL_TEMPLATES,
    rejectionTemplates: DEFAULT_EMAIL_TEMPLATES.filter((t) => t.category === "rejection"),
  };
  write(store);

  if (getCompanyToken()) {
    try {
      await companyApi.updateCompanyProfile({ settings: store.settings });
    } catch (e) {}
  }
  return DEFAULT_EMAIL_TEMPLATES;
}

export function renderEmailTemplate(templateText, vars = {}) {
  if (!templateText) return "";
  let rendered = templateText;
  const map = {
    "{{candidate_name}}": vars.candidateName || vars.candidate_name || "Nguyễn Văn An",
    "{{job_title}}": vars.jobTitle || vars.job_title || "Senior Software Engineer",
    "{{company_name}}": vars.companyName || vars.company_name || "LàmViec360",
    "{{date}}": vars.date || new Date().toLocaleDateString("vi-VN"),
    "{{interview_date}}": vars.interviewDate || vars.interview_date || "25/11/2026",
    "{{interview_time}}": vars.interviewTime || vars.interview_time || "14:00 (GMT+7)",
    "{{interview_link}}": vars.interviewLink || vars.interview_link || "https://meet.google.com/lv360-meet-xyz",
    "{{interview_location}}": vars.interviewLocation || vars.interview_location || "Phòng họp A, Tầng 8 - Bitexco Financial Tower, TP.HCM",
    "{{sender_name}}": vars.senderName || vars.sender_name || "Nguyễn Thị Mai (HR Manager)",
    "{{rejection_reason}}": vars.rejectionReason || vars.rejection_reason || "Yêu cầu kinh nghiệm chuyên sâu",
    "{{notes}}": vars.notes || "",
  };
  Object.keys(map).forEach((token) => {
    rendered = rendered.split(token).join(map[token]);
  });
  return rendered;
}

// Backwards-compatible rejection template functions
export function listRejectionTemplates() {
  const store = getStore();
  const all = currentEmailTemplates(store);
  return all.filter((t) => (t.category || "rejection") === "rejection").slice();
}

export async function addRejectionTemplate({ title, body, subject }) {
  return saveEmailTemplate({
    title,
    body,
    subject: subject || "Cập nhật về hồ sơ ứng tuyển {{job_title}} tại {{company_name}}",
    category: "rejection",
    isDefault: false,
  });
}

export async function updateRejectionTemplate(id, patch) {
  const tpl = getEmailTemplate(id) || { id, title: "", body: "", category: "rejection" };
  await saveEmailTemplate({ ...tpl, ...patch });
  return listRejectionTemplates();
}

export async function deleteRejectionTemplate(id) {
  await deleteEmailTemplate(id);
  return listRejectionTemplates();
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

export async function requestPasswordReset(email) {
  const store = getStore();
  const targetEmail =
    (email ||
    (typeof window !== "undefined" ? localStorage.getItem("lv360_company_email") : "") ||
    store.company?.email ||
    store.auth?.email || "").trim();

  if (!targetEmail) throw new Error("Work email is required");
  return companyAuth.forgotPassword(targetEmail);
}

export async function verifyPasswordResetOtp({ email, code }) {
  const store = getStore();
  const targetEmail =
    (email ||
    (typeof window !== "undefined" ? localStorage.getItem("lv360_company_email") : "") ||
    store.company?.email ||
    store.auth?.email || "").trim();

  if (!targetEmail) throw new Error("Work email is required");
  if (!code) throw new Error("Verification code is required");
  return companyAuth.verifyResetOtp({ email: targetEmail, code });
}

export async function completePasswordReset({ token, email, code, newPassword }) {
  if (!newPassword) throw new Error("New password is required");
  return companyAuth.resetPassword({
    token,
    email,
    code,
    new_password: newPassword,
  });
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

export function getMockVerificationDocsForCandidate(candidateName = "Candidate") {
  const cleanName = String(candidateName || "Candidate").replace(/\s+/g, "_");
  return [
    {
      id: "DOC-PAYSLIP-1",
      category: "payslip",
      title: "Bảng lương 3 tháng gần nhất (Payslip)",
      file_name: `${cleanName}_Payslip_Q3.pdf`,
      mime_type: "application/pdf",
      size_bytes: 345280,
      is_encrypted: true,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      verified: true,
      period: "Tháng 07 - Tháng 09/2024",
      employer: "Tập đoàn Công nghệ Alpha / Alpha Tech Corp",
      gross_salary: "35,000,000 VND",
      net_salary: "29,850,000 VND",
      bhxh: "2,800,000 VND",
      tax: "2,350,000 VND",
    },
    {
      id: "DOC-RELIEVING-1",
      category: "relieving",
      title: "Thư xác nhận thôi việc (Relieving Letter)",
      file_name: `Relieving_Letter_${cleanName}.pdf`,
      mime_type: "application/pdf",
      size_bytes: 184320,
      is_encrypted: true,
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      verified: true,
      employer: "Công ty Cổ phần Phần mềm V-Soft",
      designation: "Senior Software Engineer",
      tenure: "15/03/2021 – 31/08/2024",
      conduct: "Exemplary professional conduct, all company assets returned",
    },
    {
      id: "DOC-CONTRACT-1",
      category: "contract",
      title: "Hợp đồng lao động trước đây (Prior Contract)",
      file_name: `Employment_Contract_2021_2024.pdf`,
      mime_type: "application/pdf",
      size_bytes: 492000,
      is_encrypted: true,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      verified: true,
      employer: "Công ty Cổ phần Phần mềm V-Soft",
      contract_no: "HDLD-2021/VS-089",
      role: "Kỹ sư Phần mềm Cao cấp",
      type: "Hợp đồng lao động không xác định thời hạn",
    },
    {
      id: "DOC-DEGREE-1",
      category: "certificate",
      title: "Bằng Cử nhân Công nghệ Thông tin & Chứng chỉ",
      file_name: `Degree_Computer_Science_HCMUS.pdf`,
      mime_type: "application/pdf",
      size_bytes: 624500,
      is_encrypted: true,
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      verified: true,
      institution: "Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
      degree: "Cử nhân Công nghệ Thông tin (Chính quy)",
      classification: "Loại Giỏi (Very Good)",
      year: "2019",
    },
  ];
}

export async function getApplicantVerificationDocuments(applicantId, candidateName = "Candidate") {
  if (getCompanyToken()) {
    try {
      const res = await companyApi.getApplicantVerificationDocuments(applicantId);
      if (res?.documents && res.documents.length > 0) {
        return res.documents;
      }
    } catch (e) {
      console.warn("Backend getApplicantVerificationDocuments failed, using fallback:", e.message);
    }
  }
  return getMockVerificationDocsForCandidate(candidateName);
}

export async function downloadApplicantVerificationDocument(applicantId, docId, fallbackFileName) {
  if (getCompanyToken()) {
    return companyApi.downloadApplicantVerificationDocument(applicantId, docId, fallbackFileName);
  }
  throw new Error("Authentication required to download verification documents");
}



export async function exportCandidatesCsv(filters = {}) {
  if (getCompanyToken()) {
    try {
      const csvData = await companyApi.exportCandidatesCsv(filters);
      return csvData;
    } catch (e) {
      console.warn("Backend CSV export failed, generating from store:", e.message);
    }
  }

  // Local CSV generation fallback
  const store = getStore();
  let list = (store.initialized ? store.candidates : ensureSeeded().candidates).slice();
  if (filters.jobId) {
    list = list.filter((c) => String(c.jobId) === String(filters.jobId));
  }
  if (filters.stage && filters.stage !== "All") {
    list = list.filter((c) => (c.stage || "").toLowerCase() === filters.stage.toLowerCase());
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s) ||
        (c.jobTitle || "").toLowerCase().includes(s)
    );
  }
  if (filters.minScore) {
    list = list.filter((c) => (c.matchScore || 0) >= filters.minScore);
  }
  if (filters.minExperience !== undefined && filters.minExperience !== null) {
    list = list.filter((c) => (c.experienceYears || 0) >= filters.minExperience);
  }
  if (filters.maxExperience !== undefined && filters.maxExperience !== null) {
    list = list.filter((c) => (c.experienceYears || 0) <= filters.maxExperience);
  }

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const headers = [
    "Application ID", "Job Title", "Candidate Name", "Email", "Phone",
    "Stage", "Match Score", "Experience (Years)", "Education", "Applied Date"
  ];

  const rows = [headers.join(",")];
  for (const c of list) {
    rows.push([
      escapeCsv(c.id),
      escapeCsv(c.jobTitle),
      escapeCsv(c.name),
      escapeCsv(c.email),
      escapeCsv(c.phone),
      escapeCsv(c.stage),
      escapeCsv(c.matchScore),
      escapeCsv(c.experienceYears),
      escapeCsv(c.educationLevel),
      escapeCsv(c.appliedDate),
    ].join(","));
  }
  return "\uFEFF" + rows.join("\r\n");
}
