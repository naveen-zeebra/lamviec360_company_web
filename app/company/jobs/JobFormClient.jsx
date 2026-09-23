"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Check from "../../../components/ds/Check";
import Toast, { useToast } from "../../../components/ds/Toast";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
import { getJob, saveJob, getQuota, setJobStatus } from "../../../lib/companyStore";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];
const EDU_LEVELS = ["Not required", "High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "PhD"];
const DOC_OPTIONS = ["CV / Resume", "Cover Letter", "Portfolio", "References", "Certifications"];

const EMPTY = {
  title: "",
  department: "",
  type: "Full-time",
  location: "",
  salaryMin: "",
  salaryMax: "",
  negotiable: false,
  jd: "",
  skills: [],
  experience: "",
  education: "Bachelor's Degree",
  deadline: "",
  vacancies: "1",
  documents: ["CV / Resume"],
  aiGenerated: false,
};

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
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useToast();

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
    if (mode === "edit") {
      const j = getJob(jobId);
      if (!j) {
        setNotFound(true);
        return;
      }
      setForm({ ...EMPTY, ...j });
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
    if (!form.jd.trim()) e.jd = t(lang, "A job description is required.");
    if (!form.deadline) e.deadline = t(lang, "An application deadline is required.");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const persist = async (status) => {
    if (!validate()) {
      setToast(t(lang, "Please fix the highlighted fields."));
      return;
    }
    if (status === "Published" && quota && quota.remaining <= 0) {
      setShowUpgrade(true);
      return;
    }
    try {
      const saved = await saveJob(mode === "edit" ? { ...form, id: jobId } : form);
      if (status && saved?.id) await setJobStatus(saved.id, status);
      setToast(t(lang, status === "Published" ? "Job published" : "Draft saved"));
      setTimeout(() => router.push("/company/jobs"), 700);
    } catch (err) {
      setToast(t(lang, err.message || "Failed to save job"));
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
    set("jd", aiDraft);
    set("aiGenerated", true);
    setAiOpen(false);
    setToast(t(lang, "AI draft added — please review before saving."));
  };

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

      <div className="mb-6">
        <h1 className="mb-1.5 text-2xl font-extrabold">{mode === "edit" ? t(lang, "Edit Job") : t(lang, "Post New Job")}</h1>
        <p className="text-sm text-muted">
          {quota && quota.limit !== Infinity
            ? `${t(lang, "Posting quota")}: ${quota.remaining} ${t(lang, "of")} ${quota.limit} ${t(lang, "remaining")}`
            : t(lang, "Unlimited postings on your plan.")}
        </p>
      </div>

      <div className={CARD}>
        <div className={FORM_GRID}>
          <Input label={t(lang, "Job Title")} value={form.title} onChange={(e) => set("title", e.target.value)} error={errors.title} placeholder={t(lang, "Senior Backend Engineer")} />
          <Input label={t(lang, "Department")} value={form.department} onChange={(e) => set("department", e.target.value)} error={errors.department} placeholder="Engineering" />
          <Select label={t(lang, "Job Type")} value={form.type} onChange={(e) => set("type", e.target.value)} options={JOB_TYPES.map((x) => ({ value: x, label: t(lang, x) }))} />
          <Input label={t(lang, "Location")} value={form.location} onChange={(e) => set("location", e.target.value)} error={errors.location} placeholder="Ho Chi Minh City" />
        </div>

        <div className="mt-4">
          <label className={LABEL}>{t(lang, "Salary Range (VND)")}</label>
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
              value={form.jd}
              onChange={(e) => {
                set("jd", e.target.value);
                if (form.aiGenerated) set("aiGenerated", false);
              }}
              placeholder={t(lang, "Describe the role, responsibilities and requirements…")}
            />
          </div>
          {errors.jd && <span className="text-xs text-danger">{errors.jd}</span>}
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
          <Select label={t(lang, "Education Level")} value={form.education} onChange={(e) => set("education", e.target.value)} options={EDU_LEVELS.map((x) => ({ value: x, label: t(lang, x) }))} />
          <Input label={t(lang, "Application Deadline")} type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} error={errors.deadline} />
          <Input label={t(lang, "Vacancies")} value={form.vacancies} onChange={(e) => set("vacancies", e.target.value.replace(/\D/g, ""))} placeholder="1" />
        </div>

        <div className="mt-5">
          <label className="mb-2.5 block text-sm font-semibold text-ink">{t(lang, "Required Documents")}</label>
          <div className="flex flex-col gap-2">
            {DOC_OPTIONS.map((d) => (
              <Check key={d} label={t(lang, d)} checked={form.documents.includes(d)} onChange={() => toggleDoc(d)} />
            ))}
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

        <div className={`${ACTIONS} mt-6`}>
          <Button variant="secondary" onClick={() => persist(mode === "edit" ? null : "Draft")}>
            {t(lang, "Save as Draft")}
          </Button>
          <Button variant="primary" onClick={() => persist("Published")}>
            {t(lang, "Publish Job")}
          </Button>
        </div>
      </div>

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
              <Button variant="secondary" onClick={() => { setShowUpgrade(false); persist(mode === "edit" ? null : "Draft"); }}>
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
