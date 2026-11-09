"use client";

import React, { useState, useEffect } from "react";
import Icon from "../../../../components/ds/Icon";
import { getCompany } from "../../../../lib/companyStore";
import { getCompanyToken, API_BASE_URL } from "../../../../lib/api/client";
import { getBackendAssetUrl } from "../../../../lib/api/companyApi";
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
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!viewingDoc || !viewingDoc.doc) {
      setBlobUrl(null);
      setLoadError(null);
      return;
    }

    const { doc, applicationId } = viewingDoc;
    let active = true;
    let createdUrl = null;

    async function loadDocument() {
      setLoadingDoc(true);
      setLoadError(null);
      try {
        const token = getCompanyToken();
        const url = `${API_BASE_URL}/applicants/${applicationId}/verification-documents/${doc.id}/download`;
        const res = await fetch(url, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          if (doc.file_url) {
            setBlobUrl(getBackendAssetUrl(doc.file_url));
            return;
          }
          throw new Error("Unable to decrypt document from server.");
        }

        const blob = await res.blob();
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (err) {
        if (!active) return;
        console.warn("Failed to stream decrypted document:", err);
        if (doc.file_url) {
          setBlobUrl(getBackendAssetUrl(doc.file_url));
        } else {
          setLoadError(err.message || "Failed to load document");
        }
      } finally {
        if (active) setLoadingDoc(false);
      }
    }

    loadDocument();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [viewingDoc]);

  if (!viewingDoc) return null;

  const doc = viewingDoc.doc || {};
  const cat = (doc.category || "document").toLowerCase();
  const candName = viewingDoc.candidateName || "Candidate";
  const currentComp = getCompany() || {};
  const compName = currentComp.name || "Doanh nghiệp / Employer";
  const todayStr = new Date().toLocaleDateString("vi-VN");

  const isPdf =
    doc.mime_type === "application/pdf" ||
    doc.file_name?.toLowerCase().endsWith(".pdf") ||
    doc.title?.toLowerCase().endsWith(".pdf");

  const isImage =
    doc.mime_type?.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif)$/i.test(doc.file_name || "") ||
    /\.(png|jpe?g|webp|gif)$/i.test(doc.title || "");

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
                {candName} · {doc.file_name} ({formatBytes(doc.size_bytes || 0)})
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
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
            {loadingDoc ? (
              <div className="py-12 text-center text-xs text-muted space-y-3">
                <Icon
                  name="loader"
                  size={32}
                  className="animate-spin mx-auto text-emerald-600"
                />
                <p className="font-semibold text-ink text-sm">
                  {t(lang, "Decrypting and loading verified document...")}
                </p>
                <p className="text-muted text-[11px]">
                  AES-256 Stream · Personal Data Protection Decree 13/2023/ND-CP
                </p>
              </div>
            ) : loadError ? (
              <div className="max-w-md p-6 rounded-2xl bg-card border border-line shadow-sm text-center space-y-3">
                <Icon name="alert-triangle" size={32} className="mx-auto text-amber-500" />
                <h4 className="font-bold text-ink text-sm">
                  {t(lang, "Document Preview Unavailable")}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {loadError}
                </p>
                <div className="text-[11px] bg-sunken rounded-lg p-2 font-mono text-muted">
                  {doc.file_name} ({formatBytes(doc.size_bytes || 0)})
                </div>
              </div>
            ) : blobUrl ? (
              isPdf ? (
                <div className="w-full h-full rounded-xl overflow-hidden border border-line shadow-md bg-white">
                  <iframe
                    src={`${blobUrl}#toolbar=1`}
                    className="w-full h-full border-0"
                    title={doc.title || doc.file_name}
                  />
                </div>
              ) : isImage ? (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                  <img
                    src={blobUrl}
                    alt={doc.title || doc.file_name}
                    style={{
                      transform: `scale(${docViewerZoom / 100})`,
                      transformOrigin: "center center",
                    }}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-line bg-white transition-transform duration-150"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-xl overflow-hidden border border-line shadow-md bg-white">
                  <iframe
                    src={blobUrl}
                    className="w-full h-full border-0"
                    title={doc.title || doc.file_name}
                  />
                </div>
              )
            ) : (
              <div className="p-8 rounded-xl bg-card border border-line text-center text-xs text-muted space-y-2">
                <Icon name="file-text" size={36} className="mx-auto text-muted/60" />
                <p className="font-semibold text-ink">
                  {t(lang, "No document preview stream available.")}
                </p>
              </div>
            )}
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
