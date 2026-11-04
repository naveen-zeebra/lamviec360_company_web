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
  sendStageChangeEmail,
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
import CandidateDetailDrawer from "./components/CandidateDetailDrawer";
import CandidateDocViewerModal from "./components/CandidateDocViewerModal";
import CandidateResumeModal from "./components/CandidateResumeModal";
import CandidateBulkModal from "./components/CandidateBulkModal";
import CandidateRejectModal from "./components/CandidateRejectModal";
import CandidatesJobsOverview from "./components/CandidatesJobsOverview";

export { FIXED_PIPELINE_STAGES, PIPELINE_STAGES_CONFIG } from "./components/CandidatesConstants";

export default function CandidatesClient() {
  const [lang] = useLang();
  const params = useSearchParams();
  const jobParam = params.get("job") || "";

  // Core state
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'pipeline'
  const [density, setDensity] = useState("comfortable"); // 'comfortable' | 'compact'
  const [role, setRole] = useState("Viewer");

  // Selection & Active Filters
  const [jobFilter, setJobFilter] = useState(jobParam);
  const [jobs, setJobs] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
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
    const [noteDraft, setNoteDraft] = useState("");
  const [showAiExplain, setShowAiExplain] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Undo safety window
  const [undo, setUndo] = useState(null);

  // Modal states
    const [resumeCandidate, setResumeCandidate] = useState(null);
  const [resumeModalTab, setResumeModalTab] = useState("pdf");
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docViewerZoom, setDocViewerZoom] = useState(100);
  const [confirmBulk, setConfirmBulk] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState({ templateId: "", note: "" });
  const [rejectDelayHours, setRejectDelayHours] = useState(0);
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

    // Fetch jobs and candidates for switcher & overview
    import("../../../lib/companyStore").then(({ getStore, syncCompanyWithBackend }) => {
      const store = getStore();
      const storeJobs = store?.jobs || [];
      const storeCandidates = store?.candidates || [];
      setJobs(storeJobs);
      setAllCandidates(storeCandidates);

      if (jobParam && storeJobs.some((j) => String(j.id) === String(jobParam))) {
        setJobFilter(jobParam);
      } else {
        setJobFilter("");
      }
      setReady(true);

      syncCompanyWithBackend().then(() => {
        const updated = getStore();
        setJobs(updated?.jobs || []);
        setAllCandidates(updated?.candidates || []);
      }).catch(console.warn);
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
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newJobId) {
        url.searchParams.set("job", newJobId);
      } else {
        url.searchParams.delete("job");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const getNextStage = (curr) => {
    const order = FIXED_PIPELINE_STAGES.filter((s) => s !== "Rejected");
    const idx = order.indexOf(curr);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  };

  const handleMoveStage = async (id, stage, prevStage, explicitReason = null) => {
    const candidate = candidates.find((c) => String(c.id) === String(id)) || getCandidate(id);
    const sourceStage = prevStage || candidate?.stage;

    if (stage === "Rejected" && !explicitReason) {
      const rejTemplates = templates.filter((t) => (t.category || "rejection") === "rejection");
      const defTpl = rejTemplates.find((t) => t.isDefault) || rejTemplates[0];
      setRejectReason({ templateId: defTpl?.id || "RT-1", note: "" });
      setRejectTarget({ id, prevStage: sourceStage, candidate });
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

    const isRejection = stage === "Rejected";
    const rejTemplates = templates.filter((t) => (t.category || "rejection") === "rejection");
    const defTpl = rejTemplates.find((t) => t.isDefault) || rejTemplates[0];
    const rejectionTemplateId = defTpl ? defTpl.id : "RT-1";
    const reasonPayload = isRejection ? (explicitReason || { templateId: rejectionTemplateId, note: "" }) : undefined;

    // Optimistic candidate & counts update
    setCandidates((prev) =>
      prev.map((c) =>
        String(c.id) === String(id)
          ? {
              ...c,
              stage,
              ...(isRejection
                ? {
                    rejectionTemplateId,
                    rejectedAt: new Date().toISOString().slice(0, 10),
                  }
                : {}),
            }
          : c
      )
    );
    setStageCounts((prev) => {
      const next = { ...prev };
      if (sourceStage && next[sourceStage] && next[sourceStage] > 0) next[sourceStage]--;
      if (next[stage] !== undefined) next[stage]++;
      return next;
    });

    try {
      await setCandidateStage(id, stage, reasonPayload);
      const emailResult = await sendStageChangeEmail(candidate, stage, activeJob, reasonPayload);
      const emailNotice = emailResult && candidate?.email
        ? ` · ${t(lang, "Email notification sent to")} ${candidate.email}`
        : "";
      setToast(`${t(lang, "Moved to")} ${t(lang, stage)}${emailNotice}`);
    } catch (err) {
      console.warn("Failed to set candidate stage:", err);
      if (sourceStage) {
        setCandidates((prev) =>
          prev.map((c) => (String(c.id) === String(id) ? { ...c, stage: sourceStage } : c))
        );
      }
      setToast(t(lang, "Failed to move stage"));
    } finally {
      loadData();
    }
  };

  const confirmReject = async (customPayload = null) => {
    if (!rejectTarget) return;
    const { id, prevStage } = rejectTarget;
    const payload = customPayload || {
      templateId: rejectReason.templateId,
      lang: rejectReason.lang,
      note: rejectReason.note || "",
      delayHours: rejectDelayHours,
    };
    setRejectTarget(null);
    await handleMoveStage(id, "Rejected", prevStage, payload);
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
      {!jobFilter ? (
        <CandidatesJobsOverview
          jobs={jobs}
          allCandidates={allCandidates}
          onSelectJob={handleJobChange}
          lang={lang}
          t={t}
        />
      ) : (
        <>
      {/* ── Unified Single Job Applications Header ── */}
          <CandidatesHeader
            lang={lang}
            t={t}
            activeJob={activeJob}
            handleJobChange={handleJobChange}
            stageCounts={stageCounts}
            viewMode={viewMode}
            setViewMode={setViewMode}
            loading={loading}
            loadData={loadData}
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

      </>
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

      
      {/* ── Candidate Rejection Modal with Standardized Template (EMP-FR-025b) ── */}
      <CandidateRejectModal
        lang={lang}
        t={t}
        rejectTarget={rejectTarget}
        setRejectTarget={setRejectTarget}
        targetCand={rejectTarget?.candidate}
        templates={templates}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectDelayHours={rejectDelayHours}
        setRejectDelayHours={setRejectDelayHours}
        confirmReject={confirmReject}
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
