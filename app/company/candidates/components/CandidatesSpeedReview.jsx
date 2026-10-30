"use client";

import React, { useState, useEffect } from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import { Avatar } from "../../../../components/ds";
import StatusBadge from "../../../../components/company/StatusBadge";
import {
  getScoreBadgeClass,
  getCandidatePdfUrl,
  getResumeFileInfo,
} from "./CandidatesConstants";

export default function CandidatesSpeedReview({
  lang,
  t,
  manage,
  activeJob,
  candidates,
  speedIndex,
  setSpeedIndex,
  page,
  setPage,
  pagination,
  selected,
  setSelected,
  handleMoveStage,
  openScheduleModal,
  getNextStage,
}) {
  const [speedTab, setSpeedTab] = useState("pdf"); // 'pdf' | 'profile'
  const speedCandidate = candidates[speedIndex] || null;

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Keyboard navigation for Speed Review
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.closest("input, textarea, select")) return;
      const key = e.key.toLowerCase();
      const currentCand = candidates[speedIndex];
      if (!currentCand) return;

      if (key === "j" || key === "arrowdown") {
        e.preventDefault();
        if (speedIndex < candidates.length - 1) {
          setSpeedIndex(speedIndex + 1);
        } else if (page < pagination.totalPages) {
          setPage((p) => p + 1);
          setSpeedIndex(0);
        }
      } else if (key === "k" || key === "arrowup") {
        e.preventDefault();
        if (speedIndex > 0) {
          setSpeedIndex(speedIndex - 1);
        } else if (page > 1) {
          setPage((p) => Math.max(1, p - 1));
          setSpeedIndex(0);
        }
      } else if (key === "x") {
        e.preventDefault();
        if (manage) toggleSelect(currentCand.id);
      } else if (key === "s") {
        e.preventDefault();
        if (manage) {
          handleMoveStage(currentCand.id, "Shortlisted", currentCand.stage);
          if (speedIndex < candidates.length - 1) setSpeedIndex(speedIndex + 1);
        }
      } else if (key === "r") {
        e.preventDefault();
        if (manage) {
          handleMoveStage(currentCand.id, "Rejected", currentCand.stage);
        }
      } else if (key === "i") {
        e.preventDefault();
        if (manage) openScheduleModal(currentCand);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    speedIndex,
    candidates,
    manage,
    page,
    pagination.totalPages,
    selected,
    handleMoveStage,
    openScheduleModal,
  ]);

  return (
    <div className="flex flex-col gap-3">
      {/* Keyboard Short-cuts Banner */}
      <div className="flex items-center justify-between border border-amber-200 bg-amber-50/70 px-4 py-2 rounded-xl text-xs text-amber-900 shadow-2xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon name="zap" size={15} className="text-amber-600" />
          <strong className="font-bold">
            {t(lang, "Speed Review Active")}
          </strong>
          <span className="text-amber-700 hidden sm:inline">
            · {t(lang, "Review applications rapidly with keyboard shortcuts")}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold flex-wrap">
          <span className="rounded bg-white/90 border border-amber-300 px-2 py-0.5 text-slate-800">
            <kbd className="font-mono text-indigo-700 font-extrabold">S</kbd>{" "}
            {t(lang, "Shortlist")}
          </span>
          <span className="rounded bg-white/90 border border-amber-300 px-2 py-0.5 text-slate-800">
            <kbd className="font-mono text-purple-700 font-extrabold">I</kbd>{" "}
            {t(lang, "Interview")}
          </span>
          <span className="rounded bg-white/90 border border-amber-300 px-2 py-0.5 text-slate-800">
            <kbd className="font-mono text-rose-700 font-extrabold">R</kbd>{" "}
            {t(lang, "Reject")}
          </span>
          <span className="rounded bg-white/90 border border-amber-300 px-2 py-0.5 text-slate-800">
            <kbd className="font-mono text-slate-700 font-extrabold">J / K</kbd>{" "}
            {t(lang, "Next / Prev")}
          </span>
          <span className="rounded bg-white/90 border border-amber-300 px-2 py-0.5 text-slate-800">
            <kbd className="font-mono text-slate-700 font-extrabold">X</kbd>{" "}
            {t(lang, "Select")}
          </span>
        </div>
      </div>

      {/* 2-Pane Split-Screen Layout */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-210px)] min-h-[640px]">
        {/* Left Queue Pane */}
        <div className="w-full lg:w-[380px] shrink-0 rounded-xl border border-line bg-card shadow-xs flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-sunken/40 px-4 py-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-ink">
                {t(lang, "Candidate Queue")}
              </h3>
              <span className="text-[11px] text-muted">
                {candidates.length > 0 ? speedIndex + 1 : 0} {t(lang, "of")}{" "}
                {candidates.length} ({t(lang, "Page")} {page}/
                {pagination.totalPages || 1})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  setSpeedIndex(0);
                }}
                className="h-7 w-7 p-0"
                title={t(lang, "Previous Page")}
              >
                <Icon name="chevron-left" size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => {
                  setPage((p) => p + 1);
                  setSpeedIndex(0);
                }}
                className="h-7 w-7 p-0"
                title={t(lang, "Next Page")}
              >
                <Icon name="chevron-right" size={14} />
              </Button>
            </div>
          </div>

          {/* Scrollable List of Candidates in Queue */}
          <div className="flex-1 overflow-y-auto divide-y divide-line/60 p-2 space-y-1">
            {candidates.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                <p>{t(lang, "No applicants found for this job.")}</p>
              </div>
            ) : (
              candidates.map((cand, idx) => {
                const isSelected = idx === speedIndex;
                const isChecked = selected.includes(cand.id);

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSpeedIndex(idx)}
                    className={`group flex items-start gap-3 rounded-lg p-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/80 border border-brand/50 shadow-xs ring-1 ring-brand/30"
                        : "hover:bg-sunken/50 border border-transparent"
                    }`}
                  >
                    {manage && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(cand.id);
                        }}
                        className="h-4 w-4 rounded border-line text-brand accent-blue-600 mt-1 cursor-pointer"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="block truncate text-xs font-bold text-ink group-hover:text-brand">
                          {cand.name}
                        </strong>
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-black ${getScoreBadgeClass(
                            cand.matchScore
                          )}`}
                        >
                          ★ {cand.matchScore}%
                        </span>
                      </div>

                      <span className="block truncate text-[11px] text-muted">
                        {cand.appliedDate || t(lang, "Recently applied")}
                      </span>

                      <div className="mt-1.5 flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-700 bg-sunken px-1.5 py-0.2 rounded">
                          {cand.experienceYears} {t(lang, "yrs exp")}
                        </span>
                        <StatusBadge
                          kind="stage"
                          value={cand.stage}
                          lang={lang}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Sticky Inspection & Decision Action Bar */}
        <div className="flex-1 rounded-xl border border-line bg-card shadow-xs flex flex-col overflow-hidden">
          {speedCandidate ? (
            <>
              {/* Pane Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-line bg-sunken/40 px-5 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={speedCandidate.name} size={40} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-black text-ink truncate">
                        {speedCandidate.name}
                      </h2>
                      <StatusBadge
                        kind="stage"
                        value={speedCandidate.stage}
                        lang={lang}
                      />
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${getScoreBadgeClass(
                          speedCandidate.matchScore
                        )}`}
                      >
                        ★ {speedCandidate.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate">
                      {activeJob?.title} · {t(lang, "Applied")}:{" "}
                      {speedCandidate.appliedDate}
                    </p>
                  </div>
                </div>

                {/* View Switcher Tabs & External open */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-line bg-card p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setSpeedTab("pdf")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        speedTab === "pdf"
                          ? "bg-brand text-white shadow-xs"
                          : "text-muted hover:text-ink hover:bg-sunken"
                      }`}
                    >
                      {t(lang, "Uploaded PDF")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpeedTab("profile")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        speedTab === "profile"
                          ? "bg-brand text-white shadow-xs"
                          : "text-muted hover:text-ink hover:bg-sunken"
                      }`}
                    >
                      {t(lang, "Profile & Summary")}
                    </button>
                  </div>

                  <a
                    href={getCandidatePdfUrl(speedCandidate)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-muted hover:text-ink rounded-lg border border-line bg-card hover:bg-sunken"
                    title={t(lang, "Open resume in new window")}
                  >
                    <Icon name="external-link" size={14} />
                  </a>
                </div>
              </div>

              {/* Main Preview Content Area */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
                {speedTab === "pdf" ? (
                  getResumeFileInfo(speedCandidate).fileType === "docx" ? (
                    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-line bg-card p-8 text-center shadow-xs">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto border border-blue-200">
                        <Icon name="file-text" size={28} />
                      </div>
                      <h4 className="text-sm font-bold text-ink">
                        {speedCandidate.resumeFileName || "Candidate_CV.docx"}
                      </h4>
                      <p className="text-xs text-muted">
                        {t(
                          lang,
                          "This candidate submitted a Microsoft Word format (.docx) resume. Download to review in full fidelity."
                        )}
                      </p>
                      <a
                        href={getResumeFileInfo(speedCandidate).fileUrl}
                        download={getResumeFileInfo(speedCandidate).fileName}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover shadow-xs"
                      >
                        <Icon name="download" size={14} />
                        {t(lang, "Download DOCX Attachment")}
                      </a>
                    </div>
                  ) : (
                    <div className="relative h-full min-h-[500px] w-full rounded-xl border border-line bg-card shadow-xs overflow-hidden">
                      <iframe
                        src={`${getCandidatePdfUrl(
                          speedCandidate
                        )}#toolbar=1&navpanes=0`}
                        className="h-full w-full border-0 absolute inset-0"
                        title={`${speedCandidate.name} Resume`}
                      />
                    </div>
                  )
                ) : (
                  <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-line bg-card p-6 shadow-xs">
                    <h3 className="text-sm font-black text-ink border-b border-line pb-2">
                      {t(lang, "Applicant Profile Overview")}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-muted">{t(lang, "Email")}</span>
                        <strong className="text-ink">{speedCandidate.email}</strong>
                      </div>
                      <div>
                        <span className="block text-muted">{t(lang, "Phone")}</span>
                        <strong className="text-ink">{speedCandidate.phone}</strong>
                      </div>
                      <div>
                        <span className="block text-muted">
                          {t(lang, "Experience")}
                        </span>
                        <strong className="text-ink">
                          {speedCandidate.experienceYears} {t(lang, "years")}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-muted">
                          {t(lang, "Education")}
                        </span>
                        <strong className="text-ink">
                          {speedCandidate.educationLevel}
                        </strong>
                      </div>
                    </div>

                    {speedCandidate.coverLetter && (
                      <div className="pt-2 border-t border-line">
                        <span className="block text-xs font-bold text-muted mb-1">
                          {t(lang, "Cover Letter")}
                        </span>
                        <p className="text-xs text-ink/80 leading-relaxed bg-sunken/40 p-3 rounded-lg border border-line whitespace-pre-wrap">
                          {speedCandidate.coverLetter}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="flex flex-wrap items-center justify-between border-t border-line bg-card px-5 py-3 gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={speedIndex <= 0}
                    onClick={() => {
                      if (speedIndex > 0) setSpeedIndex(speedIndex - 1);
                    }}
                    className="gap-1 text-xs font-bold"
                    title="[K] Previous candidate"
                  >
                    <Icon name="arrow-up" size={12} />
                    {t(lang, "Prev (K)")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={speedIndex >= candidates.length - 1}
                    onClick={() => {
                      if (speedIndex < candidates.length - 1) {
                        setSpeedIndex(speedIndex + 1);
                      }
                    }}
                    className="gap-1 text-xs font-bold"
                    title="[J] Next candidate"
                  >
                    {t(lang, "Next (J)")}
                    <Icon name="arrow-down" size={12} />
                  </Button>
                </div>

                {manage && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        handleMoveStage(
                          speedCandidate.id,
                          "Rejected",
                          speedCandidate.stage
                        )
                      }
                      className="gap-1.5 text-xs font-bold"
                      title="[R] Reject candidate"
                    >
                      <Icon name="x" size={13} />
                      {t(lang, "Reject (R)")}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openScheduleModal(speedCandidate)}
                      className="gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100"
                      title="[I] Schedule interview"
                    >
                      <Icon name="calendar" size={13} />
                      {t(lang, "Interview (I)")}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        handleMoveStage(
                          speedCandidate.id,
                          "Shortlisted",
                          speedCandidate.stage
                        );
                        if (speedIndex < candidates.length - 1) {
                          setSpeedIndex(speedIndex + 1);
                        }
                      }}
                      className="gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                      title="[S] Shortlist candidate"
                    >
                      <Icon name="star" size={13} />
                      {t(lang, "Shortlist (S)")}
                    </Button>

                    {getNextStage(speedCandidate.stage) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          handleMoveStage(
                            speedCandidate.id,
                            getNextStage(speedCandidate.stage),
                            speedCandidate.stage
                          );
                          if (speedIndex < candidates.length - 1) {
                            setSpeedIndex(speedIndex + 1);
                          }
                        }}
                        className="gap-1 text-xs font-bold"
                      >
                        {t(lang, "Advance")}
                        <Icon name="arrow-right" size={12} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10 text-center text-xs text-muted">
              {t(lang, "No applicant selected for speed review.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

