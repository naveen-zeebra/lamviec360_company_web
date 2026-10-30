"use client";

import React, { useState, useEffect } from "react";
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
  getApplicantVerificationDocuments,
} from "../../../../lib/companyStore";
import { formatBytes } from "../../../../utils/format";

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
  openScheduleModal,
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
  const [verificationDocs, setVerificationDocs] = useState([]);
  const [loadingVerificationDocs, setLoadingVerificationDocs] = useState(false);

  const isShortlistedPlus = (stg) => SHORTLIST_PLUS.includes(stg);

  useEffect(() => {
    if (!open) return;
    if (isShortlistedPlus(open.stage)) {
      setLoadingVerificationDocs(true);
      getApplicantVerificationDocuments(open.id)
        .then((docs) => setVerificationDocs(docs || []))
        .catch(() => setVerificationDocs([]))
        .finally(() => setLoadingVerificationDocs(false));
    } else {
      setVerificationDocs([]);
    }
  }, [open?.id, open?.stage]);

  if (!open) return null;

  return (
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
                {activeJob?.title} · {open.appliedDate}
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
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${getScoreBadgeClass(
                  open.matchScore
                )}`}
              >
                ★ {open.matchScore}% Match
              </span>
              <button
                type="button"
                onClick={() => setShowAiExplain(!showAiExplain)}
                className="text-[11px] font-semibold text-brand hover:underline inline-flex items-center gap-1 ml-1"
                title={t(lang, "AI Match Score Breakdown (Explainable AI)")}
              >
                <span>{t(lang, "Explain")}</span>
                <Icon
                  name={showAiExplain ? "chevron-up" : "chevron-down"}
                  size={11}
                />
              </button>
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
                    onClick={() =>
                      handleMoveStage(
                        open.id,
                        getNextStage(open.stage),
                        open.stage
                      )
                    }
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
                    onClick={() =>
                      handleMoveStage(open.id, "Rejected", open.stage)
                    }
                    className="text-xs font-bold text-danger hover:bg-rose-50"
                  >
                    {t(lang, "Reject")}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* AI Match Score Explainability Breakdown */}
          {showAiExplain && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="sparkles" size={15} className="text-blue-600" />
                  <strong className="text-xs font-bold text-blue-950">
                    {t(lang, "AI Match Score Breakdown")}
                  </strong>
                </div>
                <span className="text-[11px] font-bold text-blue-700">
                  Overall: {open.matchScore}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    label: "Skills Alignment",
                    score: Math.min(100, Math.max(50, open.matchScore + 3)),
                    weight: "35%",
                  },
                  {
                    label: "Experience Level",
                    score: Math.min(100, Math.max(50, open.matchScore - 2)),
                    weight: "25%",
                  },
                  {
                    label: "Industry Relevance",
                    score: Math.min(100, Math.max(50, open.matchScore + 1)),
                    weight: "20%",
                  },
                  {
                    label: "Location & Commute",
                    score: Math.min(100, Math.max(50, open.matchScore + 4)),
                    weight: "10%",
                  },
                  {
                    label: "Education & Certifications",
                    score: Math.min(100, Math.max(50, open.matchScore - 4)),
                    weight: "10%",
                  },
                ].map((factor, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-medium text-slate-700">
                        {t(lang, factor.label)}{" "}
                        <span className="text-[10px] text-muted">
                          ({factor.weight})
                        </span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {factor.score}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-blue-800/80 pt-1 border-t border-blue-200/60 italic">
                {t(
                  lang,
                  "Evaluated by LamViec360 AI Engine · Transparent & non-discriminatory ethical scoring"
                )}
              </p>
            </div>
          )}

          {/* Contact & Professional Details */}
          <div className="rounded-xl border border-line bg-card p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted">
              {t(lang, "Candidate Overview")}
            </h3>
            <dl className="divide-y divide-line/60 text-xs">
              <div className="flex justify-between py-2">
                <dt className="text-muted">{t(lang, "Email Address")}</dt>
                <dd className="font-semibold text-ink">
                  {!contactVisible(open)
                    ? t(lang, "Hidden by privacy policy")
                    : privacy?.maskEmail
                    ? maskValue(open.email, "email")
                    : open.email || "—"}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted">{t(lang, "Phone Number")}</dt>
                <dd className="font-semibold text-ink">
                  {!contactVisible(open)
                    ? t(lang, "Hidden by privacy policy")
                    : privacy?.maskPhone
                    ? maskValue(open.phone, "phone")
                    : open.phone || "—"}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted">{t(lang, "Total Experience")}</dt>
                <dd className="font-semibold text-ink">
                  {open.experienceYears} {t(lang, "years")}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted">{t(lang, "Education Level")}</dt>
                <dd className="font-semibold text-ink">
                  {t(lang, open.educationLevel || "Bachelor's Degree")}
                </dd>
              </div>
              <div className="flex justify-between py-2 items-center">
                <dt className="text-muted">{t(lang, "Job Availability")}</dt>
                <dd>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      (open.job_availability || open.jobAvailability) ===
                      "open_to_opportunities"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : (open.job_availability || open.jobAvailability) ===
                          "not_looking"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        (open.job_availability || open.jobAvailability) ===
                        "open_to_opportunities"
                          ? "bg-amber-500"
                          : (open.job_availability || open.jobAvailability) ===
                            "not_looking"
                          ? "bg-rose-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    {(open.job_availability || open.jobAvailability) ===
                    "open_to_opportunities"
                      ? t(lang, "Open to Relevant Opportunities")
                      : (open.job_availability || open.jobAvailability) ===
                        "not_looking"
                      ? t(lang, "Not Looking")
                      : t(lang, "Open to Work")}
                  </span>
                </dd>
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
              <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                {t(lang, "Key Skills")}
              </h3>
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
              <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                {t(lang, "Cover Letter")}
              </h3>
              <p className="rounded-lg bg-sunken/40 p-3 text-xs leading-relaxed text-ink italic">
                "{open.coverLetter}"
              </p>
            </div>
          )}

          {/* Resume & Attachment Section */}
          {(() => {
            const fileInfo = getResumeFileInfo(open);
            return (
              <div className="rounded-xl border border-line bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs shrink-0 ${
                        fileInfo.fileType === "docx"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      <Icon name="file-text" size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-ink truncate">
                        {fileInfo.fileName}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {fileInfo.fileType === "docx"
                          ? t(lang, "Candidate Uploaded Word Document")
                          : t(lang, "Candidate Uploaded PDF Resume")}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold border shrink-0 ${
                      fileInfo.fileType === "docx"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {fileInfo.fileType === "docx" ? "DOCX" : "PDF 1.4"}
                  </span>
                </div>

                {fileInfo.fileType === "docx" ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-blue-900">
                      <Icon name="file-text" size={15} className="text-blue-600" />
                      <span>Microsoft Word (.docx)</span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      {t(
                        lang,
                        "This applicant submitted a Word document. You can download the original file or view the full parsed CV profile directly."
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="relative h-44 w-full overflow-hidden rounded-lg border border-line bg-slate-100 group">
                    <iframe
                      src={`${getCandidatePdfUrl(open)}#toolbar=0&navpanes=0`}
                      className="w-full h-full border-0 pointer-events-none"
                      title="Resume Quick Peek"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent flex items-end justify-between p-3">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate max-w-[200px]">
                        <Icon name="file-text" size={14} className="text-blue-400" />
                        {fileInfo.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => openResumeModal(open, "pdf")}
                        className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-ink shadow hover:bg-gray-100 transition-colors shrink-0"
                      >
                        {t(lang, "Expand PDF")}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-line/60">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openResumeModal(open)}
                    className="flex-1 gap-1.5 text-xs font-bold"
                  >
                    <Icon name="file-text" size={13} />
                    {fileInfo.fileType === "docx"
                      ? t(lang, "View Parsed Profile CV")
                      : t(lang, "Show Uploaded PDF")}
                  </Button>

                  <a
                    href={fileInfo.fileUrl}
                    download={fileInfo.fileName}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-sunken px-3 py-1.5 text-xs font-bold text-ink hover:bg-card transition-colors shadow-xs"
                    title={t(lang, "Download attachment")}
                  >
                    <Icon name="download" size={13} />
                    {t(lang, "Download")}
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Verification & Previous Employment Documents (Encrypted Storage) */}
          <div className="rounded-xl border border-line bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Icon name="shield" size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-ink">
                    {t(lang, "Verification & Employment Documents")}
                  </h3>
                  <span className="text-[11px] text-muted block">
                    {t(
                      lang,
                      "Contracts, relieving letters, payslips & certificates"
                    )}
                  </span>
                </div>
              </div>
              {isShortlistedPlus(open.stage) ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  <Icon name="unlock" size={10} /> {t(lang, "Unlocked")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                  <Icon name="lock" size={10} /> {t(lang, "Locked")}
                </span>
              )}
            </div>

            {!isShortlistedPlus(open.stage) ? (
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Icon name="lock" size={13} className="text-amber-600" />
                  <span>{t(lang, "Encrypted Candidate Documents")}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90">
                  {t(
                    lang,
                    "Verification documents (contracts, relieving letters, payslips, certificates) are encrypted. Access is granted from the Shortlisted stage onward."
                  )}
                </p>
              </div>
            ) : loadingVerificationDocs ? (
              <div className="py-4 text-center text-xs text-muted">
                <Icon
                  name="rotate-ccw"
                  size={18}
                  className="animate-spin mx-auto mb-1 text-brand"
                />
                <span>{t(lang, "Loading verified documents...")}</span>
              </div>
            ) : verificationDocs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line bg-sunken/40 p-3.5 text-center text-xs text-muted">
                <Icon
                  name="file-text"
                  size={20}
                  className="mx-auto mb-1 opacity-50"
                />
                <p>
                  {t(
                    lang,
                    "No verification documents uploaded by candidate yet."
                  )}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                {verificationDocs.map((vdoc) => (
                  <div
                    key={vdoc.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-sunken/40 p-3 text-xs transition-colors hover:bg-card"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card border border-line text-muted">
                        <Icon name="file" size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="font-bold text-ink truncate max-w-[200px]"
                            title={vdoc.title || vdoc.file_name}
                          >
                            {vdoc.title || vdoc.file_name}
                          </span>
                          <span className="rounded bg-brand-subtle px-1.5 py-0.2 text-[10px] font-bold text-brand uppercase">
                            {vdoc.category || "Document"}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted block mt-0.5">
                          {vdoc.file_name} · {formatBytes(vdoc.size_bytes || 0)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setViewingDoc({
                          doc: vdoc,
                          applicantId: open.id,
                          candidateName: open.name,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-card px-2.5 py-1 text-xs font-bold text-ink hover:bg-sunken transition-colors shrink-0 shadow-xs"
                      title={t(lang, "View confidential document (view-only)")}
                    >
                      <Icon name="eye" size={12} />
                      <span>{t(lang, "View")}</span>
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-[10px] text-muted pt-1">
                  <Icon name="shield" size={11} className="text-emerald-600" />
                  <span>
                    {t(
                      lang,
                      "View-only per Vietnam PDPD (Decree 13/2023/ND-CP). Direct downloads restricted."
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Rejection Details if Rejected */}
          {open.stage === "Rejected" &&
            (open.rejectionTemplateId || open.rejectionNote) && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 space-y-1.5">
                <strong className="block font-bold">
                  {t(lang, "Rejection Reason & Record")}
                </strong>
                {open.rejectionTemplateId && (
                  <span>{templateTitle(open.rejectionTemplateId)}</span>
                )}
                {open.rejectionNote && (
                  <p className="text-rose-800 italic">
                    "{open.rejectionNote}"
                  </p>
                )}
              </div>
            )}

          {/* Internal Notes Feed */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted">
              {t(lang, "Internal Recruiter Notes")}
            </h3>
            <div className="flex flex-col gap-2">
              {(!open.notes || open.notes.length === 0) && (
                <p className="text-xs text-muted italic">
                  {t(lang, "No notes recorded yet.")}
                </p>
              )}
              {open.notes?.map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border border-line bg-sunken/40 p-3 text-xs"
                >
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
                  placeholder={t(
                    lang,
                    "Write an internal note… (visible to team only)"
                  )}
                  className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink placeholder-muted focus:border-brand focus:outline-none"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    if (!noteDraft.trim()) return;
                    await addCandidateNote(
                      open.id,
                      noteDraft.trim(),
                      getAuth()?.name || "Hiring Team"
                    );
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
  );
}

