"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Check from "../../../components/ds/Check";
import Skeleton from "../../../components/ds/Skeleton";
import Toast, { useToast } from "../../../components/ds/Toast";
import StatusBadge from "../../../components/company/StatusBadge";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
import { getJob, saveJob, deleteJob, getQuota, setJobStatus } from "../../../lib/companyStore";
import { getCompanyJobDetail } from "../../../lib/api/companyApi";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];
const EDU_LEVELS = ["Not required", "High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "PhD"];
const DOC_OPTIONS = ["CV / Resume", "Cover Letter", "Portfolio", "References", "Certifications"];

function getDefaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

const EMPTY = {
  title: "",
  department: "",
  type: "Full-time",
  location: "",
  salaryType: "Gross",
  salaryMin: "",
  salaryMax: "",
  negotiable: false,
  description: "",
  skills: [],
  experience: "",
  education: "Bachelor's Degree",
  deadline: getDefaultDeadline(),
  openUntilClosed: false,
  vacancies: "1",
  documents: ["CV / Resume"],
  attitudeType: "",
  socialType: "",
  personalityType: "",
  overtimeWillingness: "",
  projectWorkReqs: "",
  aiGenerated: false,
  status: "published",
};

/**
 * EMP-FR-015: JD Completion Progress Indicator
 * Strictly evaluates fill rate across discrete tiers: 25% / 50% / 75% / 100%
 */

const EXPERIENCE_CARDS = [
  {
    id: "fresher",
    label: "Fresher",
    labelVi: "Fresher",
    years: "0",
    sliderVal: 0,
    subtitle: "0 yrs · No experience / Intern",
    subtitleVi: "0 năm · Chưa có kinh nghiệm / Thực tập",
    icon: "sprout",
    badge: "Entry",
  },
  {
    id: "0-1",
    label: "0 - 1 Year",
    labelVi: "0 - 1 Năm",
    years: "0-1",
    sliderVal: 1,
    subtitle: "Junior / Early Career",
    subtitleVi: "Khởi đầu sự nghiệp",
    icon: "sparkles",
    badge: "Junior",
  },
  {
    id: "1-3",
    label: "1 - 3 Years",
    labelVi: "1 - 3 Năm",
    years: "1-3",
    sliderVal: 2,
    subtitle: "Associate / Mid-level",
    subtitleVi: "Chuyên viên cơ bản",
    icon: "briefcase",
    badge: "Mid",
  },
  {
    id: "3-5",
    label: "3 - 5 Years",
    labelVi: "3 - 5 Năm",
    years: "3-5",
    sliderVal: 4,
    subtitle: "Experienced Specialist",
    subtitleVi: "Chuyên viên giàu kinh nghiệm",
    icon: "award",
    badge: "Senior",
  },
  {
    id: "5-10",
    label: "5 - 10 Years",
    labelVi: "5 - 10 Năm",
    years: "5-10",
    sliderVal: 7,
    subtitle: "Senior Professional / Lead",
    subtitleVi: "Chuyên gia cao cấp",
    icon: "shield-check",
    badge: "Lead",
  },
  {
    id: "10+",
    label: "10+ Years",
    labelVi: "10+ Năm",
    years: "10+",
    sliderVal: 10,
    subtitle: "Expert / Director / Principal",
    subtitleVi: "Quản lý cấp cao / Giám đốc",
    icon: "crown",
    badge: "Expert",
  },
];

function getActiveExperienceCardId(val) {
  if (val === undefined || val === null || val === "") return null;
  const s = String(val).trim().toLowerCase();
  if (s === "0" || s === "fresher" || s.includes("intern")) return "fresher";
  if (s === "0-1" || s === "1" || s.includes("entry")) return "0-1";
  if (s === "1-3" || s === "2" || s === "3") return "1-3";
  if (s === "3-5" || s === "4" || s === "5") return "3-5";
  if (s === "5-10" || (parseInt(s, 10) >= 6 && parseInt(s, 10) <= 10)) return "5-10";
  if (s === "10+" || parseInt(s, 10) > 10 || s.includes("lead") || s.includes("director")) return "10+";
  return null;
}

function getExperienceSliderValue(val) {
  if (val === undefined || val === null || val === "") return 0;
  const s = String(val).trim().toLowerCase();
  if (s === "0" || s === "fresher") return 0;
  if (s === "0-1") return 1;
  if (s === "1-3") return 2;
  if (s === "3-5") return 4;
  if (s === "5-10") return 7;
  if (s === "10+" || s.includes("+")) return 10;
  const num = parseInt(s, 10);
  return isNaN(num) ? 0 : Math.min(10, Math.max(0, num));
}

function formatExperienceLabel(val, lang) {
  if (val === undefined || val === null || val === "") return lang === "VN" || lang === "VI" ? "Chưa chỉ định" : "Not specified";
  const s = String(val).trim();
  if (s === "0" || s.toLowerCase() === "fresher") return lang === "VN" || lang === "VI" ? "Fresher (0 năm kinh nghiệm)" : "Fresher (0 yrs experience)";
  if (s === "0-1") return lang === "VN" || lang === "VI" ? "0 - 1 Năm kinh nghiệm" : "0 - 1 Year experience";
  if (s === "1-3") return lang === "VN" || lang === "VI" ? "1 - 3 Năm kinh nghiệm" : "1 - 3 Years experience";
  if (s === "3-5") return lang === "VN" || lang === "VI" ? "3 - 5 Năm kinh nghiệm" : "3 - 5 Years experience";
  if (s === "5-10") return lang === "VN" || lang === "VI" ? "5 - 10 Năm kinh nghiệm" : "5 - 10 Years experience";
  if (s === "10+") return lang === "VN" || lang === "VI" ? "Trên 10 Năm kinh nghiệm" : "10+ Years experience";
  return s + " " + (lang === "VN" || lang === "VI" ? "năm kinh nghiệm" : "years experience");
}

function calculateCompletion(f) {
  let hasBasic = Boolean(f.title?.trim() && f.department?.trim() && f.location?.trim());
  let hasTerms = Boolean((f.salaryMin || f.negotiable) && f.type && (f.experience || f.education));
  let hasContent = Boolean(f.description?.trim()?.length >= 30 && f.skills?.length > 0 && (f.deadline || f.openUntilClosed));
  let hasDetails = Boolean(f.vacancies && f.education);

  if (hasBasic && hasTerms && hasContent && hasDetails) return 100;
  if (hasBasic && hasTerms && hasContent) return 75;
  if (hasBasic && (hasTerms || hasContent)) return 50;
  return 25;
}

function normalizeJobData(data) {
  if (!data) return EMPTY;
  const deadlineVal = data.deadline ? String(data.deadline).slice(0, 10) : (data.expires_at ? String(data.expires_at).slice(0, 10) : "");
  return {
    ...EMPTY,
    ...data,
    title: data.title || "",
    department: data.department || "",
    type: data.type || data.job_type || "Full-time",
    location: data.location || data.city || "",
    salaryType: data.salaryType || data.salary_type || "Gross",
    salaryMin: data.salaryMin !== undefined && data.salaryMin !== null ? String(data.salaryMin).split(".")[0] : (data.salary_min ? String(data.salary_min).split(".")[0] : ""),
    salaryMax: data.salaryMax !== undefined && data.salaryMax !== null ? String(data.salaryMax) : (data.salary_max ? String(data.salary_max).split(".")[0] : ""),
    negotiable: Boolean(data.negotiable || data.is_negotiable),
    vacancies: data.vacancies !== undefined && data.vacancies !== null ? String(data.vacancies) : "1",
    education: data.education || "Bachelor's Degree",
    experience: data.experience || data.experience_level || "",
    deadline: deadlineVal || getDefaultDeadline(),
    openUntilClosed: !deadlineVal,
    skills: Array.isArray(data.skills)
      ? data.skills
      : (typeof data.required_skills === "string" ? data.required_skills.split(",").map((s) => s.trim()).filter(Boolean) : []),
    documents: Array.isArray(data.documents)
      ? data.documents
      : (typeof data.documents === "string" ? data.documents.split(",").map((s) => s.trim()).filter(Boolean) : ["CV / Resume"]),
    attitudeType: data.attitudeType || data.attitude_type || "",
    socialType: data.socialType || data.social_type || "",
    personalityType: data.personalityType || data.personality_type || "",
    overtimeWillingness: data.overtimeWillingness || data.overtime_willingness || "",
    projectWorkReqs: data.projectWorkReqs || data.project_work_reqs || "",
    description: data.description || data.jd || "",
    status: (data.status || "published").toLowerCase(),
    aiGenerated: Boolean(data.aiGenerated || data.ai_generated),
  };
}

/**
 * EMP-FR-010: Purely UI & UI functionality only.
 * Intelligently drafts comprehensive JDs based on Job Title + Skills.
 */
function buildAiDraft(title, skills, attempt) {
  const roleTitle = title && title.trim() ? title.trim() : "Team Member";
  const skillList = skills && skills.length
    ? skills.join(", ")
    : "core technical competencies, cross-functional collaboration, and disciplined delivery";

  const drafts = [
    `About the Role:
We are seeking an accomplished and dedicated ${roleTitle} to join our growing workspace in Vietnam. In this role, you will take ownership of strategic initiatives, partner closely with department colleagues, and drive scalable outcomes that delight our clients.

Key Responsibilities:
• Lead end-to-end design, execution, and delivery within the ${roleTitle} domain.
• Collaborate with cross-functional stakeholders to plan, prioritize, and implement key workstreams.
• Maintain high engineering craft and operational excellence across all deliverables.
• Proactively identify bottlenecks, optimize workflows, and uphold best practices.
• Mentor teammates and foster a culture of ownership and continuous improvement.

Requirements & Qualifications:
• Demonstrated hands-on practical experience as a ${roleTitle} or equivalent capacity.
• Strong working knowledge and practical mastery of: ${skillList}.
• Solid problem-solving acumen with acute attention to detail and quality.
• Clear interpersonal and written communication skills (English and Vietnamese).
• Self-starter mindset with adaptability in fast-paced operational environments.

Benefits & Perks:
• Competitive compensation package with annual performance review and 13th-month bonus.
• Comprehensive private medical insurance for employee and dependents.
• Hybrid work flexibility and top-tier workstation equipment.
• Annual learning and certification stipend with structured career progression.`,

    `Role Overview:
Our organization is accelerating growth and looking for an experienced ${roleTitle} to strengthen our core capabilities and spearhead critical customer deliverables.

What You Will Do:
• Architect, implement, and maintain high-impact solutions leveraging ${skillList}.
• Translate business objectives into clear, measurable execution milestones.
• Drive quality benchmarks, peer reviews, and governance standards.
• Work in tandem with cross-disciplinary teammates to solve complex domain challenges.

What We Are Looking For:
• Solid industry background and track record of delivery in ${roleTitle} positions.
• Deep practical proficiency across: ${skillList}.
• Proven ability to handle ambiguity with structured thinking and high velocity.
• Collaborative team spirit and passion for sharing knowledge.

What We Offer:
• Attractive market-leading remuneration (Gross/Net negotiable based on merit).
• Inclusive, forward-thinking workplace culture.
• Central office location with modern collaboration amenities.
• Direct mentorship and cross-border project opportunities.`,

    `Position Summary:
Join our collaborative workplace as a ${roleTitle}. We foster craft, transparency, and innovation, giving you high autonomy to build solutions that matter.

Day-to-Day Impact:
• Own the day-to-day execution and quality standards for this function.
• Utilize ${skillList} to solve challenging operational and strategic problems.
• Keep stakeholders aligned through concise reporting and metrics tracking.
• Continuously integrate modern industry methodologies to raise team velocity.

Candidate Profile:
• Relevant background or equivalent practical track record in this domain.
• Demonstrated hands-on expertise with ${skillList}.
• Strong team-player attitude with dependable follow-through.
• Agility to learn new systems and adapt to organizational growth.

Package & Benefits:
• Competitive base salary with periodic merit-based reviews.
• Full social insurance, healthcare package, and annual leave allowance.
• Annual company trips, celebration bonuses, and team gatherings.`
  ];

  return drafts[Math.min(attempt, drafts.length - 1)];
}

const CARD = "rounded-xl border border-line bg-card p-8 shadow-xs max-md:p-5";
const FORM_GRID = "grid grid-cols-2 gap-4 gap-x-5 max-md:grid-cols-1";
const TEXTAREA = "w-full resize-y rounded-md border-[1.5px] border-line px-3.5 py-[11px] font-body text-base text-ink focus:border-line-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100";
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";
const ACTIONS = "mt-2 flex gap-3 max-sm:flex-col-reverse [&_button]:max-sm:w-full";
const AI_TAG = "inline-flex items-center gap-1 rounded-pill bg-brand-subtle px-2 py-[3px] text-[11px] font-bold tracking-[0.02em] text-brand";
const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(21,23,27,0.55)] p-6 backdrop-blur-xs";
const MODAL = "max-h-[88vh] w-full max-w-[580px] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-line";
const MODAL_HEAD = "mb-3 flex items-center justify-between gap-3 border-b border-line pb-3";
const ICON_BTN = "inline-flex rounded-lg border border-transparent p-1.5 text-muted hover:bg-sunken hover:text-ink cursor-pointer transition-colors";
const HINT = "flex items-start gap-2 rounded-md bg-brand-subtle px-4 py-3 text-sm leading-relaxed text-muted";
const ERRBOX = "flex flex-col items-start gap-2 rounded-md border border-red-200 bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger-fg";

