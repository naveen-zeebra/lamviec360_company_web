"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";

export default function CandidateBulkModal({
  lang,
  t,
  confirmBulk,
  setConfirmBulk,
  selectAllMatching,
  selectedCount,
  totalMatching,
  templates,
  runBulk,
}) {
  if (!confirmBulk) return null;

  const count = selectAllMatching ? totalMatching : selectedCount;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-line space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-rose-600">
            {t(lang, "Reject")} {count.toLocaleString()} {t(lang, "Candidates?")}
          </h3>
          <button
            onClick={() => setConfirmBulk(null)}
            className="text-muted hover:text-ink"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 leading-relaxed">
          {t(
            lang,
            "This action will move all selected candidates to the Rejected stage. You will have a 5-minute safety window to undo."
          )}
        </div>

        {templates && templates.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              {t(lang, "Rejection Template")}
            </label>
            <select
              value={confirmBulk.templateId || ""}
              onChange={(e) =>
                setConfirmBulk({ ...confirmBulk, templateId: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-card p-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
            >
              <option value="">{t(lang, "No specific reason")}</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmBulk(null)}
          >
            {t(lang, "Cancel")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              runBulk("Rejected", {
                templateId: confirmBulk.templateId || "",
              })
            }
          >
            {t(lang, "Reject All Selected")}
          </Button>
        </div>
      </div>
    </div>
  );
}

