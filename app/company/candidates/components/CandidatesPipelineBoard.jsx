"use client";

import React, { useState } from "react";
import Icon from "../../../../components/ds/Icon";
import { Avatar } from "../../../../components/ds";
import {
  PIPELINE_STAGES_CONFIG,
  FIXED_PIPELINE_STAGES,
  getScoreBadgeClass,
  getResumeFileInfo,
} from "./CandidatesConstants";

export default function CandidatesPipelineBoard({
  lang,
  t,
  manage,
  activeJob,
  candidates,
  stageCounts,
  selected,
  setSelected,
  handleMoveStage,
  setOpenId,
  setNoteDraft,
  setShowAiExplain,
  openResumeModal,
  pipelineStages = null,
  onOpenStagesModal = null,
  onOpenScheduleModal = null,
  onAdvanceRound = null,
}) {
  const [collapsedColumns, setCollapsedColumns] = useState({});
  const [columnLimits, setColumnLimits] = useState({});
  const [draggingCandidateId, setDraggingCandidateId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const displayStages = Array.isArray(pipelineStages) && pipelineStages.length > 0
    ? pipelineStages
    : PIPELINE_STAGES_CONFIG;

  const handleDragStart = (e, candidate) => {
    if (!manage) return;
    setDraggingCandidateId(candidate.id);
    e.dataTransfer.setData("text/plain", String(candidate.id));
    try {
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ id: candidate.id, sourceStage: candidate.stage })
      );
    } catch (_) {}
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingCandidateId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, stageId) => {
    if (!manage) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== stageId) {
      setDragOverColumn(stageId);
    }
  };

  const handleDragLeave = (e, stageId) => {
    if (dragOverColumn === stageId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    let candidateId = draggingCandidateId;
    let sourceStage = null;
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw) {
        const parsed = JSON.parse(raw);
        candidateId = parsed.id || candidateId;
        sourceStage = parsed.sourceStage;
      }
    } catch (_) {}
    if (!candidateId) {
      candidateId = e.dataTransfer.getData("text/plain");
    }
    setDraggingCandidateId(null);
    if (!candidateId) return;

    const candidate = candidates.find((c) => String(c.id) === String(candidateId));
    sourceStage = sourceStage || candidate?.stage;
    if (sourceStage === targetStage) return;

    handleMoveStage(candidateId, targetStage, sourceStage);
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-ink">
            <Icon name="columns" size={14} className="text-brand" />
            {t(lang, "Recruitment Pipeline Board")}
          </span>
          <span className="text-line-strong">·</span>
          <span>{activeJob?.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {manage && onOpenStagesModal && (
            <button
              type="button"
              onClick={onOpenStagesModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card hover:bg-sunken px-2.5 py-1 text-xs font-bold text-ink transition-colors cursor-pointer shadow-2xs"
              title={t(lang, "Customize Stages")}
            >
              <Icon name="settings" size={13} className="text-muted" />
              <span>{t(lang, "Customize Stages")}</span>
            </button>
          )}
          {manage && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-brand-subtle text-brand px-2.5 py-0.5 rounded-full font-bold">
              <Icon name="grip-vertical" size={12} />
              {t(lang, "Drag & Drop Enabled")}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 scrollbar-thin">
        {displayStages.map((colConfig) => {
          const stg = colConfig.id;
          const isCollapsed = collapsedColumns[stg];
          const stageItems = candidates.filter((c) => c.stage === stg);
          const totalInStage = stageCounts[stg] ?? stageItems.length;
          const limit = columnLimits[stg] || 20;
          const visibleItems = stageItems.slice(0, limit);
          const hasMore = stageItems.length > limit;
          const isDragOver = dragOverColumn === stg;

          if (isCollapsed) {
            return (
              <div
                key={stg}
                onClick={() =>
                  setCollapsedColumns((prev) => ({ ...prev, [stg]: false }))
                }
                className="flex w-12 shrink-0 cursor-pointer flex-col items-center justify-between rounded-xl border border-line bg-sunken/60 py-4 hover:border-brand/50 hover:bg-card transition-all"
                title={`${t(lang, colConfig.labelKey)} (${totalInStage}) - Click to expand`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${colConfig.bg}`}
                  >
                    <Icon name={colConfig.icon} size={13} />
                  </span>
                  <span className="rounded-full bg-card px-1.5 py-0.5 text-[10px] font-black border border-line">
                    {totalInStage}
                  </span>
                </div>
                <span className="text-xs font-bold text-muted rotate-[-90deg] whitespace-nowrap mt-16 mb-16">
                  {t(lang, colConfig.labelKey)}
                </span>
                <button type="button" className="p-1 text-muted hover:text-ink">
                  <Icon name="maximize-2" size={12} />
                </button>
              </div>
            );
          }

          return (
            <div
              key={stg}
              onDragOver={(e) => handleDragOver(e, stg)}
              onDragLeave={(e) => handleDragLeave(e, stg)}
              onDrop={(e) => handleDrop(e, stg)}
              className={`flex w-[320px] shrink-0 flex-col rounded-xl border bg-sunken/40 p-3 transition-all ${
                colConfig.border
              } border-t-4 ${
                isDragOver
                  ? colConfig.dropRing + " shadow-lg"
                  : "border-line shadow-2xs"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-line/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${colConfig.bg} shrink-0`}
                  >
                    <Icon name={colConfig.icon} size={13} />
                  </span>
                  <div className="min-w-0">
                    <h3
                      className="text-xs font-black uppercase tracking-wider text-ink truncate"
                      title={t(lang, colConfig.labelKey)}
                    >
                      {t(lang, colConfig.labelKey)}
                    </h3>
                    {colConfig.subtitleKey && (
                      <span className="block text-[10px] text-purple-700 font-semibold leading-none mt-0.5">
                        ({t(lang, colConfig.subtitleKey)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-black shrink-0 ${colConfig.bg}`}
                  >
                    {totalInStage.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedColumns((prev) => ({ ...prev, [stg]: true }))
                    }
                    className="text-muted hover:text-ink p-1 rounded hover:bg-card"
                    title={t(lang, "Collapse column")}
                  >
                    <Icon name="minimize-2" size={12} />
                  </button>
                </div>
              </div>

              {/* Drop Placeholder */}
              {isDragOver && (
                <div className="mb-2.5 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand/60 bg-white/90 py-3 text-xs font-bold text-brand animate-pulse shadow-sm">
                  <Icon name="arrow-down-circle" size={15} />
                  <span>{t(lang, "Drop candidate here")}</span>
                </div>
              )}

              {/* Column Cards Container */}
              <div className="flex flex-col gap-2.5 min-h-[160px] flex-1">
                {visibleItems.length === 0 && !isDragOver ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-line/80 py-10 text-center text-xs text-muted/70 bg-card/40">
                    <Icon
                      name={colConfig.icon}
                      size={20}
                      className="mb-1.5 opacity-30 text-ink"
                    />
                    <span className="font-semibold">
                      {t(lang, "No candidates in this stage")}
                    </span>
                    {manage && (
                      <span className="text-[10px] text-muted/60 mt-0.5">
                        {t(lang, "Drag cards here to update")}
                      </span>
                    )}
                  </div>
                ) : (
                  visibleItems.map((c) => {
                    const isBeingDragged = draggingCandidateId === c.id;
                    return (
                      <div
                        key={c.id}
                        draggable={manage}
                        onDragStart={(e) => handleDragStart(e, c)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          if (e.target.closest("button, select, input, a")) return;
                          setOpenId(c.id);
                          setNoteDraft("");
                        }}
                        className={`group relative flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 transition-all select-none ${
                          isBeingDragged
                            ? "opacity-30 border-dashed border-brand shadow-none scale-95 ring-2 ring-brand/30 cursor-grabbing"
                            : "border-line shadow-2xs hover:border-brand/40 hover:shadow-md cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        {/* Card Header: Drag Grip + Avatar + Name + Checkbox */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {manage && (
                              <span
                                title={t(lang, "Drag to move stage")}
                                className="cursor-grab active:cursor-grabbing text-muted/30 group-hover:text-ink/60 mt-0.5 transition-colors shrink-0"
                              >
                                <Icon name="grip-vertical" size={15} />
                              </span>
                            )}
                            <Avatar name={c.name} size={32} />
                            <div className="min-w-0">
                              <strong className="block truncate text-xs font-bold text-ink group-hover:text-brand transition-colors">
                                {c.name}
                              </strong>
                              <span className="block max-w-[150px] truncate text-[11px] text-muted">
                                {c.appliedDate || t(lang, "Recently applied")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {manage && (
                              <input
                                type="checkbox"
                                checked={selected.includes(c.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(c.id);
                                }}
                                aria-label={`Select ${c.name}`}
                                className="h-3.5 w-3.5 rounded border-line text-brand accent-blue-600 cursor-pointer"
                              />
                            )}
                          </div>
                        </div>

                        {/* Card Badges: AI Score + Experience */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenId(c.id);
                              setShowAiExplain(true);
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold hover:opacity-85 transition-opacity ${getScoreBadgeClass(
                              c.matchScore
                            )}`}
                            title={t(
                              lang,
                              "AI Match Score. Click to view breakdown."
                            )}
                          >
                            <Icon name="sparkles" size={10} />
                            <span>{c.matchScore}%</span>
                          </button>
                          <span className="text-muted font-medium bg-sunken/60 px-2 py-0.5 rounded-md">
                            {c.experienceYears} {t(lang, "yrs exp")}
                          </span>
                        </div>

                        {c.isStalled && (
                          <div className="inline-flex items-center gap-1.5 self-start rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            <Icon name="alert-triangle" size={11} className="text-amber-600 shrink-0" />
                            <span>
                              {lang === "VN" || lang === "VI"
                                ? `Tồn đọng (${c.daysInStage} ngày ở giai đoạn này)`
                                : `Stalled (${c.daysInStage}d in stage)`}
                            </span>
                          </div>
                        )}

                        {/* Interview Rounds & Status Badge (2-3 rounds tracking) */}
                        {(c.stage === "Interview Scheduled" || c.interview) && (
                          <div className="flex items-center justify-between gap-1.5 pt-1 text-[11px] bg-purple-50/70 border border-purple-100 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-200/80 text-purple-800 shrink-0 font-bold text-[10px]">
                                <Icon name="calendar" size={11} />
                              </span>
                              <div className="min-w-0">
                                <span className="block font-bold text-purple-900 text-[11px] truncate">
                                  {c.interview?.round || "Round 1"}
                                </span>
                                {c.interview?.at && (
                                  <span className="block text-[10px] text-purple-700/80 truncate">
                                    {new Date(c.interview.at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {manage && onOpenScheduleModal && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenScheduleModal(c);
                                  }}
                                  className="p-1 rounded text-purple-700 hover:text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer"
                                  title={t(lang, "Schedule / Edit Interview")}
                                >
                                  <Icon name="calendar-plus" size={12} />
                                </button>
                              )}
                              {manage && onAdvanceRound && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAdvanceRound(c.id);
                                  }}
                                  className="inline-flex items-center gap-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white px-1.5 py-0.5 text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                                  title={t(lang, "Advance to Next Round")}
                                >
                                  <span>{t(lang, "Advance")}</span>
                                  <Icon name="chevron-right" size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Footer: View PDF & Stage Selector */}
                        <div className="mt-1 flex items-center justify-between gap-2 border-t border-line/60 pt-2 text-[11px]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openResumeModal(c);
                              }}
                              className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition-colors"
                              title={t(
                                lang,
                                "Show Uploaded PDF / Candidate CV"
                              )}
                            >
                              <Icon name="file-text" size={12} />
                              <span>
                                {getResumeFileInfo(c).fileType === "docx"
                                  ? t(lang, "View CV (Doc)")
                                  : t(lang, "View PDF")}
                              </span>
                            </button>

                            {(c.answers || c.hasAnswers) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openResumeModal(c, "answers");
                                }}
                                className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
                                title={t(lang, "View Screening Question Answers")}
                              >
                                <Icon name="help-circle" size={12} />
                                <span>{t(lang, "Answers")}</span>
                              </button>
                            )}
                          </div>

                          {manage && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted group-hover:text-brand transition-colors">
                              <Icon name="move" size={11} />
                              <span>{t(lang, "Drag to move")}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Load more in column */}
                {hasMore && (
                  <button
                    onClick={() =>
                      setColumnLimits((prev) => ({
                        ...prev,
                        [stg]: (prev[stg] || 20) + 20,
                      }))
                    }
                    className="w-full rounded-lg border border-line bg-card py-2 text-center text-xs font-bold text-brand hover:bg-sunken transition-colors shadow-2xs"
                  >
                    +{stageItems.length - limit} {t(lang, "more")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

