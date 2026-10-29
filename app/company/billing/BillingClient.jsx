"use client";

import { useEffect, useState } from "react";
import { Button, Badge } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import Toast, { useToast } from "../../../components/ds/Toast";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
import {
  getCompany,
  getQuota,
  PLANS,
} from "../../../lib/companyStore";

function Billing() {
  const [lang] = useLang();
  const [ready, setReady] = useState(false);
  const [company, setCompany] = useState(null);
  const [quota, setQuota] = useState(null);
  const [annual, setAnnual] = useState(false);
  const [toast, setToast] = useToast();

  const isVi = lang === "VI" || lang === "VN";

  const refresh = () => {
    const co = getCompany();
    const q = getQuota();
    setCompany(co);
    setQuota(q);
  };

  useEffect(() => {
    refresh();
    setReady(true);
  }, []);

  if (!ready || !company || !quota) return <Skeleton height={420} />;

  const currentPlan = PLANS.find((p) => p.id === company.plan) || PLANS[0];
  const used = quota.used || 0;
  const limitDisplay = quota.limit === Infinity ? "∞" : quota.limit;
  const pct =
    quota.limit === Infinity
      ? 15
      : Math.min(100, Math.round((used / (quota.limit || 1)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">
            {isVi ? "Gói dịch vụ & Hạn mức đăng tin" : "Subscription & Job Quota"}
          </h1>
          <p className="text-xs text-muted">
            {isVi
              ? "Xem gói tuyển dụng hiện tại, theo dõi hạn mức tin đăng và các tính năng khả dụng."
              : "View your active recruitment tier, monitor job posting quotas, and explore available features."}
          </p>
        </div>

        {/* Phase 1 Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold text-blue-900 shadow-2xs">
          <Icon name="sparkles" size={14} className="text-blue-600 shrink-0" />
          <span>
            {isVi
              ? "Giai đoạn 1: Miễn phí 100% (Hạn mức 999 tin)"
              : "Phase 1: 100% Free (Quota: 999 Postings)"}
          </span>
        </div>
      </div>

      {/* Current Active Plan Overview Card */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-md bg-brand-subtle/40 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-brand">
                {t(lang, "Current Plan")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isVi ? "Đang hoạt động (Giai đoạn 1)" : "Active (Phase 1)"}
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-black text-ink">
              {currentPlan.name}
            </h2>
            <p className="mt-1 text-xs text-muted max-w-xl leading-relaxed">
              {isVi
                ? "Trong Giai đoạn 1, doanh nghiệp của bạn được phân bổ hạn mức 999 tin đăng tuyển dụng hoạt động miễn phí."
                : "During Phase 1, your company is allocated 999 free active job postings."}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-xl font-black text-ink">
              {isVi ? "0 ₫" : "0 VND"}
            </span>
            <span className="text-xs text-muted">
              {isVi ? "Trạng thái:" : "Status:"}{" "}
              <strong className="text-emerald-700 font-bold">
                {isVi ? "Miễn phí (Giai đoạn 1)" : "Free (Phase 1)"}
              </strong>
            </span>
          </div>
        </div>

        {/* Quota Progress Meter */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-ink flex items-center gap-1.5">
              <Icon name="briefcase" size={14} className="text-brand" />
              {isVi ? "Hạn mức tin tuyển dụng đang hoạt động" : "Active Job Postings Quota"}
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

          <div className="flex items-center justify-between text-[11px] text-muted pt-1">
            <span>
              {isVi
                ? "Thời gian lưu trữ hồ sơ ứng viên:"
                : "Candidate profile retention:"}{" "}
              <strong className="text-ink">
                {currentPlan.retentionMonths} {isVi ? "tháng" : "months"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Phase 1 Policy Callout Banner */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Icon name="sparkles" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-blue-950">
                  {isVi
                    ? "Chính sách tuyển dụng Giai đoạn 1"
                    : "Phase 1 Recruitment Policy"}
                </h4>
                <span className="rounded-md bg-blue-200/70 px-2 py-0.5 text-[10px] font-extrabold uppercase text-blue-800">
                  {isVi ? "Kích hoạt 100% miễn phí" : "100% Free Active"}
                </span>
              </div>
              <p className="mt-1 text-xs text-blue-900/80 leading-relaxed max-w-2xl">
                {isVi
                  ? "Nền tảng LàmViệc360 áp dụng chính sách miễn phí 100% cho mọi nhà tuyển dụng trong Giai đoạn 1 với hạn mức 999 tin đăng hoạt động đồng thời. Các gói trả phí (Professional, Enterprise) và cổng thanh toán trực tuyến sẽ được mở trong Giai đoạn 2."
                  : "LàmViệc360 is currently operating under Phase 1 launch policy: 100% free for all registered employers with 999 active job posting slots. Paid subscription tiers (Professional, Enterprise) and payment gateway processing will be introduced in Phase 2."}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-xl bg-white/90 border border-blue-200/80 px-4 py-2.5 text-center shadow-2xs">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isVi ? "Gói đang kích hoạt" : "Active Tier"}
            </span>
            <span className="text-base font-black text-brand">Freemium (999 Jobs)</span>
          </div>
        </div>
      </div>

      {/* Plan Tier Showcase Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-ink">
              {isVi ? "Các gói dịch vụ tuyển dụng" : "Recruitment Packages"}
            </h3>
            <p className="text-xs text-muted">
              {isVi
                ? "Gói Freemium đang được kích hoạt cho toàn bộ doanh nghiệp trong Giai đoạn 1."
                : "The Freemium tier is active for all employers during Phase 1."}
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-xl border border-line bg-card p-1.5 shadow-2xs">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                !annual ? "bg-brand text-white shadow-xs" : "text-muted hover:text-ink"
              }`}
              onClick={() => setAnnual(false)}
            >
              {isVi ? "Hàng tháng" : "Monthly"}
            </span>

            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
                annual ? "bg-brand text-white shadow-xs" : "text-muted hover:text-ink"
              }`}
              onClick={() => setAnnual(true)}
            >
              <span>{isVi ? "Hàng năm" : "Annual"}</span>
              <span className="rounded bg-emerald-500 text-white px-1.5 py-0.2 text-[10px] font-black uppercase">
                {isVi ? "-20%" : "Save 20%"}
              </span>
            </span>
          </div>
        </div>

        {/* 3-Tier Plan Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((p) => {
            const isCurrent = p.id === company.plan;
            const isPhase2 = !p.enabled;
            const priceDisplay = annual
              ? isVi && p.priceAnnual
                ? p.priceAnnual
                : p.priceAnnual || p.price
              : isVi && p.priceMonthly
              ? p.priceMonthly
              : p.price;

            return (
              <div
                key={p.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                  isCurrent
                    ? "border-brand bg-card shadow-md ring-2 ring-brand/20"
                    : isPhase2
                    ? "border-line/70 bg-card/60 opacity-85 shadow-2xs"
                    : "border-line bg-card shadow-2xs hover:border-line-hover"
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                    {isVi ? "Giai đoạn 1 (Đang kích hoạt)" : "Phase 1 (Active)"}
                  </span>
                )}
                {isPhase2 && (
                  <span className="absolute -top-3 right-6 rounded-full bg-slate-100 border border-slate-300 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-2xs">
                    {isVi ? "Giai đoạn 2 (Sắp mở)" : "Phase 2 (Coming Soon)"}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-ink">{p.name}</h4>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {isVi ? "Khả dụng" : "Active"}
                        </span>
                      )}
                    </div>
                    {p.aiFeatures && (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                        <Icon name="sparkles" size={10} /> AI
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-ink">
                      {priceDisplay}
                    </span>
                    {p.id === "Professional" && (
                      <span className="text-xs text-muted font-semibold">
                        {isVi ? "/ tháng" : "/ mo"}
                      </span>
                    )}
                  </div>

                  {annual && p.annualTotal && (
                    <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                      {isVi
                        ? `Thanh toán theo năm (${p.annualTotal})`
                        : `Billed annually (${p.annualTotal})`}
                    </p>
                  )}

                  <p className="mt-2.5 text-xs text-muted leading-relaxed min-h-[36px]">
                    {isVi
                      ? isCurrent
                        ? "Gói dịch vụ kích hoạt cho toàn bộ doanh nghiệp trong Giai đoạn 1."
                        : p.id === "Professional"
                        ? "Gói dịch vụ dành cho doanh nghiệp đang mở rộng quy mô (Giai đoạn 2)."
                        : "Gói dịch vụ tùy chỉnh cho tập đoàn và tổ chức quy mô lớn (Giai đoạn 2)."
                      : p.blurb}
                  </p>

                  <div className="mt-4 border-t border-line/60 pt-4 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {isVi ? "Quyền lợi bao gồm:" : "Features included:"}
                    </div>
                    {p.features.map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-start gap-2.5 text-xs text-ink/90 leading-tight"
                      >
                        <span className="text-emerald-600 shrink-0 mt-0.5">
                          <Icon name="check" size={13} />
                        </span>
                        <span>{t(lang, feat)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line/40">
                  {isCurrent ? (
                    <Button
                      variant="secondary"
                      disabled={true}
                      className="w-full justify-center text-xs font-bold cursor-default opacity-90 border-emerald-300 bg-emerald-50/50 text-emerald-800"
                    >
                      <Icon name="check" size={14} className="mr-1.5 text-emerald-600" />
                      {isVi ? "Gói hiện tại đang kích hoạt" : "Current Active Plan"}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled={true}
                      className="w-full justify-center text-xs font-bold cursor-not-allowed opacity-60 bg-sunken/40 text-muted"
                    >
                      <Icon name="lock" size={12} className="mr-1.5 text-muted" />
                      {isVi ? "Sắp ra mắt (Giai đoạn 2)" : "Coming in Phase 2"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted italic">
          *{" "}
          {isVi
            ? "Trong Giai đoạn 1, toàn bộ tính năng tuyển dụng được cung cấp miễn phí với gói Freemium. Các gói trả phí sẽ được mở trong Giai đoạn 2."
            : "In Phase 1, all recruitment features are provided free of charge under the Freemium plan. Paid tiers will be unlocked in Phase 2."}
        </p>
      </div>

      <Toast msg={toast} />
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
