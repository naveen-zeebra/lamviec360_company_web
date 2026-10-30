"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import { FUNNEL_STAGES } from "./CandidatesConstants";

export default function CandidatesHeader({
  lang,
  t,
  jobs,
  activeJob,
  jobFilter,
  handleJobChange,
  stageCounts,
  activeStage,
  setActiveStage,
  setPage,
  showFunnel,
  setShowFunnel,
}) {
  return (
    <>
      {/* ── Prominent Job-Wise Context Bar ── */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3.5 min-w-0 flex-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand shrink-0">
              <Icon name="briefcase" size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted">
                <span className="font-black uppercase tracking-wider text-ink">
                  {t(lang, "Job Pipeline")}:
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {activeJob?.status || "Published"}
                </span>
                {activeJob?.type && (
                  <span className="font-semibold text-slate-700 bg-sunken px-2 py-0.5 rounded text-[11px]">
                    {activeJob.type}
                  </span>
                )}
                {activeJob?.department && (
                  <span className="font-semibold text-slate-700 bg-sunken px-2 py-0.5 rounded text-[11px]">
                    {activeJob.department}
                  </span>
                )}
                {activeJob?.location && (
                  <span className="hidden lg:inline text-muted">
                    · 📍 {activeJob.location}
                  </span>
                )}
              </div>

              {/* Job Switcher Select */}
              <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                <div className="relative inline-block max-w-[480px] w-full">
                  <select
                    value={jobFilter}
                    onChange={(e) => handleJobChange(e.target.value)}
                    className="w-full rounded-lg border border-line bg-card py-2 pl-3 pr-8 text-sm font-black text-ink shadow-xs focus:border-brand focus:outline-none cursor-pointer truncate"
                    aria-label={t(lang, "Select Job Pipeline")}
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.applicantCount ?? 0} {t(lang, "applicants")})
                      </option>
                    ))}
                  </select>
                </div>

                {activeJob?.id && (
                  <a
                    href={`/company/jobs/${activeJob.id}`}
                    className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                    title={t(lang, "View job posting details")}
                  >
                    <span>{t(lang, "View Job")}</span>
                    <Icon name="external-link" size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Job Pipeline Numbers */}
          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-line/60 pt-3 md:pt-0 md:pl-6 shrink-0">
            <div>
              <span className="block text-[11px] font-bold text-muted uppercase">
                {t(lang, "Total Applicants")}
              </span>
              <strong className="text-xl font-black text-ink">
                {(stageCounts.Total || 0).toLocaleString()}
              </strong>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-muted uppercase">
                {t(lang, "Active in Funnel")}
              </span>
              <strong className="text-xl font-black text-emerald-600">
                {Math.max(0, (stageCounts.Total || 0) - (stageCounts.Rejected || 0)).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Conversion Funnel Bar ── */}
      <div className="rounded-xl border border-line bg-card p-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-line/60">
          <div className="flex items-center gap-2">
            <Icon name="trending-up" size={15} className="text-brand" />
            <h3 className="text-xs font-black uppercase tracking-wider text-ink">
              {t(lang, "Recruitment Funnel")}
            </h3>
            <span className="text-[11px] text-muted hidden sm:inline">
              · {activeJob?.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              {(stageCounts.Rejected || 0).toLocaleString()} {t(lang, "Rejected")} (
              {stageCounts.Total > 0
                ? Math.round(((stageCounts.Rejected || 0) / stageCounts.Total) * 100)
                : 0}
              %)
            </span>
            <button
              type="button"
              onClick={() => setShowFunnel(!showFunnel)}
              className="text-xs font-semibold text-muted hover:text-ink p-1 rounded hover:bg-sunken"
              title={showFunnel ? t(lang, "Hide Funnel") : t(lang, "Show Funnel")}
            >
              <Icon name={showFunnel ? "chevron-up" : "chevron-down"} size={14} />
            </button>
          </div>
        </div>

        {showFunnel && (
          <div className="pt-3 overflow-x-auto scrollbar-thin">
            <div className="flex items-center min-w-[720px] gap-2 pb-1">
              {FUNNEL_STAGES.map((fstg, idx) => {
                const count = stageCounts[fstg.id] || 0;
                const total = stageCounts.Total || 1;
                const pctOfTotal = Math.round((count / total) * 100);
                const isSelected = activeStage === fstg.id;
                const prevCount =
                  idx > 0 ? stageCounts[FUNNEL_STAGES[idx - 1].id] || 0 : total;
                const stepConversion =
                  prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;

                return (
                  <div key={fstg.id} className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStage(fstg.id);
                        setPage(1);
                      }}
                      className={`flex-1 rounded-xl border p-2.5 text-left transition-all relative ${
                        isSelected
                          ? "border-brand bg-brand/5 shadow-xs ring-2 ring-brand/20"
                          : "border-line bg-sunken/40 hover:bg-card hover:border-brand/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted truncate">
                          <span className={`h-2 w-2 rounded-full ${fstg.dot}`} />
                          {t(lang, fstg.label)}
                        </span>
                        <span className="text-[10px] font-extrabold text-muted">
                          {idx === 0 ? "100%" : `${stepConversion}%`}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <strong className="text-base font-black text-ink">
                          {count.toLocaleString()}
                        </strong>
                        <span className="text-[10px] font-semibold text-muted">
                          {pctOfTotal}% {t(lang, "total")}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line/60">
                        <div
                          className={`h-full rounded-full ${fstg.dot}`}
                          style={{
                            width: `${Math.min(100, Math.max(8, pctOfTotal))}%`,
                          }}
                        />
                      </div>
                    </button>

                    {idx < FUNNEL_STAGES.length - 1 && (
                      <div className="px-1 text-muted/40 shrink-0">
                        <Icon name="chevron-right" size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

