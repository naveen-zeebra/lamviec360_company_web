"use client";

import React, { useState } from "react";
import Select from "../../../../components/ds/Select";
import Switch from "../components/Switch";
import { DEFAULT_EMAIL_TEMPLATES } from "../../../../lib/companyStore";

export default function CommsTemplatesTab({
  lang = "EN",
  t = (l, k) => k,
  settings,
  persistSettings,
}) {
  const [selectedLang, setSelectedLang] = useState("vi"); // 'vi' | 'en'
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all' | 'rejection' | 'pipeline'

  // Standard universal templates (same across all companies, completely non-editable)
  const allTemplates = DEFAULT_EMAIL_TEMPLATES;

  // Filter templates strictly by the chosen preview language
  const displayedTemplates = allTemplates.filter((tpl) => {
    const matchesLang = (tpl.lang || "vi") === selectedLang;
    if (!matchesLang) return false;
    if (categoryFilter === "rejection") return (tpl.category || "rejection") === "rejection";
    if (categoryFilter === "pipeline") return (tpl.category || "rejection") !== "rejection";
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-ink">
          {t(lang, "Candidate Rejection & Pipeline Communication")}
        </h3>
        <p className="mb-4 text-sm text-muted">
          {t(
            lang,
            "Standardized communication templates sent when candidates move stages or are rejected. Templates are centrally maintained and identical across all employer companies to ensure high compliance. Template creation and editing are disabled."
          )}
        </p>

        {/* Delay & Auto-Dispatch Settings */}
        <div className="rounded-lg border border-line bg-sunken p-5 mb-6 max-w-[560px]">
          <h4 className="m-0 text-sm font-bold text-ink mb-3">
            {t(lang, "Rejection Email Delay Buffer")}
          </h4>
          <div className="flex flex-col gap-3">
            <Switch
              label={t(
                lang,
                "Automatically send email notification when candidate is moved to Rejected"
              )}
              description={t(lang, "Dispatches standardized rejection email to applicant inbox")}
              on={settings?.pipeline?.autoRejectEmail !== false}
              onChange={(v) =>
                persistSettings({
                  pipeline: { ...settings?.pipeline, autoRejectEmail: v },
                })
              }
            />
            <Switch
              label={t(
                lang,
                "Schedule delayed sending for rejection emails (grace buffer)"
              )}
              description={t(lang, "Adds respectful delay window before delivery")}
              on={Boolean(settings?.pipeline?.delayRejectionEmail)}
              onChange={(v) =>
                persistSettings({
                  pipeline: { ...settings?.pipeline, delayRejectionEmail: v },
                })
              }
            />
            {settings?.pipeline?.delayRejectionEmail && (
              <div className="mt-2 max-w-[280px]">
                <Select
                  label={t(lang, "Delayed Send Window")}
                  value={String(settings?.pipeline?.rejectionDelayHours || 24)}
                  onChange={(e) =>
                    persistSettings({
                      pipeline: {
                        ...settings?.pipeline,
                        rejectionDelayHours: Number(e.target.value),
                      },
                    })
                  }
                  options={[
                    { value: "0", label: t(lang, "Immediate (0 hours)") },
                    { value: "12", label: "12 " + t(lang, "hours") },
                    { value: "24", label: "24 " + t(lang, "hours (Recommended)") },
                    { value: "48", label: "48 " + t(lang, "hours") },
                    { value: "72", label: "72 " + t(lang, "hours (3 days)") },
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Standard Content Info Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 mb-4 flex items-center justify-between gap-3 text-xs text-blue-900">
          <div>
            <strong className="block font-bold">
              {t(lang, "Standardized Universal Templates")}
            </strong>
            <span className="text-blue-800">
              {t(
                lang,
                "All employer organizations share these official, compliance-verified templates in both Vietnamese and English. Content is non-editable to preserve brand trust and candidate experience standards."
              )}
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-blue-100 text-blue-800 font-bold px-2.5 py-1 text-[11px]">
            {t(lang, "Read-Only")}
          </span>
        </div>

        {/* Content-Only Template Catalog Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          {/* Language Switcher Tabs */}
          <div className="inline-flex rounded-lg border border-line bg-sunken p-1">
            <button
              type="button"
              onClick={() => setSelectedLang("vi")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                selectedLang === "vi"
                  ? "bg-card text-brand shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              🇻🇳 Tiếng Việt (Vietnamese)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang("en")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                selectedLang === "en"
                  ? "bg-card text-brand shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              🇬🇧 English
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: "all", label: t(lang, "All Templates") },
              { id: "rejection", label: t(lang, "Rejection Reasons") },
              { id: "pipeline", label: t(lang, "Stage Movements") },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                  categoryFilter === cat.id
                    ? "bg-brand text-white"
                    : "bg-sunken text-muted hover:text-ink border border-line"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Content List (Read-Only Preview) */}
        <div className="grid grid-cols-1 gap-3">
          {displayedTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-line bg-card p-4 flex flex-col gap-2.5 hover:border-brand/40 transition-colors shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5">
                    {tpl.category === "rejection" ? t(lang, "Rejection Reason") : t(lang, "Stage Movement")}
                  </span>
                  <strong className="text-sm font-extrabold text-ink">{tpl.title}</strong>
                  {tpl.isDefault && (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                      {t(lang, "Default")}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-mono text-muted uppercase">
                  {tpl.code || tpl.id}
                </span>
              </div>

              {/* Subject Line Preview */}
              <div className="text-xs text-ink/80 flex items-center gap-1.5">
                <span className="font-bold text-muted shrink-0">{t(lang, "Subject:")}</span>
                <span className="font-medium text-ink">{tpl.subject}</span>
              </div>

              {/* Body Text Preview */}
              <div className="text-xs text-slate-700 dark:text-slate-300 m-0 whitespace-pre-line bg-sunken/40 rounded-lg p-3 border border-line/60 font-sans leading-relaxed">
                {tpl.body || tpl.body_text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
