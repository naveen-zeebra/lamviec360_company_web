"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import { Avatar } from "../../../../components/ds";
import StatusBadge from "../../../../components/company/StatusBadge";
import { getCandidatePdfUrl, getResumeFileInfo } from "./CandidatesConstants";

export default function CandidateResumeModal({
  lang,
  t,
  resumeCandidate,
  setResumeCandidate,
  resumeModalTab,
  setResumeModalTab,
  activeJob,
}) {
  if (!resumeCandidate) return null;

  const fileInfo = getResumeFileInfo(resumeCandidate);

  return (
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
                <h2 className="text-base font-black text-ink">
                  {resumeCandidate.name}
                </h2>
                <StatusBadge
                  kind="stage"
                  value={resumeCandidate.stage}
                  lang={lang}
                />
              </div>
              <p className="text-xs text-muted">
                {activeJob?.title} · {t(lang, "Applied")}:{" "}
                {resumeCandidate.appliedDate}
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
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] uppercase font-black ${
                  resumeModalTab === "pdf"
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
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
              download={
                resumeCandidate.resumeFileName ||
                `${resumeCandidate.name?.replace(/\s+/g, "_")}_CV.pdf`
              }
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

        {/* Modal Body */}
        {resumeModalTab === "pdf" ? (
          <div className="flex-1 w-full h-full flex flex-col bg-slate-900/5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-line bg-card/90 px-6 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold border ${
                    fileInfo.fileType === "docx"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {fileInfo.fileType === "docx" ? "DOCX" : "PDF 1.4"}
                </span>
                <span className="font-bold text-ink">{fileInfo.fileName}</span>
                <span className="hidden md:inline text-muted">
                  · {t(lang, "Candidate uploaded document")}
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

            {fileInfo.fileType === "docx" ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-sunken/30 text-center">
                <div className="mx-auto max-w-md rounded-2xl border border-line bg-card p-6 shadow-sm space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
                    <Icon name="file-text" size={30} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-ink">
                      Microsoft Word Document (.docx)
                    </h3>
                    <p className="mt-1.5 text-xs text-muted leading-relaxed">
                      {t(
                        lang,
                        "This resume was uploaded as a Word file. Web browsers do not embed Word documents directly in iframes. You can view the candidate's structured profile or download the file."
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      variant="primary"
                      onClick={() => setResumeModalTab("profile")}
                      className="gap-1.5 text-xs font-bold"
                    >
                      <Icon name="user" size={14} />
                      {t(lang, "Switch to Profile View")}
                    </Button>
                    <a
                      href={
                        resumeCandidate.resumeUrl ||
                        resumeCandidate.resume_url ||
                        "#"
                      }
                      download={fileInfo.fileName}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3.5 py-2 text-xs font-bold text-ink hover:bg-sunken transition-colors shadow-xs"
                    >
                      <Icon name="download" size={14} />
                      {t(lang, "Download .docx")}
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 w-full h-full relative bg-slate-100">
                <iframe
                  src={`${getCandidatePdfUrl(
                    resumeCandidate
                  )}#toolbar=1&navpanes=0`}
                  className="w-full h-full border-0 absolute inset-0"
                  title={`${resumeCandidate.name} - Resume PDF`}
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 rounded-lg bg-card/95 backdrop-blur-sm border border-line px-3.5 py-1.5 shadow-md text-xs">
                  <span className="text-muted text-[11px]">
                    {t(lang, "Having trouble viewing preview?")}
                  </span>
                  <a
                    href={getCandidatePdfUrl(resumeCandidate)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-brand hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <Icon name="external-link" size={11} />
                    {t(lang, "Open in New Tab")}
                  </a>
                  <span className="text-line text-xs">·</span>
                  <button
                    type="button"
                    onClick={() => setResumeModalTab("profile")}
                    className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <Icon name="user" size={11} />
                    {t(lang, "Switch to Profile View")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-sunken/20">
            <div className="mx-auto max-w-3xl rounded-xl border border-line bg-card p-8 md:p-10 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-line pb-6">
                <div className="flex items-center gap-4">
                  <Avatar name={resumeCandidate.name} size={64} />
                  <div>
                    <h1 className="text-2xl font-black text-ink">
                      {resumeCandidate.name}
                    </h1>
                    <p className="text-sm font-semibold text-brand">
                      {resumeCandidate.headline ||
                        resumeCandidate.candidate_headline ||
                        `Candidate for ${activeJob?.title || "Open Position"}`}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {resumeCandidate.email} · {resumeCandidate.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-line bg-sunken/40 px-4 py-2 text-center">
                    <span className="block text-[10px] font-bold text-muted uppercase">
                      {t(lang, "Experience")}
                    </span>
                    <strong className="text-base font-black text-ink">
                      {resumeCandidate.experienceYears} {t(lang, "Yrs")}
                    </strong>
                  </div>
                  <div className="rounded-xl border border-line bg-sunken/40 px-4 py-2 text-center">
                    <span className="block text-[10px] font-bold text-muted uppercase">
                      {t(lang, "AI Score")}
                    </span>
                    <strong className="text-base font-black text-emerald-600">
                      {resumeCandidate.matchScore}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              {resumeCandidate.coverLetter && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                    {t(lang, "Cover Letter / Candidate Intro")}
                  </h3>
                  <div className="rounded-xl border border-line bg-sunken/30 p-4 text-xs text-ink/90 leading-relaxed whitespace-pre-wrap">
                    {resumeCandidate.coverLetter}
                  </div>
                </div>
              )}

              {/* Skills */}
              {Array.isArray(resumeCandidate.skills) &&
                resumeCandidate.skills.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted">
                      {t(lang, "Key Competencies & Technical Skills")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeCandidate.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink shadow-2xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

