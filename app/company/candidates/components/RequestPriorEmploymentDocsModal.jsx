"use client";

import React, { useState } from "react";
import Icon from "../../../../components/ds/Icon";
import { requestApplicantVerificationDocuments } from "../../../../lib/api/companyApi";

const DOC_TYPE_OPTIONS = [
  {
    id: "payslips_3m",
    nameEn: "Payslips (3-Month Basis)",
    nameVi: "Phiếu lương (3 tháng gần nhất)",
    descEn: "Salary statements or bank pay stubs for the last 3 consecutive months.",
    descVi: "Sao kê bảng lương hoặc biên nhận lương 3 tháng làm việc gần nhất.",
    icon: "file-text",
  },
  {
    id: "payslips_6m",
    nameEn: "Payslips (6-Month Basis)",
    nameVi: "Phiếu lương (6 tháng gần nhất)",
    descEn: "Salary statements or bank pay stubs for the last 6 consecutive months.",
    descVi: "Sao kê bảng lương hoặc biên nhận lương 6 tháng làm việc gần nhất.",
    icon: "file-text",
  },
  {
    id: "relieving_letter",
    nameEn: "Relieving / Experience Letter",
    nameVi: "Thư giải tỏa / Giấy xác nhận thôi việc",
    descEn: "Official employer release letter confirming resignation and handover clearance.",
    descVi: "Văn bản xác nhận hoàn tất nghĩa vụ và chấm dứt hợp đồng lao động tại công ty cũ.",
    icon: "award",
  },
  {
    id: "prior_contract",
    nameEn: "Prior Employment Contract",
    nameVi: "Hợp đồng lao động cũ",
    descEn: "Official signed labor agreement from prior employer.",
    descVi: "Bản hợp đồng lao động đã ký kết tại đơn vị sử dụng lao động trước đây.",
    icon: "briefcase",
  },
];

export default function RequestPriorEmploymentDocsModal({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  onSuccess,
  lang = "EN",
  t = (l, s) => s,
}) {
  const isVi = lang === "VI";
  const [selectedTypes, setSelectedTypes] = useState(new Set(["payslips_3m", "relieving_letter"]));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const toggleType = (id) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTypes.size === DOC_TYPE_OPTIONS.length) {
      setSelectedTypes(new Set());
    } else {
      setSelectedTypes(new Set(DOC_TYPE_OPTIONS.map((x) => x.id)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedTypes.size === 0) {
      setErrorMsg(
        isVi
          ? "Vui lòng chọn ít nhất một loại tài liệu cần yêu cầu."
          : "Please select at least one document type to request."
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const typesArray = Array.from(selectedTypes);
      await requestApplicantVerificationDocuments(applicationId, typesArray, notes.trim());
      if (onSuccess) onSuccess(typesArray);
      onClose();
    } catch (err) {
      console.error("Failed to request documents:", err);
      setErrorMsg(
        err?.message ||
          (isVi
            ? "Không thể gửi yêu cầu tài liệu. Vui lòng kiểm tra lại quyền truy cập hoặc thử lại sau."
            : "Failed to request documents. Please verify your permissions or try again later.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-line bg-card shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-body animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-line bg-card shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shadow-2xs shrink-0 mt-0.5">
              <Icon name="shield" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink m-0">
                  {isVi ? "Yêu cầu tài liệu công việc trước đây" : "Request Prior-Employment Documents"}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {isVi ? "Chế độ chỉ xem" : "View-Only"}
                </span>
              </div>
              <p className="text-xs text-muted m-0 mt-1">
                {isVi
                  ? `Gửi thông báo bảo mật đến ${candidateName || "ứng viên"} để chia sẻ hồ sơ công tác trước đây.`
                  : `Send a secure request to ${candidateName || "the candidate"} to share prior work records.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink p-1 rounded-lg hover:bg-sunken transition-colors cursor-pointer"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* View-Only Policy Alert */}
        <div className="p-3.5 bg-blue-50/70 border-b border-blue-100 flex items-start gap-2.5 shrink-0 text-xs text-blue-900">
          <Icon name="info" size={15} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">
              {isVi ? "Chính sách bảo mật tài liệu nhạy cảm" : "Confidential Document Sharing Policy"}:
            </span>{" "}
            <span>
              {isVi
                ? "Tài liệu được mã hóa AES-256 và mở dưới chế độ chỉ xem (View-Only). Nhà tuyển dụng không thể tải tệp về máy nhằm bảo vệ dữ liệu cá nhân của ứng viên (EMP-FR-026b)."
                : "Documents are AES-256 encrypted and accessible in View-Only mode. File downloads are strictly prohibited to protect sensitive candidate records (EMP-FR-026b)."}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <Icon name="alert-circle" size={15} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Document selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-ink">
                {isVi ? "Chọn loại tài liệu cần xác minh" : "Select Required Document Types"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-brand hover:underline font-semibold cursor-pointer"
              >
                {selectedTypes.size === DOC_TYPE_OPTIONS.length
                  ? isVi ? "Bỏ chọn tất cả" : "Deselect All"
                  : isVi ? "Chọn tất cả" : "Select All"}
              </button>
            </div>

            <div className="space-y-2.5">
              {DOC_TYPE_OPTIONS.map((opt) => {
                const isSelected = selectedTypes.has(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleType(opt.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "border-brand bg-brand-subtle/30 shadow-2xs"
                        : "border-line bg-card hover:border-line-strong"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-300 text-brand focus:ring-brand h-4 w-4 shrink-0 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon name={opt.icon} size={14} className={isSelected ? "text-brand" : "text-muted"} />
                        <span className="font-bold text-xs text-ink">
                          {isVi ? opt.nameVi : opt.nameEn}
                        </span>
                      </div>
                      <p className="text-xs text-muted m-0 mt-0.5">
                        {isVi ? opt.descVi : opt.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Notes */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1">
              {isVi ? "Ghi chú / Lời nhắn cho ứng viên (Tùy chọn)" : "Notes / Instructions for Candidate (Optional)"}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isVi
                  ? "Ví dụ: Vui lòng đính kèm phiếu lương có mộc đỏ hoặc sao kê ngân hàng chính thức để phục vụ quy trình đánh giá đãi ngộ..."
                  : "e.g. Please share official stamped payslips or authenticated bank statements for compensation review..."
              }
              className="w-full text-xs rounded-xl border border-line bg-card p-3 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-line bg-card shrink-0">
          <span className="text-xs text-muted">
            {selectedTypes.size} {isVi ? "loại tài liệu đã chọn" : "document types selected"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-lg border border-line hover:bg-sunken transition-colors cursor-pointer"
            >
              {isVi ? "Hủy" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedTypes.size === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover disabled:opacity-50 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name={submitting ? "refresh-cw" : "send"} size={14} className={submitting ? "lv-spin" : ""} />
              <span>{submitting ? (isVi ? "Đang gửi..." : "Sending...") : isVi ? "Gửi yêu cầu" : "Send Request"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
