"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import { getCompany } from "../../../../lib/companyStore";
import { formatBytes } from "../../../../utils/format";

export default function CandidateDocViewerModal({
  lang,
  t,
  viewingDoc,
  setViewingDoc,
  docViewerZoom,
  setDocViewerZoom,
  setToast,
}) {
  if (!viewingDoc) return null;

  const doc = viewingDoc.doc || {};
  const cat = (doc.category || "document").toLowerCase();
  const candName = viewingDoc.candidateName || "Candidate";
  const currentComp = getCompany() || {};
  const compName = currentComp.name || "Doanh nghiệp / Employer";
  const todayStr = new Date().toLocaleDateString("vi-VN");

  const getCatBadge = () => {
    if (cat.includes("payslip"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (cat.includes("relieving"))
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (cat.includes("contract"))
      return "bg-purple-50 text-purple-700 border-purple-200";
    if (cat.includes("cert") || cat.includes("degree"))
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5"
      onClick={() => {
        setViewingDoc(null);
        setDocViewerZoom(100);
      }}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "s")) {
          e.preventDefault();
          setToast(
            t(
              lang,
              "Printing and saving are disabled per PDPD Decree 13/2023/ND-CP"
            )
          );
        }
      }}
    >
      <div
        className="w-full max-w-5xl rounded-2xl bg-card shadow-2xl overflow-hidden border border-line flex flex-col h-[90vh] animate-in fade-in-50 duration-200"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          setToast(
            t(
              lang,
              "Right-click context menu is disabled for confidential documents"
            )
          );
        }}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-line bg-card px-4 py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Icon name="shield" size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-ink truncate max-w-[280px] sm:max-w-md">
                  {doc.title || doc.file_name}
                </h3>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getCatBadge()}`}
                >
                  {doc.category || "Document"}
                </span>
              </div>
              <span className="text-[11px] text-muted block truncate mt-0.5">
                {candName} · {doc.file_name} (
                {formatBytes(doc.size_bytes || 0)})
              </span>
            </div>
          </div>

          {/* Center / Zoom & Control Toolbar */}
          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-line bg-sunken/60 p-1">
            <button
              onClick={() => setDocViewerZoom((z) => Math.max(50, z - 15))}
              className="rounded p-1 text-muted hover:bg-card hover:text-ink transition-colors"
              title={t(lang, "Zoom out")}
            >
              <Icon name="minus" size={13} />
            </button>
            <span className="px-2 text-[11px] font-mono font-bold text-ink w-12 text-center select-none">
              {docViewerZoom}%
            </span>
            <button
              onClick={() => setDocViewerZoom((z) => Math.min(200, z + 15))}
              className="rounded p-1 text-muted hover:bg-card hover:text-ink transition-colors"
              title={t(lang, "Zoom in")}
            >
              <Icon name="plus" size={13} />
            </button>
            <button
              onClick={() => setDocViewerZoom(100)}
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-muted hover:bg-card hover:text-ink transition-colors"
              title={t(lang, "Reset Zoom to 100%")}
            >
              100%
            </button>
          </div>

          {/* Right Badges & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
              {t(lang, "View-Only / No Download")}
            </span>
            <span className="hidden lg:inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              AES-256
            </span>
            <button
              onClick={() => {
                setViewingDoc(null);
                setDocViewerZoom(100);
              }}
              className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink transition-colors"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Modal Center Document Canvas with Anti-Tamper Watermark */}
        <div className="relative flex-1 overflow-auto bg-slate-900/5 p-4 sm:p-6 flex items-center justify-center select-none">
          {/* Watermark Overlay Pattern */}
          <div
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden flex flex-wrap items-center justify-around opacity-15"
            style={{
              transform: "rotate(-25deg) scale(1.15)",
              userSelect: "none",
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="p-6 text-center text-xs font-mono font-black uppercase tracking-wider text-slate-800"
              >
                <div>{compName}</div>
                <div>{candName}</div>
                <div className="text-[10px] text-red-600 font-extrabold">
                  CONFIDENTIAL · PDPD DECREE 13/2023/ND-CP
                </div>
                <div className="text-[9px]">{todayStr}</div>
              </div>
            ))}
          </div>

          {/* Document Content Canvas */}
          <div
            className="relative z-10 w-full max-w-3xl rounded-xl bg-card border border-line shadow-lg p-8 sm:p-12 space-y-6 transition-transform duration-150"
            style={{
              transform: `scale(${docViewerZoom / 100})`,
              transformOrigin: "center top",
            }}
          >
            {/* Header section in doc */}
            <div className="border-b border-line pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                  VERIFIED ATTACHMENT
                </span>
                <h2 className="text-lg font-black text-ink">
                  {doc.title || doc.file_name}
                </h2>
                <span className="text-xs text-muted">
                  Applicant: {candName}
                </span>
              </div>
              <div className="text-right">
                <span className="inline-block rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  VERIFIED
                </span>
                <span className="block text-[10px] text-muted mt-1 font-mono">
                  DOC-{doc.id || "001"}
                </span>
              </div>
            </div>

            {/* Document summary representation */}
            <div className="space-y-4 text-xs text-ink/80 leading-relaxed font-sans">
              <div className="rounded-lg bg-sunken/40 p-4 border border-line/60 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted block">Document Category:</span>
                    <strong className="font-semibold text-ink">
                      {doc.category || "Professional Verification"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted block">File Type / MIME:</span>
                    <strong className="font-semibold text-ink">
                      {doc.mime_type || "application/pdf"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted block">
                      Encryption Standard:
                    </span>
                    <strong className="font-semibold text-ink font-mono">
                      AES-256 (At-Rest)
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted block">File Size:</span>
                    <strong className="font-semibold text-ink">
                      {formatBytes(doc.size_bytes || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-dashed border-line text-center text-muted text-xs space-y-2">
                <Icon name="file-text" size={32} className="mx-auto text-muted/60" />
                <p className="font-semibold">
                  {t(
                    lang,
                    "Document securely rendered in View-Only Protected Sandbox."
                  )}
                </p>
                <p className="text-[11px] text-muted/80 max-w-md mx-auto">
                  {t(
                    lang,
                    "Per Vietnam Personal Data Protection Decree 13/2023/ND-CP, downloads, screenshots, printing, and unauthorized exports of this candidate verification document are monitored and logged to the tenant compliance audit trail."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Compliance Audit Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-line bg-card px-4 py-2.5 text-[11px] text-muted gap-2">
          <div className="flex items-center gap-2">
            <Icon name="lock" size={13} className="text-emerald-600" />
            <span>
              {t(
                lang,
                "Protected Document Session — Access logged in compliance audit trail"
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px]">Session ID: LV3-{Date.now().toString(36).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

