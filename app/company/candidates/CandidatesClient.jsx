"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Select, Avatar, Badge } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import Toast, { useToast } from "../../../components/ds/Toast";
import StatusBadge from "../../../components/company/StatusBadge";
import { useLang, t } from "../../../utils/lang";
import {
  getAuth,
  getSettings,
  listJobs,
  getCandidate,
  setCandidateStage,
  bulkSetCandidateStage,
  addCandidateNote,
  setCandidateRating,
  fetchCandidatesPaginated,
  fetchStageCounts,
  listRejectionTemplates,
  scheduleCandidateInterview,
  PIPELINE_STAGES,
  can,
  syncCompanyWithBackend,
} from "../../../lib/companyStore";

const SHORTLIST_PLUS = ["Shortlisted", "Interview Scheduled", "Offer Sent", "Hired"];

const STAGE_COLORS = {
  Applied: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    border: "border-t-blue-500",
  },
  Screening: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    border: "border-t-amber-500",
  },
  Shortlisted: {
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    border: "border-t-indigo-500",
  },
  "Interview Scheduled": {
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    border: "border-t-purple-500",
  },
  "Offer Sent": {
    bg: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
    border: "border-t-teal-500",
  },
  Hired: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    border: "border-t-emerald-500",
  },
  Rejected: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    border: "border-t-rose-500",
  },
};

function maskValue(v, type) {
  if (!v) return v;
  if (type === "email") {
    const [n, d] = v.split("@");
    return d ? `${n.slice(0, 1)}•••@${d}` : "•••";
  }
  return v.length > 4 ? `${"•".repeat(v.length - 3)}${v.slice(-3)}` : "•••";
}

const SORTS = [
  { value: "date", label: "Application Date (Newest)" },
  { value: "score", label: "AI Match Score (High-Low)" },
  { value: "experience", label: "Experience (Most)" },
  { value: "name", label: "Candidate Name (A-Z)" },
];

const MATCH_FILTERS = [
  { value: "0", label: "All Match Scores" },
  { value: "85", label: "Excellent (85%+)" },
  { value: "70", label: "Good (70%+)" },
  { value: "50", label: "Fair (50%+)" },
];

const EXP_FILTERS = [
  { value: "all", label: "All Experience" },
  { value: "entry", label: "0 – 2 Years (Entry)" },
  { value: "mid", label: "3 – 5 Years (Mid-level)" },
  { value: "senior", label: "5+ Years (Senior)" },
];

const PAGE_SIZES = [
  { value: "25", label: "25 per page" },
  { value: "50", label: "50 per page" },
  { value: "100", label: "100 per page" },
];

