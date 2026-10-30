"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import Select from "../../../../components/ds/Select";
import {
  FIXED_PIPELINE_STAGES,
  getStageStyle,
  MATCH_FILTERS,
  EXP_FILTERS,
  SORTS,
  PAGE_SIZES,
} from "./CandidatesConstants";

export default function CandidatesFilters({
  lang,
  t,
  activeStage,
  setActiveStage,
  setPage,
  stageCounts,
  searchQuery,
  setSearchQuery,
  minScoreFilter,
  setMinScoreFilter,
  expFilter,
  setExpFilter,
  sortBy,
  setSortBy,
  candidatesCount,
  pageSize,
  setPageSize,
  pagination,
  resetFilters,
  viewMode,
  density,
  setDensity,
  handleExportCsv,
  isExporting,
}) {
  const hasActiveFilters =
    activeStage !== "All" ||
    searchQuery ||
    minScoreFilter !== "0" ||
    expFilter !== "all" ||
    sortBy !== "date";

  return (
    <>
      {/* ── Horizontal Stage Tabs with Live Job Counts ── */}
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
              activeStage === "All"
                ? "bg-white/20 text-white"
                : "bg-sunken text-ink"
            }`}
          >
            {(stageCounts.Total || 0).toLocaleString()}
          </span>
        </button>

        {FIXED_PIPELINE_STAGES.map((stg) => {
          const count = stageCounts[stg] || 0;
          const isSelected = activeStage === stg;
          const color = getStageStyle(stg);

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
              <span
                className={`h-2 w-2 rounded-full ${
                  isSelected ? "bg-white" : color.dot
                }`}
              />
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

      {/* ── High-Performance Filter & Search Toolbar ── */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search Box */}
          <div className="relative lg:col-span-5">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                lang,
                "Search applicants by name, email, or skill..."
              )}
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

          {/* AI Match Score */}
          <div className="lg:col-span-3">
            <Select
              value={minScoreFilter}
              onChange={(e) => {
                setMinScoreFilter(e.target.value);
                setPage(1);
              }}
              options={MATCH_FILTERS.map((f) => ({
                value: f.value,
                label: t(lang, f.label),
              }))}
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
              options={EXP_FILTERS.map((f) => ({
                value: f.value,
                label: t(lang, f.label),
              }))}
            />
          </div>

          {/* Sort Filter */}
          <div className="lg:col-span-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={SORTS.map((s) => ({
                value: s.value,
                label: t(lang, s.label),
              }))}
            />
          </div>
        </div>

        {/* Sub-toolbar row: Reset, Density Toggle, CSV Export, and Rows per page */}
        <div className="mt-3 flex flex-wrap items-center justify-between border-t border-line/60 pt-3 text-xs text-muted gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              {t(lang, "Showing")}{" "}
              <strong className="text-ink">
                {candidatesCount > 0
                  ? (pagination.page - 1) * Number(pageSize) + 1
                  : 0}{" "}
                –{" "}
                {Math.min(
                  pagination.page * Number(pageSize),
                  pagination.total || 0
                )}
              </strong>{" "}
              {t(lang, "of")}{" "}
              <strong className="text-ink">
                {(pagination.total || 0).toLocaleString()}
              </strong>{" "}
              {t(lang, "applicants for this job")}
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

          <div className="flex items-center gap-3 flex-wrap">
            {/* Density switch */}
            {viewMode === "table" && (
              <div className="inline-flex rounded-md border border-line bg-sunken/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setDensity("compact")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    density === "compact"
                      ? "bg-card text-ink shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                  title="Compact rows for high density"
                >
                  {t(lang, "Compact")}
                </button>
                <button
                  type="button"
                  onClick={() => setDensity("comfortable")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    density === "comfortable"
                      ? "bg-card text-ink shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                  title="Comfortable row padding"
                >
                  {t(lang, "Comfortable")}
                </button>
              </div>
            )}

            {/* Export CSV Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="gap-1.5 text-xs font-bold"
              title="Export up to 5,000 matching candidates for this job to CSV"
            >
              <Icon
                name={isExporting ? "rotate-ccw" : "download"}
                size={13}
                className={isExporting ? "animate-spin" : ""}
              />
              {isExporting ? t(lang, "Exporting...") : t(lang, "Export CSV")}
            </Button>

            {/* Rows per page */}
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline">
                {t(lang, "Rows per page:")}
              </span>
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
      </div>
    </>
  );
}