function JobForm({ mode, jobId }) {
  const [lang] = useLang();
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [skillDraft, setSkillDraft] = useState("");
  const [quota, setQuota] = useState(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [viewMode, setViewMode] = useState("edit");
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // EMP-FR-010: Purely UI & UI functionality AI JD state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [aiAttempts, setAiAttempts] = useState(0); // 0 initial, max 2 retries (total 3 attempts)
  const [aiError, setAiError] = useState(false);
  const aiCache = useRef("");

  const [showUpgrade, setShowUpgrade] = useState(false);

  // Session-cache restoration on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("lv360_cached_ai_jd");
        if (cached) aiCache.current = cached;
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    setQuota(getQuota());
    if (mode === "edit" && jobId) {
      const localJob = getJob(jobId);
      if (localJob) {
        setForm(normalizeJobData(localJob));
        setIsLoading(false);
      }

      if (!String(jobId).startsWith("JOB-")) {
        getCompanyJobDetail(jobId)
          .then((res) => {
            const data = res?.data || res;
            if (data && data.id) {
              setForm(normalizeJobData(data));
              setNotFound(false);
            } else if (!localJob) {
              setNotFound(true);
            }
          })
          .catch((err) => {
            console.warn("Could not fetch fresh job from API:", err);
            if (!localJob) setNotFound(true);
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
        if (!localJob) setNotFound(true);
      }
    } else {
      setIsLoading(false);
    }
  }, [mode, jobId]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const addSkill = () => {
    const v = skillDraft.trim();
    if (v && !form.skills.includes(v)) set("skills", [...form.skills, v]);
    setSkillDraft("");
  };

  const toggleDoc = (d) => set("documents", form.documents.includes(d) ? form.documents.filter((x) => x !== d) : [...form.documents, d]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = t(lang, "Job title is required.");
    if (!form.department.trim()) e.department = t(lang, "Department is required.");
    if (!form.location.trim()) e.location = t(lang, "Location is required.");
    if (!form.description.trim()) e.description = t(lang, "A job description is required.");
    // EMP-FR-009: Default 30 days, or open until manually closed
    if (!form.openUntilClosed && !form.deadline) {
      e.deadline = t(lang, "Please set an application deadline or check 'Open until manually closed'.");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const persist = async (targetStatus) => {
    if (isSubmitting) return;
    if (!validate()) {
      setToast(t(lang, "Please fill in the required fields."));
      return;
    }
    const finalStatus = (targetStatus || form.status || "published").toLowerCase();
    if (finalStatus === "published" && quota && quota.remaining <= 0) {
      setShowUpgrade(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const jobData = {
        ...form,
        deadline: form.openUntilClosed ? null : form.deadline,
        description: form.description,
        status: finalStatus,
        ...(mode === "edit" ? { id: jobId } : {}),
      };
      await saveJob(jobData);
      setToast(t(lang, finalStatus === "published" ? "Job published successfully!" : "Draft saved successfully!"));
      setTimeout(() => router.push("/company/jobs"), 700);
    } catch (err) {
      setToast(t(lang, err.message || "Failed to save job"));
      setIsSubmitting(false);
    }
  };

  /**
   * EMP-FR-010: UI-only AI drafting with simulated loading, max 2 retries, and review
   */
  const runAi = () => {
    if (aiAttempts >= 3) return; // 1 initial + max 2 retries = 3 total attempts
    setAiLoading(true);
    setAiError(false);

    setTimeout(() => {
      const attempt = aiAttempts;
      const draftText = buildAiDraft(form.title, form.skills, attempt);
      setAiDraft(draftText);
      setAiAttempts((n) => n + 1);
      setAiLoading(false);
    }, 900);
  };

  const openAi = () => {
    setAiOpen(true);
    if (aiCache.current) {
      setAiDraft(aiCache.current);
    } else if (aiAttempts === 0) {
      runAi();
    }
  };

  const confirmAiDraft = () => {
    aiCache.current = aiDraft;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("lv360_cached_ai_jd", aiDraft);
      } catch (_) {}
    }
    set("description", aiDraft);
    set("aiGenerated", true);
    setAiOpen(false);
    setToast(t(lang, "AI draft applied — please review before saving."));
  };

  const retriesLeft = Math.max(0, 2 - Math.max(0, aiAttempts - 1));
  const completionRate = calculateCompletion(form);

  if (isLoading) {
    return (
      <div className={CARD}>
        <div className="flex flex-col gap-4 py-8">
          <Skeleton width={200} height={28} />
          <Skeleton height={42} />
          <Skeleton height={140} />
          <Skeleton height={42} />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-card px-6 py-14 text-center text-muted">
        <h3 className="mb-2 text-lg font-bold text-ink">{t(lang, "Job not found")}</h3>
        <div className="mt-4">
          <Link href="/company/jobs">
            <Button variant="secondary">{t(lang, "Back to Job Management")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const publicJobUrl = typeof window !== "undefined"
    ? `http://localhost:3001/job-detail/${encodeURIComponent((form.title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + (jobId || "preview"))}`
    : "";

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="mb-5 flex items-center gap-2 text-sm text-faint [&_a]:text-muted">
        <Link href="/company/jobs">{t(lang, "Job Management")}</Link>
        <Icon name="chevron-right" size={14} />
        <span>{mode === "edit" ? t(lang, "Edit Job") : t(lang, "Post New Job")}</span>
      </div>

      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-extrabold text-ink">
            {mode === "edit" ? t(lang, "Edit Job") : t(lang, "Post New Job")}
          </h1>
          <p className="text-sm text-muted">
            {quota && quota.limit !== Infinity
              ? `${t(lang, "Posting quota")}: ${quota.remaining} ${t(lang, "of")} ${quota.limit} ${t(lang, "remaining")}`
              : t(lang, "Quick and streamlined job authoring and publishing.")}
          </p>
        </div>

        {mode === "edit" && (
          <div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1 shadow-2xs">
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${viewMode === "edit" ? "bg-brand text-white shadow-2xs" : "text-muted hover:text-ink"}`}
              onClick={() => setViewMode("edit")}
            >
              <Icon name="pencil" size={13} /> {t(lang, "Edit Form")}
            </button>
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${viewMode === "preview" ? "bg-brand text-white shadow-2xs" : "text-muted hover:text-ink"}`}
              onClick={() => setViewMode("preview")}
            >
              <Icon name="eye" size={13} /> {t(lang, "Preview Job")}
            </button>
          </div>
        )}
      </div>

      {/* EMP-FR-015: Discrete JD Completion Progress Indicator (25% / 50% / 75% / 100%) */}
      <div className="mb-6 rounded-2xl border border-line bg-card p-5 shadow-2xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Icon name="check-circle" size={14} />
            </span>
            <span className="text-sm font-bold text-ink">
              {t(lang, "Completion Progress")}:
            </span>
            <span className="rounded-md bg-sunken px-2 py-0.5 text-xs font-extrabold text-ink">
              {completionRate}%
            </span>
          </div>

          <span className="text-xs font-semibold text-muted">
            {completionRate === 100
              ? t(lang, "Excellent! Job posting has all required details and is ready to publish.")
              : completionRate >= 75
              ? t(lang, "Great progress. Complete all details to reach 100%.")
              : completionRate >= 50
              ? t(lang, "Add description & skills to reach 75%.")
              : t(lang, "Fill in role details & compensation to advance.")}
          </span>
        </div>

        {/* 4-Tier Segmented Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[25, 50, 75, 100].map((tier) => {
            const active = completionRate >= tier;
            return (
              <div key={tier} className="flex flex-col gap-1.5">
                <div
                  className={`h-2 w-full rounded-pill transition-all duration-300 ${
                    active
                      ? tier === 100
                        ? "bg-emerald-500"
                        : tier === 75
                        ? "bg-brand"
                        : tier === 50
                        ? "bg-amber-500"
                        : "bg-blue-500"
                      : "bg-sunken"
                  }`}
                />
                <span className={`text-[11px] font-semibold text-center ${active ? "text-ink font-bold" : "text-faint"}`}>
                  {tier}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Actionable Milestones */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line text-xs">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${form.title && form.department && form.location ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-sunken text-muted"}`}>
            <Icon name={form.title && form.department && form.location ? "check" : "circle"} size={11} /> 25% Title & Location
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${(form.salaryMin || form.negotiable) && form.type ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-sunken text-muted"}`}>
            <Icon name={(form.salaryMin || form.negotiable) && form.type ? "check" : "circle"} size={11} /> 50% Compensation & Terms
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${form.description?.length >= 30 && form.skills?.length > 0 ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-sunken text-muted"}`}>
            <Icon name={form.description?.length >= 30 && form.skills?.length > 0 ? "check" : "circle"} size={11} /> 75% JD & Skills
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${form.vacancies && form.education && (form.deadline || form.openUntilClosed) ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-sunken text-muted"}`}>
            <Icon name={form.vacancies && form.education && (form.deadline || form.openUntilClosed) ? "check" : "circle"} size={11} /> 100% Ready to Publish
          </span>
        </div>
      </div>

      {viewMode === "preview" ? (
        /* Preview Showcase */
        <div className={CARD}>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
            <div>
              <div className="mb-2 flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-ink">{form.title || "Untitled Job"}</h2>
                <StatusBadge kind="job" value={form.status} lang={lang} />
                {form.aiGenerated && (
                  <span className={AI_TAG}>
                    <Icon name="sparkles" size={10} /> {t(lang, "AI Generated")}
                  </span>
                )}
              </div>
              <p className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <Icon name="building-2" size={14} /> {form.department || "General"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icon name="map-pin" size={14} /> {form.location || "Vietnam"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icon name="briefcase" size={14} /> {form.type}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setViewMode("edit")}>
                <Icon name="pencil" size={14} style={{ marginRight: 6 }} /> {t(lang, "Back to Edit")}
              </Button>
            </div>
          </div>

          {/* EMP-FR-014: Social Sharing Links on Published/Preview Job */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-sunken/40 p-4">
            <div className="flex items-center gap-2">
              <Icon name="share-2" size={16} className="text-brand" />
              <span className="text-xs font-bold text-ink">{t(lang, "Share Job Posting")}:</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicJobUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-[#0a66c2] hover:bg-blue-50 no-underline transition-colors"
              >
                <Icon name="linkedin" size={14} /> LinkedIn
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicJobUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-[#1877f2] hover:bg-blue-50 no-underline transition-colors"
              >
                <Icon name="facebook" size={14} /> Facebook
              </a>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(publicJobUrl);
                    setToast(t(lang, "Public job link copied to clipboard!"));
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunken cursor-pointer transition-colors"
              >
                <Icon name="copy" size={14} /> {t(lang, "Copy Link")}
              </button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-sunken p-4 max-sm:grid-cols-1">
            <div>
              <span className="mb-1 block text-xs text-muted">{t(lang, "Salary Range")}</span>
              <strong className="text-sm text-ink">
                {form.negotiable
                  ? t(lang, "Negotiable")
                  : form.salaryMin && form.salaryMax
                  ? `${Number(form.salaryMin).toLocaleString()} – ${Number(form.salaryMax).toLocaleString()} VND (${form.salaryType})`
                  : t(lang, "Negotiable")}
              </strong>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted">{t(lang, "Experience Required")}</span>
              <strong className="text-sm text-ink">{formatExperienceLabel(form.experience, lang)}</strong>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted">{t(lang, "Education Level")}</span>
              <strong className="text-sm text-ink">{form.education || "Bachelor's Degree"}</strong>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted">{t(lang, "Application Deadline")}</span>
              <strong className="text-sm text-ink">{form.openUntilClosed ? t(lang, "Open until manually closed") : form.deadline || "—"}</strong>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted">{t(lang, "Vacancies")}</span>
              <strong className="text-sm text-ink">{form.vacancies || "1"}</strong>
            </div>
          </div>

          {form.skills && form.skills.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-semibold text-ink">{t(lang, "Required Skills")}</h4>
              <div className="flex flex-wrap gap-2">
                {form.skills.map((s) => (
                  <span key={s} className="rounded-full bg-brand-subtle px-3 py-1 text-xs font-semibold text-brand">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink">{t(lang, "Job Description")}</h4>
            <div className="whitespace-pre-wrap rounded-xl border border-line bg-sunken p-4 text-sm leading-relaxed text-ink font-body">
              {form.description || t(lang, "No description provided.")}
            </div>
          </div>
        </div>
      ) : (
        /* Edit Form */
        <div className={CARD}>
          <div className={FORM_GRID}>
            <Input
              label={t(lang, "Job Title")}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              error={errors.title}
              placeholder={t(lang, "e.g. Senior Frontend Engineer")}
            />
            <Input
              label={t(lang, "Department")}
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              error={errors.department}
              placeholder={t(lang, "e.g. Product Engineering")}
            />
            <Select
              label={t(lang, "Job Type")}
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              options={JOB_TYPES.map((x) => ({ value: x, label: t(lang, x) }))}
              placeholder={t(lang, "Select Job Type")}
            />
            <Input
              label={t(lang, "Location")}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              error={errors.location}
              placeholder={t(lang, "e.g. Ho Chi Minh City, Vietnam")}
            />
          </div>

          {/* Salary Section (EMP-FR-009 with Gross/Net and Negotiable toggle) */}
          <div className="mt-5 rounded-xl border border-line bg-sunken/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-sm font-bold text-ink">{t(lang, "Salary Range (VND)")}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">{t(lang, "Salary Type")}:</span>
                <div className="flex rounded-lg border border-line bg-card p-0.5">
                  <button
                    type="button"
                    onClick={() => set("salaryType", "Gross")}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${form.salaryType === "Gross" ? "bg-brand text-white shadow-xs" : "text-muted hover:text-ink"}`}
                  >
                    Gross
                  </button>
                  <button
                    type="button"
                    onClick={() => set("salaryType", "Net")}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${form.salaryType === "Net" ? "bg-brand text-white shadow-xs" : "text-muted hover:text-ink"}`}
                  >
                    Net
                  </button>
                </div>
              </div>
            </div>

            <div className={FORM_GRID}>
              <Input
                label={t(lang, "Minimum Salary (VND)")}
                value={form.salaryMin}
                disabled={form.negotiable}
                onChange={(e) => set("salaryMin", e.target.value.replace(/\D/g, ""))}
                placeholder={t(lang, "e.g. 20000000")}
              />
              <Input
                label={t(lang, "Maximum Salary (VND)")}
                value={form.salaryMax}
                disabled={form.negotiable}
                onChange={(e) => set("salaryMax", e.target.value.replace(/\D/g, ""))}
                placeholder={t(lang, "e.g. 35000000")}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Check
                label={t(lang, "Salary is negotiable")}
                checked={form.negotiable}
                onChange={() => set("negotiable", !form.negotiable)}
              />
              {!form.negotiable && (form.salaryMin || form.salaryMax) && (
                <span className="text-xs font-bold text-brand bg-brand-subtle px-2.5 py-1 rounded-md">
                  {form.salaryMin ? Number(form.salaryMin).toLocaleString() : "0"} – {form.salaryMax ? Number(form.salaryMax).toLocaleString() : "—"} VND ({form.salaryType})
                </span>
              )}
            </div>
          </div>

          {/* Job Description (EMP-FR-009 & EMP-FR-010 AI Generate JD) */}
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-bold text-ink">{t(lang, "Job Description")}</label>
              <div className="flex items-center gap-2.5">
                {form.aiGenerated && (
                  <span className={AI_TAG}>
                    <Icon name="sparkles" size={11} /> {t(lang, "AI Generated")}
                  </span>
                )}
                {/* EMP-FR-010: AI Generate JD Action */}
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-subtle px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/15 cursor-pointer transition-colors"
                  onClick={openAi}
                >
                  <Icon name="sparkles" size={14} /> {t(lang, "AI Generate JD")}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-line focus-within:border-brand focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <div className="flex items-center gap-3.5 border-b border-line bg-sunken/60 px-3.5 py-2 text-xs font-semibold text-muted">
                <span className="font-bold cursor-pointer hover:text-ink">B</span>
                <span className="italic cursor-pointer hover:text-ink">I</span>
                <span className="underline cursor-pointer hover:text-ink">U</span>
                <span className="text-line">•</span>
                <span className="cursor-pointer hover:text-ink flex items-center gap-1">
                  <Icon name="list" size={13} /> Bullets
                </span>
                <span className="cursor-pointer hover:text-ink flex items-center gap-1">
                  <Icon name="link" size={13} /> Link
                </span>
              </div>
              <textarea
                className="min-h-[240px] w-full resize-y border-none p-4 font-body text-sm leading-relaxed text-ink outline-none"
                value={form.description}
                onChange={(e) => {
                  set("description", e.target.value);
                  if (form.aiGenerated) set("aiGenerated", false);
                }}
                placeholder={t(lang, "Describe the role, key responsibilities, requirements, and benefits…")}
              />
            </div>
            {errors.description && <span className="mt-1 text-xs text-danger">{errors.description}</span>}
          </div>

          {/* Required Skills Tag Input (EMP-FR-009) */}
          <div className="mt-5">
            <label className={LABEL}>{t(lang, "Required Skills (Tag Input)")}</label>
            <div className="flex gap-2">
              <Input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder={t(lang, "Type skill (e.g. React, Python) and press Enter")}
              />
              <Button type="button" variant="secondary" onClick={addSkill}>
                {t(lang, "Add")}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-pill bg-brand-subtle py-1 pl-3 pr-1.5 text-xs font-bold text-brand shadow-2xs">
                  {s}
                  <button
                    type="button"
                    className="flex items-center rounded-full p-0.5 hover:bg-black/10 cursor-pointer"
                    aria-label={t(lang, "Remove") + " " + s}
                    onClick={() => set("skills", form.skills.filter((x) => x !== s))}
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Experience Cards & Fine-tuning Selector (0 - 10+ Years) */}
          <div className="mt-6 rounded-xl border border-line bg-card p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 mb-3.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  {lang === "VN" || lang === "VI" ? "Yêu cầu kinh nghiệm làm việc" : "Experience Required (0 – 10+ Years)"}
                </label>
                <p className="text-xs text-faint mt-0.5">
                  {lang === "VN" || lang === "VI"
                    ? "Chọn thẻ cấp bậc kinh nghiệm phù hợp hoặc trượt để tùy chỉnh số năm chính xác"
                    : "Select a preset experience card or use the slider for custom years"}
                </p>
              </div>

              {form.experience !== "" && (
                <div className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                  <Icon name="check-circle" size={13} />
                  <span>{formatExperienceLabel(form.experience, lang)}</span>
                </div>
              )}
            </div>

            {/* 6 Preset Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
              {EXPERIENCE_CARDS.map((card) => {
                const activeCardId = getActiveExperienceCardId(form.experience);
                const isSelected = activeCardId === card.id;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => set("experience", card.years)}
                    className={`group relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand bg-brand/5 shadow-xs ring-2 ring-brand/20 text-ink"
                        : "border-line bg-card hover:border-slate-300 hover:bg-sunken/40 text-muted hover:text-ink"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1 mb-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          isSelected ? "bg-brand text-white" : "bg-sunken text-muted group-hover:text-brand"
                        }`}
                      >
                        <Icon name={card.icon} size={15} />
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-brand/15 text-brand font-extrabold" : "bg-sunken text-faint"
                        }`}
                      >
                        {card.badge}
                      </span>
                    </div>

                    <strong className="text-xs font-bold block mb-0.5">
                      {lang === "VN" || lang === "VI" ? card.labelVi : card.label}
                    </strong>
                    <span className="text-[11px] text-faint leading-tight block">
                      {lang === "VN" || lang === "VI" ? card.subtitleVi : card.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Fine-Tuning Slider (0 to 10+ Years) & Exact Numeric Input */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-line/70 bg-sunken/30 rounded-lg p-3">
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center justify-between text-xs font-semibold text-muted mb-1.5">
                  <span>{lang === "VN" || lang === "VI" ? "Thanh trượt năm kinh nghiệm (0 – 10+ năm)" : "Fine-tune Experience Slider (0 – 10+ yrs)"}</span>
                  <span className="font-extrabold text-brand">
                    {getExperienceSliderValue(form.experience) >= 10 ? "10+ years" : getExperienceSliderValue(form.experience) + " years"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={getExperienceSliderValue(form.experience)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val === 0) set("experience", "0");
                    else if (val === 1) set("experience", "0-1");
                    else if (val >= 10) set("experience", "10+");
                    else set("experience", String(val));
                  }}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-faint font-medium px-0.5 mt-1">
                  <span>0 (Fresher)</span>
                  <span>1 yr</span>
                  <span>3 yrs</span>
                  <span>5 yrs</span>
                  <span>7 yrs</span>
                  <span>10+ yrs</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted font-medium">
                  {lang === "VN" || lang === "VI" ? "Hoặc nhập số năm:" : "Or custom years:"}
                </span>
                <input
                  type="text"
                  value={form.experience}
                  onChange={(e) => set("experience", e.target.value.replace(/[^0-9+-]/g, ""))}
                  placeholder="e.g. 3"
                  className="h-8 w-20 rounded-md border border-line bg-card px-2.5 text-center text-xs font-bold text-ink focus:border-brand focus:outline-none"
                />
                <span className="text-xs text-muted">{lang === "VN" || lang === "VI" ? "năm" : "years"}</span>
              </div>
            </div>
          </div>

          {/* Education, Deadline, Vacancies Grid */}
          <div className={`${FORM_GRID} mt-5`}>
            <Select
              label={t(lang, "Education Level")}
              value={form.education}
              onChange={(e) => set("education", e.target.value)}
              options={EDU_LEVELS.map((x) => ({ value: x, label: t(lang, x) }))}
              placeholder="Select Education"
            />

            <div>
              <Input
                label={t(lang, "Application Deadline (Default: 30 days)")}
                type="date"
                disabled={form.openUntilClosed}
                value={form.openUntilClosed ? "" : form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
                error={errors.deadline}
              />
              <div className="mt-1.5">
                <Check
                  label={t(lang, "No fixed deadline (open until manually closed)")}
                  checked={form.openUntilClosed}
                  onChange={() => {
                    set("openUntilClosed", !form.openUntilClosed);
                    if (!form.openUntilClosed) set("deadline", "");
                    else set("deadline", getDefaultDeadline());
                  }}
                />
              </div>
            </div>

            <Input
              label={t(lang, "Vacancies (number of positions)")}
              value={form.vacancies}
              onChange={(e) => set("vacancies", e.target.value.replace(/\D/g, ""))}
              placeholder="1"
            />

            <Select
              label={t(lang, "Status")}
              value={form.status || "published"}
              onChange={(e) => set("status", e.target.value)}
              placeholder="Select status"
              options={[
                { value: "published", label: t(lang, "Published") },
                { value: "draft", label: t(lang, "Draft") },
              ]}
            />
          </div>

          {/* Required Verification Documents */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-ink">{t(lang, "Required Candidate Documents (PDPD Compliant)")}</label>
            <div className="flex flex-wrap gap-4">
              {DOC_OPTIONS.map((d) => (
                <Check key={d} label={t(lang, d)} checked={form.documents.includes(d)} onChange={() => toggleDoc(d)} />
              ))}
            </div>
          </div>

          {/* Quota Notice */}
          {quota && quota.limit !== Infinity && (
            <p className={`${HINT} mt-5`}>
              <Icon name="info" size={16} style={{ color: "var(--color-brand)", marginTop: 2 }} />
              <span>
                {t(lang, "Publishing this job uses 1 of your")} {quota.limit} {t(lang, "free postings.")} {quota.remaining} {t(lang, "remaining.")}
              </span>
            </p>
          )}

          {/* Action Bar (EMP-FR-011 Draft vs Published & EMP-FR-013 sub-2-minute posting) */}
          <div className={`${ACTIONS} mt-8 flex flex-wrap items-center justify-between border-t border-line pt-5`}>
            <div className="flex gap-3">
              <Button variant="secondary" disabled={isSubmitting} onClick={() => persist("draft")}>
                <Icon name="file-text" size={14} style={{ marginRight: 6 }} />
                {t(lang, isSubmitting ? "Saving..." : "Save as Draft")}
              </Button>
              <Button variant="primary" disabled={isSubmitting} onClick={() => persist("published")}>
                <Icon name="check" size={14} style={{ marginRight: 6 }} />
                {t(lang, isSubmitting ? "Publishing..." : "Publish Job")}
              </Button>
            </div>

            {mode === "edit" && (
              <Button
                variant="danger"
                disabled={isSubmitting}
                onClick={async () => {
                  if (window.confirm(t(lang, "Are you sure you want to delete this job posting? This action cannot be undone."))) {
                    try {
                      setIsSubmitting(true);
                      await deleteJob(jobId);
                      setToast(t(lang, "Job deleted successfully"));
                      setTimeout(() => router.push("/company/jobs"), 600);
                    } catch (err) {
                      setToast(t(lang, err?.message || "Failed to delete job"));
                      setIsSubmitting(false);
                    }
                  }
                }}
              >
                <Icon name="trash" size={14} style={{ marginRight: 6 }} />
                {t(lang, "Delete Job")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* EMP-FR-010: AI Generate JD Modal (UI & UI functionality only, max 2 retries, cached) */}
      {aiOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "AI Job Description")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="flex items-center gap-2 text-base font-bold text-ink">
                <Icon name="sparkles" size={16} className="text-brand" /> {t(lang, "AI Job Description Generator")}
              </strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setAiOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-xs text-muted mb-4">
              {t(lang, "Generated dynamically from your Job Title and Required Skills. Human review and confirmation are required before saving.")}
            </p>

            {aiLoading ? (
              <div className="rounded-2xl border border-dashed border-line bg-card px-5 py-12 text-center text-muted">
                <Icon name="loader" size={26} className="animate-spin text-brand mx-auto mb-3" />
                <p className="text-sm font-semibold text-ink">{t(lang, "Drafting tailored JD with AI…")}</p>
                <span className="text-xs text-muted">{t(lang, "Synthesizing responsibilities, qualifications, and benefits.")}</span>
              </div>
            ) : aiError ? (
              <div className={ERRBOX} role="alert">
                <span>{t(lang, "AI generation simulation encountered an issue. You can retry or write manually.")}</span>
                {retriesLeft > 0 && (
                  <Button variant="secondary" size="sm" onClick={runAi}>
                    {t(lang, "Retry")} ({retriesLeft} {t(lang, "left")})
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={AI_TAG}>
                      <Icon name="sparkles" size={10} /> {t(lang, "AI Generated Draft")}
                    </span>
                    <span className="text-xs font-semibold text-faint">
                      {t(lang, "Retries remaining:")} <strong className="text-ink">{retriesLeft} / 2</strong>
                    </span>
                  </div>
                  <textarea
                    className={`${TEXTAREA} min-h-[260px] text-xs leading-relaxed`}
                    value={aiDraft}
                    onChange={(e) => setAiDraft(e.target.value)}
                  />
                </div>

                <div className={`${ACTIONS} mt-5 flex items-center justify-between`}>
                  {retriesLeft > 0 ? (
                    <Button variant="secondary" size="sm" onClick={runAi}>
                      <Icon name="refresh-cw" size={13} style={{ marginRight: 6 }} />
                      {t(lang, "Regenerate Draft")} ({retriesLeft} {t(lang, "left")})
                    </Button>
                  ) : (
                    <span className="text-xs text-faint font-medium">
                      {t(lang, "Maximum 2 retries reached for this session.")}
                    </span>
                  )}

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setAiOpen(false)}>
                      {t(lang, "Cancel")}
                    </Button>
                    <Button variant="primary" size="sm" onClick={confirmAiDraft} disabled={!aiDraft.trim()}>
                      <Icon name="check" size={14} style={{ marginRight: 6 }} />
                      {t(lang, "Use This Draft")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Limit Modal */}
      {showUpgrade && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Upgrade required")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-base font-bold text-ink">{t(lang, "You've reached your free posting limit")}</strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setShowUpgrade(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="text-sm text-muted">
              {t(lang, "Freemium includes a limited number of active job postings. Upgrade to publish more, or save this job as a draft for now.")}
            </p>
            <div className={`${ACTIONS} mt-6`}>
              <Button variant="secondary" onClick={() => { setShowUpgrade(false); persist("draft"); }}>
                {t(lang, "Save as Draft")}
              </Button>
              <Link href="/company/billing">
                <Button variant="primary">{t(lang, "See Plans")}</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast} />
    </>
  );
}

export default function JobFormClient(props) {
  return (
    <RequirePermission action="jobs.manage">
      <JobForm {...props} />
    </RequirePermission>
  );
}
