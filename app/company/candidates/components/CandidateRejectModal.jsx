"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import { getCompany, getAuth, renderEmailTemplate } from "../../../../lib/companyStore";

export default function CandidateRejectModal({
  lang,
  t,
  rejectTarget,
  setRejectTarget,
  targetCand,
  templates,
  rejectReason,
  setRejectReason,
  rejectDelayHours,
  setRejectDelayHours,
  confirmReject,
}) {
  if (!rejectTarget) return null;

  const rejTemplates = (templates || []).filter(
    (t) => (t.category || "rejection") === "rejection"
  );
  const currentTpl =
    rejTemplates.find(
      (t) => String(t.id) === String(rejectReason.templateId)
    ) || rejTemplates[0];

  const comp = getCompany() || {};
  const auth = getAuth() || {};

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-line space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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

        <p className="text-xs text-muted leading-relaxed">
          {t(
            lang,
            "Select a standardized rejection template. The parameterized rejection email will be queued per your delivery preference."
          )}
        </p>

        {/* Template selector */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">
            {t(lang, "Rejection Template (EMP-FR-025b)")}
          </label>
          <select
            value={rejectReason.templateId || (currentTpl ? currentTpl.id : "")}
            onChange={(e) =>
              setRejectReason({ ...rejectReason, templateId: e.target.value })
            }
            className="w-full rounded-lg border border-line bg-card p-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
          >
            {rejTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.title} {tpl.isDefault ? `(${t(lang, "Default")})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Timing Configuration (Screen e09 / EMP-FR-025b) */}
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
                {currentTpl.title}
              </span>
            </div>

            <div className="rounded-lg bg-card border border-line p-3 text-[11px] space-y-1.5">
              <div className="text-slate-800 dark:text-slate-200">
                <strong className="text-muted">Subject: </strong>
                {renderEmailTemplate(currentTpl.subject, {
                  candidateName: targetCand?.name || "Candidate",
                  jobTitle: targetCand?.jobTitle || "Engineer",
                  companyName: comp?.name || "Tech Corp Vietnam",
                })}
              </div>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line pt-1 text-[11px] border-t border-line/60">
                {renderEmailTemplate(currentTpl.body, {
                  candidateName: targetCand?.name || "Candidate",
                  jobTitle: targetCand?.jobTitle || "Engineer",
                  companyName: comp?.name || "Tech Corp Vietnam",
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
            value={rejectReason.note || ""}
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
            <Button variant="danger" size="sm" onClick={confirmReject}>
              {t(lang, "Confirm Rejection")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

