"use client";

import React, { useState, useEffect } from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import { getCompany, getAuth, renderEmailTemplate } from "../../../../lib/companyStore";

export default function CandidateRejectModal({
  lang = "EN",
  t = (l, k) => k,
  rejectTarget,
  setRejectTarget,
  targetCand,
  templates = [],
  rejectReason,
  setRejectReason,
  rejectDelayHours,
  setRejectDelayHours,
  confirmReject,
}) {
  if (!rejectTarget) return null;

  // Initialize language preference based on candidate record (employee/seeker level preference)
  const initialCandidateLang = (
    targetCand?.preferred_language ||
    targetCand?.preferredLanguage ||
    targetCand?.lang ||
    "vi"
  ).toLowerCase().startsWith("en") ? "en" : "vi";

  const [modalLang, setModalLang] = useState(initialCandidateLang);

  // Filter templates strictly by category "rejection" and selected language
  const availableTemplates = (templates || []).filter(
    (item) => (item.category || "rejection") === "rejection" && (item.lang || "vi") === modalLang
  );

  // Active template selection
  const currentTpl =
    availableTemplates.find(
      (item) => String(item.id) === String(rejectReason?.templateId)
    ) ||
    availableTemplates.find(
      (item) => item.code === rejectReason?.templateId
    ) ||
    availableTemplates.find((item) => item.isDefault) ||
    availableTemplates[0];

  // Update rejectReason templateId when switching language if needed
  useEffect(() => {
    if (currentTpl && rejectReason?.templateId !== currentTpl.id) {
      setRejectReason((prev) => ({
        ...prev,
        templateId: currentTpl.id,
        lang: modalLang,
      }));
    }
  }, [modalLang, currentTpl]);

  const comp = getCompany() || {};
  const auth = getAuth() || {};

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-line space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <Icon name="x-circle" size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-ink">
                {t(lang, "Reject Candidate")}
              </h3>
              <span className="text-[11px] text-muted block">
                {targetCand?.name} · {targetCand?.jobTitle || "Job Candidate"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setRejectTarget(null)}
            className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink transition-colors"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Preferred Language Detection & Recruiter Switcher */}
        <div className="flex items-center justify-between rounded-xl bg-sunken p-3 border border-line">
          <div>
            <span className="text-xs font-bold text-ink block">
              {t(lang, "Candidate Email Language")}
            </span>
            <span className="text-[11px] text-muted">
              {t(lang, "Auto-detected based on candidate profile preference")}
            </span>
          </div>

          <div className="inline-flex rounded-lg border border-line bg-card p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setModalLang("vi")}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                modalLang === "vi"
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setModalLang("en")}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                modalLang === "en"
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Template selector */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">
            {t(lang, "Rejection Reason Template")}
          </label>
          <select
            value={currentTpl?.id || ""}
            onChange={(e) =>
              setRejectReason({ ...rejectReason, templateId: e.target.value, lang: modalLang })
            }
            className="w-full rounded-lg border border-line bg-card p-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
          >
            {availableTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.title} {tpl.isDefault ? `(${t(lang, "Default")})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Timing Configuration */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">
            {t(lang, "Email Delivery Schedule")}
          </label>
          <select
            value={rejectDelayHours}
            onChange={(e) => setRejectDelayHours(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-card p-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
          >
            <option value="0">{t(lang, "Send Immediately")}</option>
            <option value="24">
              {t(
                lang,
                "Delay 24 Hours (Recommended for respectful candidate experience)"
              )}
            </option>
            <option value="48">{t(lang, "Delay 48 Hours")}</option>
            <option value="72">{t(lang, "Delay 72 Hours")}</option>
          </select>
        </div>

        {/* Live Preview Box */}
        {currentTpl && (
          <div className="rounded-xl border border-line bg-sunken/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted">
              <span className="flex items-center gap-1">
                <Icon name="mail" size={12} className="text-brand" />
                {t(lang, "Candidate Email Preview:")}
              </span>
              <span className="text-brand font-semibold">
                {modalLang === "vi" ? "Tiếng Việt" : "English"}
              </span>
            </div>

            <div className="rounded-lg bg-card border border-line p-3 text-[11px] space-y-1.5">
              <div className="text-slate-800 dark:text-slate-200">
                <strong className="text-muted">Subject: </strong>
                {renderEmailTemplate(
                  currentTpl.subject ||
                    (modalLang === "en"
                      ? "Update regarding your application for {{job_title}} at {{company_name}}"
                      : "Cập nhật về hồ sơ ứng tuyển {{job_title}} tại {{company_name}}"),
                  {
                    candidateName: targetCand?.name || "Candidate",
                    jobTitle: targetCand?.jobTitle || "Position",
                    companyName: comp?.name || "LàmViệc360",
                  }
                )}
              </div>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line pt-1 text-[11px] border-t border-line/60 max-h-[140px] overflow-y-auto">
                {renderEmailTemplate(currentTpl.body || currentTpl.body_text || "", {
                  candidateName: targetCand?.name || "Candidate",
                  jobTitle: targetCand?.jobTitle || "Position",
                  companyName: comp?.name || "LàmViệc360",
                  senderName: auth?.name || "Hiring Team",
                })}
              </div>
            </div>
          </div>
        )}

        {/* Internal Note */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">
            {t(lang, "Internal Note (Optional)")}
          </label>
          <textarea
            rows={2}
            value={rejectReason?.note || ""}
            onChange={(e) =>
              setRejectReason({ ...rejectReason, note: e.target.value })
            }
            placeholder={t(
              lang,
              "Add optional context for your hiring team…"
            )}
            className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-[10px] text-muted">
            {rejectDelayHours > 0
              ? t(lang, `Delivery queued: ${rejectDelayHours}h delay`)
              : t(lang, "Delivery: immediate dispatch")}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRejectTarget(null)}
            >
              {t(lang, "Cancel")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                confirmReject({
                  templateId: currentTpl?.id,
                  lang: modalLang,
                  note: rejectReason?.note || "",
                  delayHours: rejectDelayHours,
                });
              }}
            >
              {t(lang, "Confirm Rejection")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
