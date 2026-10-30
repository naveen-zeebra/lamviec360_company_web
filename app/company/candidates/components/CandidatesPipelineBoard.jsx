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
}) {
  const [collapsedColumns, setCollapsedColumns] = useState({});
  const [columnLimits, setColumnLimits] = useState({});
  const [draggingCandidateId, setDraggingCandidateId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

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
        {manage && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-brand-subtle text-brand px-2.5 py-0.5 rounded-full font-bold">
            <Icon name="grip-vertical" size={12} />
            {t(lang, "Drag & Drop Enabled")}
          </span>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 scrollbar-thin">
        {PIPELINE_STAGES_CONFIG.map((colConfig) => {
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
                  <h3
                    className="text-xs font-black uppercase tracking-wider text-ink truncate"
                    title={t(lang, colConfig.labelKey)}
                  >
                    {t(lang, colConfig.labelKey)}
                  </h3>
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

                        {/* Footer: View PDF & Stage Selector */}
                        <div className="mt-1 flex items-center justify-between gap-2 border-t border-line/60 pt-2 text-[11px]">
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

                          {manage && (
                            <select
                              value={c.stage}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleMoveStage(c.id, e.target.value, c.stage);
                              }}
                              aria-label={`Move stage for ${c.name}`}
                              className="rounded-md border border-line bg-sunken/60 px-1.5 py-0.5 text-[10px] font-semibold text-ink focus:border-brand focus:outline-none cursor-pointer max-w-[130px] truncate"
                            >
                              {FIXED_PIPELINE_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {t(lang, s)}
                                </option>
                              ))}
                            </select>
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

