"use client";

import { useEffect, useState } from "react";
import { Badge } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
import {
  getCompany,
  getQuota,
  listTeam,
  listInvitations,
  syncCompanyWithBackend,
  PLANS,
  MAX_TEAM_COUNT,
} from "../../../lib/companyStore";

function Billing() {
  const [lang] = useLang();
  const [ready, setReady] = useState(false);
  const [company, setCompany] = useState(null);
  const [quota, setQuota] = useState(null);
  const [teamCount, setTeamCount] = useState(1);

  const isVi = lang === "VI" || lang === "VN";

  const refresh = () => {
    const co = getCompany();
    const q = getQuota();
    const activeMembers = listTeam().filter((m) => m.status === "Active").length;
    const pendingInvites = listInvitations().filter((i) => i.status === "Pending").length;
    setCompany(co);
    setQuota(q);
    setTeamCount(activeMembers + pendingInvites);
  };

  useEffect(() => {
    refresh();
    setReady(true);
    syncCompanyWithBackend().then(refresh).catch(console.warn);
    if (typeof window !== "undefined") {
      window.addEventListener("lv360-store", refresh);
      return () => window.removeEventListener("lv360-store", refresh);
    }
  }, []);

  if (!ready || !company || !quota) return <Skeleton height={360} />;

  const currentPlan = PLANS[0];
  const used = quota.used || 0;
  const limitDisplay = quota.limit === Infinity ? "∞" : quota.limit;
  const pct =
    quota.limit === Infinity
      ? 15
      : Math.min(100, Math.round((used / (quota.limit || 1)) * 100));
  const seatLimit = currentPlan.maxTeamCount || MAX_TEAM_COUNT || 6;
  const seatPct = Math.min(100, Math.round((teamCount / seatLimit) * 100));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">
            {isVi ? "Gói dịch vụ & Hạn mức" : "Plan & Workspace Limits"}
          </h1>
          <p className="text-xs text-muted">
            {isVi
              ? "Thông tin gói Freemium hiện tại, hạn mức tin đăng và số lượng thành viên đội ngũ."
              : "View your active Freemium plan, job posting quota, and workspace team member limit."}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
          <Icon name="check-circle" size={14} className="text-emerald-600 shrink-0" />
          <span>
            {isVi
              ? `Freemium · Miễn phí (Tối đa ${seatLimit} thành viên)`
              : `Freemium · Free Active (Max ${seatLimit} Team Members)`}
          </span>
        </div>
      </div>

      {/* Current Active Freemium Plan Overview Card */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-md bg-brand-subtle/40 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-brand">
                {t(lang, "Current Plan")}
              </span>
              <Badge tone="success">
                {isVi ? "Đang hoạt động" : "Active"}
              </Badge>
            </div>

            <h2 className="mt-2 text-2xl font-black text-ink">
              {currentPlan.name}
            </h2>
            <p className="mt-1 text-xs text-muted max-w-xl leading-relaxed">
              {isVi
                ? `Doanh nghiệp của bạn đang sử dụng gói Freemium miễn phí với tối đa ${quota.limit} tin tuyển dụng và tối đa ${seatLimit} thành viên đội ngũ.`
                : `Your workspace is on the active Freemium plan with up to ${quota.limit} active job postings and up to ${seatLimit} team members.`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-xl font-black text-ink">
              {isVi ? "0 ₫" : "0 VND"}
            </span>
            <span className="text-xs text-muted">
              {isVi ? "Trạng thái:" : "Status:"}{" "}
              <strong className="text-emerald-700 font-bold">
                {isVi ? "Miễn phí" : "Free Plan"}
              </strong>
            </span>
          </div>
        </div>

        {/* Job Quota & Team Seats Progress */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 rounded-xl border border-line/70 bg-sunken/30 p-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-ink flex items-center gap-1.5">
                <Icon name="briefcase" size={14} className="text-brand" />
                {isVi ? "Tin tuyển dụng đang hoạt động" : "Active Job Postings Quota"}
              </span>
              <span className="text-ink">
                {used} / {limitDisplay}{" "}
                <span className="text-muted font-normal">
                  ({quota.remaining === Infinity ? "∞" : quota.remaining} {t(lang, "remaining")})
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full bg-brand transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-line/70 bg-sunken/30 p-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-ink flex items-center gap-1.5">
                <Icon name="users" size={14} className="text-brand" />
                {isVi ? "Thành viên đội ngũ" : "Workspace Team Members"}
              </span>
              <span className="text-ink">
                {teamCount} / {seatLimit}{" "}
                <span className="text-muted font-normal">
                  ({Math.max(0, seatLimit - teamCount)} {isVi ? "chỗ trống" : "available"})
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-sunken">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  teamCount >= seatLimit ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${seatPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Included Features */}
        <div className="mt-6 border-t border-line/60 pt-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3">
            {isVi ? "Quyền lợi gói Freemium bao gồm:" : "Included in your Freemium plan:"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentPlan.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-ink/90 leading-tight">
                <span className="text-emerald-600 shrink-0 mt-0.5">
                  <Icon name="check" size={14} />
                </span>
                <span>{t(lang, feat)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] text-muted border-t border-line/50 pt-3">
          <span>
            {isVi ? "Thời gian lưu trữ hồ sơ ứng viên:" : "Candidate profile retention:"}{" "}
            <strong className="text-ink">
              {currentPlan.retentionMonths} {isVi ? "tháng" : "months"}
            </strong>
          </span>
          <span>
            {isVi ? "Giới hạn thành viên tối đa:" : "Max team members:"}{" "}
            <strong className="text-ink">{seatLimit}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BillingClient() {
  return (
    <RequirePermission action="billing.manage">
      <Billing />
    </RequirePermission>
  );
}
