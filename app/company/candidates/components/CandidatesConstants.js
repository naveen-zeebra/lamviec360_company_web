import { getBackendAssetUrl } from "../../../../lib/api/companyApi";

export const SHORTLIST_PLUS = [
  "Shortlisted",
  "Interview Scheduled",
  "Offer Sent",
  "Hired",
  "Post-Hire Tracking",
];

export const COLOR_PRESETS = {
  blue: {
    color: "blue",
    border: "border-t-blue-500",
    dot: "bg-blue-500",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dropRing: "ring-2 ring-blue-400 border-blue-400 bg-blue-50/50",
  },
  amber: {
    color: "amber",
    border: "border-t-amber-500",
    dot: "bg-amber-500",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dropRing: "ring-2 ring-amber-400 border-amber-400 bg-amber-50/50",
  },
  sky: {
    color: "sky",
    border: "border-t-sky-500",
    dot: "bg-sky-500",
    bg: "bg-sky-50 text-sky-700 border-sky-200",
    dropRing: "ring-2 ring-sky-400 border-sky-400 bg-sky-50/50",
  },
  indigo: {
    color: "indigo",
    border: "border-t-indigo-500",
    dot: "bg-indigo-500",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dropRing: "ring-2 ring-indigo-400 border-indigo-400 bg-indigo-50/50",
  },
  purple: {
    color: "purple",
    border: "border-t-purple-500",
    dot: "bg-purple-500",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    dropRing: "ring-2 ring-purple-400 border-purple-400 bg-purple-50/50",
  },
  teal: {
    color: "teal",
    border: "border-t-teal-500",
    dot: "bg-teal-500",
    bg: "bg-teal-50 text-teal-700 border-teal-200",
    dropRing: "ring-2 ring-teal-400 border-teal-400 bg-teal-50/50",
  },
  emerald: {
    color: "emerald",
    border: "border-t-emerald-500",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dropRing: "ring-2 ring-emerald-400 border-emerald-400 bg-emerald-50/50",
  },
  cyan: {
    color: "cyan",
    border: "border-t-cyan-500",
    dot: "bg-cyan-500",
    bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dropRing: "ring-2 ring-cyan-400 border-cyan-400 bg-cyan-50/50",
  },
  rose: {
    color: "rose",
    border: "border-t-rose-500",
    dot: "bg-rose-500",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dropRing: "ring-2 ring-rose-400 border-rose-400 bg-rose-50/50",
  },
  gray: {
    color: "gray",
    border: "border-t-gray-400",
    dot: "bg-gray-400",
    bg: "bg-gray-50 text-gray-600 border-gray-200",
    dropRing: "ring-2 ring-gray-300 border-gray-300 bg-gray-50/50",
  },
};

