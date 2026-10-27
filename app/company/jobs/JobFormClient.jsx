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
  deadline: "",
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

function calculateCompletion(f) {
  let score = 0;
  if (f.title?.trim()) score++;
  if (f.department?.trim()) score++;
  if (f.location?.trim()) score++;
  if (f.salaryMin || f.negotiable) score++;
  if (f.description?.trim()) score++;
  if (f.skills?.length > 0) score++;
  if (f.deadline) score++;
  if (f.vacancies) score++;
  if (score >= 7) return 100;
  if (score >= 5) return 75;
  if (score >= 3) return 50;
  return 25;
}

function normalizeJobData(data) {
  if (!data) return EMPTY;
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
    deadline: data.deadline ? String(data.deadline).slice(0, 10) : (data.expires_at ? String(data.expires_at).slice(0, 10) : ""),
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

function buildAiDraft(title, skills, attempt) {
  const skillLine = skills.length ? skills.join(", ") : "the core tools for this role";
  const variants = [
    `We are hiring a ${title || "new team member"} to join our team in Vietnam.\n\nAbout the role:\nYou will take ownership of key work in this area, collaborate across functions and help us deliver results that matter to our customers.\n\nWhat you'll do:\n- Lead day-to-day delivery for this function\n- Work closely with stakeholders to plan and prioritise\n- Raise the quality bar through feedback and documentation\n\nWhat we're looking for:\n- Solid hands-on experience with ${skillLine}\n- Clear written and spoken communication (EN/VI a plus)\n- A track record of shipping and improving real work`,
    `${title || "This role"} — full ownership of an important area of our business.\n\nYou'll be responsible for planning, executing and continuously improving the work in your remit, partnering with teammates across the company.\n\nResponsibilities:\n- Own outcomes end to end, not just tasks\n- Bring structure to ambiguous problems\n- Mentor and support others where you can\n\nRequirements:\n- Strong practical knowledge of ${skillLine}\n- Comfort working in a fast-moving, collaborative environment\n- Bias toward action and measurable impact`,
    `Join us as a ${title || "team member"}.\n\nWe're looking for someone practical, thorough and collaborative to strengthen this part of the team.\n\nDay to day you will:\n- Deliver high-quality work against clear goals\n- Coordinate with other teams and keep everyone informed\n- Spot and fix problems before they grow\n\nYou should have:\n- Real experience with ${skillLine}\n- Good judgement and attention to detail\n- Fluent communication with local and regional colleagues`,
  ];
  return variants[Math.min(attempt, variants.length - 1)];
}

const CARD = "rounded-xl border border-line bg-card p-8 shadow-md max-md:p-5";
const FORM_GRID = "grid grid-cols-2 gap-4 gap-x-5 max-md:grid-cols-1";
const TEXTAREA = "w-full resize-y rounded-md border-[1.5px] border-line px-3.5 py-[11px] font-body text-base text-ink focus:border-line-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100";
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";
const ACTIONS = "mt-2 flex gap-3 max-sm:flex-col-reverse [&_button]:max-sm:w-full";
const AI_TAG = "inline-flex items-center gap-1 rounded-pill bg-brand-subtle px-2 py-[3px] text-[11px] font-bold tracking-[0.02em] text-brand";
const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(21,23,27,0.5)] p-6";
const MODAL = "max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-xl bg-card p-6 shadow-lg";
const MODAL_HEAD = "mb-3 flex items-center justify-between gap-3";
const ICON_BTN = "inline-flex rounded-sm border border-transparent p-1.5 text-muted hover:bg-sunken hover:text-ink";
const HINT = "flex items-start gap-2 rounded-md bg-brand-subtle px-4 py-3 text-sm leading-relaxed text-muted";
const ERRBOX = "flex flex-col items-start gap-2 rounded-md border border-red-100 bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger-fg";

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

  // AI JD state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [aiAttempts, setAiAttempts] = useState(0);
  const [aiError, setAiError] = useState(false);
  const aiCache = useRef("");

  const [showUpgrade, setShowUpgrade] = useState(false);

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
    if (!form.deadline) e.deadline = t(lang, "An application deadline is required.");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const persist = async (targetStatus) => {
    if (isSubmitting) return;
    if (!validate()) {
      setToast(t(lang, "Please fix the highlighted fields."));
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
        description: form.description,
        status: finalStatus,
        ...(mode === "edit" ? { id: jobId } : {}),
      };
      await saveJob(jobData);
      setToast(t(lang, finalStatus === "published" ? "Job published" : "Draft saved"));
      setTimeout(() => router.push("/company/jobs"), 700);
    } catch (err) {
      setToast(t(lang, err.message || "Failed to save job"));
      setIsSubmitting(false);
    }
  };

  const runAi = () => {
    if (aiAttempts >= 3) return;
    setAiLoading(true);
    setAiError(false);
    setTimeout(() => {
      const attempt = aiAttempts;
      // Simulate an occasional failure on the 2nd retry to exercise the fallback.
      if (attempt === 2 && form.title.length % 2 === 1) {
        setAiError(true);
        setAiDraft("");
      } else {
        setAiDraft(buildAiDraft(form.title, form.skills, attempt));
      }
      setAiAttempts((n) => n + 1);
      setAiLoading(false);
    }, 1100);
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
    set("description", aiDraft);
    set("aiGenerated", true);
    setAiOpen(false);
    setToast(t(lang, "AI draft added — please review before saving."));
  };

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
      <div className="rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted">
        <h3 className="mb-2 text-lg">{t(lang, "Job not found")}</h3>
        <div className="mt-4">
          <Link href="/company/jobs">
            <Button variant="secondary">{t(lang, "Back to Job Management")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const retriesLeft = Math.max(0, 2 - Math.max(0, aiAttempts - 1));

  return (
    <>
      <div className="mb-5 flex items-center gap-2 text-sm text-faint [&_a]:text-muted">
        <Link href="/company/jobs">{t(lang, "Job Management")}</Link>
        <Icon name="chevron-right" size={14} />
        <span>{mode === "edit" ? t(lang, "Edit Job") : t(lang, "Post New Job")}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1.5 text-2xl font-extrabold">{mode === "edit" ? t(lang, "Edit Job") : t(lang, "Post New Job")}</h1>
          <p className="text-sm text-muted">
            {quota && quota.limit !== Infinity
              ? `${t(lang, "Posting quota")}: ${quota.remaining} ${t(lang, "of")} ${quota.limit} ${t(lang, "remaining")}`
              : t(lang, "Unlimited postings on your plan.")}
          </p>
        </div>
        {mode === "edit" && (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-card p-1">
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${viewMode === "edit" ? "bg-brand text-on-brand" : "text-muted hover:text-ink"}`}
              onClick={() => setViewMode("edit")}
            >
              <Icon name="pencil" size={13} /> {t(lang, "Edit Form")}
            </button>
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${viewMode === "preview" ? "bg-brand text-on-brand" : "text-muted hover:text-ink"}`}
              onClick={() => setViewMode("preview")}
            >
              <Icon name="eye" size={13} /> {t(lang, "Preview Job")}
            </button>
          </div>
        )}
      </div>

      {/* EMP-FR-015: JD Completion Progress Indicator */}
      <div className="mb-5 rounded-xl border border-line bg-card p-4 shadow-xs">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Icon name="check-circle" size={14} className="text-brand" />
            {t(lang, "JD Completion Progress (EMP-FR-015)")}:
          </span>
          <span className="text-xs font-extrabold text-brand">{calculateCompletion(form)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-pill bg-sunken">
          <div
            className="h-full rounded-pill transition-all duration-300"
            style={{
              width: `${calculateCompletion(form)}%`,
              backgroundColor:
                calculateCompletion(form) === 100
                  ? "#10b981"
                  : calculateCompletion(form) >= 75
                  ? "#2563eb"
                  : calculateCompletion(form) >= 50
                  ? "#f59e0b"
                  : "#ef4444",
            }}
          />
        </div>
      </div>

      {viewMode === "preview" ? (
        <div className={CARD}>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
            <div>
              <div className="mb-2 flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-ink">{form.title || "Untitled Job"}</h2>
                <StatusBadge kind="job" value={form.status} lang={lang} />
                {form.aiGenerated && (
                  <span className={AI_TAG}>
                    <Icon name="sparkles" size={10} /> {t(lang, "AI JD")}
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

          <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-sunken p-4 max-sm:grid-cols-1">
            <div>
              <span className="mb-1 block text-xs text-muted">{t(lang, "Salary")}</span>
              <strong className="text-sm text-ink">
                {form.negotiable
                  ? t(lang, "Negotiable")
                  : form.salaryMin && form.salaryMax
                  ? `${form.salaryMin} - ${form.salaryMax} VND`
                  : t(lang, "Negotiable")}
              </strong>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted">{t(lang, "Experience")}</span>
              <strong className="text-sm text-ink">{form.experience ? `${form.experience} ${t(lang, "years")}` : "Not specified"}</strong>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted">{t(lang, "Education Level")}</span>
              <strong className="text-sm text-ink">{form.education || "Bachelor's Degree"}</strong>
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted">{t(lang, "Application Deadline")}</span>
              <strong className="text-sm text-ink">{form.deadline || "—"}</strong>
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

          {form.documents && form.documents.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-semibold text-ink">{t(lang, "Required Documents")}</h4>
              <div className="flex flex-wrap gap-2">
                {form.documents.map((d) => (
                  <span key={d} className="rounded-md border border-line bg-card px-2.5 py-1 text-xs text-ink">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink">{t(lang, "Job Description")}</h4>
            <div className="whitespace-pre-wrap rounded-lg border border-line bg-sunken p-4 text-sm leading-relaxed text-ink font-body">
              {form.description || t(lang, "No description provided.")}
            </div>
          </div>
        </div>
      ) : (
        <div className={CARD}>
        <div className={FORM_GRID}>
          <Input label={t(lang, "Job Title")} value={form.title} onChange={(e) => set("title", e.target.value)} error={errors.title} placeholder={t(lang, "Enter job title")} />
          <Input label={t(lang, "Department")} value={form.department} onChange={(e) => set("department", e.target.value)} error={errors.department} placeholder="Enter department name" />
          <Select label={t(lang, "Job Type")} value={form.type} onChange={(e) => set("type", e.target.value)} options={JOB_TYPES.map((x) => ({ value: x, label: t(lang, x) }))} placeholder="Select Job Type" />
          <Input label={t(lang, "Location")} value={form.location} onChange={(e) => set("location", e.target.value)} error={errors.location} placeholder="Enter job location" />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className={LABEL}>{t(lang, "Salary Range (VND)")}</label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted">{t(lang, "Salary Type (BR-009)")}:</span>
              <select
                value={form.salaryType || "Gross"}
                onChange={(e) => set("salaryType", e.target.value)}
                className="rounded-md border border-line bg-card px-2 py-0.5 text-xs font-semibold text-ink"
              >
                <option value="Gross">{t(lang, "Gross")}</option>
                <option value="Net">{t(lang, "Net")}</option>
              </select>
            </div>
          </div>
          <div className={FORM_GRID}>
            <Input value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value.replace(/\D/g, ""))} placeholder={t(lang, "Min e.g. 20000000")} />
            <Input value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value.replace(/\D/g, ""))} placeholder={t(lang, "Max e.g. 35000000")} />
          </div>
          <div className="mt-2.5">
            <Check label={t(lang, "Salary is negotiable")} checked={form.negotiable} onChange={() => set("negotiable", !form.negotiable)} />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-semibold text-ink">{t(lang, "Job Description")}</label>
            <div className="flex items-center gap-2.5">
              {form.aiGenerated && (
                <span className={AI_TAG}>
                  <Icon name="sparkles" size={10} /> {t(lang, "AI Generated")}
                </span>
              )}
              <button type="button" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline" onClick={openAi}>
                <Icon name="sparkles" size={14} /> {t(lang, "AI Generate JD")}
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-md border-[1.5px] border-line">
            <div className="flex items-center gap-3.5 border-b border-line bg-sunken px-3 py-2 text-[13px] text-faint" aria-hidden="true">
              <span className="font-bold">B</span>
              <span className="italic">I</span>
              <span className="underline">U</span>
              <Icon name="list" size={14} />
              <Icon name="link" size={14} />
            </div>
            <textarea
              className="min-h-[220px] w-full resize-y border-none px-3.5 py-[11px] font-body text-base text-ink outline-none"
              value={form.description}
              onChange={(e) => {
                set("description", e.target.value);
                if (form.aiGenerated) set("aiGenerated", false);
              }}
              placeholder={t(lang, "Describe the role, responsibilities and requirements…")}
            />
          </div>
          {errors.description && <span className="text-xs text-danger">{errors.description}</span>}
        </div>

        <div className="mt-5">
          <label className={LABEL}>{t(lang, "Required Skills")}</label>
          <div className="flex gap-2">
            <Input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} placeholder={t(lang, "Type a skill and press Add")} />
            <Button type="button" variant="secondary" onClick={addSkill}>
              {t(lang, "Add")}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-pill bg-brand-subtle py-1.5 pl-3 pr-1.5 text-sm font-semibold text-brand">
                {s}
                <button type="button" className="flex items-center rounded-full p-0.5 hover:bg-white/60" aria-label={t(lang, "Remove") + " " + s} onClick={() => set("skills", form.skills.filter((x) => x !== s))}>
                  <Icon name="x" size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className={`${FORM_GRID} mt-5`}>
          <Input label={t(lang, "Experience (years)")} value={form.experience} onChange={(e) => set("experience", e.target.value.replace(/\D/g, ""))} placeholder="3" />
          <Select label={t(lang, "Education Level")} value={form.education} onChange={(e) => set("education", e.target.value)} options={EDU_LEVELS.map((x) => ({ value: x, label: t(lang, x) }))} placeholder="Select options" />
          <Input label={t(lang, "Application Deadline")} type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} error={errors.deadline} />
          <Input label={t(lang, "Vacancies")} value={form.vacancies} onChange={(e) => set("vacancies", e.target.value.replace(/\D/g, ""))} placeholder="1" />
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

        <div className="mt-5">
          <label className="mb-2.5 block text-sm font-semibold text-ink">{t(lang, "Required Documents")}</label>
          <div className="flex flex-col gap-2">
            {DOC_OPTIONS.map((d) => (
              <Check key={d} label={t(lang, d)} checked={form.documents.includes(d)} onChange={() => toggleDoc(d)} />
            ))}
          </div>
        </div>

        {/* EMP-FR-009: Candidate Selection Criteria */}
        <div className="mt-5 rounded-lg border border-line bg-sunken/40 p-4">
          <h4 className="mb-1 text-sm font-bold text-ink">{t(lang, "Candidate Selection Criteria (EMP-FR-009)")}</h4>
          <p className="mb-3 text-xs text-muted">
            {t(lang, "Define behavioral, personality and working arrangement criteria for candidate screening.")}
          </p>
          <div className={FORM_GRID}>
            <Input
              label={t(lang, "Attitude Type")}
              value={form.attitudeType}
              onChange={(e) => set("attitudeType", e.target.value)}
              placeholder={t(lang, "e.g. Proactive, Inquisitive, Ownership")}
            />
            <Input
              label={t(lang, "Social & Team Type")}
              value={form.socialType}
              onChange={(e) => set("socialType", e.target.value)}
              placeholder={t(lang, "e.g. Collaborative, Independent")}
            />
            <Input
              label={t(lang, "Personality Type")}
              value={form.personalityType}
              onChange={(e) => set("personalityType", e.target.value)}
              placeholder={t(lang, "e.g. Analytical, Adaptable, Creative")}
            />
            <Input
              label={t(lang, "Overtime Willingness")}
              value={form.overtimeWillingness}
              onChange={(e) => set("overtimeWillingness", e.target.value)}
              placeholder={t(lang, "e.g. Flexible when project deadline approaches")}
            />
            <div className="col-span-2 max-md:col-span-1">
              <Input
                label={t(lang, "Project Work Requirements")}
                value={form.projectWorkReqs}
                onChange={(e) => set("projectWorkReqs", e.target.value)}
                placeholder={t(lang, "e.g. Prior agile delivery experience, cross-functional project")}
              />
            </div>
          </div>
        </div>

        {quota && quota.limit !== Infinity && (
          <p className={`${HINT} mt-5`}>
            <Icon name="info" size={16} style={{ color: "var(--color-brand)", marginTop: 2 }} />
            <span>
              {t(lang, "Publishing this job uses 1 of your")} {quota.limit} {t(lang, "free postings.")} {quota.remaining} {t(lang, "remaining.")}
            </span>
          </p>
        )}

        <div className={`${ACTIONS} mt-6 flex flex-wrap items-center justify-between`}>
          <div className="flex gap-3">
            <Button variant="secondary" disabled={isSubmitting} onClick={() => persist("draft")}>
              {t(lang, isSubmitting ? "Saving..." : "Save as Draft")}
            </Button>
            <Button variant="primary" disabled={isSubmitting} onClick={() => persist("published")}>
              {t(lang, isSubmitting ? "Saving..." : "Publish Job")}
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

      {aiOpen && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "AI Job Description")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="flex items-center gap-2 text-md">
                <Icon name="sparkles" size={16} /> {t(lang, "AI Job Description")}
              </strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setAiOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="text-sm text-muted">
              {t(lang, "Generated from your job title and skills. Human review and confirmation are required before saving.")}
            </p>

            {aiLoading ? (
              <div className="rounded-lg border border-dashed border-line bg-card px-5 py-10 text-center text-muted">
                <Icon name="loader" size={22} style={{ margin: "0 auto 10px", color: "var(--color-brand)" }} />
                <p>{t(lang, "Drafting with Google Gemini…")}</p>
              </div>
            ) : aiError ? (
              <div className={ERRBOX} role="alert">
                <span>{t(lang, "AI generation failed. You can retry or write the description manually.")}</span>
                {retriesLeft > 0 && (
                  <Button variant="secondary" size="sm" onClick={runAi}>
                    {t(lang, "Retry")} ({retriesLeft} {t(lang, "left")})
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="mt-3.5 flex flex-col">
                  <span className={`${AI_TAG} mb-2 self-start`}>
                    <Icon name="sparkles" size={10} /> {t(lang, "AI Generated")}
                  </span>
                  <textarea className={`${TEXTAREA} min-h-[240px]`} value={aiDraft} onChange={(e) => setAiDraft(e.target.value)} />
                </div>
                <div className={`${ACTIONS} mt-4`}>
                  {retriesLeft > 0 ? (
                    <Button variant="secondary" onClick={runAi}>
                      <Icon name="refresh-cw" size={14} /> {t(lang, "Retry")} ({retriesLeft} {t(lang, "left")})
                    </Button>
                  ) : (
                    <span className="self-center text-xs text-faint">
                      {t(lang, "No retries left — edit manually or use this draft.")}
                    </span>
                  )}
                  <Button variant="primary" onClick={confirmAiDraft} disabled={!aiDraft.trim()}>
                    <Icon name="check" size={14} /> {t(lang, "Use this draft")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showUpgrade && (
        <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={t(lang, "Upgrade required")}>
          <div className={MODAL}>
            <div className={MODAL_HEAD}>
              <strong className="text-md">{t(lang, "You've reached your free posting limit")}</strong>
              <button className={ICON_BTN} aria-label={t(lang, "Close")} onClick={() => setShowUpgrade(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="text-sm text-muted">
              {t(lang, "Freemium includes a limited number of active job postings. Upgrade to publish more, or save this job as a draft for now.")}
            </p>
            <div className={`${ACTIONS} mt-4`}>
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
