"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useLang, t } from "../../../utils/lang";
import Button from "../../../components/ds/Button";
import Icon from "../../../components/ds/Icon";
import Toast, { useToast } from "../../../components/ds/Toast";
import {
  getAuth,
  can,
  getSettings,
  getCandidate,
  setCandidateStage,
  bulkSetCandidateStage,
  scheduleCandidateInterview,
  fetchCandidatesPaginated,
  fetchStageCounts,
  listRejectionTemplates,
  exportCandidatesCsv,
} from "../../../lib/companyStore";
import {
  FIXED_PIPELINE_STAGES,
  SHORTLIST_PLUS,
} from "./components/CandidatesConstants";
import CandidatesHeader from "./components/CandidatesHeader";
import CandidatesFilters from "./components/CandidatesFilters";
import CandidatesTableView from "./components/CandidatesTableView";
import CandidatesPipelineBoard from "./components/CandidatesPipelineBoard";
import CandidatesSpeedReview from "./components/CandidatesSpeedReview";
import CandidateDetailDrawer from "./components/CandidateDetailDrawer";
import CandidateRejectModal from "./components/CandidateRejectModal";
import CandidateScheduleModal from "./components/CandidateScheduleModal";
import CandidateDocViewerModal from "./components/CandidateDocViewerModal";
import CandidateResumeModal from "./components/CandidateResumeModal";
import CandidateBulkModal from "./components/CandidateBulkModal";

export { FIXED_PIPELINE_STAGES, PIPELINE_STAGES_CONFIG } from "./components/CandidatesConstants";