export const INTERVIEW_ROUNDS = [
  { round: 1, name: "Round 1", label: "Initial Screening / Technical Interview", badge: "bg-purple-100 text-purple-700 border-purple-200" },
  { round: 2, name: "Round 2", label: "Panel / Deep Dive Interview", badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { round: 3, name: "Round 3", label: "Culture Fit / Final Interview", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

export const PIPELINE_STAGES_CONFIG = [
  {
    id: "Applied",
    labelKey: "Applied",
    icon: "inbox",
    color: "blue",
    border: "border-t-blue-500",
    dot: "bg-blue-500",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dropRing: "ring-2 ring-blue-400 border-blue-400 bg-blue-50/50",
    required: true,
  },
  {
    id: "Screening",
    labelKey: "Screening",
    icon: "search",
    color: "amber",
    border: "border-t-amber-500",
    dot: "bg-amber-500",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dropRing: "ring-2 ring-amber-400 border-amber-400 bg-amber-50/50",
    required: true,
  },
  {
    id: "Phone Screening",
    labelKey: "Phone Screening",
    icon: "phone-call",
    color: "sky",
    border: "border-t-sky-500",
    dot: "bg-sky-500",
    bg: "bg-sky-50 text-sky-700 border-sky-200",
    dropRing: "ring-2 ring-sky-400 border-sky-400 bg-sky-50/50",
    required: false,
  },
  {
    id: "Shortlisted",
    labelKey: "Shortlisted",
    icon: "star",
    color: "indigo",
    border: "border-t-indigo-500",
    dot: "bg-indigo-500",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dropRing: "ring-2 ring-indigo-400 border-indigo-400 bg-indigo-50/50",
    required: true,
  },
  {
    id: "Interview Scheduled",
    labelKey: "Interview Scheduled",
    subtitleKey: "2-3 rounds",
    icon: "calendar",
    color: "purple",
    border: "border-t-purple-500",
    dot: "bg-purple-500",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    dropRing: "ring-2 ring-purple-400 border-purple-400 bg-purple-50/50",
    required: true,
  },
  {
    id: "Offer Sent",
    labelKey: "Offer Sent",
    icon: "mail-check",
    color: "teal",
    border: "border-t-teal-500",
    dot: "bg-teal-500",
    bg: "bg-teal-50 text-teal-700 border-teal-200",
    dropRing: "ring-2 ring-teal-400 border-teal-400 bg-teal-50/50",
    required: true,
  },
  {
    id: "Hired",
    labelKey: "Hired",
    icon: "badge-check",
    color: "emerald",
    border: "border-t-emerald-500",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dropRing: "ring-2 ring-emerald-400 border-emerald-400 bg-emerald-50/50",
    required: true,
  },
  {
    id: "Post-Hire Tracking",
    labelKey: "Post-Hire Tracking",
    icon: "user-check",
    color: "cyan",
    border: "border-t-cyan-500",
    dot: "bg-cyan-500",
    bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dropRing: "ring-2 ring-cyan-400 border-cyan-400 bg-cyan-50/50",
    required: false,
  },
  {
    id: "Rejected",
    labelKey: "Rejected",
    icon: "x-circle",
    color: "rose",
    border: "border-t-rose-500",
    dot: "bg-rose-500",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dropRing: "ring-2 ring-rose-400 border-rose-400 bg-rose-50/50",
    required: true,
  },
  {
    id: "Withdrawn",
    labelKey: "Withdrawn",
    icon: "undo-2",
    color: "gray",
    border: "border-t-gray-400",
    dot: "bg-gray-400",
    bg: "bg-gray-50 text-gray-600 border-gray-200",
    dropRing: "ring-2 ring-gray-300 border-gray-300 bg-gray-50/50",
    required: false,
  },
];

export function resolvePipelineConfig(configuredStages) {
  if (!Array.isArray(configuredStages) || configuredStages.length === 0) {
    return PIPELINE_STAGES_CONFIG;
  }
  const colorKeys = Object.keys(COLOR_PRESETS);
  return configuredStages
    .filter((s) => s.enabled !== false)
    .map((s, idx) => {
      const id = s.label || s.id;
      const basePreset = COLOR_PRESETS[s.color] || COLOR_PRESETS[colorKeys[idx % colorKeys.length]] || COLOR_PRESETS.blue;
      return {
        id,
        labelKey: s.label || s.id,
        subtitleKey: (s.id === "interview_scheduled" || s.label?.toLowerCase().includes("interview")) ? "2-3 rounds" : undefined,
        icon: s.icon || (id.toLowerCase().includes("interview") ? "calendar" : id.toLowerCase().includes("screen") ? "search" : id.toLowerCase().includes("offer") ? "mail-check" : id.toLowerCase().includes("hire") ? "badge-check" : id.toLowerCase().includes("reject") ? "x-circle" : "inbox"),
        color: s.color || basePreset.color,
        border: basePreset.border,
        dot: basePreset.dot,
        bg: basePreset.bg,
        dropRing: basePreset.dropRing,
        required: Boolean(s.required),
        isCustom: Boolean(s.isCustom),
        description: s.description || "",
      };
    });
}

export const FIXED_PIPELINE_STAGES = PIPELINE_STAGES_CONFIG.map((s) => s.id);

export const FUNNEL_STAGES = [
  { id: "Applied", label: "Applied", icon: "inbox", color: "blue", border: "border-blue-500", dot: "bg-blue-500" },
  { id: "Screening", label: "Screening", icon: "search", color: "amber", border: "border-amber-500", dot: "bg-amber-500" },
  { id: "Shortlisted", label: "Shortlisted", icon: "star", color: "indigo", border: "border-indigo-500", dot: "bg-indigo-500" },
  { id: "Interview Scheduled", label: "Interview", icon: "calendar", color: "purple", border: "border-purple-500", dot: "bg-purple-500" },
  { id: "Offer Sent", label: "Offer", icon: "mail-check", color: "teal", border: "border-teal-500", dot: "bg-teal-500" },
  { id: "Hired", label: "Hired", icon: "badge-check", color: "emerald", border: "border-emerald-500", dot: "bg-emerald-500" },
];

export const STAGE_COLORS = Object.fromEntries(
  PIPELINE_STAGES_CONFIG.map((s) => [
    s.id,
    {
      bg: s.bg,
      dot: s.dot,
      border: s.border,
      icon: s.icon,
      dropRing: s.dropRing,
    },
  ])
);

export function getStageStyle(stage, pipelineConfig = null) {
  if (Array.isArray(pipelineConfig)) {
    const found = pipelineConfig.find((c) => c.id === stage || c.labelKey === stage);
    if (found) {
      return {
        bg: found.bg,
        dot: found.dot,
        border: found.border,
        icon: found.icon,
        dropRing: found.dropRing,
      };
    }
  }
  return (
    STAGE_COLORS[stage] || {
      bg: "bg-slate-50 text-slate-700 border-slate-200",
      dot: "bg-slate-500",
      border: "border-t-slate-500",
      icon: "inbox",
      dropRing: "ring-2 ring-slate-400 border-slate-400 bg-slate-50/50",
    }
  );
}

export function maskValue(v, type) {
  if (!v) return v;
  if (type === "email") {
    const [n, d] = v.split("@");
    return d ? `${n.slice(0, 1)}•••@${d}` : "•••";
  }
  return v.length > 4 ? `${"•".repeat(v.length - 3)}${v.slice(-3)}` : "•••";
}

export const SORTS = [
  { value: "date", label: "Application Date (Newest)" },
  { value: "score", label: "AI Match Score (High-Low)" },
  { value: "experience", label: "Experience (Most)" },
  { value: "name", label: "Candidate Name (A-Z)" },
];

export const MATCH_FILTERS = [
  { value: "0", label: "All Match Scores" },
  { value: "85", label: "Excellent (85%+)" },
  { value: "70", label: "Good (70%+)" },
  { value: "50", label: "Fair (50%+)" },
];

export const EXP_FILTERS = [
  { value: "all", label: "All Experience" },
  { value: "entry", label: "0 – 2 Years (Entry)" },
  { value: "mid", label: "3 – 5 Years (Mid-level)" },
  { value: "senior", label: "5+ Years (Senior)" },
];

export const PAGE_SIZES = [
  { value: "25", label: "25 per page" },
  { value: "50", label: "50 per page" },
  { value: "100", label: "100 per page" },
  { value: "200", label: "200 per page" },
];

export function getScoreBadgeClass(score) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (score >= 65) return "bg-blue-50 text-blue-700 border border-blue-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}

export function getCandidatePdfUrl(candidate) {
  if (!candidate) return getBackendAssetUrl("/uploads/resumes/Candidate_Resume.pdf");
  const rawUrl = candidate.resumeUrl || candidate.resume_url;
  if (rawUrl && typeof rawUrl === "string") {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
      return trimmed;
    }
    if (trimmed.startsWith("/uploads/")) {
      return getBackendAssetUrl(trimmed);
    }
  }

  const clean = (candidate.name || "Candidate")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  return getBackendAssetUrl(`/uploads/resumes/${clean}_CV.pdf`);
}

// Clean human-readable filename by removing storage UUID / timestamp prefixes
export function cleanResumeFileName(rawName) {
  if (!rawName || typeof rawName !== "string") return "resume.pdf";
  let name = rawName.split("?")[0].split("#")[0];
  try {
    name = decodeURIComponent(name);
  } catch (e) {}
  name = name.split("/").pop().split("\\").pop().replace(/\+/g, " ");

  let prev;
  do {
    prev = name;
    name = name
      .replace(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}[_-]/, "")
      .replace(/^[a-fA-F0-9]{8,64}[_-]/, "")
      .replace(/^\d{10,14}[_-]/, "");
  } while (name !== prev);

  return name.trim() || "resume.pdf";
}

export function getResumeFileInfo(candidate) {
  if (!candidate) {
    return {
      fileType: "none",
      isIframeRenderable: false,
      fileName: "Candidate_Resume.pdf",
      fileUrl: getBackendAssetUrl("/uploads/resumes/Candidate_Resume.pdf"),
    };
  }
  const raw = (candidate.resumeUrl || candidate.resume_url || candidate.resumeFileName || "").toLowerCase();
  const isDocx = raw.endsWith(".docx") || raw.endsWith(".doc");
  const isPdf = raw.endsWith(".pdf") || (!isDocx && Boolean(candidate.resumeUrl || candidate.resume_url));
  const cleanName = candidate.name ? candidate.name.trim().replace(/\s+/g, "_") : "Candidate";
  const rawResumeName = candidate.resumeFileName || candidate.resume_file_name || candidate.resume_name || (candidate.resumeUrl || candidate.resume_url ? (candidate.resumeUrl || candidate.resume_url).split("/").pop() : "");
  const defaultFallback = isDocx ? `${cleanName}_CV.docx` : `${cleanName}_CV.pdf`;
  const fileName = rawResumeName ? cleanResumeFileName(rawResumeName) : defaultFallback;
  const fileUrl = isDocx ? getBackendAssetUrl(candidate.resumeUrl || candidate.resume_url || "#") : getCandidatePdfUrl(candidate);

  return {
    fileType: isDocx ? "docx" : isPdf ? "pdf" : "profile",
    isIframeRenderable: isPdf && !isDocx,
    fileName,
    fileUrl,
  };
}

