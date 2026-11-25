"use client";

import React, { useState, useEffect } from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import {
  COLOR_PRESETS,
} from "../../candidates/components/CandidatesConstants";
import {
  getAllConfiguredStages,
  saveConfiguredStages,
  resetPipelineStagesToDefault,
} from "../../../../lib/companyStore";

const AVAILABLE_ICONS = [
  "inbox",
  "search",
  "phone-call",
  "star",
  "calendar",
  "mail-check",
  "badge-check",
  "user-check",
  "x-circle",
  "file-text",
  "award",
  "shield-check",
  "layers",
];

export default function PipelineStagesTab({
  lang,
  t,
  settings,
  persistSettings,
  setToast,
  onStagesUpdated = null,
}) {
  const [stages, setStages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStage, setNewStage] = useState({
    name: "",
    icon: "file-text",
    color: "indigo",
  });
  const [renameMapping, setRenameMapping] = useState({});

  useEffect(() => {
    setStages(getAllConfiguredStages());
  }, [settings]);

  const moveStage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;
    const updated = [...stages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setStages(updated);
  };

  const handleStartRename = (stage) => {
    setEditingId(stage.id || stage.label);
    setEditingName(stage.label || stage.id);
  };

  const handleSaveRename = (index) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    const oldLabel = stages[index].label || stages[index].id;
    if (oldLabel !== trimmed) {
      setRenameMapping((prev) => ({
        ...prev,
        [oldLabel]: trimmed,
      }));
    }
    const updated = [...stages];
    updated[index] = {
      ...updated[index],
      label: trimmed,
    };
    setStages(updated);
    setEditingId(null);
    setEditingName("");
  };

  const handleToggleStage = (index) => {
    const stage = stages[index];
    if (stage.required) return;
    const updated = [...stages];
    updated[index] = {
      ...updated[index],
      enabled: stage.enabled === false ? true : false,
    };
    setStages(updated);
  };

  const handleDeleteStage = (index) => {
    const stage = stages[index];
    if (stage.required) return;
    const updated = stages.filter((_, i) => i !== index);
    setStages(updated);
  };

  const handleAddCustomStage = (e) => {
    e.preventDefault();
    const trimmed = newStage.name.trim();
    if (!trimmed) return;

    const id = `custom_${Date.now()}`;
    const created = {
      id,
      label: trimmed,
      description: "Custom pipeline stage",
      required: false,
      enabled: true,
      isCustom: true,
      icon: newStage.icon || "file-text",
      color: newStage.color || "indigo",
    };

    const rejIdx = stages.findIndex((s) => s.id === "rejected" || s.label === "Rejected");
    const updated = [...stages];
    if (rejIdx !== -1) {
      updated.splice(rejIdx, 0, created);
    } else {
      updated.push(created);
    }

    setStages(updated);
    setNewStage({ name: "", icon: "file-text", color: "indigo" });
    setShowAddForm(false);
  };

  const handleSaveAll = async () => {
    try {
      await saveConfiguredStages(stages, renameMapping);
      onStagesUpdated?.();
      setToast(t(lang, "Stage updated successfully"));
      setRenameMapping({});
    } catch (e) {
      setToast(e.message || "Failed to save stages");
    }
  };

  const handleReset = async () => {
    if (window.confirm(t(lang, "Reset to Standard Stages?"))) {
      try {
        const res = await resetPipelineStagesToDefault();
        setStages(res);
        onStagesUpdated?.();
        setRenameMapping({});
        setToast(t(lang, "Pipeline stages restored to default"));
      } catch (e) {
        setToast(e.message || "Failed to reset stages");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h3 className="text-base font-bold text-ink">
            {t(lang, "Recruitment Pipeline Stages")}
          </h3>
          <p className="text-xs text-muted">
            {t(
              lang,
              "Standard static stages form the foundation. Company Admin can toggle optional stages, reorder, or add custom stages."
            )}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleReset}>
          <Icon name="rotate-ccw" size={13} />
          {t(lang, "Reset to Standard Stages")}
        </Button>
      </div>

      {/* Stage list */}
      <div className="space-y-2.5 max-w-3xl">
        {stages.map((stg, index) => {
          const isEditing = editingId === (stg.id || stg.label);
          const isEnabled = stg.enabled !== false;
          const preset = COLOR_PRESETS[stg.color] || COLOR_PRESETS.blue;

          return (
            <div
              key={stg.id || stg.label || index}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                isEnabled ? "bg-sunken/40 border-line" : "bg-sunken/20 border-line/60 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveStage(index, -1)}
                    className="p-1 rounded text-muted hover:text-ink hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title={t(lang, "Move Up")}
                  >
                    <Icon name="chevron-up" size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={index === stages.length - 1}
                    onClick={() => moveStage(index, 1)}
                    className="p-1 rounded text-muted hover:text-ink hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title={t(lang, "Move Down")}
                  >
                    <Icon name="chevron-down" size={13} />
                  </button>
                </div>
                <span className="w-6 text-center text-xs font-bold text-muted">
                  {index + 1}
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${preset.bg} shrink-0`}
                >
                  <Icon name={stg.icon || "inbox"} size={16} />
                </span>
              </div>

              <div className="flex-1 min-w-0 px-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(index);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="w-full max-w-xs rounded-md border border-brand bg-card px-2.5 py-1 text-xs font-bold text-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(index)}
                      className="rounded bg-brand px-2 py-1 text-[11px] font-bold text-white hover:bg-brand/90 cursor-pointer"
                    >
                      <Icon name="check" size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded border border-line px-2 py-1 text-[11px] font-bold text-muted hover:text-ink cursor-pointer"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sm font-bold text-ink">
                      {t(lang, stg.label)}
                    </strong>
                    {stg.required ? (
                      <span className="rounded bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold">
                        {t(lang, "Static Core")}
                      </span>
                    ) : stg.isCustom ? (
                      <span className="rounded bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold">
                        {t(lang, "Custom Stage")}
                      </span>
                    ) : (
                      <span className="rounded bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold">
                        {t(lang, "Standard Optional")}
                      </span>
                    )}
                    {(stg.id === "interview_scheduled" || stg.label?.toLowerCase().includes("interview")) && (
                      <span className="rounded bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-1">
                        <Icon name="calendar" size={11} />
                        {t(lang, "2-3 rounds")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => handleStartRename(stg)}
                    className="p-2 text-muted hover:text-brand hover:bg-card rounded-md transition-colors cursor-pointer"
                    title={t(lang, "Rename Stage")}
                  >
                    <Icon name="edit-2" size={14} />
                  </button>
                )}

                {!stg.required ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStage(index)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        isEnabled
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                      }`}
                      title={t(lang, "Enable / Disable Stage")}
                    >
                      {isEnabled ? t(lang, "Active") : t(lang, "Disabled")}
                    </button>
                    {stg.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStage(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title={t(lang, "Delete Stage")}
                      >
                        <Icon name="trash-2" size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-muted/70 px-3">
                    {t(lang, "Always Active")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Stage */}
      {showAddForm ? (
        <form
          onSubmit={handleAddCustomStage}
          className="max-w-3xl rounded-xl border border-brand/40 bg-brand-subtle/30 p-4 space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink flex items-center gap-1.5">
              <Icon name="plus-circle" size={16} className="text-brand" />
              {t(lang, "Add Custom Stage")}
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-muted hover:text-ink text-xs cursor-pointer"
            >
              <Icon name="x" size={15} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-ink mb-1">
                {t(lang, "Stage Name")}
              </label>
              <input
                type="text"
                required
                placeholder={t(lang, "e.g. Assessment Test")}
                value={newStage.name}
                onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                className="w-full rounded-lg border border-line bg-card p-2 text-xs text-ink focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                {t(lang, "Stage Icon")}
              </label>
              <select
                value={newStage.icon}
                onChange={(e) => setNewStage({ ...newStage, icon: e.target.value })}
                className="w-full rounded-lg border border-line bg-card p-2 text-xs text-ink focus:border-brand focus:outline-none cursor-pointer"
              >
                {AVAILABLE_ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                {t(lang, "Stage Color")}
              </label>
              <select
                value={newStage.color}
                onChange={(e) => setNewStage({ ...newStage, color: e.target.value })}
                className="w-full rounded-lg border border-line bg-card p-2 text-xs text-ink focus:border-brand focus:outline-none cursor-pointer"
              >
                {Object.keys(COLOR_PRESETS).map((ck) => (
                  <option key={ck} value={ck}>
                    {ck}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setShowAddForm(false)}
            >
              {t(lang, "Cancel")}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {t(lang, "Add Stage")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="max-w-3xl flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand/60 bg-brand-subtle/20 px-3.5 py-2 text-xs font-bold text-brand hover:bg-brand-subtle/40 transition-colors cursor-pointer"
          >
            <Icon name="plus" size={14} />
            <span>{t(lang, "Add Custom Stage")}</span>
          </button>
        </div>
      )}

      {/* Save Button */}
      <div className="max-w-3xl flex justify-end gap-3 pt-4 border-t border-line">
        <Button variant="primary" size="md" onClick={handleSaveAll}>
          <Icon name="check" size={15} />
          {t(lang, "Save Changes")}
        </Button>
      </div>
    </div>
  );
}
