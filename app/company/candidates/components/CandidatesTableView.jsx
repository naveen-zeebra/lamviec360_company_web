"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import StatusBadge from "../../../../components/company/StatusBadge";
import {
  FIXED_PIPELINE_STAGES,
  getScoreBadgeClass,
  maskValue,
} from "./CandidatesConstants";

export default function CandidatesTableView({
  lang,
  t,
  manage,
  candidates,
  loading,
  selected,
  setSelected,
  selectAllMatching,
  setSelectAllMatching,
  pagination,
  page,
  setPage,
  jumpPage,
  setJumpPage,
  handleJumpPage,
  density,
  privacy,
  sortBy,
  setSortBy,
  handleMoveStage,
  handleRating,
  openResumeModal,
  setOpenId,
  setNoteDraft,
  getNextStage,
  setConfirmBulk,
  runBulk,
}) {
  const isPageSelected =
    candidates.length > 0 && candidates.every((c) => selected.includes(c.id));

  const handleSelectPage = () => {
    if (isPageSelected) {
      setSelected([]);
      setSelectAllMatching(false);
    } else {
      setSelected(candidates.map((c) => c.id));
    }
  };

  const handleSelectAllMatching = () => {
    setSelectAllMatching(true);
  };

  const handleClearSelection = () => {
    setSelected([]);
    setSelectAllMatching(false);
  };

  const toggleSelectOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const cellPy = density === "compact" ? "py-2" : "py-3.5";

  return (
    <div className="flex flex-col gap-3">
      {/* ── Floating Multi-Select & Bulk Actions Bar ── */}
      {manage && selected.length > 0 && (
        <div className="sticky top-4 z-40 flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/95 p-3.5 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-black text-white">
                {selectAllMatching
                  ? (pagination.total || 0).toLocaleString()
                  : selected.length}
              </span>
              <span className="text-sm font-bold text-ink">
                {selectAllMatching
                  ? `${(pagination.total || 0).toLocaleString()} ${t(
                    lang,
                    "candidates selected across all pages"
                  )}`
                  : `${selected.length} ${t(lang, "candidates selected")}`}
              </span>

              {isPageSelected &&
                (pagination.total || 0) > candidates.length &&
                !selectAllMatching && (
                  <button
                    type="button"
                    onClick={handleSelectAllMatching}
                    className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    {t(lang, "Select all")}{" "}
                    {(pagination.total || 0).toLocaleString()}{" "}
                    {t(lang, "candidates matching this filter")}
                  </button>
                )}

              {selectAllMatching && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  {t(lang, "Clear selection")}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  if (e.target.value === "Rejected") {
                    setConfirmBulk({ stage: "Rejected", phase: 1 });
                  } else {
                    runBulk(e.target.value);
                  }
                  e.target.value = "";
                }}
                className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink shadow-xs focus:border-brand focus:outline-none"
              >
                <option value="" disabled>
                  {t(lang, "Bulk Move to Stage…")}
                </option>
                {FIXED_PIPELINE_STAGES.map((s) => (
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
                onClick={handleClearSelection}
                className="text-xs font-bold text-muted hover:text-ink"
              >
                {t(lang, "Cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table Container ── */}
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-sunken/50 text-[11px] font-black uppercase tracking-wider text-muted">
                {manage && (
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isPageSelected}
                      onChange={handleSelectPage}
                      aria-label="Select all on this page"
                      className="rounded border-line text-brand focus:ring-brand"
                    />
                  </th>
                )}
                <th
                  onClick={() => setSortBy("name")}
                  className="cursor-pointer px-4 py-3 hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t(lang, "Candidate")}</span>
                    {sortBy === "name" && <Icon name="arrow-up" size={12} />}
                  </div>
                </th>
                <th
                  onClick={() => setSortBy("experience")}
                  className="cursor-pointer px-4 py-3 hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t(lang, "Experience")}</span>
                    {sortBy === "experience" && (
                      <Icon name="arrow-down" size={12} />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => setSortBy("score")}
                  className="cursor-pointer px-4 py-3 hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t(lang, "AI Match Score")}</span>
                    {sortBy === "score" && <Icon name="arrow-down" size={12} />}
                  </div>
                </th>
                <th className="px-4 py-3">{t(lang, "Stage")}</th>
                <th className="px-4 py-3 text-right">{t(lang, "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {loading && candidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={manage ? 7 : 6}
                    className="py-12 text-center text-muted"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Icon
                        name="rotate-ccw"
                        size={20}
                        className="animate-spin text-brand"
                      />
                      <span>{t(lang, "Loading applicants...")}</span>
                    </div>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={manage ? 7 : 6}
                    className="py-12 text-center text-muted"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Icon name="inbox" size={28} className="text-muted/60" />
                      <strong className="text-sm font-bold text-ink">
                        {t(lang, "No candidates found")}
                      </strong>
                      <span className="text-xs">
                        {t(
                          lang,
                          "Try resetting your filters or selecting another job pipeline."
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                candidates.map((c) => {
                  const isChecked = selected.includes(c.id);
                  const initials = (c.name || "C")
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const displayEmail = privacy?.maskEmail
                    ? maskValue(c.email, "email")
                    : c.email;
                  const displayPhone = privacy?.maskPhone
                    ? maskValue(c.phone, "phone")
                    : c.phone;

                  return (
                    <tr
                      key={c.id}
                      className={`group transition-colors hover:bg-sunken/40 ${isChecked ? "bg-blue-50/40" : ""
                        }`}
                    >
                      {manage && (
                        <td className={`px-4 text-center ${cellPy}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(c.id)}
                            aria-label={`Select candidate ${c.name}`}
                            className="rounded border-line text-brand focus:ring-brand"
                          />
                        </td>
                      )}

                      {/* Candidate Avatar & Basic Info */}
                      <td className={`px-4 ${cellPy}`}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand/20 to-blue-200 text-xs font-black text-brand shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenId(c.id);
                                setNoteDraft("");
                              }}
                              className="font-bold text-ink hover:text-brand hover:underline block text-left truncate text-xs sm:text-sm"
                            >
                              {c.name}
                            </button>
                            <div className="flex items-center gap-2 text-[11px] text-muted truncate">
                              {displayEmail && <span>{displayEmail}</span>}

                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Experience */}
                      <td className={`px-4 ${cellPy}`}>
                        <div>
                          <strong className="font-bold text-ink">
                            {c.experienceYears} {t(lang, "years")}
                          </strong>
                          <span className="block text-[11px] text-muted truncate">
                            {c.educationLevel || "Bachelor's"}
                          </span>
                        </div>
                      </td>

                      {/* AI Match Score */}
                      <td className={`px-4 ${cellPy}`}>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${getScoreBadgeClass(
                            c.matchScore
                          )}`}
                        >
                          <Icon name="sparkles" size={11} />
                          {c.matchScore}%
                        </span>
                      </td>



                      {/* Stage Selector */}
                      <td className={`px-4 ${cellPy}`}>
                        {manage ? (
                          <select
                            value={c.stage}
                            onChange={(e) =>
                              handleMoveStage(c.id, e.target.value, c.stage)
                            }
                            aria-label={`Change stage for ${c.name}`}
                            className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink shadow-xs focus:border-brand focus:outline-none"
                          >
                            {FIXED_PIPELINE_STAGES.map((s) => (
                              <option key={s} value={s}>
                                {t(lang, s)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge
                            kind="stage"
                            value={c.stage}
                            lang={lang}
                          />
                        )}
                      </td>

                      {/* Actions */}
                      <td className={`px-4 text-right ${cellPy}`}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openResumeModal(c)}
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            title={t(
                              lang,
                              "Show Uploaded PDF / Candidate CV"
                            )}
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
                              onClick={() =>
                                handleMoveStage(
                                  c.id,
                                  getNextStage(c.stage),
                                  c.stage
                                )
                              }
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
                              onClick={() =>
                                handleMoveStage(c.id, "Rejected", c.stage)
                              }
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

        {/* ── Table Pagination Bar with Jump to Page ── */}
        {(pagination.totalPages || 1) > 1 && (
          <div className="flex flex-wrap items-center justify-between border-t border-line bg-card p-4 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">
                {t(lang, "Page")} <strong className="text-ink">{page}</strong>{" "}
                {t(lang, "of")}{" "}
                <strong className="text-ink">{pagination.totalPages}</strong>
              </span>

              {/* Jump to Page Input */}
              <div className="flex items-center gap-1 text-xs text-muted">
                <span>{t(lang, "Jump to page")}:</span>
                <input
                  type="number"
                  min={1}
                  max={pagination.totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJumpPage();
                  }}
                  placeholder="#"
                  className="w-12 rounded border border-line bg-card px-1.5 py-1 text-center font-bold text-ink focus:border-brand focus:outline-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleJumpPage}
                  className="px-2 py-1 text-xs font-bold text-brand"
                >
                  {t(lang, "Go")}
                </Button>
              </div>
            </div>

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

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({
                  length: Math.min(5, pagination.totalPages),
                }).map((_, i) => {
                  let pageNum = i + 1;
                  if (pagination.totalPages > 5 && page > 3) {
                    pageNum = page - 2 + i;
                    if (pageNum > pagination.totalPages) {
                      pageNum = pagination.totalPages - (4 - i);
                    }
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${page === pageNum
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
    </div>
  );
}

