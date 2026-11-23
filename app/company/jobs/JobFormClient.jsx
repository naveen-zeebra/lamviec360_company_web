"use client";
import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
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
import { useMasterData, DEFAULT_MASTER_DATA } from "../../../lib/masterData";
import { getJob, saveJob, deleteJob, getQuota, setJobStatus } from "../../../lib/companyStore";
import { getCompanyJobDetail } from "../../../lib/api/companyApi";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];
const EDU_LEVELS = ["Not required", "High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "PhD"];

const QUESTION_TEMPLATES = [
  {
    label: "Work Authorization",
    question: "Are you legally authorized to work in Vietnam?",
    type: "yes_no",
    required: true,
    options: ["Yes", "No"],
  },
  {
    label: "Years of Experience",
    question: "How many years of relevant professional experience do you have for this role?",
    type: "number",
    required: true,
    options: [],
  },
  {
    label: "On-site / Hybrid Availability",
    question: "Are you able to commute and work on-site/hybrid at our designated office?",
    type: "yes_no",
    required: false,
    options: ["Yes", "No"],
  },
  {
    label: "Notice Period",
    question: "What is your earliest possible start date or notice period (in days)?",
    type: "number",
    required: false,
    options: [],
  },
  {
    label: "Highest Education",
    question: "Which best describes your highest completed level of education?",
    type: "choice",
    required: false,
    options: ["High School", "Associate Degree", "Bachelor's Degree", "Master's Degree or PhD"],
  },
];


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
  questions: [],
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
  if (s === "10+" || s.includes("+") || parseInt(s, 10) >= 10 || s.includes("lead") || s.includes("director")) return "10+";
  if (s === "5-10" || (parseInt(s, 10) >= 6 && parseInt(s, 10) < 10)) return "5-10";
  if (s === "3-5" || s === "4" || s === "5") return "3-5";
  if (s === "1-3" || s === "2" || s === "3") return "1-3";
  if (s === "0-1" || s === "1" || s.includes("entry")) return "0-1";
  if (s === "0" || s === "fresher" || s.includes("intern")) return "fresher";
  return null;
}

function getExperienceSliderValue(val) {
  if (val === undefined || val === null || val === "") return 0;
  const s = String(val).trim().toLowerCase();
  if (s === "10+" || s.includes("+") || parseInt(s, 10) >= 10) return 10;
  if (s === "5-10" || (parseInt(s, 10) >= 6 && parseInt(s, 10) < 10)) return 7;
  if (s === "3-5" || s === "4" || s === "5") return 4;
  if (s === "1-3" || s === "2" || s === "3") return 2;
  if (s === "0-1" || s === "1") return 1;
  if (s === "0" || s === "fresher") return 0;
  const num = parseInt(s, 10);
  return isNaN(num) ? 0 : Math.min(10, Math.max(0, num));
}

function formatExperienceLabel(val, lang) {
  if (val === undefined || val === null || val === "") return lang === "VN" || lang === "VI" ? "Chưa chỉ định" : "Not specified";
  const s = String(val).trim();
  if (s === "10+" || s.includes("+") || parseInt(s, 10) >= 10) return lang === "VN" || lang === "VI" ? "Trên 10 Năm kinh nghiệm" : "10+ Years experience";
  if (s === "5-10" || (parseInt(s, 10) >= 6 && parseInt(s, 10) < 10)) return lang === "VN" || lang === "VI" ? "5 - 10 Năm kinh nghiệm" : "5 - 10 Years experience";
  if (s === "3-5" || s === "4" || s === "5") return lang === "VN" || lang === "VI" ? "3 - 5 Năm kinh nghiệm" : "3 - 5 Years experience";
  if (s === "1-3" || s === "2" || s === "3") return lang === "VN" || lang === "VI" ? "1 - 3 Năm kinh nghiệm" : "1 - 3 Years experience";
  if (s === "0-1" || s === "1") return lang === "VN" || lang === "VI" ? "0 - 1 Năm kinh nghiệm" : "0 - 1 Year experience";
  if (s === "0" || s.toLowerCase() === "fresher") return lang === "VN" || lang === "VI" ? "Fresher (0 năm kinh nghiệm)" : "Fresher (0 yrs experience)";
  return s + " " + (lang === "VN" || lang === "VI" ? "năm kinh nghiệm" : "years experience");
}

