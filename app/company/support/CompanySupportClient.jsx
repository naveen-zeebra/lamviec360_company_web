"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Icon from "../../../components/ds/Icon";
import { useLang } from "../../../utils/lang";
import { getAuth, getCompany } from "../../../lib/companyStore";
import {
  submitCompanySupportTicket,
  trackCompanySupportTicket,
  replyToCompanySupportTicket,
  listMyCompanyTickets,
  COMPANY_SUPPORT_CATEGORIES,
} from "../../../lib/api/supportApi";

export default function CompanySupportClient() {
  const [lang] = useLang();
  const isVi = lang === "VN" || lang === "VI";

  const [auth, setAuth] = useState(null);
  const [company, setCompany] = useState(null);

  // Tickets list state
  const [tickets, setTickets] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedTicketNumber, setSelectedTicketNumber] = useState(null);

  // Active Ticket Thread state
  const [activeTicket, setActiveTicket] = useState(null);
  const [loadingActiveTicket, setLoadingActiveTicket] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);

  // New Ticket Composer Modal/Drawer state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCategory, setNewCategory] = useState("BILLING");
  const [newMessage, setNewMessage] = useState("");
  const [submittingNew, setSubmittingNew] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Quick search fallback
  const [searchCode, setSearchCode] = useState("");

  const loadTickets = useCallback(async (userAuth, userComp) => {
    try {
      setLoadingList(true);
      const email = userAuth?.email || null;
      const compId = userAuth?.companyId || userComp?.id || null;
      if (email || compId) {
        const res = await listMyCompanyTickets({ email, company_id: compId });
        if (res?.success && Array.isArray(res.data)) {
          setTickets(res.data);
          // Auto-select first ticket if none selected
          if (res.data.length > 0 && !selectedTicketNumber) {
            setSelectedTicketNumber(res.data[0].ticket_number);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load company tickets:", err);
    } finally {
      setLoadingList(false);
    }
  }, [selectedTicketNumber]);

  useEffect(() => {
    const curAuth = getAuth();
    const curCompany = getCompany();
    setAuth(curAuth);
    setCompany(curCompany);
    loadTickets(curAuth, curCompany);
  }, [loadTickets]);

  // Load active ticket details whenever selectedTicketNumber changes
  const loadTicketDetails = useCallback(async (ticketNo) => {
    if (!ticketNo) return;
    try {
      setLoadingActiveTicket(true);
      const res = await trackCompanySupportTicket(ticketNo);
      if (res?.success && res.data) {
        setActiveTicket(res.data);
      }
    } catch (err) {
      console.warn("Failed to load ticket details:", err);
    } finally {
      setLoadingActiveTicket(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTicketNumber) {
      loadTicketDetails(selectedTicketNumber);
    }
  }, [selectedTicketNumber, loadTicketDetails]);

  // Quick 1-click create support ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || newMessage.trim().length < 5) {
      setSubmitError(isVi ? "Vui lòng nhập nội dung (tối thiểu 5 ký tự)." : "Please enter message (at least 5 characters).");
      return;
    }
    setSubmitError(null);
    setSubmittingNew(true);
    try {
      // Auto-extract a clean subject from message or category
      const firstLine = newMessage.trim().split("\n")[0].slice(0, 80);
      const categoryObj = COMPANY_SUPPORT_CATEGORIES.find((c) => c.value === newCategory);
      const categoryLabel = isVi ? categoryObj?.label?.vi : categoryObj?.label?.en;
      const subject = `[${categoryLabel || newCategory}] ${firstLine}`;

      const res = await submitCompanySupportTicket({
        subject,
        category: newCategory,
        priority: "MEDIUM",
        message: newMessage.trim(),
        submitter_name: auth?.name || auth?.email || "Employer Representative",
        submitter_email: auth?.email || "company@domain.com",
        company_id: auth?.companyId || company?.id || null,
      });

      if (res?.success && res.data) {
        const newCode = res.data.ticket_number;
        setShowNewModal(false);
        setNewMessage("");

        // Optimistically add to tickets list immediately
        const optimisticTicket = {
          id: res.data.id,
          ticket_number: newCode,
          subject,
          category: newCategory,
          priority: "MEDIUM",
          status: "OPEN",
          submitter_name: auth?.name || auth?.email || "Employer Representative",
          submitter_email: auth?.email || "company@domain.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: 1,
          has_admin_reply: false,
          last_message: {
            sender_type: "USER",
            sender_name: auth?.name || auth?.email || "Employer Representative",
            message_body: newMessage.trim(),
            created_at: new Date().toISOString(),
          },
        };

        setTickets((prev) => [optimisticTicket, ...prev.filter((t) => t.ticket_number !== newCode)]);
        setSelectedTicketNumber(newCode);
        loadTickets(auth, company);
        loadTicketDetails(newCode);
      } else {
        setSubmitError(res?.message || (isVi ? "Không thể gửi yêu cầu." : "Failed to create ticket."));
      }
    } catch (err) {
      setSubmitError(err?.message || (isVi ? "Lỗi kết nối máy chủ." : "Connection error."));
    } finally {
      setSubmittingNew(false);
    }
  };

  // Send follow-up reply in active thread
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket?.ticket_number) return;
    setReplying(true);
    try {
      const res = await replyToCompanySupportTicket(activeTicket.ticket_number, {
        message: replyMessage.trim(),
        submitter_name: auth?.name || "Employer",
      });
      if (res?.success) {
        setReplyMessage("");
        await loadTicketDetails(activeTicket.ticket_number);
        loadTickets(auth, company);
      }
    } catch (err) {
      console.warn("Failed to send reply:", err);
    } finally {
      setReplying(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "RESOLVED":
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{isVi ? "Đã xong" : "Resolved"}</span>;
      case "CLOSED":
        return <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-800">{isVi ? "Đã đóng" : "Closed"}</span>;
      case "IN_PROGRESS":
        return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">{isVi ? "Đang xử lý" : "In Progress"}</span>;
      default:
        return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">{isVi ? "Mới gửi" : "Open"}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/company/overview" className="hover:text-blue-600">
              {isVi ? "Tổng quan" : "Overview"}
            </Link>
            <Icon name="chevron-right" size={12} />
            <span className="font-semibold text-slate-800">{isVi ? "Hỗ trợ" : "Support"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Icon name="life-buoy" size={20} />
            </span>
            {isVi ? "Trung tâm Hỗ trợ Doanh nghiệp" : "Employer Support Desk"}
          </h1>
        </div>

        {/* Quick Action: New Ticket */}
        <button
          type="button"
          onClick={() => {
            setSubmitError(null);
            setShowNewModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Icon name="plus" size={16} />
          <span>{isVi ? "Tạo yêu cầu mới" : "New Support Ticket"}</span>
        </button>
      </div>

      {/* Main 2-Column Minimalist Workplace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
        {/* LEFT COLUMN: TICKET LIST (4 cols) */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon name="inbox" size={16} className="text-blue-600" />
              <span>{isVi ? "Danh sách yêu cầu" : "My Tickets"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {tickets.length}
              </span>
            </h2>

            {/* Quick manual search fallback */}
            <button
              type="button"
              onClick={() => {
                const code = prompt(isVi ? "Nhập mã phiếu hỗ trợ (VD: TK-...):" : "Enter Ticket Number:");
                if (code && code.trim()) {
                  setSelectedTicketNumber(code.trim().toUpperCase());
                }
              }}
              title={isVi ? "Tìm theo mã phiếu" : "Search by code"}
              className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <Icon name="search" size={16} />
            </button>
          </div>

          {/* Ticket Items Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px]">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
                <p>{isVi ? "Đang tải yêu cầu..." : "Loading tickets..."}</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <Icon name="message-square" size={32} className="mx-auto text-slate-300" />
                <p className="text-xs">{isVi ? "Bạn chưa có yêu cầu hỗ trợ nào." : "No support tickets yet."}</p>
                <button
                  type="button"
                  onClick={() => setShowNewModal(true)}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                >
                  {isVi ? "Gửi câu hỏi đầu tiên" : "Ask your first question"}
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicketNumber === t.ticket_number;
                return (
                  <div
                    key={t.ticket_number}
                    onClick={() => setSelectedTicketNumber(t.ticket_number)}
                    className={`cursor-pointer rounded-xl p-3 border transition-all text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 shadow-sm"
                        : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {t.ticket_number}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                      {t.subject}
                    </h3>
                    {t.last_message && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">
                        <strong className="text-slate-700">{t.last_message.sender_name}:</strong>{" "}
                        {t.last_message.message_body}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{t.created_at ? new Date(t.created_at).toLocaleDateString("vi-VN") : ""}</span>
                      {t.has_admin_reply && (
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                          <Icon name="check" size={10} />
                          {isVi ? "Admin đã phản hồi" : "Admin replied"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION THREAD (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loadingActiveTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-xs">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
              <span>{isVi ? "Đang tải nội dung cuộc trò chuyện..." : "Loading conversation..."}</span>
            </div>
          ) : activeTicket ? (
            <>
              {/* Thread Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600">
                      {activeTicket.ticket_number}
                    </span>
                    {getStatusBadge(activeTicket.status)}
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {COMPANY_SUPPORT_CATEGORIES.find((c) => c.value === activeTicket.category)?.label?.[isVi ? "vi" : "en"] || activeTicket.category}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                    {activeTicket.subject}
                  </h2>
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  {isVi ? "Tạo lúc:" : "Created:"} {activeTicket.created_at ? new Date(activeTicket.created_at).toLocaleString("vi-VN") : ""}
                </div>
              </div>

              {/* Message Bubbles Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 max-h-[420px] bg-slate-50/30">
                {activeTicket.messages && activeTicket.messages.length > 0 ? (
                  activeTicket.messages.map((m) => {
                    const isAdmin = m.sender_type === "ADMIN";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[85%] ${isAdmin ? "mr-auto items-start" : "ml-auto items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                          <span
                            className={`rounded px-1.5 py-0.2 font-bold ${
                              isAdmin ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {isAdmin ? "Super Admin" : (isVi ? "Doanh nghiệp" : "You")}
                          </span>
                          <span className="font-medium text-slate-600">{m.sender_name}</span>
                          <span>•</span>
                          <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                        </div>
                        <div
                          className={`rounded-2xl p-3.5 text-xs sm:text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                            isAdmin
                              ? "bg-white border border-blue-200 text-slate-800 rounded-tl-sm"
                              : "bg-blue-600 text-white rounded-tr-sm"
                          }`}
                        >
                          {m.message_body}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-xs text-slate-400 py-8">
                    {isVi ? "Chưa có tin nhắn trong luồng." : "No messages in thread."}
                  </p>
                )}
              </div>

              {/* Fast Inline Reply Bar */}
              <div className="p-3.5 border-t border-slate-100 bg-white">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder={
                      isVi
                        ? "Gửi phản hồi nhanh tới Super Admin..."
                        : "Type a reply to Super Admin..."
                    }
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyMessage.trim()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {replying ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Icon name="send" size={14} />
                        <span className="hidden sm:inline">{isVi ? "Gửi" : "Send"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-center space-y-2">
              <Icon name="help-circle" size={40} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                {isVi ? "Chọn một yêu cầu để xem phản hồi" : "Select a ticket to view conversation"}
              </p>
              <p className="text-xs max-w-sm text-slate-400">
                {isVi
                  ? "Bạn có thể xem trực tiếp câu trả lời của Super Admin và trò chuyện trao đổi tại đây."
                  : "View replies from Super Admin and send follow-ups with zero friction."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ULTRA-MINIMAL NEW TICKET MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Icon name="edit-3" size={18} className="text-blue-600" />
                {isVi ? "Gửi yêu cầu hỗ trợ" : "New Support Request"}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {submitError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              {/* Category Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  {isVi ? "Chủ đề cần hỗ trợ" : "Category"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_SUPPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNewCategory(cat.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        newCategory === cat.value
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {isVi ? cat.label.vi : cat.label.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Box */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  {isVi ? "Nội dung yêu cầu" : "How can we help?"} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    isVi
                      ? "Mô tả câu hỏi hoặc vấn đề của bạn..."
                      : "Describe your question or issue in detail..."
                  }
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Context Notice */}
              <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 flex items-center gap-2">
                <Icon name="shield-check" size={14} className="text-emerald-600 shrink-0" />
                <span>
                  {isVi
                    ? `Tài khoản doanh nghiệp: ${company?.name || auth?.name || "Đối tác"} (${auth?.email})`
                    : `Linked account: ${company?.name || auth?.name || "Partner"} (${auth?.email})`}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isVi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submittingNew || !newMessage.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingNew ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Icon name="send" size={14} />
                  )}
                  <span>{isVi ? "Gửi ngay" : "Submit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
