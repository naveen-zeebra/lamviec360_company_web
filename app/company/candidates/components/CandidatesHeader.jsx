"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import StatusBadge from "../../../../components/company/StatusBadge";
import { tr } from "../../../../utils/lang";

export default function CandidatesHeader({
  lang,
  t,
  activeJob,
  handleJobChange,
  stageCounts,
  viewMode,
  setViewMode,
  loading,
  loadData,
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-xs space-y-3">
      {/* Top navigation row: Back button & View Mode toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Back to All Jobs button */}
        <div>
          <button
            type="button"
            onClick={() => handleJobChange("")}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-line bg-sunken/60 px-3 py-1.5 font-bold text-ink hover:border-brand/40 hover:text-brand hover:bg-card transition-all cursor-pointer shadow-2xs text-xs"
          >
            <Icon name="arrow-left" size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>{tr(lang, "← Tất cả vị trí", "← All Jobs")}</span>
          </button>
        </div>

        {/* Right: View Mode switcher & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="inline-flex rounded-lg border border-line bg-sunken/50 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand text-white shadow-2xs"
                  : "text-muted hover:text-ink hover:bg-card"
              }`}
              title="Table list view"
            >
              <Icon name="list" size={13} />
              {t(lang, "Table View")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pipeline")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "pipeline"
                  ? "bg-brand text-white shadow-2xs"
                  : "text-muted hover:text-ink hover:bg-card"
              }`}
              title="Kanban pipeline board"
            >
              <Icon name="columns" size={13} />
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
            <Icon
              name="rotate-ccw"
              size={13}
              className={loading ? "animate-spin" : ""}
            />
          </Button>
        </div>
      </div>

      {/* Main Job Context Bar: Active Job Title, Badges, Metrics */}
      <div className="pt-2 border-t border-line/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand shrink-0">
            <Icon name="briefcase" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-ink tracking-tight truncate max-w-lg">
                {activeJob?.title || t(lang, "Job Applications")}
              </h2>
              <StatusBadge kind="job" value={activeJob?.status || "Published"} lang={lang} />
              {activeJob?.aiGenerated && (
                <span className="inline-flex items-center gap-1 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                  <Icon name="sparkles" size={9} /> AI
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted mt-0.5">
              {activeJob?.department && <span>{activeJob.department}</span>}
              {activeJob?.type && (
                <>
                  <span>•</span>
                  <span>{activeJob.type}</span>
                </>
              )}
              {activeJob?.location && (
                <>
                  <span>•</span>
                  <span>📍 {activeJob.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Prominent Applicant Count Pill */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3.5 py-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand text-white">
              <Icon name="users" size={13} />
            </span>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                {tr(lang, "Ứng viên vị trí này", "Applicants for this role")}
              </span>
              <strong className="text-base font-black text-ink">
                {(stageCounts.Total || 0).toLocaleString()} {tr(lang, "hồ sơ", "candidates")}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
