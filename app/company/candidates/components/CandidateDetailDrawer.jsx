"use client";

import React, { useState, useEffect, useMemo } from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import { Avatar } from "../../../../components/ds";
import StatusBadge from "../../../../components/company/StatusBadge";
import {
  SHORTLIST_PLUS,
  getScoreBadgeClass,
  getCandidatePdfUrl,
  getResumeFileInfo,
  maskValue,
} from "./CandidatesConstants";
import {
  getAuth,
  addCandidateNote,
  setCandidateRating,
  getApplicantVerificationDocuments,
  fetchApplicantDetail,
  getApplicantMessagesStore,
  sendApplicantMessageStore,
} from "../../../../lib/companyStore";
import { formatBytes } from "../../../../utils/format";
import RequestPriorEmploymentDocsModal from "./RequestPriorEmploymentDocsModal";

export default function CandidateDetailDrawer({
  lang,
  t,
  open,
  setOpenId,
  manage,
  activeJob,
  privacy,
  contactVisible,
  showAiExplain,
  setShowAiExplain,
  getNextStage,
  handleMoveStage,
  openResumeModal,
  setViewingDoc,
  templateTitle,
  noteDraft,
  setNoteDraft,
  loadData,
  setToast,
}) {
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'resume' | 'ai' | 'documents' | 'answers' | 'messages'
  const [fullCand, setFullCand] = useState(open);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [verificationDocs, setVerificationDocs] = useState([]);
  const [loadingVerificationDocs, setLoadingVerificationDocs] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [isRequestDocModalOpen, setIsRequestDocModalOpen] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [dmThread, setDmThread] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmDraft, setDmDraft] = useState("");
  const [dmSending, setDmSending] = useState(false);

  const isShortlistedPlus = (stg) => SHORTLIST_PLUS.includes(stg);

  // Sync full applicant record on candidate open
  useEffect(() => {
    if (!open?.id) return;
    setFullCand(open);
    setLoadingDetail(true);
    fetchApplicantDetail(open.id)
      .then((detail) => {
        if (detail) {
          setFullCand((prev) => ({ ...(prev || {}), ...detail }));
        }
      })
      .catch((err) => console.warn("Could not fetch full applicant detail:", err))
      .finally(() => setLoadingDetail(false));
  }, [open?.id]);

  // Load verification documents if shortlisted+
  useEffect(() => {
    if (!open?.id) return;
    const stage = fullCand?.stage || open.stage;
    if (isShortlistedPlus(stage)) {
      setLoadingVerificationDocs(true);
      getApplicantVerificationDocuments(open.id, open.name)
        .then((docs) => setVerificationDocs(docs || []))
        .catch(() => setVerificationDocs([]))
        .finally(() => setLoadingVerificationDocs(false));
    } else {
      setVerificationDocs([]);
    }
  }, [open?.id, fullCand?.stage, open?.stage, open?.name]);

  const loadDirectMessages = async (appId) => {
    if (!appId) return;
    setDmLoading(true);
    try {
      const res = await getApplicantMessagesStore(appId);
      setDmThread(res?.thread || null);
      setDmMessages(Array.isArray(res?.messages) ? res.messages : []);
      if (res?.thread) {
        setFullCand((prev) => ({
          ...(prev || {}),
          allow_recruiter_dm: !!res.thread.allow_recruiter_dm,
          dm_opt_in_requested_at: res.thread.dm_opt_in_requested_at || prev?.dm_opt_in_requested_at,
          unread_dm_count: 0,
        }));
      }
    } catch (err) {
      console.warn("Could not load direct messages:", err);
    } finally {
      setDmLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "messages" && open?.id) {
      loadDirectMessages(open.id);
    }
  }, [activeTab, open?.id]);

  const screeningQuestionsMap = useMemo(() => {
    const map = {};
    const rawList = fullCand?.questions || open?.questions || activeJob?.questions;
    let qList = [];
    if (Array.isArray(rawList)) {
      qList = rawList;
    } else if (typeof rawList === "string" && rawList.trim()) {
      try {
        const parsed = JSON.parse(rawList);
        if (Array.isArray(parsed)) qList = parsed;
      } catch { }
    }
    for (const item of qList) {
      if (item && item.id) {
        map[item.id] = item.question || item.text || item.label || item.id;
      }
    }
    return map;
  }, [fullCand?.questions, open?.questions, activeJob?.questions]);

  const candidateAnswers = useMemo(() => {
    const raw = fullCand?.answers || open?.answers;
    if (!raw) return null;
    if (typeof raw === "object") {
      return Object.keys(raw).length ? raw : null;
    }
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" && Object.keys(parsed).length ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }, [fullCand?.answers, open?.answers]);

  if (!open) return null;

  const cand = fullCand || open;
  const fileInfo = getResumeFileInfo(cand);

  const handleCopy = (text, key) => {
    if (!text || text === "—") return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    setToast(t(lang, "Copied to clipboard"));
  };

  const handleStarRating = async (stars) => {
    if (!manage) return;
    try {
      await setCandidateRating(cand.id, stars);
      setFullCand((prev) => ({ ...prev, rating: stars, matchScore: stars * 20 }));
      setToast(t(lang, "Rating updated"));
      if (loadData) loadData();
    } catch (err) {
      setToast(t(lang, "Failed to update rating"));
    }
  };

  const emailVal = !contactVisible(cand)
    ? t(lang, "Hidden by privacy policy")
    : privacy?.maskEmail
      ? maskValue(cand.email, "email")
      : cand.email || "—";

  const phoneVal = !contactVisible(cand)
    ? t(lang, "Hidden by privacy policy")
    : privacy?.maskPhone
      ? maskValue(cand.phone, "phone")
      : cand.phone || "—";

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={() => setOpenId(null)}
    >
      <aside
        className="h-full w-full max-w-4xl overflow-y-auto bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-line"
        role="dialog"
        aria-modal="true"
        aria-label={cand.name}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 border-b border-line bg-card/95 backdrop-blur-md px-6 py-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar name={cand.name} size={54} />
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-black text-ink truncate">{cand.name}</h2>
                  <StatusBadge kind="stage" value={cand.stage} lang={lang} />
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreBadgeClass(
                      cand.matchScore
                    )}`}
                  >
                    ★ {cand.matchScore}% Match
                  </span>
                  {cand.isStalled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                      <Icon name="alert-triangle" size={11} />
                      {lang === "VN" || lang === "VI"
                        ? `Tồn đọng (${cand.daysInStage} ngày)`
                        : `Stalled (${cand.daysInStage}d)`}
                    </span>
                  )}
                  {cand.profileSnapshot && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                      title={t(lang, "Frozen candidate profile snapshot captured at application time")}
                    >
                      <Icon name="lock" size={10} />
                      {t(lang, "Submitted Snapshot")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted font-medium mt-0.5 truncate">
                  {cand.headline ? (
                    <span className="font-semibold text-brand mr-2">{cand.headline} ·</span>
                  ) : null}
                  {activeJob?.title || cand.jobTitle || "Open Role"} · {t(lang, "Applied")}: {cand.appliedDate}
                  {cand.city ? ` · ${cand.city}, ${cand.country || "Vietnam"}` : ""}
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpenId(null)}
              className="rounded-xl p-2 text-muted hover:bg-sunken hover:text-ink transition-colors shrink-0"
              aria-label="Close drawer"
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1 border-t border-line/70 pt-2 -mb-1 flex-wrap">
            {[
              { key: "profile", label: t(lang, "Full Profile"), icon: "user" },
              { key: "resume", label: t(lang, "Resume & CV"), icon: "file-text" },
              { key: "ai", label: t(lang, "AI Match & Notes"), icon: "sparkles" },
              {
                key: "documents",
                label: `${t(lang, "Verified Documents")} ${verificationDocs.length > 0 ? `(${verificationDocs.length})` : ""
                  }`,
                icon: "shield",
              },
              // {
              //   key: "answers",
              //   label: t(lang, "Screening Answers"),
              //   icon: "help-circle",
              // },
              {
                key: "messages",
                label: `${t(lang, "Direct Messages")}${(cand.unread_dm_count || 0) > 0 ? ` (${cand.unread_dm_count})` : ""}`,
                icon: "message-square",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-ink hover:bg-sunken"
                  }`}
              >
                <Icon name={tab.icon} size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Body - Tab Content */}
        <div className="flex-1 p-6 md:p-8 space-y-6">
          {/* ============================================================== */}
          {/* TAB 0: SCREENING ANSWERS                                       */}
          {/* ============================================================== */}
          {activeTab === "answers" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-line bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-line">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Icon name="help-circle" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-ink">
                      {t(lang, "Screening Question Responses")}
                    </h3>
                    <p className="text-xs text-muted">
                      {activeJob?.title || cand.jobTitle || "Job Position"}
                    </p>
                  </div>
                </div>

                {(() => {
                  let rawAnswers = cand.answers;
                  if (typeof rawAnswers === "string") {
                    try { rawAnswers = JSON.parse(rawAnswers); } catch (e) { }
                  }

                  let rawQuestions = cand.questions || activeJob?.questions || [];
                  if (typeof rawQuestions === "string") {
                    try { rawQuestions = JSON.parse(rawQuestions); } catch (e) { }
                  }
                  const qMap = {};
                  if (Array.isArray(rawQuestions)) {
                    for (const q of rawQuestions) {
                      if (q && q.id) qMap[q.id] = q.question || q.text || q.label;
                    }
                  }

                  if (!rawAnswers || (typeof rawAnswers === "object" && Object.keys(rawAnswers).length === 0)) {
                    return (
                      <div className="py-10 text-center text-muted text-xs">
                        <Icon name="info" size={28} className="mx-auto text-muted/60 mb-2" />
                        <p>{t(lang, "No screening question answers were recorded for this candidate.")}</p>
                      </div>
                    );
                  }

                  const entries = typeof rawAnswers === "object" ? Object.entries(rawAnswers) : [["answers", rawAnswers]];

                  return (
                    <div className="space-y-3">
                      {entries.map(([key, val], idx) => {
                        let qText = qMap[key] || (typeof val === "object" && val?.question ? val.question : null);
                        if (!qText) {
                          qText = !key.startsWith("q_") ? key : `${t(lang, "Question")} ${idx + 1}`;
                        }
                        const ansText = typeof val === "object" && val !== null
                          ? (val.answer !== undefined ? String(val.answer) : JSON.stringify(val))
                          : String(val);

                        return (
                          <div
                            key={key}
                            className="rounded-xl border border-line bg-sunken/40 p-4 space-y-2 hover:border-emerald-300 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-[11px] font-bold">
                                {idx + 1}
                              </span>
                              <h4 className="text-xs md:text-sm font-bold text-ink leading-snug">
                                {qText}
                              </h4>
                            </div>
                            <div className="pl-7">
                              <div className="inline-block rounded-lg border border-line bg-card px-3.5 py-1.5 text-xs md:text-sm font-semibold text-ink shadow-2xs">
                                {ansText || <span className="text-muted italic">{t(lang, "No response provided")}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: FULL PROFILE                                            */}
          {/* ============================================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Summary / Bio */}
              {cand.bio ? (
                <div className="rounded-2xl border border-line bg-sunken/40 p-5 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                    {t(lang, "Professional Summary & Bio")}
                  </h3>
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap font-sans">
                    {cand.bio}
                  </p>
                </div>
              ) : null}

              {/* Candidate Overview Grid */}
              <div className="rounded-2xl border border-line bg-card p-5 space-y-4 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                  {t(lang, "Candidate Overview & Contact")}
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-line/60 bg-sunken/30 p-3 space-y-1">
                    <dt className="text-muted text-[11px] font-medium">{t(lang, "Email Address")}</dt>
                    <dd className="font-bold text-ink flex items-center justify-between">
                      <span className="truncate">{emailVal}</span>
                      {contactVisible(cand) && cand.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(cand.email, "email")}
                          className="text-muted hover:text-brand p-1"
                          title="Copy Email"
                        >
                          <Icon name={copiedKey === "email" ? "check" : "copy"} size={13} />
                        </button>
                      )}
                    </dd>
                  </div>

                  <div className="rounded-xl border border-line/60 bg-sunken/30 p-3 space-y-1">
                    <dt className="text-muted text-[11px] font-medium">{t(lang, "Phone Number")}</dt>
                    <dd className="font-bold text-ink flex items-center justify-between">
                      <span className="truncate">{phoneVal}</span>
                      {contactVisible(cand) && cand.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(cand.phone, "phone")}
                          className="text-muted hover:text-brand p-1"
                          title="Copy Phone"
                        >
                          <Icon name={copiedKey === "phone" ? "check" : "copy"} size={13} />
                        </button>
                      )}
                    </dd>
                  </div>

                  <div className="rounded-xl border border-line/60 bg-sunken/30 p-3 space-y-1">
                    <dt className="text-muted text-[11px] font-medium">{t(lang, "Total Experience")}</dt>
                    <dd className="font-bold text-ink text-sm">
                      {cand.experienceYears || cand.experience_years || 0} {t(lang, "years")}
                    </dd>
                  </div>

                  <div className="rounded-xl border border-line/60 bg-sunken/30 p-3 space-y-1">
                    <dt className="text-muted text-[11px] font-medium">{t(lang, "Education Level")}</dt>
                    <dd className="font-bold text-ink text-sm">
                      {t(lang, cand.educationLevel || "Bachelor's Degree")}
                    </dd>
                  </div>

                  <div className="rounded-xl border border-line/60 bg-sunken/30 p-3 space-y-1">
                    <dt className="text-muted text-[11px] font-medium">{t(lang, "Location")}</dt>
                    <dd className="font-bold text-ink text-sm flex items-center gap-1.5">
                      <Icon name="map-pin" size={13} className="text-red-500" />
                      <span>{cand.city ? `${cand.city}, ${cand.country || "Vietnam"}` : "Vietnam"}</span>
                    </dd>
                  </div>

                  <div className="rounded-xl border border-line/60 bg-sunken/30 p-3 space-y-1">
                    <dt className="text-muted text-[11px] font-medium">{t(lang, "Job Availability")}</dt>
                    <dd>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${(cand.job_availability || cand.jobAvailability) === "open_to_opportunities"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : (cand.job_availability || cand.jobAvailability) === "not_looking"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${(cand.job_availability || cand.jobAvailability) === "open_to_opportunities"
                            ? "bg-amber-500"
                            : (cand.job_availability || cand.jobAvailability) === "not_looking"
                              ? "bg-rose-500"
                              : "bg-emerald-500"
                            }`}
                        />
                        {(cand.job_availability || cand.jobAvailability) === "open_to_opportunities"
                          ? t(lang, "Open to Relevant Opportunities")
                          : (cand.job_availability || cand.jobAvailability) === "not_looking"
                            ? t(lang, "Not Looking")
                            : t(lang, "Open to Work")}
                      </span>
                    </dd>
                  </div>
                </dl>

                {/* Social & Portfolio Links */}
                {(cand.githubUrl || cand.github_url || cand.linkedinUrl || cand.linkedin_url) && (
                  <div className="flex items-center gap-3 pt-3 border-t border-line/60">
                    <span className="text-xs text-muted font-medium">{t(lang, "Profiles")}:</span>
                    {(cand.githubUrl || cand.github_url) && (
                      <a
                        href={cand.githubUrl || cand.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-sunken px-3 py-1.5 text-xs font-bold text-ink hover:bg-card transition-colors shadow-2xs"
                      >
                        <Icon name="code" size={13} className="text-slate-700" />
                        <span>GitHub</span>
                        <Icon name="external-link" size={11} className="text-muted" />
                      </a>
                    )}
                    {(cand.linkedinUrl || cand.linkedin_url) && (
                      <a
                        href={cand.linkedinUrl || cand.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs border-blue-200"
                      >
                        <Icon name="globe" size={13} className="text-blue-600" />
                        <span>LinkedIn</span>
                        <Icon name="external-link" size={11} className="text-blue-500" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Skills Cloud */}
              {Array.isArray(cand.skills) && cand.skills.length > 0 && (
                <div className="rounded-2xl border border-line bg-card p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                      {t(lang, "Key Skills & Competencies")}
                    </h3>
                    <span className="text-[11px] text-muted font-bold">
                      {cand.skills.length} {t(lang, "skills verified")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cand.skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-line bg-sunken/60 px-3 py-1 text-xs font-bold text-ink shadow-2xs"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio & Project Showcase (LV360-FSD-004, EMP-FR-021, JSP-FR-014) */}
              {(() => {
                const portfolioList = Array.isArray(cand.portfolio?.items)
                  ? cand.portfolio.items
                  : Array.isArray(cand.portfolioItems)
                    ? cand.portfolioItems
                    : Array.isArray(cand.projects)
                      ? cand.projects
                      : [];
                const hasSingleLinkOrFile = !!(cand.portfolio?.url || cand.portfolioUrl || cand.portfolio?.fileName || cand.portfolioFileName);

                if (portfolioList.length === 0 && !hasSingleLinkOrFile) return null;

                return (
                  <div className="rounded-2xl border border-line bg-card p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                          <Icon name="briefcase" size={14} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                          {t(lang, "Portfolio & Project Showcase")}
                        </h3>
                      </div>
                      {portfolioList.length > 0 && (
                        <span className="text-[11px] text-muted font-bold">
                          {portfolioList.length} {t(lang, "projects")}
                        </span>
                      )}
                    </div>

                    {portfolioList.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 pt-1">
                        {portfolioList.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="rounded-xl border border-line/80 bg-sunken/30 p-4 space-y-2 hover:border-line transition-all"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-ink flex items-center gap-2 m-0">
                                  <span>{item.title}</span>
                                  {item.role && (
                                    <span className="inline-flex items-center rounded-full bg-brand-subtle text-brand border border-brand/20 px-2 py-0.5 text-[10px] font-bold">
                                      {item.role}
                                    </span>
                                  )}
                                </h4>
                                {(item.fromDate || item.toDate) && (
                                  <span className="text-[11px] text-muted flex items-center gap-1 mt-0.5 font-medium">
                                    <Icon name="calendar" size={11} className="text-faint" />
                                    <span>
                                      {item.fromDate} {item.fromDate && item.toDate ? "–" : ""} {item.isOngoing || item.toDate === "Present" ? t(lang, "Present") : item.toDate}
                                    </span>
                                  </span>
                                )}
                              </div>

                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-link hover:text-brand transition-colors"
                                >
                                  <span>{t(lang, "Live Demo / Repo")}</span>
                                  <Icon name="external-link" size={11} />
                                </a>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-xs text-ink/80 leading-relaxed font-sans whitespace-pre-wrap m-0">
                                {item.description}
                              </p>
                            )}

                            {item.fileName && (
                              <div className="pt-1.5 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1 text-[11px] font-semibold text-ink shadow-2xs">
                                  <Icon name="paperclip" size={12} className="text-muted" />
                                  <span className="truncate max-w-[200px]">{item.fileName}</span>
                                  {item.fileSize ? (
                                    <span className="text-[10px] text-muted">({(item.fileSize / 1024).toFixed(0)} KB)</span>
                                  ) : null}
                                </span>
                                {item.fileDataUrl && (
                                  <a
                                    href={item.fileDataUrl}
                                    download={item.fileName}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                                  >
                                    <Icon name="download" size={11} />
                                    <span>{t(lang, "Download")}</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Fallback to single portfolio link/file if present */
                      <div className="flex flex-wrap items-center gap-3">
                        {(cand.portfolio?.url || cand.portfolioUrl) && (
                          <a
                            href={cand.portfolio?.url || cand.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-sunken px-3 py-1.5 text-xs font-bold text-ink hover:bg-card transition-colors shadow-2xs"
                          >
                            <Icon name="globe" size={13} className="text-blue-600" />
                            <span>{t(lang, "Portfolio Website")}</span>
                            <Icon name="external-link" size={11} className="text-muted" />
                          </a>
                        )}
                        {(cand.portfolio?.fileName || cand.portfolioFileName) && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-sunken px-3 py-1.5 text-xs font-medium text-ink">
                            <Icon name="paperclip" size={13} className="text-muted" />
                            <span>{cand.portfolio?.fileName || cand.portfolioFileName}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Cover Letter */}
              {(cand.coverLetter || cand.cover_letter) && (
                <div className="rounded-2xl border border-line bg-card p-5 space-y-3 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                    {t(lang, "Cover Letter")}
                  </h3>
                  <div className="rounded-xl bg-sunken/40 p-4 text-xs leading-relaxed text-ink/90 whitespace-pre-wrap font-sans italic border border-line/60">
                    "{cand.coverLetter || cand.cover_letter}"
                  </div>
                </div>
              )}

              {/* Screening Questions & Answers */}
              {candidateAnswers && Object.keys(candidateAnswers).length > 0 && (
                <div className="rounded-2xl border border-line bg-card p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Icon name="help-circle" size={14} className="text-brand" />
                      <span>{t(lang, "Screening Question Responses")}</span>
                    </h3>
                    <span className="text-[11px] font-bold text-muted">
                      {Object.keys(candidateAnswers).length} {t(lang, "questions answered")}
                    </span>
                  </div>
                  <div className="space-y-3 pt-1">
                    {Object.entries(candidateAnswers).map(([qKey, ans], idx) => {
                      const questionText =
                        screeningQuestionsMap[qKey] ||
                        (typeof ans === "object" && ans?.question ? ans.question : null) ||
                        (!qKey.startsWith("q_") ? qKey : `${t(lang, "Question")} ${idx + 1}`);

                      const answerText =
                        typeof ans === "object" && ans !== null
                          ? (ans.answer !== undefined ? String(ans.answer) : JSON.stringify(ans))
                          : String(ans);

                      return (
                        <div
                          key={qKey}
                          className="rounded-xl border border-line/70 bg-sunken/40 p-4 space-y-2 text-xs"
                        >
                          <div className="font-bold text-ink flex items-start gap-2">
                            <span className="text-brand font-black shrink-0">{idx + 1}.</span>
                            <span>{questionText}</span>
                          </div>
                          <div className="pl-5">
                            <span className="inline-block rounded-lg border border-line bg-card px-3 py-1.5 font-semibold text-ink shadow-2xs">
                              {answerText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: RESUME & CV PREVIEW                                     */}
          {/* ============================================================== */}
          {activeTab === "resume" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-line bg-card p-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs shrink-0 ${fileInfo.fileType === "docx"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-rose-50 text-rose-600"
                        }`}
                    >
                      <Icon name="file-text" size={20} />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-ink">{fileInfo.fileName}</span>
                      <span className="block text-xs text-muted">
                        {fileInfo.fileType === "docx"
                          ? t(lang, "Candidate Uploaded Word Document")
                          : t(lang, "Candidate Uploaded PDF Document")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={fileInfo.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink hover:bg-sunken shadow-xs transition-colors"
                      title={t(lang, "Open PDF in new tab")}
                    >
                      <Icon name="external-link" size={13} />
                      <span>{t(lang, "New Tab")}</span>
                    </a>
                    <a
                      href={fileInfo.fileUrl}
                      download={fileInfo.fileName}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-white px-3.5 py-1.5 text-xs font-bold shadow-xs hover:bg-brand/90 transition-colors"
                      title={t(lang, "Download file")}
                    >
                      <Icon name="download" size={13} />
                      <span>{t(lang, "Download")}</span>
                    </a>
                  </div>
                </div>

                {fileInfo.fileType === "docx" ? (
                  <div className="p-8 text-center bg-sunken/30 rounded-xl mt-4 space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
                      <Icon name="file-text" size={28} />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h4 className="font-bold text-ink text-sm">Microsoft Word (.docx)</h4>
                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {t(
                          lang,
                          "Word documents cannot be embedded directly in browser frames. You can download the original file or inspect the full parsed candidate profile."
                        )}
                      </p>
                    </div>
                    <div className="flex justify-center gap-3 pt-2">
                      <Button
                        variant="primary"
                        onClick={() => setActiveTab("profile")}
                        className="gap-1.5 text-xs font-bold"
                      >
                        <Icon name="user" size={14} />
                        {t(lang, "View Parsed Profile")}
                      </Button>
                      <a
                        href={fileInfo.fileUrl}
                        download={fileInfo.fileName}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-4 py-2 text-xs font-bold text-ink hover:bg-sunken shadow-xs"
                      >
                        <Icon name="download" size={14} />
                        {t(lang, "Download .docx")}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 h-[650px] w-full rounded-xl overflow-hidden border border-line bg-slate-100 shadow-inner">
                    <iframe
                      src={`${getCandidatePdfUrl(cand)}#toolbar=1&navpanes=0`}
                      className="w-full h-full border-0"
                      title={`${cand.name} - Resume PDF`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: AI MATCH & INTERNAL NOTES                               */}
          {/* ============================================================== */}
          {activeTab === "ai" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Explainable AI Factors */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon name="sparkles" size={18} className="text-blue-600" />
                    <div>
                      <h3 className="text-sm font-black text-blue-950">
                        {t(lang, "Explainable AI Match Breakdown")}
                      </h3>
                      <p className="text-[11px] text-blue-800/80">
                        {t(lang, "Evaluated by LàmViệc360 ethical matching engine")}
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-black text-blue-700 bg-blue-100 border border-blue-200 rounded-full px-3 py-1">
                    {cand.matchScore}% Overall
                  </span>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  {[
                    { label: "Skills Alignment", score: Math.min(100, Math.max(50, cand.matchScore + 3)), weight: "35%" },
                    { label: "Experience Level", score: Math.min(100, Math.max(50, cand.matchScore - 2)), weight: "25%" },
                    { label: "Industry Relevance", score: Math.min(100, Math.max(50, cand.matchScore + 1)), weight: "20%" },
                    { label: "Location & Commute", score: Math.min(100, Math.max(50, cand.matchScore + 4)), weight: "10%" },
                    { label: "Education & Certifications", score: Math.min(100, Math.max(50, cand.matchScore - 4)), weight: "10%" },
                  ].map((factor, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {t(lang, factor.label)}{" "}
                          <span className="text-[10px] text-muted">({factor.weight})</span>
                        </span>
                        <span className="font-bold text-slate-900">{factor.score}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Details if Rejected */}
              {cand.stage === "Rejected" && (cand.rejectionTemplateId || cand.rejectionNote) && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-xs text-rose-900 space-y-2">
                  <strong className="block font-bold text-sm text-rose-950">
                    {t(lang, "Rejection Record & Reason")}
                  </strong>
                  {cand.rejectionTemplateId && (
                    <span className="font-semibold">{templateTitle(cand.rejectionTemplateId)}</span>
                  )}
                  {cand.rejectionNote && (
                    <p className="text-rose-800 italic bg-white/60 p-3 rounded-lg border border-rose-200/70">
                      "{cand.rejectionNote}"
                    </p>
                  )}
                </div>
              )}

              {/* Internal Recruiter Notes */}
              <div className="rounded-2xl border border-line bg-card p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                    {t(lang, "Internal Hiring Notes")}
                  </h3>
                  <span className="text-[11px] text-muted">
                    {t(lang, "Confidential · Team only")}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {(!cand.notes || cand.notes.length === 0) && (
                    <div className="rounded-xl border border-dashed border-line bg-sunken/30 p-6 text-center text-xs text-muted">
                      <Icon name="message-square" size={24} className="mx-auto mb-1.5 opacity-40" />
                      <p>{t(lang, "No recruiter notes recorded yet.")}</p>
                    </div>
                  )}
                  {cand.notes?.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-line bg-sunken/40 p-4 text-xs space-y-1"
                    >
                      <p className="text-ink leading-relaxed font-sans">{n.text}</p>
                      <span className="block text-[10px] text-muted font-medium">
                        {n.author} · {n.at}
                      </span>
                    </div>
                  ))}
                </div>

                {manage && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-line/60">
                    <textarea
                      rows={3}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder={t(
                        lang,
                        "Add an internal evaluation note for the hiring team…"
                      )}
                      className="w-full rounded-xl border border-line bg-sunken/20 p-3 text-xs text-ink placeholder-muted focus:border-brand focus:bg-card focus:outline-none transition-colors"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          if (!noteDraft.trim()) return;
                          await addCandidateNote(
                            cand.id,
                            noteDraft.trim(),
                            getAuth()?.name || "Recruiter"
                          );
                          setNoteDraft("");
                          setToast(t(lang, "Note saved"));
                          if (loadData) loadData();
                        }}
                        className="font-bold text-xs"
                      >
                        <Icon name="send" size={13} />
                        {t(lang, "Save Note")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: DIRECT MESSAGES                                         */}
          {/* ============================================================== */}
          {activeTab === "messages" && (() => {
            const allowDm = Boolean(dmThread?.allow_recruiter_dm ?? cand.allow_recruiter_dm);

            const handleSendDm = async (e) => {
              e.preventDefault();
              if (!manage || !dmDraft.trim() || !allowDm) return;
              setDmSending(true);
              try {
                const res = await sendApplicantMessageStore(cand.id, dmDraft.trim());
                if (res?.message) {
                  setDmMessages((prev) => [...prev, res.message]);
                }
                if (res?.thread) setDmThread(res.thread);
                setDmDraft("");
                setToast(t(lang, "Direct message sent"));
              } catch (err) {
                setToast(err?.message || t(lang, "Failed to send message"));
              } finally {
                setDmSending(false);
              }
            };

            return (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="rounded-2xl border border-line bg-card p-5 shadow-xs space-y-4">
                  {/* Account Policy Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${allowDm ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                        <Icon name={allowDm ? "message-square" : "lock"} size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-ink">
                          {t(lang, "Candidate Direct Messages")}
                        </h3>
                        <p className="text-xs text-muted">
                          {allowDm
                            ? t(lang, "Direct messaging enabled by candidate's account contact policy.")
                            : t(lang, "Candidate has not enabled recruiter Direct Messages in their account policy.")}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${allowDm
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${allowDm ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {allowDm ? t(lang, "Messaging Allowed") : t(lang, "Disabled by Candidate Policy")}
                    </span>
                  </div>

                  {!allowDm && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-sunken/50 p-4 text-center text-xs text-muted">
                      {t(lang, "This candidate did not opt in to recruiter Direct Messages during account registration / privacy settings.")}
                    </div>
                  )}

                  {/* Message History Timeline */}
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {dmLoading ? (
                      <div className="py-8 text-center text-xs text-muted">
                        <Icon name="loader" size={20} className="animate-spin mx-auto mb-2 text-brand" />
                        {t(lang, "Loading messages...")}
                      </div>
                    ) : dmMessages.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted bg-sunken/30 rounded-xl border border-line/60">
                        {allowDm
                          ? t(lang, "No direct messages yet. Start the conversation with the candidate below.")
                          : t(lang, "No messages exchanged.")}
                      </div>
                    ) : (
                      dmMessages.map((m) => {
                        const isRecruiter = m.sender_role === "recruiter";
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isRecruiter ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${isRecruiter
                                ? "bg-brand text-white rounded-br-sm"
                                : "bg-sunken border border-line text-ink rounded-bl-sm"
                                }`}
                            >
                              <div className={`text-[10px] font-bold mb-1 ${isRecruiter ? "text-white/80" : "text-muted"}`}>
                                {m.sender_name} · {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                              </div>
                              <p className="m-0 whitespace-pre-wrap">{m.body}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Composer */}
                  {allowDm && manage && (
                    <form onSubmit={handleSendDm} className="pt-3 border-t border-line flex flex-col sm:flex-row gap-2.5">
                      <textarea
                        rows={2}
                        value={dmDraft}
                        onChange={(e) => setDmDraft(e.target.value)}
                        placeholder={t(lang, "Write a direct message to the candidate...")}
                        className="flex-1 rounded-xl border border-line bg-card px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={dmSending || !dmDraft.trim()}
                        className="shrink-0 self-end sm:self-stretch px-4 text-xs font-bold gap-1.5"
                      >
                        <Icon name="send" size={14} />
                        {dmSending ? t(lang, "Sending...") : t(lang, "Send Message")}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* TAB 4: VERIFIED DOCUMENTS                                      */}
          {/* ============================================================== */}
          {activeTab === "documents" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-line bg-card p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <Icon name="shield" size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-ink">
                        {t(lang, "Confidential Candidate Verification Documents")}
                      </h3>
                      <p className="text-xs text-muted">
                        {t(lang, "Contracts, relieving letters, payslips & degrees")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isShortlistedPlus(cand.stage) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsRequestDocModalOpen(true)}
                        className="text-xs font-bold gap-1.5 text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100"
                      >
                        <Icon name="file-text" size={13} />
                        {t(lang, "Request Documents")}
                      </Button>
                    )}
                    {isShortlistedPlus(cand.stage) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold">
                        <Icon name="unlock" size={12} /> {t(lang, "Unlocked")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-bold">
                        <Icon name="lock" size={12} /> {t(lang, "Locked")}
                      </span>
                    )}
                  </div>
                </div>

                {!isShortlistedPlus(cand.stage) ? (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-xs text-amber-900 space-y-2 text-center">
                    <Icon name="lock" size={28} className="mx-auto text-amber-600 mb-1" />
                    <h4 className="font-bold text-amber-950 text-sm">
                      {t(lang, "Documents are Encrypted & Confidential")}
                    </h4>
                    <p className="text-xs text-amber-800/90 max-w-lg mx-auto leading-relaxed">
                      {t(
                        lang,
                        "Candidate employment contracts, relieving letters, payslips, and degree certificates are encrypted. Under EMP-FR-026b and Vietnam PDPD Decree 13/2023/ND-CP, full access is granted from the Shortlisted stage onward."
                      )}
                    </p>
                  </div>
                ) : loadingVerificationDocs ? (
                  <div className="py-12 text-center text-xs text-muted space-y-2">
                    <Icon name="loader" size={24} className="animate-spin mx-auto text-emerald-600" />
                    <p>{t(lang, "Loading verified documents from encrypted storage...")}</p>
                  </div>
                ) : verificationDocs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line bg-sunken/40 p-8 text-center text-xs text-muted space-y-2">
                    <Icon name="file-text" size={28} className="mx-auto text-muted/50" />
                    <p className="font-semibold text-ink">
                      {t(lang, "No verification documents uploaded yet.")}
                    </p>
                    <p className="text-[11px] text-muted">
                      {t(lang, "Candidate has not submitted contracts or credentials for this role.")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {verificationDocs.map((vdoc) => (
                      <div
                        key={vdoc.id}
                        className="rounded-xl border border-line bg-card p-4 hover:border-emerald-300 transition-colors shadow-2xs flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <Icon name="file-text" size={17} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-ink truncate">
                                {vdoc.title || vdoc.file_name}
                              </h4>
                              <span className="text-[10px] text-muted block truncate">
                                {vdoc.file_name} ({formatBytes(vdoc.size_bytes || 0)})
                              </span>
                            </div>
                          </div>
                          <span className="inline-block rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase shrink-0">
                            {vdoc.category || "Verified"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-line/60">
                          <span className="text-[10px] font-mono text-muted">AES-256</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setViewingDoc({
                                doc: vdoc,
                                candidateName: cand.name,
                                applicationId: cand.id,
                              })
                            }
                            className="text-xs font-bold gap-1 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                          >
                            <Icon name="eye" size={13} />
                            {t(lang, "Inspect Document")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <RequestPriorEmploymentDocsModal
          isOpen={isRequestDocModalOpen}
          onClose={() => setIsRequestDocModalOpen(false)}
          applicationId={cand.id}
          candidateName={cand.name}
          onSuccess={() => {
            getApplicantVerificationDocuments(cand.id, cand.name)
              .then((docs) => setVerificationDocs(docs || []))
              .catch(() => { });
          }}
          lang={lang}
          t={t}
        />
      </aside>
    </div>
  );
}