function formatVndNumber(val) {
  if (val === undefined || val === null || val === "") return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function parseVndNumber(val) {
  if (val === undefined || val === null || val === "") return "";
  return String(val).replace(/,/g, "");
}

function calculateCompletion(f) {
  if (!f) return 0;
  const hasBasic = Boolean(f.title?.trim() && f.title?.trim().length <= 100 && f.department?.trim() && f.location?.trim());
  const hasTerms = Boolean((f.salaryMin || f.negotiable) && f.type);
  const hasContent = Boolean(f.description?.trim()?.length >= 200 && f.skills?.length > 0);
  const hasPublishReady = Boolean(hasBasic && hasTerms && hasContent && f.vacancies && f.education && (f.deadline || f.openUntilClosed));

  let score = 0;
  if (hasBasic) score += 25;
  if (hasTerms) score += 25;
  if (hasContent) score += 25;
  if (hasPublishReady) score += 25;
  return score;
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
    salaryMin: data.salaryMin !== undefined && data.salaryMin !== null ? formatVndNumber(String(data.salaryMin).split(".")[0]) : (data.salary_min ? formatVndNumber(String(data.salary_min).split(".")[0]) : ""),
    salaryMax: data.salaryMax !== undefined && data.salaryMax !== null ? formatVndNumber(String(data.salaryMax).split(".")[0]) : (data.salary_max ? formatVndNumber(String(data.salary_max).split(".")[0]) : ""),
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
    questions: Array.isArray(data.questions)
      ? data.questions
      : (typeof data.questions === "string" && data.questions.trim()
          ? (() => { try { return JSON.parse(data.questions); } catch (e) { return []; } })()
          : []),
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
  const { jobTypes, departments, locations } = useMasterData();
  const router = useRouter();
  const [initialData, setInitialData] = useState(EMPTY);
  const [skillDraft, setSkillDraft] = useState("");
  const [quota, setQuota] = useState(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [viewMode, setViewMode] = useState("edit");
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedCriteria, setCheckedCriteria] = useState({
    attitude: false,
    social: false,
    personality: false,
    overtime: false,
    project: false,
  });

  useEffect(() => {
    if (initialData) {
      setCheckedCriteria({
        attitude: Boolean(initialData.attitudeType),
        social: Boolean(initialData.socialType),
        personality: Boolean(initialData.personalityType),
        overtime: Boolean(initialData.overtimeWillingness),
        project: Boolean(initialData.projectWorkReqs),
      });
    }
  }, [initialData]);

  // Formik Validation Schema using Yup
  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .trim()
      .required(t(lang, "Job title is required."))
      .max(100, lang === "VN" || lang === "VI" ? "Tiêu đề công việc tối đa 100 ký tự." : "Job title must not exceed 100 characters."),
    department: Yup.string().trim().required(t(lang, "Department is required.")),
    type: Yup.string().required(t(lang, "Job type is required.")),
    location: Yup.string().trim().required(t(lang, "Location is required.")),
    description: Yup.string()
      .trim()
      .required(t(lang, "A job description is required."))
      .min(200, (param) => lang === "VN" || lang === "VI"
        ? `Mô tả công việc phải có ít nhất 200 ký tự (hiện có ${param.value?.length || 0} ký tự).`
        : `Job description must be at least 200 characters (currently ${param.value?.length || 0} characters).`),
    deadline: Yup.string().when("openUntilClosed", {
      is: false,
      then: (schema) => schema.required(t(lang, "Please set an application deadline or check 'Open until manually closed'.")),
      otherwise: (schema) => schema.notRequired(),
    }),
    salaryMin: Yup.mixed()
      .test("salary-min-valid", t(lang, "Minimum salary cannot be negative."), function (val) {
        if (this.parent.negotiable || val === "" || val === undefined || val === null) return true;
        const num = Number(parseVndNumber(val));
        return !isNaN(num) && num >= 0;
      })
      .test("salary-min-lte-max", t(lang, "Minimum salary cannot be greater than maximum salary."), function (val) {
        if (this.parent.negotiable || val === "" || val === undefined || val === null) return true;
        const max = this.parent.salaryMax;
        if (max === "" || max === undefined || max === null) return true;
        const numMin = Number(parseVndNumber(val));
        const numMax = Number(parseVndNumber(max));
        if (isNaN(numMin) || isNaN(numMax) || numMin < 0 || numMax < 0) return true;
        return numMin <= numMax;
      }),
    salaryMax: Yup.mixed()
      .test("salary-max-valid", t(lang, "Maximum salary cannot be negative."), function (val) {
        if (this.parent.negotiable || val === "" || val === undefined || val === null) return true;
        const num = Number(parseVndNumber(val));
        return !isNaN(num) && num >= 0;
      })
      .test("salary-max-gte-min", t(lang, "Maximum salary must be greater than or equal to minimum salary."), function (val) {
        if (this.parent.negotiable || val === "" || val === undefined || val === null) return true;
        const min = this.parent.salaryMin;
        if (min === "" || min === undefined || min === null) return true;
        const numMin = Number(parseVndNumber(min));
        const numMax = Number(parseVndNumber(val));
        if (isNaN(numMin) || isNaN(numMax) || numMin < 0 || numMax < 0) return true;
        return numMax >= numMin;
      }),
  });

  const formik = useFormik({
    initialValues: initialData,
    enableReinitialize: true,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      // Submission routed via persist()
    },
  });

  const form = formik.values;
  const errors = formik.errors;
  const set = (k, v) => formik.setFieldValue(k, v);

  // EMP-FR-010: Purely UI & UI functionality AI JD state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [aiAttempts, setAiAttempts] = useState(0); // 0 initial, max 2 retries (total 3 attempts)
  const [aiError, setAiError] = useState(false);
  const aiCache = useRef("");
  const textareaRef = useRef(null);

  const applyFormat = (formatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const fullText = form.description || "";
    const selected = fullText.substring(start, end);

    let replacement = "";
    let cursorOffset = 0;
    let newCursorPos = start;

    switch (formatType) {
      case "bold": {
        const text = selected || (lang === "VN" || lang === "VI" ? "Văn bản in đậm" : "Bold text");
        replacement = `**${text}**`;
        newCursorPos = selected ? start + replacement.length : start + 2;
        cursorOffset = selected ? 0 : text.length;
        break;
      }
      case "italic": {
        const text = selected || (lang === "VN" || lang === "VI" ? "Văn bản in nghiêng" : "Italic text");
        replacement = `*${text}*`;
        newCursorPos = selected ? start + replacement.length : start + 1;
        cursorOffset = selected ? 0 : text.length;
        break;
      }
      case "underline": {
        const text = selected || (lang === "VN" || lang === "VI" ? "Văn bản gạch chân" : "Underlined text");
        replacement = `<u>${text}</u>`;
        newCursorPos = selected ? start + replacement.length : start + 3;
        cursorOffset = selected ? 0 : text.length;
        break;
      }
      case "h2": {
        const text = selected || (lang === "VN" || lang === "VI" ? "Tiêu đề mục lớn" : "Main Heading");
        replacement = `\n## ${text}\n`;
        newCursorPos = start + replacement.length;
        break;
      }
      case "h3": {
        const text = selected || (lang === "VN" || lang === "VI" ? "Tiêu đề mục nhỏ" : "Subheading");
        replacement = `\n### ${text}\n`;
        newCursorPos = start + replacement.length;
        break;
      }
      case "bullets": {
        if (selected) {
          const lines = selected.split("\n");
          replacement = lines
            .map((l) => (l.trim().startsWith("•") || l.trim().startsWith("-") ? l : `• ${l}`))
            .join("\n");
        } else {
          replacement = lang === "VN" || lang === "VI"
            ? `\n• Trách nhiệm hoặc yêu cầu 1\n• Trách nhiệm hoặc yêu cầu 2\n`
            : `\n• Key responsibility or requirement 1\n• Key responsibility or requirement 2\n`;
        }
        newCursorPos = start + replacement.length;
        break;
      }
      case "numbered": {
        if (selected) {
          const lines = selected.split("\n");
          replacement = lines.map((l, i) => `${i + 1}. ${l.replace(/^\d+\.\s*/, "")}`).join("\n");
        } else {
          replacement = lang === "VN" || lang === "VI"
            ? `\n1. Bước hoặc nhiệm vụ 1\n2. Bước hoặc nhiệm vụ 2\n`
            : `\n1. Step or task 1\n2. Step or task 2\n`;
        }
        newCursorPos = start + replacement.length;
        break;
      }
      case "quote": {
        const text = selected || (lang === "VN" || lang === "VI" ? "Đoạn trích dẫn hoặc lưu ý đặc biệt" : "Important quote or note");
        replacement = `\n> ${text}\n`;
        newCursorPos = start + replacement.length;
        break;
      }
      case "link": {
        const url = prompt(lang === "VN" || lang === "VI" ? "Nhập địa chỉ liên kết (URL):" : "Enter URL:", "https://");
        if (!url) return;
        const text = selected || (lang === "VN" || lang === "VI" ? "Tên liên kết" : "Link text");
        replacement = `[${text}](${url})`;
        newCursorPos = start + replacement.length;
        break;
      }
      default:
        return;
    }

    const nextText = fullText.substring(0, start) + replacement + fullText.substring(end);
    set("description", nextText);
    if (form.aiGenerated) set("aiGenerated", false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        if (cursorOffset > 0) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos + cursorOffset);
        } else {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }
    }, 10);
  };

  const [showUpgrade, setShowUpgrade] = useState(false);

  // Session-cache restoration on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("lv360_cached_ai_jd");
        if (cached) aiCache.current = cached;
      } catch (_) { }
    }
  }, []);

  useEffect(() => {
    setQuota(getQuota());
    if (mode === "edit" && jobId) {
      const localJob = getJob(jobId);
      if (localJob) {
        setInitialData(normalizeJobData(localJob));
        setIsLoading(false);
      }

      if (!String(jobId).startsWith("JOB-")) {
        getCompanyJobDetail(jobId)
          .then((res) => {
            const data = res?.data || res;
            if (data && data.id) {
              setInitialData(normalizeJobData(data));
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

  const addSkill = () => {
    const v = skillDraft.trim();
    if (v && !form.skills.includes(v)) set("skills", [...form.skills, v]);
    setSkillDraft("");
  };

  const addQuestion = (template) => {
    const newQ = template
      ? {
          id: "q_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          question: template.question,
          type: template.type,
          required: Boolean(template.required),
          options: Array.isArray(template.options) ? [...template.options] : [],
        }
      : {
          id: "q_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          question: "",
          type: "text",
          required: false,
          options: [],
        };
    set("questions", [...(form.questions || []), newQ]);
  };

  const updateQuestion = (index, patch) => {
    const list = [...(form.questions || [])];
    list[index] = { ...list[index], ...patch };
    set("questions", list);
  };

  const removeQuestion = (index) => {
    const list = [...(form.questions || [])];
    list.splice(index, 1);
    set("questions", list);
  };

  const moveQuestion = (index, dir) => {
    const list = [...(form.questions || [])];
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    set("questions", list);
  };

  const addOptionToQuestion = (qIndex, optVal) => {
    const val = (optVal || "").trim();
    if (!val) return;
    const q = (form.questions || [])[qIndex];
    if (!q) return;
    const options = Array.isArray(q.options) ? [...q.options] : [];
    if (!options.includes(val)) {
      options.push(val);
      updateQuestion(qIndex, { options });
    }
  };

  const removeOptionFromQuestion = (qIndex, optIndex) => {
    const q = (form.questions || [])[qIndex];
    if (!q) return;
    const options = Array.isArray(q.options) ? [...q.options] : [];
    options.splice(optIndex, 1);
    updateQuestion(qIndex, { options });
  };

  const toggleCriterion = (key, formField) => {
    setCheckedCriteria((prev) => {
      const nextVal = !prev[key];
      if (!nextVal) {
        set(formField, "");
      }
      return { ...prev, [key]: nextVal };
    });
  };

  const persist = async (targetStatus) => {
    if (isSubmitting) return;

    // Validate with Formik
    const formErrors = await formik.validateForm();
    if (Object.keys(formErrors).length > 0) {
      formik.setTouched(
        Object.keys(formErrors).reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
      );
      if (formErrors.salaryMin || formErrors.salaryMax) {
        setToast(formErrors.salaryMin || formErrors.salaryMax);
      } else {
        setToast(t(lang, "Please fill in all required fields."));
      }
      if (typeof document !== "undefined") {
        setTimeout(() => {
          const firstErr = document.querySelector(".border-danger, textarea.border-danger");
          if (firstErr) {
            firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
            firstErr.focus?.();
          }
        }, 100);
      }
      return;
    }
    const finalStatus = (targetStatus || form.status || "published").toLowerCase();
    if (finalStatus === "published" && quota && quota.remaining <= 0) {
      setShowUpgrade(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const rawMin = parseVndNumber(form.salaryMin);
      const rawMax = parseVndNumber(form.salaryMax);
      const jobData = {
        ...form,
        salaryMin: rawMin ? Number(rawMin) : null,
        salaryMax: rawMax ? Number(rawMax) : null,
        deadline: form.openUntilClosed ? null : form.deadline,
        expires_at: form.openUntilClosed ? null : form.deadline,
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
      } catch (_) { }
    }
    set("description", aiDraft);
    set("aiGenerated", true);
    setAiOpen(false);
    setToast(t(lang, "AI draft applied — please review before saving."));
  };

  const retriesLeft = Math.max(0, 2 - Math.max(0, aiAttempts - 1));

  const locationList = locations && locations.length > 0 ? locations : (DEFAULT_MASTER_DATA.locations || [
    "Ho Chi Minh City",
    "Ha Noi",
    "Da Nang",
    "Hai Phong",
    "Can Tho",
    "Remote",
  ]);
  const locationOptions = Array.from(new Set([
    ...(form.location ? [form.location] : []),
    ...locationList,
  ])).map((l) => ({ value: l, label: t(lang, l) }));

  const typeList = jobTypes && jobTypes.length > 0 ? jobTypes : JOB_TYPES;
  const jobTypeOptions = Array.from(new Set([
    ...(form.type ? [form.type] : []),
    ...typeList,
  ])).map((x) => ({ value: x, label: t(lang, x) }));

  const completionRate = calculateCompletion(form);
  const milestone1 = Boolean(form.title?.trim() && form.title?.trim().length <= 100 && form.department?.trim() && form.location?.trim());
  const milestone2 = Boolean((form.salaryMin || form.negotiable) && form.type);
  const milestone3 = Boolean(form.description?.trim()?.length >= 200 && form.skills?.length > 0);
  const milestone4 = completionRate === 100;

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
                  className={`h-2 w-full rounded-pill transition-all duration-300 ${active
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
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${milestone1 ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-sunken text-muted"}`}>
            <Icon name={milestone1 ? "check" : "circle"} size={11} /> 25% Title & Location
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${milestone2 ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-sunken text-muted"}`}>
            <Icon name={milestone2 ? "check" : "circle"} size={11} /> 50% Compensation & Terms
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${milestone3 ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-sunken text-muted"}`}>
            <Icon name={milestone3 ? "check" : "circle"} size={11} /> 75% JD (Min 200 chars) & Skills
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${milestone4 ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-sunken text-muted"}`}>
            <Icon name={milestone4 ? "check" : "circle"} size={11} /> 100% Ready to Publish
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
                  : form.salaryMin || form.salaryMax
                    ? `${form.salaryMin || "0"} – ${form.salaryMax || "—"} VND (${form.salaryType})`
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

          {/* Selection Criteria Preview */}
          {(form.attitudeType || form.socialType || form.personalityType || form.overtimeWillingness || form.projectWorkReqs) && (
            <div className="mt-6 rounded-xl border border-line bg-sunken/40 p-4">
              <h4 className="mb-3 text-sm font-bold text-ink flex items-center gap-2">
                <Icon name="user-check" size={16} className="text-brand" />
                {t(lang, "Selection Criteria & Work Culture")}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs max-sm:grid-cols-1 mb-3">
                {form.attitudeType && (
                  <div>
                    <span className="text-muted font-semibold block mb-0.5">{t(lang, "Attitude Type")}:</span>
                    <p className="text-ink bg-card p-2.5 rounded-md border border-line whitespace-pre-wrap leading-relaxed m-0">
                      {form.attitudeType}
                    </p>
                  </div>
                )}
                {form.socialType && (
                  <div>
                    <span className="text-muted font-semibold block mb-0.5">{t(lang, "Social Type")}:</span>
                    <p className="text-ink bg-card p-2.5 rounded-md border border-line whitespace-pre-wrap leading-relaxed m-0">
                      {form.socialType}
                    </p>
                  </div>
                )}
                {form.personalityType && (
                  <div>
                    <span className="text-muted font-semibold block mb-0.5">{t(lang, "Personality Type")}:</span>
                    <p className="text-ink bg-card p-2.5 rounded-md border border-line whitespace-pre-wrap leading-relaxed m-0">
                      {form.personalityType}
                    </p>
                  </div>
                )}
                {form.overtimeWillingness && (
                  <div>
                    <span className="text-muted font-semibold block mb-0.5">{t(lang, "Overtime Willingness")}:</span>
                    <p className="text-ink bg-card p-2.5 rounded-md border border-line whitespace-pre-wrap leading-relaxed m-0">
                      {form.overtimeWillingness}
                    </p>
                  </div>
                )}
              </div>
              {form.projectWorkReqs && (
                <div className="mt-2 pt-2 border-t border-line/60 text-xs">
                  <span className="text-muted block mb-1 font-semibold">{t(lang, "Project Work Requirements")}:</span>
                  <p className="text-ink bg-card p-2.5 rounded-md border border-line whitespace-pre-wrap leading-relaxed">
                    {form.projectWorkReqs}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Custom Screening Questions Preview */}
          {form.questions && form.questions.length > 0 && (
            <div className="mt-6 rounded-xl border border-line bg-sunken/40 p-4">
              <h4 className="mb-3 text-sm font-bold text-ink flex items-center gap-2">
                <Icon name="help-circle" size={16} className="text-brand" />
                {t(lang, "Screening Questions")} ({form.questions.length})
              </h4>
              <div className="space-y-2.5">
                {form.questions.map((q, idx) => (
                  <div key={q.id || idx} className="rounded-lg border border-line bg-card p-3 text-xs">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-ink">
                        {idx + 1}. {q.question || "Untitled question"}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {q.required && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                            {t(lang, "Required")}
                          </span>
                        )}
                        <span className="rounded bg-sunken px-1.5 py-0.5 text-[10px] font-medium text-muted uppercase">
                          {q.type}
                        </span>
                      </div>
                    </div>
                    {q.type === "choice" && q.options && q.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 pl-4">
                        {q.options.map((opt, oIdx) => (
                          <span key={oIdx} className="rounded-full bg-sunken px-2 py-0.5 text-[11px] text-muted">
                            ○ {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Edit Form */
        <div className={CARD}>
          <div className={FORM_GRID}>
            <Input
              label={
                <div className="flex items-center justify-between w-full">
                  <span>{t(lang, "Job Title")} <span className="text-danger">*</span></span>
                  <span className={`text-[11px] font-normal ${form.title?.length > 100 ? "text-danger font-bold" : "text-muted"}`}>
                    {form.title?.length || 0}/100
                  </span>
                </div>
              }
              maxLength={100}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              error={errors.title}
              placeholder={t(lang, "e.g. Senior Frontend Engineer")}
            />
            <Input
              label={<>{t(lang, "Department")} <span className="text-danger">*</span></>}
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              error={errors.department}
              placeholder={t(lang, "e.g. Engineering, Sales, Human Resources...")}
            />
            <Select
              label={<>{t(lang, "Job Type")} <span className="text-danger">*</span></>}
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              error={errors.type}
              options={jobTypeOptions}
              placeholder={t(lang, "Select Job Type")}
            />
            <div className="w-full">
              <Input
                list="vietnam-locations-list"
                label={<>{t(lang, "Location")} <span className="text-danger">*</span></>}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                error={errors.location}
                placeholder={t(lang, "Select city or enter custom location")}
              />
              <datalist id="vietnam-locations-list">
                {locationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </datalist>
            </div>
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
                name="salaryMin"
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>{t(lang, "Minimum Salary (VND)")}</span>
                    <span className="text-[11px] font-normal text-muted">{lang === "VN" || lang === "VI" ? "Triệu đồng, không thập phân" : "Million format, no decimals"}</span>
                  </div>
                }
                value={form.salaryMin}
                disabled={form.negotiable}
                onChange={(e) => {
                  const val = formatVndNumber(e.target.value);
                  set("salaryMin", val);
                  if (form.salaryMax !== "") formik.validateField("salaryMax");
                }}
                onBlur={() => {
                  formik.setFieldTouched("salaryMin", true);
                  formik.validateField("salaryMin");
                  if (form.salaryMax !== "") formik.validateField("salaryMax");
                }}
                error={errors.salaryMin}
                placeholder={t(lang, "e.g. 20,000,000")}
              />
              <Input
                name="salaryMax"
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>{t(lang, "Maximum Salary (VND)")}</span>
                    <span className="text-[11px] font-normal text-muted">{lang === "VN" || lang === "VI" ? "Triệu đồng, không thập phân" : "Million format, no decimals"}</span>
                  </div>
                }
                value={form.salaryMax}
                disabled={form.negotiable}
                onChange={(e) => {
                  const val = formatVndNumber(e.target.value);
                  set("salaryMax", val);
                  if (form.salaryMin !== "") formik.validateField("salaryMin");
                }}
                onBlur={() => {
                  formik.setFieldTouched("salaryMax", true);
                  formik.validateField("salaryMax");
                  if (form.salaryMin !== "") formik.validateField("salaryMin");
                }}
                error={errors.salaryMax}
                placeholder={t(lang, "e.g. 35,000,000")}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Check
                label={t(lang, "Salary is negotiable")}
                checked={form.negotiable}
                onChange={() => set("negotiable", !form.negotiable)}
              />
              {!form.negotiable && (form.salaryMin || form.salaryMax) && (
                (() => {
                  const nMin = Number(parseVndNumber(form.salaryMin));
                  const nMax = Number(parseVndNumber(form.salaryMax));
                  const isMinInvalid = form.salaryMin && (isNaN(nMin) || nMin < 0);
                  const isMaxInvalid = form.salaryMax && (isNaN(nMax) || nMax < 0);
                  const isRangeInvalid = form.salaryMin && form.salaryMax && nMin > nMax;
                  if (isMinInvalid || isMaxInvalid || isRangeInvalid) {
                    return (
                      <span className="text-xs font-bold text-danger bg-red-50 border border-red-200 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <Icon name="alert-circle" size={14} />
                        {isMinInvalid || isMaxInvalid
                          ? t(lang, "Salary cannot be negative")
                          : t(lang, "Invalid range: Min salary exceeds Max salary")}
                      </span>
                    );
                  }
                  return (
                    <span className="text-xs font-bold text-brand bg-brand-subtle px-2.5 py-1 rounded-md">
                      {form.salaryMin || "0"} – {form.salaryMax || "—"} VND ({form.salaryType})
                    </span>
                  );
                })()
              )}
            </div>
          </div>

          {/* Job Description (EMP-FR-009 & EMP-FR-010 AI Generate JD) */}
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-ink">{t(lang, "Job Description")} <span className="text-danger">*</span></label>
                <span className={`text-xs ${form.description?.trim().length < 200 ? "text-amber-600 font-medium" : "text-emerald-600 font-semibold"}`}>
                  ({form.description?.trim().length || 0}/200 {lang === "VN" || lang === "VI" ? "ký tự tối thiểu" : "chars min"})
                </span>
              </div>
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

            <div className={`overflow-hidden rounded-xl border transition-all ${errors.description ? "border-danger ring-2 ring-red-100" : "border-line focus-within:border-brand focus-within:ring-2 focus-within:ring-blue-100"}`}>
              {/* Rich Text Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1 border-b border-line bg-sunken/60 px-3 py-1.5 text-xs font-semibold text-muted">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat("bold")}
                  title={lang === "VN" || lang === "VI" ? "In đậm (Ctrl+B)" : "Bold (Ctrl+B)"}
                  className="flex h-7 w-7 items-center justify-center rounded font-extrabold hover:bg-card hover:text-brand hover:shadow-2xs transition-colors cursor-pointer text-ink"
                >
                  B
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat("italic")}
                  title={lang === "VN" || lang === "VI" ? "In nghiêng (Ctrl+I)" : "Italic (Ctrl+I)"}
                  className="flex h-7 w-7 items-center justify-center rounded italic font-serif hover:bg-card hover:text-brand hover:shadow-2xs transition-colors cursor-pointer text-ink text-sm"
                >
                  I
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat("underline")}
                  title={lang === "VN" || lang === "VI" ? "Gạch chân" : "Underline"}
                  className="flex h-7 w-7 items-center justify-center rounded underline hover:bg-card hover:text-brand hover:shadow-2xs transition-colors cursor-pointer text-ink"
                >
                  U
                </button>

                <div className="mx-1 h-4 w-px bg-line" />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat("h2")}
                  title={lang === "VN" || lang === "VI" ? "Tiêu đề lớn (H2)" : "Heading 2"}
                  className="flex h-7 px-1.5 items-center justify-center rounded font-bold hover:bg-card hover:text-brand hover:shadow-2xs transition-colors cursor-pointer text-ink text-xs"
                >
                  H2
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat("h3")}
                  title={lang === "VN" || lang === "VI" ? "Tiêu đề nhỏ (H3)" : "Heading 3"}
                  className="flex h-7 px-1.5 items-center justify-center rounded font-bold hover:bg-card hover:text-brand hover:shadow-2xs transition-colors cursor-pointer text-ink text-xs"
                >
                  H3
                </button>

                <div className="mx-1 h-4 w-px bg-line" />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat("bullets")}
                  title={lang === "VN" || lang === "VI" ? "Danh sách dấu chấm" : "Bullet list"}
                  className="flex h-7 items-center gap-1 px-2 rounded hover:bg-card hover:text-brand hover:shadow-2xs transition-colors cursor-pointer text-ink text-xs"
                >
                  <Icon name="list" size={13} />
                  <span>{lang === "VN" || lang === "VI" ? "Dấu đầu dòng" : "Bullets"}</span>
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat("numbered")}
                  title={lang === "VN" || lang === "VI" ? "Danh sách đánh số" : "Numbered list"}
                  className="flex h-7 items-center gap-1 px-2 rounded hover:bg-card hover:text-brand hover:shadow-2xs transition-colors cursor-pointer text-ink text-xs"
                >
                  <Icon name="list-ordered" size={13} />
                  <span>{lang === "VN" || lang === "VI" ? "Số thứ tự" : "Numbered"}</span>
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat("quote")}
                  title={lang === "VN" || lang === "VI" ? "Trích dẫn" : "Quote"}
                  className="flex h-7 items-center gap-1 px-2 rounded hover:bg-card hover:text-brand hover:shadow-2xs transition-colors cursor-pointer text-ink text-xs"
                >
                  <Icon name="quote" size={13} />
                  <span>{lang === "VN" || lang === "VI" ? "Trích dẫn" : "Quote"}</span>
                </button>

                <div className="mx-1 h-4 w-px bg-line" />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat("link")}
                  title={lang === "VN" || lang === "VI" ? "Chèn liên kết" : "Insert link"}
                  className="flex h-7 items-center gap-1 px-2 rounded hover:bg-card hover:text-brand hover:shadow-2xs transition-colors cursor-pointer text-ink text-xs"
                >
                  <Icon name="link" size={13} />
                  <span>{lang === "VN" || lang === "VI" ? "Liên kết" : "Link"}</span>
                </button>
              </div>

              <textarea
                ref={textareaRef}
                className="min-h-[260px] w-full resize-y border-none p-4 font-body text-sm leading-relaxed text-ink outline-none"
                value={form.description}
                onChange={(e) => {
                  set("description", e.target.value);
                  if (form.aiGenerated) set("aiGenerated", false);
                }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                    e.preventDefault();
                    applyFormat("bold");
                  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
                    e.preventDefault();
                    applyFormat("italic");
                  }
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
                    className={`group relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                        ? "border-brand bg-brand/5 shadow-xs ring-2 ring-brand/20 text-ink"
                        : "border-line bg-card hover:border-slate-300 hover:bg-sunken/40 text-muted hover:text-ink"
                      }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1 mb-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isSelected ? "bg-brand text-white" : "bg-sunken text-muted group-hover:text-brand"
                          }`}
                      >
                        <Icon name={card.icon} size={15} />
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isSelected ? "bg-brand/15 text-brand font-extrabold" : "bg-sunken text-faint"
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
                label={<>{t(lang, "Application Deadline (Default: 30 days)")} {!form.openUntilClosed && <span className="text-danger">*</span>}</>}
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

          {/* Selection Criteria Setup (Optional) */}
          <div className="mt-6 rounded-xl border border-line bg-card p-5 shadow-2xs">
            <div className="border-b border-line pb-3 mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="user-check" size={18} className="text-brand" />
                  <h3 className="text-base font-bold text-ink">
                    {lang === "VN" || lang === "VI" ? "Tiêu chí tuyển chọn & Môi trường làm việc" : "Selection Criteria & Work Culture"}
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-muted">
                    {lang === "VN" || lang === "VI" ? "Không bắt buộc" : "Optional"}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">
                  {lang === "VN" || lang === "VI"
                    ? "Đánh dấu chọn tiêu chí bạn muốn áp dụng và nhập nội dung mô tả tương ứng"
                    : "Check the criteria you want to apply and enter the custom description text"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Attitude Type */}
              <div className="rounded-lg border border-line/70 bg-sunken/20 p-3.5">
                <Check
                  label={
                    <span className="text-xs font-bold text-ink">
                      {lang === "VN" || lang === "VI" ? "Thái độ & Tác phong làm việc (Attitude Type)" : "Attitude Type"}
                    </span>
                  }
                  checked={Boolean(checkedCriteria.attitude || form.attitudeType)}
                  onChange={() => toggleCriterion("attitude", "attitudeType")}
                />
                {(checkedCriteria.attitude || Boolean(form.attitudeType)) && (
                  <div className="mt-2.5 pl-6">
                    <Input
                      value={form.attitudeType}
                      onChange={(e) => set("attitudeType", e.target.value)}
                      placeholder={
                        lang === "VN" || lang === "VI"
                          ? "Nhập mô tả thái độ / tác phong làm việc mong đợi..."
                          : "Enter expected attitude / work ethic description..."
                      }
                    />
                  </div>
                )}
              </div>

              {/* Social Type */}
              <div className="rounded-lg border border-line/70 bg-sunken/20 p-3.5">
                <Check
                  label={
                    <span className="text-xs font-bold text-ink">
                      {lang === "VN" || lang === "VI" ? "Phong cách giao tiếp & Xã hội (Social Type)" : "Social Type"}
                    </span>
                  }
                  checked={Boolean(checkedCriteria.social || form.socialType)}
                  onChange={() => toggleCriterion("social", "socialType")}
                />
                {(checkedCriteria.social || Boolean(form.socialType)) && (
                  <div className="mt-2.5 pl-6">
                    <Input
                      value={form.socialType}
                      onChange={(e) => set("socialType", e.target.value)}
                      placeholder={
                        lang === "VN" || lang === "VI"
                          ? "Nhập mô tả phong cách giao tiếp / làm việc nhóm..."
                          : "Enter expected social / team communication style..."
                      }
                    />
                  </div>
                )}
              </div>

              {/* Personality Type */}
              <div className="rounded-lg border border-line/70 bg-sunken/20 p-3.5">
                <Check
                  label={
                    <span className="text-xs font-bold text-ink">
                      {lang === "VN" || lang === "VI" ? "Đặc điểm tính cách & Tư duy (Personality Type)" : "Personality Type"}
                    </span>
                  }
                  checked={Boolean(checkedCriteria.personality || form.personalityType)}
                  onChange={() => toggleCriterion("personality", "personalityType")}
                />
                {(checkedCriteria.personality || Boolean(form.personalityType)) && (
                  <div className="mt-2.5 pl-6">
                    <Input
                      value={form.personalityType}
                      onChange={(e) => set("personalityType", e.target.value)}
                      placeholder={
                        lang === "VN" || lang === "VI"
                          ? "Nhập mô tả đặc điểm tính cách / tư duy..."
                          : "Enter expected personality trait / mindset description..."
                      }
                    />
                  </div>
                )}
              </div>

              {/* Overtime Willingness */}
              <div className="rounded-lg border border-line/70 bg-sunken/20 p-3.5">
                <Check
                  label={
                    <span className="text-xs font-bold text-ink">
                      {lang === "VN" || lang === "VI" ? "Mức độ sẵn sàng làm thêm giờ (Overtime Willingness)" : "Overtime Willingness"}
                    </span>
                  }
                  checked={Boolean(checkedCriteria.overtime || form.overtimeWillingness)}
                  onChange={() => toggleCriterion("overtime", "overtimeWillingness")}
                />
                {(checkedCriteria.overtime || Boolean(form.overtimeWillingness)) && (
                  <div className="mt-2.5 pl-6">
                    <Input
                      value={form.overtimeWillingness}
                      onChange={(e) => set("overtimeWillingness", e.target.value)}
                      placeholder={
                        lang === "VN" || lang === "VI"
                          ? "Nhập yêu cầu / kỳ vọng về làm thêm giờ..."
                          : "Enter overtime expectations / flexibility description..."
                      }
                    />
                  </div>
                )}
              </div>

              {/* Project Work Requirements */}
              <div className="rounded-lg border border-line/70 bg-sunken/20 p-3.5">
                <Check
                  label={
                    <span className="text-xs font-bold text-ink">
                      {lang === "VN" || lang === "VI" ? "Yêu cầu công việc dự án cụ thể (Project Work Requirements)" : "Project Work Requirements"}
                    </span>
                  }
                  checked={Boolean(checkedCriteria.project || form.projectWorkReqs)}
                  onChange={() => toggleCriterion("project", "projectWorkReqs")}
                />
                {(checkedCriteria.project || Boolean(form.projectWorkReqs)) && (
                  <div className="mt-2.5 pl-6">
                    <textarea
                      className="w-full resize-y rounded-md border border-line bg-card p-3 font-body text-xs text-ink focus:border-brand focus:outline-none min-h-[80px]"
                      value={form.projectWorkReqs}
                      onChange={(e) => set("projectWorkReqs", e.target.value)}
                      placeholder={
                        lang === "VN" || lang === "VI"
                          ? "Mô tả yêu cầu dự án cụ thể, ca làm việc, tiến độ bàn giao hoặc điều kiện môi trường làm việc..."
                          : "Describe specific project shifts, hybrid cadence, delivery milestones, or unique environment requirements..."
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Screening Questions Builder */}
          <div className="mt-6 rounded-xl border border-line bg-card p-5 shadow-2xs">
            <div className="border-b border-line pb-3 mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="help-circle" size={18} className="text-brand" />
                  <h3 className="text-base font-bold text-ink">
                    {lang === "VN" || lang === "VI" ? "Câu hỏi sàng lọc ứng viên (Screening Questions)" : "Custom Screening Questions"}
                  </h3>
                  <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-bold text-brand">
                    {(form.questions || []).length}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">
                  {lang === "VN" || lang === "VI"
                    ? "Tạo các câu hỏi sàng lọc nhanh. Ứng viên bắt buộc phải trả lời các câu hỏi đánh dấu bắt buộc khi nộp hồ sơ."
                    : "Add custom screening questions. Candidates must answer required questions before submitting their application."}
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addQuestion()}
              >
                <Icon name="plus" size={14} style={{ marginRight: 4 }} />
                {lang === "VN" || lang === "VI" ? "Thêm câu hỏi mới" : "Add Question"}
              </Button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="mb-4 rounded-lg bg-sunken/40 p-3 border border-line/60">
              <span className="text-[11px] font-bold text-muted block mb-2">
                {lang === "VN" || lang === "VI" ? "Mẫu câu hỏi thông dụng (Bấm để thêm nhanh):" : "Preset Question Templates (Click to add):"}
              </span>
              <div className="flex flex-wrap gap-2">
                {QUESTION_TEMPLATES.map((tpl, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => addQuestion(tpl)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line bg-card px-2.5 py-1 text-xs font-medium text-ink hover:border-brand hover:text-brand transition-colors cursor-pointer"
                  >
                    <Icon name="plus-circle" size={12} className="text-brand" />
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List */}
            {(!form.questions || form.questions.length === 0) ? (
              <div className="rounded-xl border border-dashed border-line bg-sunken/20 p-6 text-center text-xs text-muted">
                <Icon name="help-circle" size={24} className="mx-auto mb-2 text-faint" />
                <p className="font-medium text-ink mb-1">
                  {lang === "VN" || lang === "VI" ? "Chưa có câu hỏi sàng lọc nào" : "No screening questions added yet"}
                </p>
                <p className="text-faint">
                  {lang === "VN" || lang === "VI"
                    ? "Bấm 'Thêm câu hỏi mới' hoặc chọn mẫu câu hỏi thông dụng ở trên để bắt đầu."
                    : "Click 'Add Question' or pick from preset templates above to configure screening questions."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.questions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    className="rounded-xl border border-line bg-sunken/20 p-4 transition-all hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 rounded bg-brand-subtle px-2 py-0.5 text-xs font-extrabold text-brand">
                        #{qIdx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={qIdx === 0}
                          onClick={() => moveQuestion(qIdx, -1)}
                          className="rounded p-1 text-muted hover:bg-card hover:text-ink disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <Icon name="arrow-up" size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={qIdx === form.questions.length - 1}
                          onClick={() => moveQuestion(qIdx, 1)}
                          className="rounded p-1 text-muted hover:bg-card hover:text-ink disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <Icon name="arrow-down" size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="rounded p-1 text-danger-fg hover:bg-red-50 cursor-pointer"
                          title="Remove Question"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-muted block mb-1">
                          {lang === "VN" || lang === "VI" ? "Nội dung câu hỏi" : "Question Prompt"} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={q.question || ""}
                          onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                          placeholder={lang === "VN" || lang === "VI" ? "Ví dụ: Bạn có thể đi làm vào thứ Bảy không?" : "e.g. Do you have experience with TypeScript?"}
                          className="w-full rounded-md border border-line bg-card px-3 py-2 text-xs font-medium text-ink focus:border-brand focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted block mb-1">
                          {lang === "VN" || lang === "VI" ? "Loại câu trả lời" : "Response Type"}
                        </label>
                        <select
                          value={q.type || "text"}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const patch = { type: newType };
                            if (newType === "yes_no" && (!q.options || q.options.length === 0)) {
                              patch.options = ["Yes", "No"];
                            }
                            updateQuestion(qIdx, patch);
                          }}
                          className="w-full rounded-md border border-line bg-card px-3 py-2 text-xs font-medium text-ink focus:border-brand focus:outline-none"
                        >
                          <option value="text">{lang === "VN" || lang === "VI" ? "Văn bản (Đoạn ngắn/dài)" : "Text Answer"}</option>
                          <option value="yes_no">{lang === "VN" || lang === "VI" ? "Có / Không (Yes / No)" : "Yes / No"}</option>
                          <option value="choice">{lang === "VN" || lang === "VI" ? "Trắc nghiệm nhiều lựa chọn" : "Multiple Choice"}</option>
                          <option value="number">{lang === "VN" || lang === "VI" ? "Số (Kinh nghiệm, ngày...)" : "Number / Numeric"}</option>
                        </select>
                      </div>
                    </div>

                    {/* Options manager for choice questions */}
                    {q.type === "choice" && (
                      <div className="mb-3 rounded-lg border border-line/70 bg-card p-3">
                        <label className="text-xs font-bold text-muted block mb-1.5">
                          {lang === "VN" || lang === "VI" ? "Các phương án lựa chọn:" : "Choice Options:"}
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(q.options || []).map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className="inline-flex items-center gap-1 rounded-md bg-sunken px-2 py-1 text-xs font-medium text-ink"
                            >
                              <span>{opt}</span>
                              <button
                                type="button"
                                onClick={() => removeOptionFromQuestion(qIdx, oIdx)}
                                className="text-muted hover:text-danger cursor-pointer"
                              >
                                <Icon name="x" size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id={`new-opt-${qIdx}`}
                            placeholder={lang === "VN" || lang === "VI" ? "Nhập phương án và bấm Thêm..." : "Type an option and click Add..."}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addOptionToQuestion(qIdx, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="flex-1 rounded-md border border-line bg-card px-2.5 py-1 text-xs text-ink focus:border-brand focus:outline-none"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`new-opt-${qIdx}`);
                              if (input) {
                                addOptionToQuestion(qIdx, input.value);
                                input.value = "";
                              }
                            }}
                          >
                            {lang === "VN" || lang === "VI" ? "Thêm lựa chọn" : "Add Option"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Required Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-line/50">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                        <input
                          type="checkbox"
                          checked={Boolean(q.required)}
                          onChange={(e) => updateQuestion(qIdx, { required: e.target.checked })}
                          className="h-4 w-4 rounded border-line text-brand focus:ring-brand accent-blue-600"
                        />
                        <span>
                          {lang === "VN" || lang === "VI"
                            ? "Bắt buộc trả lời (Ứng viên không thể nộp đơn nếu bỏ trống)"
                            : "Mandatory question (Candidate cannot apply without answering)"}
                        </span>
                      </label>
                      {q.required && (
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          * {lang === "VN" || lang === "VI" ? "Bắt buộc" : "Required"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {/* Action Bar */}
          <div className={`${ACTIONS} mt-8 flex flex-wrap items-center justify-between border-t border-line pt-5`}>
            <div className="flex gap-3">
              <Link href="/company/jobs">
                <Button variant="secondary" type="button" disabled={isSubmitting}>
                  {t(lang, "Cancel")}
                </Button>
              </Link>
              <Button variant="primary" type="button" disabled={isSubmitting} onClick={() => persist()}>
                <Icon name="check" size={14} style={{ marginRight: 6 }} />
                {t(lang, isSubmitting
                  ? "Saving..."
                  : mode === "edit"
                    ? "Update Job"
                    : form.status === "draft"
                      ? "Save as Draft"
                      : "Publish Job"
                )}
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
