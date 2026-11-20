"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Icon from "../../../components/ds/Icon";
import { getCompany, getAuth, getCompanyToken, searchTalentStore } from "../../../lib/companyStore";
import TalentSearchFilters from "./components/TalentSearchFilters";
import TalentCandidateCard from "./components/TalentCandidateCard";
import TalentProfileDrawer from "./components/TalentProfileDrawer";
import RequestContactModal from "./components/RequestContactModal";

export default function TalentSearchClient({ lang = "EN" }) {
  const isVi = lang === "VI";
  const [company, setCompany] = useState(null);
  const [auth, setAuth] = useState(null);

  // Search & filter state
  const [filters, setFilters] = useState({
    q: "",
    title: "",
    city: "",
    skills: "",
    expRange: "",
    min_experience: "",
    max_experience: "",
    education_level: "",
    min_salary: "",
  });

  const [candidates, setCandidates] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal / Drawer state
  const [drawerCandidate, setDrawerCandidate] = useState(null);
  const [contactModalState, setContactModalState] = useState({
    isOpen: false,
    candidate: null,
    mode: "contact", // 'contact' | 'message'
  });

  // Load company & auth context
  useEffect(() => {
    setCompany(getCompany());
    setAuth(getAuth());
  }, []);

  // Fetch search results
  const loadTalentData = async (filterParams) => {
    if (typeof window !== "undefined" && !getCompanyToken()) {
      setLoading(false);
      setCandidates([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await searchTalentStore(filterParams);
      if (res?.unauthenticated) {
        setCandidates([]);
        setTotalCount(0);
        return;
      }
      setCandidates(res?.items || []);
      setTotalCount(res?.total || (res?.items || []).length);
    } catch (err) {
      console.warn("Talent search query error:", err);
      setCandidates([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTalentData({ ...filters, keyword: filters.q });
    }, 250);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      q: "",
      title: "",
      city: "",
      skills: "",
      expRange: "",
      min_experience: "",
      max_experience: "",
      education_level: "",
      min_salary: "",
    });
  };

  const showToastMsg = (title, msg) => {
    setToast({ title, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Access Gating (Auth, Approval & Role Check) ──
  const hasToken = typeof window !== "undefined" ? Boolean(getCompanyToken()) : true;
  if (!hasToken && (!auth || !auth.loggedIn)) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 font-body animate-in fade-in">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-8 sm:p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto border border-blue-300">
            <Icon name="lock" size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-ink m-0">
              {isVi ? "Yêu cầu đăng nhập Doanh nghiệp" : "Employer Sign-In Required"}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed m-0">
              {isVi
                ? "Vui lòng đăng nhập bằng tài khoản nhà tuyển dụng để tìm kiếm và kết nối với nguồn nhân tài."
                : "Please log in with your employer account to search and connect with qualified candidates."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/employer-login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors shadow-xs no-underline"
            >
              <Icon name="log-in" size={16} />
              {isVi ? "Đăng nhập ngay" : "Sign In to Workspace"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const approvalStatus = (company?.approval_status || company?.verification_status || "approved").toLowerCase();
  const isApproved = approvalStatus === "approved" || approvalStatus === "verified";
  const userRole = (auth?.role || "company_admin").toLowerCase();
  const isViewer = userRole === "viewer";

  if (company && !isApproved) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 font-body animate-in fade-in">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-8 sm:p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300">
            <Icon name="shield-alert" size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 inline-block">
              {isVi ? "Tài khoản chưa được phê duyệt" : "Account Verification Pending"}
            </span>
            <h2 className="text-xl font-bold text-ink m-0">
              {isVi ? "Tính năng Tìm kiếm Ứng viên đang tạm khóa" : "Talent Search Access Restricted"}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed m-0">
              {isVi
                ? "Tính năng Tìm kiếm Ứng viên chỉ khả dụng cho doanh nghiệp đã được xác minh và phê duyệt hoạt động. Hồ sơ doanh nghiệp của bạn đang ở trạng thái: "
                : "Talent Search is available exclusively to companies verified and approved by the platform. Your company status is currently: "}
              <strong className="text-amber-950 uppercase">{approvalStatus}</strong>.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/company/settings?tab=verification"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <Icon name="check-circle" size={15} />
              <span>{isVi ? "Xem trạng thái xác minh doanh nghiệp" : "View Business Verification Status"}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isViewer) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 font-body animate-in fade-in">
        <div className="rounded-2xl border border-line bg-card p-8 sm:p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-line">
            <Icon name="lock" size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-ink m-0">
              {isVi ? "Quyền truy cập bị giới hạn (Viewer)" : "Access Restricted (Viewer Role)"}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed m-0">
              {isVi
                ? "Vai trò Người xem (Viewer) không có quyền truy cập vào Tính năng Tìm kiếm Ứng viên và liên hệ hồ sơ. Vui lòng liên hệ Quản trị viên để nâng cấp quyền."
                : "The Viewer role does not have permission to access Talent Search or request candidate contact records. Please contact your Company Admin for elevated access."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/company/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line bg-card hover:bg-sunken text-ink text-xs font-bold transition-colors shadow-2xs"
            >
              <Icon name="arrow-left" size={14} />
              <span>{isVi ? "Quay lại Danh sách Tin tuyển dụng" : "Back to Job Postings"}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-body pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[300] p-4 rounded-2xl bg-ink text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 text-xs max-w-sm">
          <Icon name="check-circle" size={18} className="text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <strong className="block font-bold">{toast.title}</strong>
            <p className="text-white/80 m-0 mt-0.5">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand-subtle text-brand flex items-center justify-center">
              <Icon name="search" size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-ink m-0 tracking-tight">
              {isVi ? "Tìm kiếm Ứng viên (Talent Search)" : "Talent Search"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted m-0 mt-1">
            {isVi
              ? "Khám phá các chuyên viên tài năng đang sẵn sàng tìm việc và chủ động gửi lời mời ứng tuyển."
              : "Search verified job seeker profiles and proactively engage suitable talent for your openings."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl border border-line bg-card text-xs font-bold text-ink shadow-2xs">
            {totalCount} {isVi ? "ứng viên phù hợp" : "candidates available"}
          </span>
        </div>
      </div>

      {/* Multi-attribute Filter Panel */}
      <TalentSearchFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        lang={lang}
      />

      {/* Search Results Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-muted space-y-3">
          <Icon name="loader" size={28} className="animate-spin text-brand mx-auto" />
          <p className="font-semibold text-ink">
            {isVi ? "Đang tìm kiếm hồ sơ ứng viên phù hợp..." : "Searching active talent pool..."}
          </p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-line bg-sunken/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-card border border-line text-muted flex items-center justify-center mx-auto shadow-2xs">
            <Icon name="users" size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-ink m-0">
              {isVi ? "Không tìm thấy ứng viên phù hợp" : "No matching candidates found"}
            </h4>
            <p className="text-xs text-muted m-0">
              {isVi
                ? "Thử mở rộng các tiêu chí bộ lọc (mức lương, số năm kinh nghiệm hoặc kỹ năng) để tìm kiếm thêm ứng viên."
                : "Try broadening your filter criteria (location, experience range or skills) to see more talent."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-bold text-brand bg-brand-subtle hover:bg-brand/10 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Icon name="rotate-ccw" size={13} />
            <span>{isVi ? "Đặt lại bộ lọc" : "Clear All Filters"}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => (
            <TalentCandidateCard
              key={cand.id}
              candidate={cand}
              onViewProfile={(c) => setDrawerCandidate(c)}
              onRequestContact={(c) =>
                setContactModalState({
                  isOpen: true,
                  candidate: c,
                  mode: "contact",
                })
              }
              onMessage={(c) =>
                setContactModalState({
                  isOpen: true,
                  candidate: c,
                  mode: "message",
                })
              }
              lang={lang}
            />
          ))}
        </div>
      )}

      {/* Full Profile Drawer (EMP-FR-021) */}
      <TalentProfileDrawer
        isOpen={!!drawerCandidate}
        onClose={() => setDrawerCandidate(null)}
        candidateSummary={drawerCandidate}
        onRequestContact={(c) => {
          setDrawerCandidate(null);
          setContactModalState({
            isOpen: true,
            candidate: c,
            mode: "contact",
          });
        }}
        onMessage={(c) => {
          setDrawerCandidate(null);
          setContactModalState({
            isOpen: true,
            candidate: c,
            mode: "message",
          });
        }}
        lang={lang}
      />

      {/* Contact & Direct Message Modal */}
      <RequestContactModal
        isOpen={contactModalState.isOpen}
        onClose={() => setContactModalState({ isOpen: false, candidate: null, mode: "contact" })}
        candidate={contactModalState.candidate}
        mode={contactModalState.mode}
        onSuccess={() => {
          if (contactModalState.mode === "message") {
            showToastMsg(
              isVi ? "Đã gửi tin nhắn" : "Message Sent",
              isVi
                ? "Lời mời ứng tuyển đã được chuyển đến hộp thư của ứng viên."
                : "Your invitation has been delivered to the candidate."
            );
          } else {
            showToastMsg(
              isVi ? "Đã gửi yêu cầu kết nối" : "Contact Request Sent",
              isVi
                ? "Yêu cầu chia sẻ thông tin liên hệ đã được gửi đến ứng viên (BR-014)."
                : "Contact access request sent. Full details will unlock upon candidate approval (BR-014)."
            );
          }
          loadTalentData(filters);
        }}
        lang={lang}
      />
    </div>
  );
}
