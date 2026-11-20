"use client";

import React, { useState } from "react";
import Icon from "../../../../components/ds/Icon";
import { requestCandidateContactStore, messageTalentCandidateStore, getStore } from "../../../../lib/companyStore";

export default function RequestContactModal({
  isOpen,
  onClose,
  candidate,
  mode = "contact", // 'contact' | 'message'
  onSuccess,
  lang = "EN",
  t = (l, s) => s,
}) {
  const isVi = lang === "VI";
  const [selectedJobId, setSelectedJobId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  if (!isOpen || !candidate) return null;

  const store = getStore();
  const activeJobs = (store.jobs || []).filter((j) => j.status === "published" || j.status === "active" || j.status === "open");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrMsg("");

    try {
      if (mode === "message") {
        if (!message.trim()) {
          setErrMsg(isVi ? "Vui lòng nhập nội dung tin nhắn." : "Please enter your message.");
          setSubmitting(false);
          return;
        }
        await messageTalentCandidateStore(candidate.id, selectedJobId ? Number(selectedJobId) : null, message.trim());
      } else {
        await requestCandidateContactStore(candidate.id, selectedJobId ? Number(selectedJobId) : null, message.trim());
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Talent action failed:", err);
      setErrMsg(
        err?.message ||
          (isVi
            ? "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau."
            : "An error occurred while sending your request. Please try again later.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isMessageMode = mode === "message";

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-card shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-body animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-line bg-card shrink-0">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 mt-0.5 ${
              isMessageMode ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-purple-50 text-purple-600 border-purple-200"
            }`}>
              <Icon name={isMessageMode ? "mail" : "user-plus"} size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink m-0">
                {isMessageMode
                  ? isVi ? "Gửi tin nhắn / Lời mời ứng tuyển" : "Send Direct Message / Job Invitation"
                  : isVi ? "Yêu cầu chia sẻ thông tin liên hệ" : "Request Candidate Contact Details"}
              </h3>
              <p className="text-xs text-muted m-0 mt-1">
                {isMessageMode
                  ? isVi
                    ? `Gửi thông điệp trực tiếp đến ${candidate.name} cho vị trí mở.`
                    : `Direct message to ${candidate.name} introducing relevant openings.`
                  : isVi
                    ? `Gửi yêu cầu mở khóa email và số điện thoại của ${candidate.name}.`
                    : `Request ${candidate.name} to approve sharing phone & email.`}
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

        {/* Notice */}
        <div className="p-3.5 bg-amber-50/70 border-b border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900 shrink-0">
          <Icon name="shield" size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{isVi ? "Quy định bảo vệ ứng viên" : "Privacy Assurance"}:</span>{" "}
            {isMessageMode
              ? isVi
                ? "Ứng viên đã cho phép nhà tuyển dụng gửi tin nhắn chủ động. Tin nhắn cần lịch sự, đúng định hướng nghề nghiệp."
                : "Candidate has enabled unsolicited recruiter messages. Communications must remain professional and relevant."
              : isVi
                ? "Thông tin liên hệ (Email & SĐT) sẽ được hiển thị ngay khi ứng viên xác nhận đồng ý chia sẻ."
                : "Full contact info (email and phone) remains masked until the candidate approves this request."}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <Icon name="alert-circle" size={15} className="shrink-0 text-rose-600" />
              <span>{errMsg}</span>
            </div>
          )}

          {/* Select Job (optional or recommended) */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1">
              {isVi ? "Chọn vị trí tuyển dụng liên quan" : "Associated Open Position (Recommended)"}
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs rounded-xl border border-line bg-card p-2.5 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="">{isVi ? "-- Không gắn với tin tuyển dụng cụ thể --" : "-- General Inquiry / No Specific Job --"}</option>
              {activeJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.location || "Vietnam"})
                </option>
              ))}
            </select>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1">
              {isMessageMode
                ? isVi ? "Nội dung tin nhắn / Lời mời" : "Message / Invitation Content *"
                : isVi ? "Lời nhắn kèm theo (Tùy chọn)" : "Personalized Note to Candidate (Optional)"}
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isMessageMode
                  ? isVi
                    ? `Chào ${candidate.name}, chúng tôi rất ấn tượng với kinh nghiệm của bạn và muốn trao đổi về cơ hội nghề nghiệp tại công ty...`
                    : `Hi ${candidate.name}, we reviewed your background and believe you would be a strong fit for our open engineering role...`
                  : isVi
                    ? `Chào ${candidate.name}, công ty chúng tôi muốn kết nối trực tiếp để thảo luận về các cơ hội hợp tác phù hợp với năng lực của bạn.`
                    : `Hi ${candidate.name}, our hiring team would love to connect directly regarding upcoming roles that match your expertise.`
              }
              className="w-full text-xs rounded-xl border border-line bg-card p-3 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-line bg-card shrink-0">
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
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover disabled:opacity-50 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Icon name={submitting ? "refresh-cw" : isMessageMode ? "send" : "check"} size={14} className={submitting ? "lv-spin" : ""} />
            <span>
              {submitting
                ? isVi ? "Đang gửi..." : "Sending..."
                : isMessageMode
                ? isVi ? "Gửi tin nhắn" : "Send Message"
                : isVi ? "Gửi yêu cầu kết nối" : "Send Contact Request"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