export default function CandidatesClient() {
  const [lang] = useLang();
  const params = useSearchParams();
  const jobParam = params.get("job") || "";

  // Core state
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'pipeline'
  const [role, setRole] = useState("Viewer");
  const [jobs, setJobs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [privacy, setPrivacy] = useState({ contactVisibility: "always", maskEmail: false, maskPhone: false });

  // Data & Pagination for high volume (1,000 - 5,000)
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, pageSize: 25 });
  const [stageCounts, setStageCounts] = useState({
    Total: 0,
    Applied: 0,
    Screening: 0,
    Shortlisted: 0,
    "Interview Scheduled": 0,
    "Offer Sent": 0,
    Hired: 0,
    Rejected: 0,
  });

  // Filters
  const [activeStage, setActiveStage] = useState("All");
  const [jobFilter, setJobFilter] = useState(jobParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [minScoreFilter, setMinScoreFilter] = useState("0");
  const [expFilter, setExpFilter] = useState("all");
  const [pageSize, setPageSize] = useState("25");
  const [page, setPage] = useState(1);

  // Kanban view column card limits to prevent DOM freezing on 5,000 items
  const [columnLimits, setColumnLimits] = useState({
    Applied: 20,
    Screening: 20,
    Shortlisted: 20,
    "Interview Scheduled": 20,
    "Offer Sent": 20,
    Hired: 20,
    Rejected: 20,
  });

  // Candidate detail drawer
  const [openId, setOpenId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");

  // Modals & Undo
  const [confirmBulk, setConfirmBulk] = useState(null);
  const [undo, setUndo] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState({ templateId: "", note: "" });
  const [resumeCandidate, setResumeCandidate] = useState(null);
  const [resumeModalTab, setResumeModalTab] = useState("pdf"); // 'pdf' | 'profile'

  // Schedule Interview modal state
  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    round: "First Round Technical & Product Interview",
    mode: "video",
    date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    time: "14:00",
    durationMin: 45,
    location: "Google Meet",
    meetingLink: "",
    interviewerName: "Talent Acquisition Team",
    interviewerRole: "Recruiter",
    instructions: "Online video interview invitation from employer. Please join on time.",
    instructionsVi: "Lời mời phỏng vấn trực tuyến từ nhà tuyển dụng. Vui lòng tham gia đúng giờ.",
  });
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [toast, setToast] = useToast();

  const manage = can(role, "candidates.manage");

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    setRole(getAuth().role);
    setJobs(listJobs());
    setPrivacy(getSettings().privacy);
    setTemplates(listRejectionTemplates());

    syncCompanyWithBackend()
      .then(() => {
        setJobs(listJobs());
      })
      .catch(console.warn)
      .finally(() => {
        setReady(true);
      });
  }, []);

  // Fetch candidates and counts
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const countsPromise = fetchStageCounts(jobFilter || null);
      const candidatesPromise = fetchCandidatesPaginated({
        jobId: jobFilter || null,
        stage: activeStage === "All" ? null : activeStage,
        search: debouncedSearch || null,
        minScore: minScoreFilter !== "0" ? Number(minScoreFilter) : null,
        sortBy,
        sortOrder: "desc",
        page,
        pageSize: Number(pageSize),
      });

      const [countsRes, listRes] = await Promise.all([countsPromise, candidatesPromise]);
      if (countsRes) {
        setStageCounts(countsRes);
      }
      if (listRes) {
        let items = listRes.candidates || [];
        // Apply client-side experience filter if needed
        if (expFilter !== "all") {
          items = items.filter((c) => {
            const exp = c.experienceYears || 0;
            if (expFilter === "entry") return exp <= 2;
            if (expFilter === "mid") return exp >= 3 && exp <= 5;
            if (expFilter === "senior") return exp > 5;
            return true;
          });
        }
        setCandidates(items);
        setPagination(listRes.pagination || { total: items.length, totalPages: 1, page, pageSize: Number(pageSize) });
      }
    } catch (err) {
      console.warn("Failed to load candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [jobFilter, activeStage, debouncedSearch, minScoreFilter, expFilter, sortBy, page, pageSize]);

  useEffect(() => {
    if (ready) {
      loadData();
    }
  }, [ready, loadData]);

  // Undo 5-min timer
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [undo]);

  const activeJob = jobs.find((j) => String(j.id) === String(jobFilter));
  const open = openId ? candidates.find((c) => String(c.id) === String(openId)) || getCandidate(openId) : null;
  const jobOf = (id) => jobs.find((j) => String(j.id) === String(id));

  // Stage advancement helpers
  const getNextStage = (curr) => {
    const order = ["Applied", "Screening", "Shortlisted", "Interview Scheduled", "Offer Sent", "Hired"];
    const idx = order.indexOf(curr);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  };

  const openScheduleModal = (candidate) => {
    if (!candidate) return;
    setScheduleCandidate(candidate);
    const defaultDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    setScheduleData({
      round: "First Round Technical & Product Interview",
      mode: "video",
      date: defaultDate,
      time: "14:00",
      durationMin: 45,
      location: "Google Meet",
      meetingLink: `https://meet.google.com/lv3-${candidate.id}`,
      interviewerName: "Talent Acquisition Team",
      interviewerRole: "Recruiter",
      instructions: "Online video interview invitation from employer. Please join on time.",
      instructionsVi: "Lời mời phỏng vấn trực tuyến từ nhà tuyển dụng. Vui lòng tham gia đúng giờ.",
    });
  };

  const move = async (id, stage) => {
    if (stage === "Rejected") {
      setRejectTarget(id);
      setRejectReason({ templateId: templates[0] ? templates[0].id : "", note: "" });
      return;
    }
    if (stage === "Interview Scheduled") {
      const candidate = candidates.find((c) => String(c.id) === String(id)) || getCandidate(id);
      openScheduleModal(candidate);
      return;
    }
    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, stage } : c))
    );
    await setCandidateStage(id, stage);
    setToast(`${t(lang, "Moved to")} ${t(lang, stage)}`);
    loadData();
  };

  const handleScheduleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!scheduleCandidate) return;
    setIsSubmittingSchedule(true);
    try {
      const scheduledAt = `${scheduleData.date} ${scheduleData.time}`;
      const payload = {
        round: scheduleData.round,
        roundName: scheduleData.round,
        at: scheduledAt,
        scheduledAt: scheduledAt,
        durationMin: Number(scheduleData.durationMin) || 45,
        mode: scheduleData.mode,
        location: scheduleData.location,
        meetingLink: scheduleData.meetingLink,
        locationOrLink: scheduleData.mode === "video" ? (scheduleData.meetingLink || scheduleData.location) : scheduleData.location,
        interviewers: [{ name: scheduleData.interviewerName, role: scheduleData.interviewerRole }],
        instructions: scheduleData.instructions,
        instructionsVi: scheduleData.instructionsVi,
      };

      await scheduleCandidateInterview(scheduleCandidate.id, payload);

      setCandidates((prev) =>
        prev.map((c) => (String(c.id) === String(scheduleCandidate.id) ? { ...c, stage: "Interview Scheduled" } : c))
      );

      try {
        const rawSeeker = typeof window !== "undefined" ? localStorage.getItem("lv360-seeker-store-v1") : null;
        if (rawSeeker) {
          const parsed = JSON.parse(rawSeeker);
          if (Array.isArray(parsed.applications)) {
            parsed.applications = parsed.applications.map((app) => {
              if (String(app.id) === String(scheduleCandidate.id) || String(app.jobId) === String(scheduleCandidate.jobId)) {
                return {
                  ...app,
                  stage: "Interview Scheduled",
                  interview: {
                    id: "IV-" + (app.id || Date.now()),
                    status: "invited",
                    at: scheduledAt,
                    durationMin: Number(scheduleData.durationMin) || 45,
                    mode: scheduleData.mode,
                    meetingLink: scheduleData.meetingLink,
                    location: scheduleData.location,
                    round: scheduleData.round,
                    roundVi: scheduleData.round,
                    interviewers: [{ name: scheduleData.interviewerName, role: scheduleData.interviewerRole }],
                    instructions: scheduleData.instructions,
                    instructionsVi: scheduleData.instructionsVi,
                  },
                };
              }
              return app;
            });
            localStorage.setItem("lv360-seeker-store-v1", JSON.stringify(parsed));
            window.dispatchEvent(new Event("lv360-store"));
          }
        }
      } catch (err) {}

      setToast(t(lang, "Interview scheduled successfully!"));
      setScheduleCandidate(null);
      loadData();
    } catch (err) {
      console.error("Failed to schedule interview:", err);
      setToast(t(lang, "Failed to schedule interview. Please try again."));
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    await setCandidateStage(rejectTarget, "Rejected", rejectReason);
    setRejectTarget(null);
    setToast(t(lang, "Candidate moved to Rejected"));
    loadData();
  };

  const handleRating = async (id, rating) => {
    setCandidates((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, rating, matchScore: rating * 20 } : c))
    );
    await setCandidateRating(id, rating);
    setToast(t(lang, "Rating updated"));
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllPage = () => {
    const pageIds = candidates.map((c) => c.id);
    const allSelected = pageIds.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const runBulk = async (stage, reason) => {
    const prev = {};
    selected.forEach((id) => {
      const c = candidates.find((x) => String(x.id) === String(id));
      if (c) prev[id] = c.stage;
    });

    await bulkSetCandidateStage(selected, stage, reason);
    setUndo({ ids: [...selected], prev, stage });
    setSelected([]);
    setConfirmBulk(null);
    setToast(`${selected.length} ${t(lang, "candidates moved to")} ${t(lang, stage)}`);
    loadData();
  };

  const doUndo = async () => {
    if (!undo) return;
    for (const [id, stage] of Object.entries(undo.prev)) {
      await setCandidateStage(id, stage);
    }
    setUndo(null);
    setToast(t(lang, "Bulk action reversed"));
    loadData();
  };

  const contactVisible = (candidate) => {
    if (!candidate) return false;
    if (privacy.contactVisibility === "never") return false;
    if (privacy.contactVisibility === "after_shortlist") return SHORTLIST_PLUS.includes(candidate.stage);
    return true;
  };

  const getCandidatePdfUrl = (candidate) => {
    if (!candidate) return "/uploads/resumes/Candidate_Resume.pdf";
    if (candidate.resumeUrl && candidate.resumeUrl.endsWith(".pdf")) return candidate.resumeUrl;
    if (candidate.resume_url && candidate.resume_url.endsWith(".pdf")) return candidate.resume_url;
    const cleanName = candidate.name ? candidate.name.trim().replace(/\s+/g, "_") : "Candidate";
    return `/uploads/resumes/${cleanName}_CV.pdf`;
  };

  const templateTitle = (id) => (templates.find((x) => x.id === id) || {}).title || "";

  const resetFilters = () => {
    setJobFilter("");
    setActiveStage("All");
    setSearchQuery("");
    setMinScoreFilter("0");
    setExpFilter("all");
    setSortBy("date");
    setPage(1);
  };

  const hasActiveFilters =
    jobFilter || activeStage !== "All" || searchQuery || minScoreFilter !== "0" || expFilter !== "all" || sortBy !== "date";

  // Score styling
  const getScoreBadgeClass = (score) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (score >= 65) return "bg-blue-50 text-blue-700 border border-blue-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
  };

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton width={320} height={36} />
        <Skeleton height={52} />
        <Skeleton height={400} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-ink md:text-3xl">
              {t(lang, "Candidate Pipeline & ATS")}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {stageCounts.Total.toLocaleString()} {t(lang, "Applications")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {t(lang, "Manage high-volume recruitment funnel, screen applicants with AI matching, and take bulk actions.")}
          </p>
        </div>

        {/* View Toggle & Quick Sync */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="inline-flex rounded-lg border border-line bg-card p-1 shadow-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-ink hover:bg-sunken"
              }`}
              title="High-density list view for 1,000+ candidates"
            >
              <Icon name="list" size={14} />
              {t(lang, "Table View")}
            </button>
            <button
              onClick={() => setViewMode("pipeline")}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "pipeline"
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-ink hover:bg-sunken"
              }`}
              title="Kanban stage columns"
            >
              <Icon name="columns" size={14} />
              {t(lang, "Pipeline Board")}
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border border-line bg-card hover:bg-sunken"
            title="Refresh candidate data"
          >
            <Icon name="rotate-ccw" size={14} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* ── 2. Horizontal Stage Tabs with Live Counts ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => {
            setActiveStage("All");
            setPage(1);
          }}
          className={`group flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all ${
            activeStage === "All"
              ? "border-brand bg-brand text-white shadow-xs"
              : "border-line bg-card text-muted hover:border-brand/40 hover:text-ink"
          }`}
        >
          <span>{t(lang, "All Stages")}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
              activeStage === "All" ? "bg-white/20 text-white" : "bg-sunken text-ink"
            }`}
          >
            {stageCounts.Total.toLocaleString()}
          </span>
        </button>

        {PIPELINE_STAGES.map((stg) => {
          const count = stageCounts[stg] || 0;
          const isSelected = activeStage === stg;
          const color = STAGE_COLORS[stg] || STAGE_COLORS.Applied;

          return (
            <button
              key={stg}
              onClick={() => {
                setActiveStage(stg);
                setPage(1);
              }}
              className={`group flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all ${
                isSelected
                  ? "border-brand bg-brand text-white shadow-xs"
                  : "border-line bg-card text-muted hover:border-brand/40 hover:text-ink"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-white" : color.dot}`} />
              <span>{t(lang, stg)}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                  isSelected ? "bg-white/20 text-white" : color.bg
                }`}
              >
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3. High-Performance Filter & Search Toolbar ── */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search Box */}
          <div className="relative lg:col-span-4">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(lang, "Search by name, email, skill, or job...")}
              className="w-full rounded-lg border border-line bg-sunken/40 py-2 pl-9 pr-8 text-sm text-ink placeholder-muted focus:border-brand focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted hover:text-ink"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {/* Job Filter */}
          <div className="lg:col-span-3">
            <Select
              value={jobFilter}
              onChange={(e) => {
                setJobFilter(e.target.value);
                setPage(1);
              }}
              placeholder={t(lang, "All Active Jobs")}
              options={[
                { value: "", label: t(lang, "All Active Jobs") },
                ...jobs.map((j) => ({
                  value: j.id,
                  label: `${j.title} (${j.applicantCount ?? 0})`,
                })),
              ]}
            />
          </div>

          {/* AI Match Score */}
          <div className="lg:col-span-2">
            <Select
              value={minScoreFilter}
              onChange={(e) => {
                setMinScoreFilter(e.target.value);
                setPage(1);
              }}
              options={MATCH_FILTERS.map((f) => ({ value: f.value, label: t(lang, f.label) }))}
            />
          </div>

          {/* Experience Filter */}
          <div className="lg:col-span-2">
            <Select
              value={expFilter}
              onChange={(e) => {
                setExpFilter(e.target.value);
                setPage(1);
              }}
              options={EXP_FILTERS.map((f) => ({ value: f.value, label: t(lang, f.label) }))}
            />
          </div>

          {/* Sort Filter */}
          <div className="lg:col-span-1">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={SORTS.map((s) => ({ value: s.value, label: t(lang, s.label) }))}
            />
          </div>
        </div>

        {/* Sub-toolbar row: Reset and Count Status */}
        <div className="mt-3 flex flex-wrap items-center justify-between border-t border-line/60 pt-3 text-xs text-muted">
          <div className="flex items-center gap-3">
            <span>
              {t(lang, "Showing")}{" "}
              <strong className="text-ink">
                {candidates.length > 0 ? (page - 1) * Number(pageSize) + 1 : 0} –{" "}
                {Math.min(page * Number(pageSize), pagination.total)}
              </strong>{" "}
              {t(lang, "of")} <strong className="text-ink">{pagination.total.toLocaleString()}</strong>{" "}
              {t(lang, "candidates")}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
              >
                <Icon name="x" size={12} />
                {t(lang, "Reset all filters")}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">{t(lang, "Rows per page:")}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-line bg-card px-2 py-1 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
            >
              {PAGE_SIZES.map((ps) => (
                <option key={ps.value} value={ps.value}>
                  {ps.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. Floating Multi-Select & Bulk Actions Bar ── */}
      {manage && selected.length > 0 && (
        <div className="sticky top-4 z-40 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/95 p-3.5 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-black text-white">
              {selected.length}
            </span>
            <span className="text-sm font-bold text-ink">
              {selected.length} {t(lang, "candidates selected")}
            </span>
            <button
              onClick={selectAllPage}
              className="text-xs font-bold text-brand hover:underline"
            >
              {candidates.every((c) => selected.includes(c.id))
                ? t(lang, "Deselect page")
                : t(lang, `Select all ${candidates.length} on this page`)}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                if (e.target.value === "Rejected") setConfirmBulk({ stage: "Rejected", phase: 1 });
                else runBulk(e.target.value);
                e.target.value = "";
              }}
              className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink shadow-xs focus:border-brand focus:outline-none"
            >
              <option value="" disabled>
                {t(lang, "Bulk Move to Stage…")}
              </option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {t(lang, s)}
                </option>
              ))}
            </select>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmBulk({ stage: "Rejected", phase: 1 })}
              className="gap-1.5 text-xs font-bold"
            >
              <Icon name="x-circle" size={13} />
              {t(lang, "Bulk Reject")}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected([])}
              className="text-xs font-bold text-muted hover:text-ink"
            >
              {t(lang, "Cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* ── 5. Undo Banner (5-minute safety window) ── */}
      {undo && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm text-amber-900">
          <div className="flex items-center gap-3">
            <Icon name="rotate-ccw" size={18} className="text-amber-600" />
            <span className="text-sm">
              <strong>{undo.ids.length}</strong> {t(lang, "candidates moved to")} <strong>{undo.stage}</strong>.{" "}
              {t(lang, "You have 5 minutes to revert this change.")}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={doUndo} className="border-amber-300 font-bold">
            {t(lang, "Undo Action")}
          </Button>
        </div>
      )}

      {/* ── 6. View Mode 1: High-Density Table View ── */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-line bg-sunken/60 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th className="w-10 px-4 py-3.5 text-center">
                    {manage && (
                      <input
                        type="checkbox"
                        checked={candidates.length > 0 && candidates.every((c) => selected.includes(c.id))}
                        onChange={selectAllPage}
                        aria-label="Select all on this page"
                        className="h-4 w-4 rounded border-line text-brand focus:ring-brand accent-blue-600"
                      />
                    )}
                  </th>
                  <th className="px-4 py-3.5">{t(lang, "Candidate")}</th>
                  <th className="px-4 py-3.5">{t(lang, "Job & Applied Date")}</th>
                  <th className="px-4 py-3.5 text-center">{t(lang, "AI Match")}</th>
                  <th className="px-4 py-3.5">{t(lang, "Experience & Skills")}</th>
                  <th className="px-4 py-3.5">{t(lang, "Stage / Status")}</th>
                  <th className="px-4 py-3.5 text-center">{t(lang, "Rating")}</th>
                  <th className="px-4 py-3.5 text-right">{t(lang, "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {loading && candidates.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="p-4">
                        <Skeleton height={42} />
                      </td>
                    </tr>
                  ))
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-muted">
                          <Icon name="users" size={24} />
                        </div>
                        <h4 className="mt-3 text-base font-bold text-ink">{t(lang, "No candidates found")}</h4>
                        <p className="mt-1 text-xs text-muted text-center">
                          {hasActiveFilters
                            ? t(lang, "Try adjusting your search criteria or stage filters.")
                            : t(lang, "When candidates apply to your jobs, they will appear here.")}
                        </p>
                        {hasActiveFilters && (
                          <Button variant="secondary" size="sm" onClick={resetFilters} className="mt-4">
                            {t(lang, "Clear all filters")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => {
                    const isRowSelected = selected.includes(c.id);
                    const matchScore = c.matchScore || c.rating * 20 || 85;

                    return (
                      <tr
                        key={c.id}
                        className={`group transition-colors hover:bg-sunken/30 ${
                          isRowSelected ? "bg-blue-50/50" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3 text-center">
                          {manage && (
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={() => toggleSelect(c.id)}
                              aria-label={`Select ${c.name}`}
                              className="h-4 w-4 rounded border-line text-brand focus:ring-brand accent-blue-600"
                            />
                          )}
                        </td>

                        {/* Candidate Name & Contact */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} size={36} />
                            <div className="min-w-0">
                              <button
                                onClick={() => {
                                  setOpenId(c.id);
                                  setNoteDraft("");
                                }}
                                className="block truncate text-left text-sm font-bold text-ink hover:text-brand hover:underline"
                              >
                                {c.name}
                              </button>
                              <div className="flex items-center gap-2 text-xs text-muted truncate">
                                <span>
                                  {!contactVisible(c)
                                    ? t(lang, "Protected")
                                    : privacy.maskEmail
                                    ? maskValue(c.email, "email")
                                    : c.email || t(lang, "No email")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Job Applied & Date */}
                        <td className="px-4 py-3">
                          <span className="block max-w-[200px] truncate text-xs font-semibold text-ink">
                            {c.jobTitle || jobOf(c.jobId)?.title || t(lang, "General Application")}
                          </span>
                          <span className="block text-[11px] text-muted">
                            {c.appliedDate || t(lang, "Recently")}
                          </span>
                        </td>

                        {/* AI Match Score */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black shadow-xs ${getScoreBadgeClass(
                              matchScore
                            )}`}
                            title={t(lang, "AI Match Score based on skills and resume parsing")}
                          >
                            <Icon name="sparkles" size={11} />
                            {matchScore}%
                          </span>
                        </td>

                        {/* Experience & Skills */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-ink">
                              {c.experienceYears} {t(lang, "years exp")}
                            </span>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {Array.isArray(c.skills) && c.skills.length > 0 ? (
                                c.skills.slice(0, 2).map((sk, i) => (
                                  <span
                                    key={i}
                                    className="rounded bg-sunken px-1.5 py-0.5 text-[10px] text-muted font-medium"
                                  >
                                    {sk}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-muted">{c.educationLevel || "Bachelor"}</span>
                              )}
                              {Array.isArray(c.skills) && c.skills.length > 2 && (
                                <span className="text-[10px] text-muted">+{c.skills.length - 2}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Stage Selector */}
                        <td className="px-4 py-3">
                          {manage ? (
                            <select
                              value={c.stage}
                              onChange={(e) => move(c.id, e.target.value)}
                              aria-label={`Change stage for ${c.name}`}
                              className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink shadow-xs focus:border-brand focus:outline-none"
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {t(lang, s)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <StatusBadge kind="stage" value={c.stage} lang={lang} />
                          )}
                        </td>

                        {/* Interactive 5-Star Rating */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                disabled={!manage}
                                onClick={() => handleRating(c.id, star)}
                                aria-label={`Rate ${star} stars`}
                                className={`p-0.5 transition-transform hover:scale-125 ${
                                  (c.rating || 0) >= star ? "text-amber-400" : "text-gray-200"
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setResumeModalTab("pdf");
                                setResumeCandidate(c);
                              }}
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                              title={t(lang, "Show Uploaded PDF Resume")}
                            >
                              <Icon name="file-text" size={14} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setOpenId(c.id);
                                setNoteDraft("");
                              }}
                              className="h-8 w-8 p-0 text-muted hover:text-brand"
                              title={t(lang, "View Details Drawer")}
                            >
                              <Icon name="eye" size={14} />
                            </Button>

                            {getNextStage(c.stage) && manage && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => move(c.id, getNextStage(c.stage))}
                                className="h-8 px-2 text-xs font-bold text-brand hover:bg-brand-subtle"
                                title={`Advance to ${getNextStage(c.stage)}`}
                              >
                                <Icon name="arrow-right" size={13} />
                              </Button>
                            )}

                            {manage && c.stage !== "Rejected" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => move(c.id, "Rejected")}
                                className="h-8 w-8 p-0 text-muted hover:text-danger hover:bg-rose-50"
                                title={t(lang, "Reject")}
                              >
                                <Icon name="x" size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Pagination Bar ── */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between border-t border-line bg-card p-4">
              <span className="text-xs text-muted">
                {t(lang, "Page")} <strong className="text-ink">{page}</strong> {t(lang, "of")}{" "}
                <strong className="text-ink">{pagination.totalPages}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 text-xs font-bold"
                >
                  <Icon name="chevron-left" size={13} />
                  {t(lang, "Previous")}
                </Button>

                {/* Direct Page Jump Buttons */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                    let pageNum = i + 1;
                    if (pagination.totalPages > 5 && page > 3) {
                      pageNum = page - 2 + i;
                      if (pageNum > pagination.totalPages) pageNum = pagination.totalPages - (4 - i);
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                          page === pageNum
                            ? "bg-brand text-white shadow-xs"
                            : "text-muted hover:bg-sunken hover:text-ink"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1 text-xs font-bold"
                >
                  {t(lang, "Next")}
                  <Icon name="chevron-right" size={13} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 7. View Mode 2: Kanban Pipeline Funnel Board ── */}
      {viewMode === "pipeline" && (
        <div className="grid grid-cols-[repeat(7,minmax(280px,1fr))] gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {PIPELINE_STAGES.map((stg) => {
            const stageItems = candidates.filter((c) => c.stage === stg);
            const totalInStage = stageCounts[stg] || stageItems.length;
            const limit = columnLimits[stg] || 20;
            const visibleItems = stageItems.slice(0, limit);
            const hasMore = stageItems.length > limit;
            const color = STAGE_COLORS[stg] || STAGE_COLORS.Applied;

            return (
              <div
                key={stg}
                className={`flex min-w-[280px] flex-col gap-3 rounded-xl border border-line bg-sunken/40 p-3.5 border-t-4 ${color.border}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                    <h3 className="text-xs font-black uppercase tracking-wider text-ink">{t(lang, stg)}</h3>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black ${color.bg}`}>
                    {totalInStage.toLocaleString()}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex flex-col gap-2.5 min-h-[120px]">
                  {visibleItems.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-line/80 py-8 text-center text-xs text-muted">
                      <span>{t(lang, "No candidates in this stage")}</span>
                    </div>
                  ) : (
                    visibleItems.map((c) => (
                      <div
                        key={c.id}
                        className="group relative rounded-lg border border-line bg-card p-3.5 shadow-xs transition-all hover:border-brand/50 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => {
                              setOpenId(c.id);
                              setNoteDraft("");
                            }}
                            className="flex items-center gap-2.5 text-left font-body"
                          >
                            <Avatar name={c.name} size={32} />
                            <div className="min-w-0">
                              <strong className="block truncate text-xs font-bold text-ink group-hover:text-brand">
                                {c.name}
                              </strong>
                              <span className="block max-w-[150px] truncate text-[11px] text-muted">
                                {c.jobTitle || jobOf(c.jobId)?.title}
                              </span>
                            </div>
                          </button>

                          {manage && (
                            <input
                              type="checkbox"
                              checked={selected.includes(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              aria-label={`Select ${c.name}`}
                              className="mt-1 h-3.5 w-3.5 rounded border-line text-brand accent-blue-600"
                            />
                          )}
                        </div>

                        {/* Card Meta Badges */}
                        <div className="mt-3 flex items-center justify-between text-[11px]">
                          <span className={`rounded-full px-2 py-0.5 font-bold ${getScoreBadgeClass(c.matchScore)}`}>
                            ★ {c.matchScore}%
                          </span>
                          <span className="text-muted font-medium">{c.experienceYears} yrs exp</span>
                        </div>

                        {/* Resume / CV Quick Access */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2 text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResumeModalTab("pdf");
                              setResumeCandidate(c);
                            }}
                            className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            title={t(lang, "Show Uploaded PDF Resume")}
                          >
                            <Icon name="file-text" size={13} />
                            <span>{t(lang, "View PDF")}</span>
                          </button>
                          {(c.resumeUrl || c.resume_url) && (
                            <a
                              href={c.resumeUrl || c.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-muted hover:text-ink transition-colors font-semibold"
                              title={t(lang, "Download file attachment")}
                            >
                              <Icon name="download" size={12} />
                              <span>{t(lang, "PDF")}</span>
                            </a>
                          )}
                        </div>

                        {/* Quick Move Dropdown */}
                        {manage && (
                          <div className="mt-3 pt-2.5 border-t border-line/60">
                            <select
                              value={c.stage}
                              onChange={(e) => move(c.id, e.target.value)}
                              aria-label={`Move stage for ${c.name}`}
                              className="w-full rounded-md border border-line bg-sunken/40 px-2 py-1 text-[11px] font-semibold text-ink focus:border-brand focus:outline-none"
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {t(lang, s)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Load more in column */}
                  {hasMore && (
                    <button
                      onClick={() =>
                        setColumnLimits((prev) => ({
                          ...prev,
                          [stg]: (prev[stg] || 20) + 20,
                        }))
                      }
                      className="w-full rounded-lg border border-line bg-card py-2 text-center text-xs font-bold text-brand hover:bg-sunken transition-colors"
                    >
                      +{stageItems.length - limit} {t(lang, "more")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 8. Slide-over Candidate Profile Drawer ── */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setOpenId(null)}
        >
          <aside
            className="h-full w-full max-w-[500px] overflow-y-auto bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
            role="dialog"
            aria-modal="true"
            aria-label={open.name}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-card/95 p-5 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <Avatar name={open.name} size={48} />
                <div>
                  <h2 className="text-lg font-black text-ink">{open.name}</h2>
                  <p className="text-xs text-muted font-medium">
                    {open.jobTitle || jobOf(open.jobId)?.title} · {open.appliedDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenId(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink transition-colors"
                aria-label="Close drawer"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-6 space-y-6">
              {/* Quick Actions & Stage Transition */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-sunken/40 p-3.5">
                <div className="flex items-center gap-2">
                  <StatusBadge kind="stage" value={open.stage} lang={lang} />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getScoreBadgeClass(open.matchScore)}`}>
                    ★ {open.matchScore}% Match
                  </span>
                </div>

                {manage && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openScheduleModal(open)}
                      className="gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100"
                    >
                      <Icon name="calendar" size={13} />
                      {t(lang, "Schedule Interview")}
                    </Button>
                    {getNextStage(open.stage) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => move(open.id, getNextStage(open.stage))}
                        className="gap-1.5 text-xs font-bold"
                      >
                        {t(lang, "Advance to")} {t(lang, getNextStage(open.stage))}
                        <Icon name="arrow-right" size={13} />
                      </Button>
                    )}
                    {open.stage !== "Rejected" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => move(open.id, "Rejected")}
                        className="text-xs font-bold text-danger hover:bg-rose-50"
                      >
                        {t(lang, "Reject")}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Star Rating Section */}
              <div className="flex items-center justify-between rounded-xl border border-line bg-card p-3.5">
                <span className="text-xs font-bold text-ink">{t(lang, "Recruiter Rating")}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={!manage}
                      onClick={() => handleRating(open.id, star)}
                      className={`text-lg transition-transform hover:scale-125 ${
                        (open.rating || 0) >= star ? "text-amber-400" : "text-gray-200"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact & Professional Details */}
              <div className="rounded-xl border border-line bg-card p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted">{t(lang, "Candidate Overview")}</h3>
                <dl className="divide-y divide-line/60 text-xs">
                  <div className="flex justify-between py-2">
                    <dt className="text-muted">{t(lang, "Email Address")}</dt>
                    <dd className="font-semibold text-ink">
                      {!contactVisible(open)
                        ? t(lang, "Hidden by privacy policy")
                        : privacy.maskEmail
                        ? maskValue(open.email, "email")
                        : open.email || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-muted">{t(lang, "Phone Number")}</dt>
                    <dd className="font-semibold text-ink">
                      {!contactVisible(open)
                        ? t(lang, "Hidden by privacy policy")
                        : privacy.maskPhone
                        ? maskValue(open.phone, "phone")
                        : open.phone || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-muted">{t(lang, "Total Experience")}</dt>
                    <dd className="font-semibold text-ink">{open.experienceYears} {t(lang, "years")}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-muted">{t(lang, "Education Level")}</dt>
                    <dd className="font-semibold text-ink">{t(lang, open.educationLevel || "Bachelor's Degree")}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-muted">{t(lang, "Applied Date")}</dt>
                    <dd className="font-semibold text-ink">{open.appliedDate}</dd>
                  </div>
                </dl>
              </div>

              {/* Skills Tags */}
              {Array.isArray(open.skills) && open.skills.length > 0 && (
                <div className="rounded-xl border border-line bg-card p-4 space-y-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted">{t(lang, "Key Skills")}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {open.skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-line bg-sunken px-2.5 py-1 text-xs font-medium text-ink"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {open.coverLetter && (
                <div className="rounded-xl border border-line bg-card p-4 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted">{t(lang, "Cover Letter")}</h3>
                  <p className="rounded-lg bg-sunken/40 p-3 text-xs leading-relaxed text-ink italic">
                    "{open.coverLetter}"
                  </p>
                </div>
              )}

              {/* Resume Document Link */}
              <div className="rounded-xl border border-line bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-xs">
                      <Icon name="file-text" size={20} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-ink">
                        {open.resumeFileName || `${open.name?.replace(/\s+/g, "_")}_CV.pdf`}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {t(lang, "Candidate Uploaded PDF Resume")}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                    PDF 1.4
                  </span>
                </div>

                {/* Inline Mini PDF Quick Peek */}
                <div className="relative h-44 w-full overflow-hidden rounded-lg border border-line bg-slate-100 group">
                  <iframe
                    src={`${getCandidatePdfUrl(open)}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-0 pointer-events-none"
                    title="Resume Quick Peek"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent flex items-end justify-between p-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate max-w-[200px]">
                      <Icon name="file-text" size={14} className="text-blue-400" />
                      {open.resumeFileName || `${open.name?.replace(/\s+/g, "_")}_CV.pdf`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setResumeModalTab("pdf");
                        setResumeCandidate(open);
                      }}
                      className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-ink shadow hover:bg-gray-100 transition-colors shrink-0"
                    >
                      {t(lang, "Expand PDF")}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-line/60">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setResumeModalTab("pdf");
                      setResumeCandidate(open);
                    }}
                    className="flex-1 gap-1.5 text-xs font-bold"
                  >
                    <Icon name="file-text" size={13} />
                    {t(lang, "Show Uploaded PDF")}
                  </Button>

                  <a
                    href={getCandidatePdfUrl(open)}
                    download={open.resumeFileName || `${open.name?.replace(/\s+/g, "_")}_CV.pdf`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-sunken px-3 py-1.5 text-xs font-bold text-ink hover:bg-card transition-colors shadow-xs"
                    title={t(lang, "Download attachment")}
                  >
                    <Icon name="download" size={13} />
                    {t(lang, "Download")}
                  </a>
                </div>
              </div>

              {/* Rejection Details if Rejected */}
              {open.stage === "Rejected" && (open.rejectionTemplateId || open.rejectionNote) && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 space-y-1.5">
                  <strong className="block font-bold">{t(lang, "Rejection Reason & Record")}</strong>
                  {open.rejectionTemplateId && <span>{templateTitle(open.rejectionTemplateId)}</span>}
                  {open.rejectionNote && <p className="text-rose-800 italic">"{open.rejectionNote}"</p>}
                </div>
              )}

              {/* Internal Notes Feed */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                  {t(lang, "Internal Recruiter Notes")}
                </h3>
                <div className="flex flex-col gap-2">
                  {(!open.notes || open.notes.length === 0) && (
                    <p className="text-xs text-muted italic">{t(lang, "No notes recorded yet.")}</p>
                  )}
                  {open.notes?.map((n) => (
                    <div key={n.id} className="rounded-lg border border-line bg-sunken/40 p-3 text-xs">
                      <p className="text-ink leading-relaxed">{n.text}</p>
                      <span className="mt-1 block text-[10px] text-muted">
                        {n.author} · {n.at}
                      </span>
                    </div>
                  ))}
                </div>

                {manage && (
                  <div className="flex gap-2 pt-1">
                    <textarea
                      rows={2}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder={t(lang, "Write an internal note… (visible to team only)")}
                      className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink placeholder-muted focus:border-brand focus:outline-none"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (!noteDraft.trim()) return;
                        await addCandidateNote(open.id, noteDraft.trim(), getAuth().name);
                        setNoteDraft("");
                        setToast(t(lang, "Note saved"));
                        loadData();
                      }}
                      className="self-end font-bold"
                    >
                      {t(lang, "Add")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── 9. Rejection Modal ── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-ink">{t(lang, "Reject Candidate")}</h3>
              <button onClick={() => setRejectTarget(null)} className="text-muted hover:text-ink">
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {t(lang, "Select a standardized rejection template. This reason will be archived on the candidate record.")}
            </p>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Rejection Template")}</label>
              <select
                value={rejectReason.templateId}
                onChange={(e) => setRejectReason({ ...rejectReason, templateId: e.target.value })}
                className="w-full rounded-lg border border-line bg-card p-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
              >
                <option value="">{t(lang, "No specific reason")}</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Internal Note (Optional)")}</label>
              <textarea
                rows={2}
                value={rejectReason.note}
                onChange={(e) => setRejectReason({ ...rejectReason, note: e.target.value })}
                placeholder={t(lang, "Add optional context for your hiring team…")}
                className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setRejectTarget(null)}>
                {t(lang, "Cancel")}
              </Button>
              <Button variant="danger" size="sm" onClick={confirmReject}>
                {t(lang, "Confirm Rejection")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9b. Schedule Interview Popup Modal ── */}
      {scheduleCandidate && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 md:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                  📅
                </div>
                <div>
                  <h3 className="text-base font-black text-ink">{t(lang, "Schedule Candidate Interview")}</h3>
                  <p className="text-xs text-muted">
                    {t(lang, "Candidate")}: <strong className="text-ink">{scheduleCandidate.name}</strong> • {scheduleCandidate.jobTitle || "Job Application"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleCandidate(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink transition-colors"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Form inputs */}
            <form onSubmit={handleScheduleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Interview Round / Title */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Interview Title / Round Name")}</label>
                <input
                  type="text"
                  required
                  value={scheduleData.round}
                  onChange={(e) => setScheduleData({ ...scheduleData, round: e.target.value })}
                  placeholder="e.g. First Round Technical & Product Interview"
                  className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink font-semibold focus:border-brand focus:outline-none"
                />
              </div>

              {/* Format / Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Interview Format")}</label>
                  <select
                    value={scheduleData.mode}
                    onChange={(e) => setScheduleData({ ...scheduleData, mode: e.target.value })}
                    className="w-full rounded-lg border border-line bg-card p-2.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="video">🎥 {t(lang, "Video Call (Online)")}</option>
                    <option value="phone">📞 {t(lang, "Phone Call")}</option>
                    <option value="on-site">📍 {t(lang, "On-site Interview")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Duration (Minutes)")}</label>
                  <select
                    value={scheduleData.durationMin}
                    onChange={(e) => setScheduleData({ ...scheduleData, durationMin: Number(e.target.value) })}
                    className="w-full rounded-lg border border-line bg-card p-2.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                  >
                    <option value={30}>30 {t(lang, "Minutes")}</option>
                    <option value={45}>45 {t(lang, "Minutes")}</option>
                    <option value={60}>60 {t(lang, "Minutes")}</option>
                    <option value={90}>90 {t(lang, "Minutes")}</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Date")}</label>
                  <input
                    type="date"
                    required
                    value={scheduleData.date}
                    onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                    className="w-full rounded-lg border border-line bg-card p-2.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Time")}</label>
                  <input
                    type="time"
                    required
                    value={scheduleData.time}
                    onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                    className="w-full rounded-lg border border-line bg-card p-2.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Meeting Link or Location Address */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  {scheduleData.mode === "video" ? t(lang, "Video Meeting Link") : t(lang, "Location / Office Address")}
                </label>
                <input
                  type="text"
                  required
                  value={scheduleData.mode === "video" ? scheduleData.meetingLink : scheduleData.location}
                  onChange={(e) =>
                    scheduleData.mode === "video"
                      ? setScheduleData({ ...scheduleData, meetingLink: e.target.value, location: "Google Meet" })
                      : setScheduleData({ ...scheduleData, location: e.target.value })
                  }
                  placeholder={
                    scheduleData.mode === "video"
                      ? "e.g. https://meet.google.com/lv3-xxxx"
                      : "e.g. Floor 8, VNG Campus, District 7, Ho Chi Minh City"
                  }
                  className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink font-semibold focus:border-brand focus:outline-none"
                />
              </div>

              {/* Interviewers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Interviewer Name")}</label>
                  <input
                    type="text"
                    value={scheduleData.interviewerName}
                    onChange={(e) => setScheduleData({ ...scheduleData, interviewerName: e.target.value })}
                    placeholder="e.g. Talent Acquisition Team"
                    className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink font-semibold focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Interviewer Role")}</label>
                  <input
                    type="text"
                    value={scheduleData.interviewerRole}
                    onChange={(e) => setScheduleData({ ...scheduleData, interviewerRole: e.target.value })}
                    placeholder="e.g. Recruiter / Engineering Lead"
                    className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink font-semibold focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Instructions for Candidate")}</label>
                <textarea
                  rows={2}
                  value={scheduleData.instructions}
                  onChange={(e) => setScheduleData({ ...scheduleData, instructions: e.target.value })}
                  placeholder={t(lang, "e.g. Online video interview invitation from employer. Please join on time.")}
                  className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button variant="secondary" size="sm" type="button" onClick={() => setScheduleCandidate(null)}>
                  {t(lang, "Cancel")}
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmittingSchedule}>
                  <Icon name={isSubmittingSchedule ? "rotate-ccw" : "calendar"} size={14} className={isSubmittingSchedule ? "animate-spin" : ""} />
                  {isSubmittingSchedule ? t(lang, "Scheduling...") : t(lang, "Confirm & Schedule Interview")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 10. Bulk Rejection Confirmation Modal ── */}
      {confirmBulk && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-rose-600">
                {t(lang, "Reject")} {selected.length} {t(lang, "Candidates?")}
              </h3>
              <button onClick={() => setConfirmBulk(null)} className="text-muted hover:text-ink">
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 leading-relaxed">
              {t(
                lang,
                "This action will move all selected candidates to the Rejected stage. You will have a 5-minute safety window to undo."
              )}
            </div>

            {templates.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">{t(lang, "Rejection Template")}</label>
                <select
                  value={confirmBulk.templateId || ""}
                  onChange={(e) => setConfirmBulk({ ...confirmBulk, templateId: e.target.value })}
                  className="w-full rounded-lg border border-line bg-card p-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">{t(lang, "No specific reason")}</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmBulk(null)}>
                {t(lang, "Cancel")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => runBulk("Rejected", { templateId: confirmBulk.templateId || "" })}
              >
                {t(lang, "Reject All Selected")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 11. Full Interactive Resume & CV Viewer Modal ── */}
      {resumeCandidate && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setResumeCandidate(null)}
        >
          <div
            className="relative flex h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-card shadow-2xl overflow-hidden border border-line animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-line bg-sunken/40 px-6 py-3.5 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-xs">
                  <Icon name="file-text" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-ink">{resumeCandidate.name}</h2>
                    <StatusBadge kind="stage" value={resumeCandidate.stage} lang={lang} />
                  </div>
                  <p className="text-xs text-muted">
                    {resumeCandidate.jobTitle || jobOf(resumeCandidate.jobId)?.title} · {t(lang, "Applied")}: {resumeCandidate.appliedDate}
                  </p>
                </div>
              </div>

              {/* View Switcher Tabs: Uploaded PDF vs Parsed Profile */}
              <div className="inline-flex rounded-lg border border-line bg-card p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setResumeModalTab("pdf")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    resumeModalTab === "pdf"
                      ? "bg-brand text-white shadow-xs"
                      : "text-muted hover:text-ink hover:bg-sunken"
                  }`}
                >
                  <Icon name="file-text" size={13} />
                  <span>{t(lang, "Uploaded PDF")}</span>
                  <span className={`rounded px-1.5 py-0.2 text-[10px] uppercase font-black ${
                    resumeModalTab === "pdf" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
                  }`}>
                    PDF
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setResumeModalTab("profile")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    resumeModalTab === "profile"
                      ? "bg-brand text-white shadow-xs"
                      : "text-muted hover:text-ink hover:bg-sunken"
                  }`}
                >
                  <Icon name="user" size={13} />
                  <span>{t(lang, "Profile & AI Summary")}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={getCandidatePdfUrl(resumeCandidate)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink hover:bg-sunken transition-all shadow-xs"
                  title="Open PDF in new browser tab"
                >
                  <Icon name="external-link" size={13} />
                  <span className="hidden sm:inline">{t(lang, "New Tab")}</span>
                </a>
                <a
                  href={getCandidatePdfUrl(resumeCandidate)}
                  download={resumeCandidate.resumeFileName || `${resumeCandidate.name?.replace(/\s+/g, "_")}_CV.pdf`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink hover:bg-sunken transition-all shadow-xs"
                  title="Download PDF"
                >
                  <Icon name="download" size={13} />
                  <span className="hidden sm:inline">{t(lang, "Download")}</span>
                </a>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink hover:bg-sunken transition-all shadow-xs"
                  title="Print CV"
                >
                  <Icon name="printer" size={13} />
                  <span className="hidden sm:inline">{t(lang, "Print")}</span>
                </button>
                <button
                  onClick={() => setResumeCandidate(null)}
                  className="rounded-lg p-2 text-muted hover:bg-sunken hover:text-ink transition-colors"
                  aria-label="Close modal"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Switch between PDF Embed and Parsed Profile */}
            {resumeModalTab === "pdf" ? (
              <div className="flex-1 w-full h-full flex flex-col bg-slate-900/5 overflow-hidden">
                {/* PDF Status & Info Sub-Bar */}
                <div className="flex flex-wrap items-center justify-between border-b border-line bg-card/90 px-6 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                      PDF 1.4
                    </span>
                    <span className="font-bold text-ink">
                      {resumeCandidate.resumeFileName || `${resumeCandidate.name?.replace(/\s+/g, "_")}_CV.pdf`}
                    </span>
                    <span className="hidden md:inline text-muted">
                      · {t(lang, "Candidate uploaded PDF document")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                      <Icon name="check-circle" size={12} />
                      {t(lang, "Active Document")}
                    </span>
                    <a
                      href={getCandidatePdfUrl(resumeCandidate)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-brand hover:underline inline-flex items-center gap-1"
                    >
                      <Icon name="maximize-2" size={11} />
                      {t(lang, "Open Full Window")}
                    </a>
                  </div>
                </div>

                {/* Embedded PDF iframe */}
                <div className="flex-1 w-full h-full relative bg-slate-100">
                  <iframe
                    src={`${getCandidatePdfUrl(resumeCandidate)}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-0 absolute inset-0"
                    title={`${resumeCandidate.name} - Resume PDF`}
                  />
                </div>
              </div>
            ) : (
              /* Modal Scrollable CV Document View */
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-sunken/20">
                <div className="mx-auto max-w-3xl rounded-xl border border-line bg-card p-8 md:p-10 shadow-sm space-y-8">
                  {/* Header Banner */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-line pb-6">
                    <div className="flex items-center gap-4">
                      <Avatar name={resumeCandidate.name} size={64} />
                      <div>
                        <h1 className="text-2xl font-black text-ink">{resumeCandidate.name}</h1>
                        <p className="text-sm font-semibold text-brand">
                          {resumeCandidate.headline || resumeCandidate.candidate_headline || `Candidate for ${resumeCandidate.jobTitle || "Open Position"}`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                          <span>✉ {contactVisible(resumeCandidate) ? resumeCandidate.email : t(lang, "Protected by policy")}</span>
                          <span>☎ {contactVisible(resumeCandidate) ? resumeCandidate.phone : t(lang, "Protected by policy")}</span>
                          <span>📍 Vietnam</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black shadow-xs ${getScoreBadgeClass(resumeCandidate.matchScore)}`}>
                        ★ {resumeCandidate.matchScore}% Match Score
                      </span>
                      <span className="text-xs font-semibold text-muted">
                        {resumeCandidate.experienceYears} {t(lang, "years experience")}
                      </span>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-2.5">
                      {t(lang, "Executive Summary")}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink/90">
                      {resumeCandidate.bio ||
                        `Experienced professional with ${resumeCandidate.experienceYears} years in the technology industry, demonstrating strong problem-solving capabilities, cross-functional collaboration, and technical proficiency. Actively seeking to contribute expertise to ${resumeCandidate.jobTitle || "this position"}.`}
                    </p>
                  </div>

                  {/* Core Competencies & Skills */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-2.5">
                      {t(lang, "Core Competencies & Skills")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(resumeCandidate.skills) && resumeCandidate.skills.length > 0
                        ? resumeCandidate.skills
                        : ["Technical Problem Solving", "Software Architecture", "Team Leadership", "Agile / Scrum", "Code Review", "API Design"]
                      ).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="rounded-lg border border-brand/20 bg-brand-subtle/50 px-3 py-1 text-xs font-bold text-brand"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-3">
                      {t(lang, "Professional Experience")}
                    </h3>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-line bg-sunken/30 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-ink">Senior Specialist / Engineer</h4>
                            <span className="text-xs text-muted">Technology Solutions Vietnam · Full-time</span>
                          </div>
                          <span className="text-xs font-semibold text-muted">
                            {resumeCandidate.experienceYears > 0 ? `${resumeCandidate.experienceYears} yrs total` : "Recent"}
                          </span>
                        </div>
                        <ul className="mt-2.5 list-disc pl-5 text-xs text-ink/80 space-y-1">
                          <li>Delivered high-impact product features and collaborated with multidisciplinary agile teams.</li>
                          <li>Architected scalable workflows adhering to industry best practices and quality standards.</li>
                          <li>Spearheaded performance optimizations resulting in enhanced application responsiveness.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-2.5">
                      {t(lang, "Education & Credentials")}
                    </h3>
                    <div className="rounded-lg border border-line p-3.5 flex justify-between items-center text-xs">
                      <div>
                        <strong className="block text-sm text-ink">{resumeCandidate.educationLevel || "Bachelor's Degree"} in Computer Science / Information Technology</strong>
                        <span className="text-muted">Accredited University, Vietnam</span>
                      </div>
                      <Badge tone="success">{t(lang, "Verified")}</Badge>
                    </div>
                  </div>

                  {/* Certifications & Professional Licenses */}
                  {(resumeCandidate.certifications?.length > 0 || resumeCandidate.certification) && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-2.5">
                        {t(lang, "Certifications & Professional Licenses")}
                      </h3>
                      <div className="space-y-2">
                        {(resumeCandidate.certifications?.length > 0
                          ? resumeCandidate.certifications
                          : [resumeCandidate.certification]
                        ).filter(Boolean).map((cert, cIdx) => (
                          <div key={cIdx} className="rounded-lg border border-line bg-card p-3.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-brand-subtle flex items-center justify-center text-brand font-bold text-sm shrink-0">
                                🎖️
                              </span>
                              <div>
                                <strong className="block text-sm text-ink">{cert.name}</strong>
                                <span className="text-muted">
                                  {cert.issuer} {cert.issueDate ? `· ${cert.issueDate}` : ""} {cert.credentialId ? `(ID: ${cert.credentialId})` : ""}
                                </span>
                              </div>
                            </div>
                            {cert.fileData ? (
                              <a
                                href={cert.fileData}
                                download={cert.fileName || "Certification.pdf"}
                                className="px-2.5 py-1 text-xs font-semibold rounded border border-line bg-surface hover:bg-sunken text-ink transition-colors flex items-center gap-1"
                              >
                                <Icon name="download" size={12} />
                                <span>{t(lang, "View Certificate")}</span>
                              </a>
                            ) : (
                              <Badge tone="info">{t(lang, "Certified")}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cover Letter */}
                  {resumeCandidate.coverLetter && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-2.5">
                        {t(lang, "Applicant Statement / Cover Letter")}
                      </h3>
                      <blockquote className="rounded-xl border-l-4 border-brand bg-brand-subtle/20 p-4 text-xs italic leading-relaxed text-ink">
                        "{resumeCandidate.coverLetter}"
                      </blockquote>
                    </div>
                  )}

                  {/* Original Document Attachment Footer */}
                  <div className="rounded-xl border border-line bg-sunken/40 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Icon name="file-text" size={24} className="text-brand" />
                      <div>
                        <span className="block text-xs font-bold text-ink">
                          {resumeCandidate.resumeFileName || `${resumeCandidate.name?.replace(/\s+/g, "_")}_CV.pdf`}
                        </span>
                        <span className="block text-[11px] text-muted">
                          {t(lang, "Uploaded file attachment on record")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setResumeModalTab("pdf")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-sunken transition-colors shadow-xs"
                      >
                        <Icon name="file-text" size={13} />
                        {t(lang, "Switch to PDF View")}
                      </button>
                      <a
                        href={getCandidatePdfUrl(resumeCandidate)}
                        download={resumeCandidate.resumeFileName || `${resumeCandidate.name?.replace(/\s+/g, "_")}_CV.pdf`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand-hover transition-colors shadow-xs"
                      >
                        <Icon name="download" size={13} />
                        {t(lang, "Download Attachment")}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast msg={toast} />
    </div>
  );
}