export default function CandidatesClient() {
  const [lang] = useLang();
  const params = useSearchParams();
  const jobParam = params.get("job") || "";

  // Core state
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'pipeline' | 'speed'
  const [density, setDensity] = useState("comfortable"); // 'comfortable' | 'compact'
  const [role, setRole] = useState("Viewer");

  // Selection & Active Filters
  const [jobFilter, setJobFilter] = useState(jobParam);
  const [jobs, setJobs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [privacy, setPrivacy] = useState({
    contactVisibility: "always",
    maskEmail: false,
    maskPhone: false,
  });

  const [candidates, setCandidates] = useState([]);
  const [stageCounts, setStageCounts] = useState({
    Total: 0,
    Applied: 0,
    Screening: 0,
    "Phone Screening": 0,
    Shortlisted: 0,
    "Interview Scheduled": 0,
    "Offer Sent": 0,
    Hired: 0,
    "Post-Hire Tracking": 0,
    Rejected: 0,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    pageSize: 25,
  });

  // Table & Board states
  const [activeStage, setActiveStage] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [minScoreFilter, setMinScoreFilter] = useState("0");
  const [expFilter, setExpFilter] = useState("all");
  const [pageSize, setPageSize] = useState("25");
  const [page, setPage] = useState(1);
  const [jumpPage, setJumpPage] = useState("");
  const [showFunnel, setShowFunnel] = useState(true);

  // Selections
  const [selected, setSelected] = useState([]);
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [noteDraft, setNoteDraft] = useState("");
  const [showAiExplain, setShowAiExplain] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Undo safety window
  const [undo, setUndo] = useState(null);

  // Modal states
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState({ templateId: "", note: "" });
  const [rejectDelayHours, setRejectDelayHours] = useState(24);
  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    round: "First Round Technical & Product Interview",
    mode: "video",
    date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    time: "14:00",
    durationMin: 45,
    location: "Google Meet",
    meetingLink: "https://meet.google.com/lv3-interview",
    interviewerName: "Talent Acquisition Team",
    interviewerRole: "Recruiter",
    instructions: "Online video interview invitation from employer. Please join on time.",
  });
  const [resumeCandidate, setResumeCandidate] = useState(null);
  const [resumeModalTab, setResumeModalTab] = useState("pdf");
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docViewerZoom, setDocViewerZoom] = useState(100);
  const [confirmBulk, setConfirmBulk] = useState(null);
  const [toast, setToast] = useToast();

  const manage = can(role, "candidates.manage");
  const activeJob = jobs.find((j) => String(j.id) === String(jobFilter)) || null;
  const open = openId
    ? candidates.find((c) => String(c.id) === String(openId)) || getCandidate(openId)
    : null;

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 280);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Initial setup: Jobs, Auth, Privacy
  useEffect(() => {
    setRole(getAuth()?.role || "Company Admin");
    setPrivacy(getSettings()?.privacy || {});
    setTemplates(listRejectionTemplates());

    // Fetch jobs for switcher
    import("../../../lib/companyStore").then(({ getStore }) => {
      const storeJobs = getStore()?.jobs || [];
      setJobs(storeJobs);
      if (storeJobs.length > 0) {
        const initialJobId = jobParam && storeJobs.some((j) => String(j.id) === String(jobParam))
          ? jobParam
          : storeJobs[0].id;
        setJobFilter(initialJobId);
      }
      setReady(true);
    });
  }, [jobParam]);

  // Load paginated data
  const loadData = useCallback(async () => {
    if (!jobFilter) {
      setCandidates([]);
      setPagination({ total: 0, totalPages: 1, page: 1, pageSize: Number(pageSize) });
      return;
    }

    setLoading(true);
    try {
      let minExp = null;
      let maxExp = null;
      if (expFilter === "entry") {
        minExp = 0;
        maxExp = 2;
      } else if (expFilter === "mid") {
        minExp = 3;
        maxExp = 5;
      } else if (expFilter === "senior") {
        minExp = 6;
      }

      const countsPromise = fetchStageCounts(jobFilter);
      const candidatesPromise = fetchCandidatesPaginated({
        jobId: jobFilter,
        stage: activeStage === "All" ? null : activeStage,
        search: debouncedSearch || null,
        sortBy,
        minScore: minScoreFilter !== "0" ? Number(minScoreFilter) : null,
        minExperience: minExp,
        maxExperience: maxExp,
        page,
        pageSize: Number(pageSize),
      });

      const [counts, candRes] = await Promise.all([countsPromise, candidatesPromise]);
      setStageCounts(counts);
      setCandidates(candRes.candidates);
      setPagination(candRes.pagination);
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [jobFilter, activeStage, debouncedSearch, sortBy, minScoreFilter, expFilter, page, pageSize]);

  useEffect(() => {
    if (ready && jobFilter) {
      loadData();
    }
  }, [ready, jobFilter, loadData]);

  // Handlers
  const handleJobChange = (newJobId) => {
    setJobFilter(newJobId);
    setPage(1);
    setSelected([]);
    setSelectAllMatching(false);
    setOpenId(null);
    setSpeedIndex(0);
  };

  const getNextStage = (curr) => {
    const order = FIXED_PIPELINE_STAGES.filter((s) => s !== "Rejected");
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
    });
  };

  const handleMoveStage = async (id, stage, prevStage) => {
    const candidate = candidates.find((c) => String(c.id) === String(id)) || getCandidate(id);
    const sourceStage = prevStage || candidate?.stage;

    if (stage === "Rejected") {
      setRejectTarget(id);
      const rejTemplates = templates.filter((t) => (t.category || "rejection") === "rejection");
      const defTpl = rejTemplates.find((t) => t.isDefault) || rejTemplates[0];
      setRejectReason({ templateId: defTpl ? defTpl.id : (templates[0]?.id || ""), note: "" });
      return;
    }
    if (stage === "Interview Scheduled") {
      openScheduleModal(candidate);
      return;
    }

    // Set 5-minute Undo Window per EMP-FR-019b
    if (sourceStage && sourceStage !== stage) {
      setUndo({
        single: true,
        id,
        name: candidate?.name || t(lang, "Candidate"),
        prev: sourceStage,
        stage,
      });
    }

    // Optimistic candidate & counts update
    setCandidates((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, stage } : c))
    );
    setStageCounts((prev) => {
      const next = { ...prev };
      if (sourceStage && next[sourceStage] && next[sourceStage] > 0) next[sourceStage]--;
      if (next[stage] !== undefined) next[stage]++;
      return next;
    });

    try {
      await setCandidateStage(id, stage);
      setToast(`${t(lang, "Moved to")} ${t(lang, stage)}`);
    } catch (err) {
      console.warn("Failed to set candidate stage:", err);
      if (sourceStage) {
        setCandidates((prev) =>
          prev.map((c) => (String(c.id) === String(id) ? { ...c, stage: sourceStage } : c))
        );
      }
      setToast(t(lang, "Failed to move stage"));
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const targetId = rejectTarget;
    const rejTemplates = templates.filter((t) => (t.category || "rejection") === "rejection");
    const finalTemplateId = rejectReason.templateId || (rejTemplates[0]?.id || "");
    const reasonPayload = {
      ...rejectReason,
      templateId: finalTemplateId,
      delayHours: rejectDelayHours,
    };

    const targetCand = candidates.find((c) => String(c.id) === String(targetId)) || getCandidate(targetId);
    const sourceStage = targetCand?.stage || "Applied";

    // 1. Optimistic candidate state update
    setCandidates((prev) =>
      prev.map((c) =>
        String(c.id) === String(targetId)
          ? {
              ...c,
              stage: "Rejected",
              rejectionTemplateId: finalTemplateId,
              rejectionNote: rejectReason.note,
              rejectedAt: new Date().toISOString().slice(0, 10),
            }
          : c
      )
    );

    // 2. Optimistic counts update
    setStageCounts((prev) => {
      const next = { ...prev };
      if (sourceStage && next[sourceStage] && next[sourceStage] > 0) next[sourceStage]--;
      next.Rejected = (next.Rejected || 0) + 1;
      return next;
    });

    // 3. Close rejection modal immediately
    setRejectTarget(null);

    // 4. Set undo window
    setUndo({
      single: true,
      id: targetId,
      name: targetCand?.name || t(lang, "Candidate"),
      prev: sourceStage,
      stage: "Rejected",
    });

    try {
      await setCandidateStage(targetId, "Rejected", reasonPayload);
      setToast(t(lang, "Candidate moved to Rejected"));
    } catch (err) {
      console.warn("Failed to set candidate rejection in backend:", err);
      setToast(t(lang, "Candidate moved to Rejected"));
    } finally {
      loadData();
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleCandidate) return;

    const candidateId = scheduleCandidate.id;
    const scheduledAt = `${scheduleData.date}T${scheduleData.time}:00`;
    const payload = {
      roundName: scheduleData.round,
      round: scheduleData.round,
      scheduledAt,
      durationMin: Number(scheduleData.durationMin) || 45,
      mode: scheduleData.mode,
      location: scheduleData.location,
      meetingLink: scheduleData.meetingLink,
      locationOrLink:
        scheduleData.mode === "video"
          ? scheduleData.meetingLink || scheduleData.location
          : scheduleData.location,
      interviewerName: scheduleData.interviewerName,
      interviewerRole: scheduleData.interviewerRole,
      interviewers: [
        scheduleData.interviewerName
          ? `${scheduleData.interviewerName} (${scheduleData.interviewerRole || "Recruiter"})`
          : "Talent Acquisition Team",
      ],
      instructions: scheduleData.instructions,
    };

    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) =>
        String(c.id) === String(candidateId)
          ? {
              ...c,
              stage: "Interview Scheduled",
              interview: {
                round: scheduleData.round,
                at: scheduledAt,
                status: "invited",
                mode: scheduleData.mode,
                meetingLink: scheduleData.meetingLink,
                location: scheduleData.location,
              },
            }
          : c
      )
    );

    setScheduleCandidate(null);

    try {
      await scheduleCandidateInterview(candidateId, payload);
    } catch (err) {
      console.warn("Failed to schedule interview in backend:", err);
    } finally {
      setToast(t(lang, "Interview scheduled successfully!"));
      loadData();
    }
  };

  const handleRating = async (id, rating) => {
    setCandidates((prev) =>
      prev.map((c) =>
        String(c.id) === String(id) ? { ...c, rating, matchScore: rating * 20 } : c
      )
    );
    try {
      const { updateCandidateRating } = await import("../../../lib/api/companyApi");
      await updateCandidateRating(id, rating);
    } catch (_) {}
    setToast(t(lang, "Rating updated"));
  };

  const runBulk = async (stage, reason) => {
    const prev = {};
    selected.forEach((id) => {
      const c = candidates.find((x) => String(x.id) === String(id));
      if (c) prev[id] = c.stage;
    });

    const targetIds = selectAllMatching ? candidates.map((c) => c.id) : selected;

    // Optimistic candidates update
    setCandidates((prevCands) =>
      prevCands.map((c) => (targetIds.includes(c.id) ? { ...c, stage } : c))
    );

    setUndo({ ids: [...targetIds], prev, stage });
    setSelected([]);
    setSelectAllMatching(false);
    setConfirmBulk(null);

    try {
      await bulkSetCandidateStage(targetIds, stage, reason);
      setToast(`${targetIds.length} ${t(lang, "candidates moved to")} ${t(lang, stage)}`);
    } catch (err) {
      console.warn("Bulk update notice:", err);
      setToast(`${targetIds.length} ${t(lang, "candidates moved to")} ${t(lang, stage)}`);
    } finally {
      loadData();
    }
  };

  const doUndo = async () => {
    if (!undo) return;
    try {
      if (undo.single && undo.id && undo.prev) {
        await setCandidateStage(undo.id, undo.prev);
        setToast(t(lang, "Stage movement reversed"));
      } else if (undo.prev && typeof undo.prev === "object") {
        for (const [id, stage] of Object.entries(undo.prev)) {
          await setCandidateStage(id, stage);
        }
        setToast(t(lang, "Bulk action reversed"));
      }
      setUndo(null);
      loadData();
    } catch (e) {
      console.warn("Undo failed:", e);
    }
  };

  const handleExportCsv = async () => {
    if (!jobFilter) return;
    setIsExporting(true);
    try {
      await exportCandidatesCsv({
        jobId: jobFilter,
        stage: activeStage === "All" ? null : activeStage,
        search: debouncedSearch || null,
        minScore: minScoreFilter !== "0" ? Number(minScoreFilter) : null,
        sortBy,
      });
      setToast(t(lang, "Exported candidates to CSV successfully"));
    } catch (err) {
      console.warn("Failed to export candidates:", err);
      setToast(t(lang, "Failed to export candidates"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleJumpPage = () => {
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= pagination.totalPages) {
      setPage(p);
      setJumpPage("");
    }
  };

  const resetFilters = () => {
    setActiveStage("All");
    setSearchQuery("");
    setMinScoreFilter("0");
    setExpFilter("all");
    setSortBy("date");
    setPage(1);
  };

  const contactVisible = (candidate) => {
    if (!candidate) return false;
    if (privacy.contactVisibility === "never") return false;
    if (privacy.contactVisibility === "after_shortlist") {
      return SHORTLIST_PLUS.includes(candidate.stage);
    }
    return true;
  };

  const openResumeModal = (candidate, preferredTab = null) => {
    setResumeCandidate(candidate);
    setResumeModalTab(preferredTab || "pdf");
  };

  const templateTitle = (id) =>
    (templates.find((x) => String(x.id) === String(id)) || {}).title || "";

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto p-4 md:p-6">
      {/* ── Top Header & Mode Toggle ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-ink md:text-3xl">
              {t(lang, "Candidate Pipeline")}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {(stageCounts.Total || 0).toLocaleString()} {t(lang, "Applications")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {t(
              lang,
              "Screen candidates, manage stage progression, and execute bulk actions job-by-job."
            )}
          </p>
        </div>

        {/* View Toggle & Quick Refresh */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
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
            <button
              onClick={() => setViewMode("speed")}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "speed"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                  : "text-amber-700 bg-amber-50/70 hover:bg-amber-100 hover:text-amber-900 border border-amber-200/50"
              }`}
              title="Speed Reviewer mode with keyboard shortcuts for 10x faster screening"
            >
              <Icon
                name="zap"
                size={14}
                className={
                  viewMode === "speed"
                    ? "text-yellow-200 fill-current"
                    : "text-amber-600"
                }
              />
              {t(lang, "Speed Reviewer")}
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
            <Icon
              name="rotate-ccw"
              size={14}
              className={loading ? "animate-spin" : ""}
            />
          </Button>
        </div>
      </div>

      {/* ── Job-Wise Context Bar & Conversion Funnel ── */}
      <CandidatesHeader
        lang={lang}
        t={t}
        jobs={jobs}
        activeJob={activeJob}
        jobFilter={jobFilter}
        handleJobChange={handleJobChange}
        stageCounts={stageCounts}
        activeStage={activeStage}
        setActiveStage={setActiveStage}
        setPage={setPage}
        showFunnel={showFunnel}
        setShowFunnel={setShowFunnel}
      />

      {/* ── Filters & Search Toolbar ── */}
      <CandidatesFilters
        lang={lang}
        t={t}
        activeStage={activeStage}
        setActiveStage={setActiveStage}
        setPage={setPage}
        stageCounts={stageCounts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        minScoreFilter={minScoreFilter}
        setMinScoreFilter={setMinScoreFilter}
        expFilter={expFilter}
        setExpFilter={setExpFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        candidatesCount={candidates.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        pagination={pagination}
        resetFilters={resetFilters}
        viewMode={viewMode}
        density={density}
        setDensity={setDensity}
        handleExportCsv={handleExportCsv}
        isExporting={isExporting}
      />

      {/* ── Undo Banner (5-minute safety window per EMP-FR-019b) ── */}
      {undo && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 shadow-sm text-amber-900 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
              <Icon name="rotate-ccw" size={16} />
            </span>
            <span className="text-xs sm:text-sm">
              {undo.single ? (
                <>
                  <strong>{undo.name}</strong> {t(lang, "moved to")}{" "}
                  <strong>{t(lang, undo.stage)}</strong>.{" "}
                </>
              ) : (
                <>
                  <strong>{undo.ids?.length || 0}</strong>{" "}
                  {t(lang, "candidates moved to")}{" "}
                  <strong>{t(lang, undo.stage)}</strong>.{" "}
                </>
              )}
              <span className="text-amber-700/80">
                {t(lang, "You have 5 minutes to revert this change.")}
              </span>
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={doUndo}
            className="border-amber-300 font-bold bg-white text-amber-900 hover:bg-amber-100 shrink-0"
          >
            <Icon name="rotate-ccw" size={13} />
            {t(lang, "Undo Action")}
          </Button>
        </div>
      )}

      {/* ── View Modes ── */}
      {viewMode === "table" && (
        <CandidatesTableView
          lang={lang}
          t={t}
          manage={manage}
          candidates={candidates}
          loading={loading}
          selected={selected}
          setSelected={setSelected}
          selectAllMatching={selectAllMatching}
          setSelectAllMatching={setSelectAllMatching}
          pagination={pagination}
          page={page}
          setPage={setPage}
          jumpPage={jumpPage}
          setJumpPage={setJumpPage}
          handleJumpPage={handleJumpPage}
          density={density}
          privacy={privacy}
          sortBy={sortBy}
          setSortBy={setSortBy}
          handleMoveStage={handleMoveStage}
          handleRating={handleRating}
          openResumeModal={openResumeModal}
          setOpenId={setOpenId}
          setNoteDraft={setNoteDraft}
          getNextStage={getNextStage}
          setConfirmBulk={setConfirmBulk}
          runBulk={runBulk}
        />
      )}

      {viewMode === "pipeline" && (
        <CandidatesPipelineBoard
          lang={lang}
          t={t}
          manage={manage}
          activeJob={activeJob}
          candidates={candidates}
          stageCounts={stageCounts}
          selected={selected}
          setSelected={setSelected}
          handleMoveStage={handleMoveStage}
          setOpenId={setOpenId}
          setNoteDraft={setNoteDraft}
          setShowAiExplain={setShowAiExplain}
          openResumeModal={openResumeModal}
        />
      )}

      {viewMode === "speed" && (
        <CandidatesSpeedReview
          lang={lang}
          t={t}
          manage={manage}
          activeJob={activeJob}
          candidates={candidates}
          speedIndex={speedIndex}
          setSpeedIndex={setSpeedIndex}
          page={page}
          setPage={setPage}
          pagination={pagination}
          selected={selected}
          setSelected={setSelected}
          handleMoveStage={handleMoveStage}
          openScheduleModal={openScheduleModal}
          getNextStage={getNextStage}
        />
      )}

      {/* ── Slide-over Candidate Profile Drawer ── */}
      <CandidateDetailDrawer
        lang={lang}
        t={t}
        open={open}
        setOpenId={setOpenId}
        manage={manage}
        activeJob={activeJob}
        privacy={privacy}
        contactVisible={contactVisible}
        showAiExplain={showAiExplain}
        setShowAiExplain={setShowAiExplain}
        openScheduleModal={openScheduleModal}
        getNextStage={getNextStage}
        handleMoveStage={handleMoveStage}
        openResumeModal={openResumeModal}
        setViewingDoc={setViewingDoc}
        templateTitle={templateTitle}
        noteDraft={noteDraft}
        setNoteDraft={setNoteDraft}
        loadData={loadData}
        setToast={setToast}
      />

      {/* ── Rejection Modal (Screen e09 / EMP-FR-025b) ── */}
      <CandidateRejectModal
        lang={lang}
        t={t}
        rejectTarget={rejectTarget}
        setRejectTarget={setRejectTarget}
        targetCand={
          rejectTarget
            ? candidates.find((c) => String(c.id) === String(rejectTarget)) ||
              getCandidate(rejectTarget)
            : null
        }
        templates={templates}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectDelayHours={rejectDelayHours}
        setRejectDelayHours={setRejectDelayHours}
        confirmReject={confirmReject}
      />

      {/* ── Schedule Interview Modal ── */}
      <CandidateScheduleModal
        lang={lang}
        t={t}
        scheduleCandidate={scheduleCandidate}
        setScheduleCandidate={setScheduleCandidate}
        activeJob={activeJob}
        scheduleData={scheduleData}
        setScheduleData={setScheduleData}
        handleScheduleSubmit={handleScheduleSubmit}
      />

      {/* ── Bulk Action Confirmation Modal ── */}
      <CandidateBulkModal
        lang={lang}
        t={t}
        confirmBulk={confirmBulk}
        setConfirmBulk={setConfirmBulk}
        selectAllMatching={selectAllMatching}
        selectedCount={selected.length}
        totalMatching={pagination.total || 0}
        templates={templates}
        runBulk={runBulk}
      />

      {/* ── Full Interactive Resume & CV Viewer Modal ── */}
      <CandidateResumeModal
        lang={lang}
        t={t}
        resumeCandidate={resumeCandidate}
        setResumeCandidate={setResumeCandidate}
        resumeModalTab={resumeModalTab}
        setResumeModalTab={setResumeModalTab}
        activeJob={activeJob}
      />

      {/* ── View-Only Verification Document Modal (Screen e11 / EMP-FR-026b & Vietnam PDPD) ── */}
      <CandidateDocViewerModal
        lang={lang}
        t={t}
        viewingDoc={viewingDoc}
        setViewingDoc={setViewingDoc}
        docViewerZoom={docViewerZoom}
        setDocViewerZoom={setDocViewerZoom}
        setToast={setToast}
      />

      {/* Toast Notification */}
      <Toast msg={toast} />
    </div>
  );
}
