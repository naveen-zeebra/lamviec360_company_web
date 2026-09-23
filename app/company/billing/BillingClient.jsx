"use client";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import Toast, { useToast } from "../../../components/ds/Toast";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
import { getCompany, getQuota, setPlan, PLANS } from "../../../lib/companyStore";

const FEATURES = {
  Freemium: ["Up to 3 active job postings", "Basic candidate pipeline", "1 team member", "Email support"],
  Professional: ["Up to 25 active job postings", "AI candidate screening", "Unlimited team members", "Priority support"],
  Enterprise: ["Unlimited job postings", "AI screening + analytics", "SSO & audit exports", "Dedicated account manager"],
};

function Billing() {
  const [lang] = useLang();
  const [ready, setReady] = useState(false);
  const [company, setCompany] = useState(null);
  const [quota, setQuota] = useState(null);
  const [toast, setToast] = useToast();

  const refresh = () => {
    setCompany(getCompany());
    setQuota(getQuota());
  };

  useEffect(() => {
    refresh();
    setReady(true);
  }, []);

  if (!ready) return <Skeleton height={320} />;

  const used = quota.used;
  const limit = quota.limit === Infinity ? "∞" : quota.limit;
  const pct = quota.limit === Infinity ? 20 : Math.min(100, Math.round((used / quota.limit) * 100));

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1.5 text-2xl font-extrabold">{t(lang, "Subscription & Billing")}</h1>
        <p className="text-sm text-muted">{t(lang, "Manage your plan and see your remaining job-posting quota.")}</p>
      </div>

      <div className="mb-7 rounded-xl border border-line bg-card p-8 shadow-md max-md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="mb-1 inline-block text-sm font-bold uppercase tracking-[0.06em] text-brand">
              {t(lang, "Current plan")}
            </span>
            <h2 className="text-xl">{t(lang, company.plan)}</h2>
          </div>
          <div className="text-right">
            <strong className="text-lg">{PLANS.find((p) => p.id === company.plan)?.price}</strong>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span>{t(lang, "Active job postings")}</span>
            <strong>
              {used} / {limit}
            </strong>
          </div>
          <div className="h-2 overflow-hidden rounded-pill bg-sunken">
            <i className="block h-full rounded-pill bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
        {PLANS.map((p) => {
          const current = p.id === company.plan;
          const featured = p.id === "Professional";
          return (
            <div
              key={p.id}
              className={[
                "relative flex h-full flex-col gap-2.5 rounded-lg border-[1.5px] bg-card p-8",
                featured ? "border-line-brand shadow-md" : "border-line",
              ].join(" ")}
            >
              {featured && (
                <span className="absolute -top-3 left-8 rounded-pill bg-brand px-3 py-1 text-xs font-bold text-white">{t(lang, "Popular")}</span>
              )}
              <h3 className="text-xl">{t(lang, p.name)}</h3>
              <div className="my-2 text-lg font-bold">{p.price}</div>
              <p className="mb-2 flex-1 text-sm text-muted">{t(lang, p.blurb)}</p>
              <ul className="m-0 my-2 flex list-none flex-col gap-3 p-0">
                {FEATURES[p.id].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                    <span aria-hidden="true" className="mt-0.5 text-green-600">
                      <Icon name="check" size={14} />
                    </span>
                    {t(lang, f)}
                  </li>
                ))}
              </ul>
              <Button
                variant={current ? "secondary" : "primary"}
                disabled={current}
                onClick={() => {
                  setPlan(p.id);
                  refresh();
                  setToast(`${t(lang, "Switched to")} ${t(lang, p.name)}`);
                }}
                className="w-full justify-center"
              >
                {current ? t(lang, "Current plan") : t(lang, "Choose") + " " + t(lang, p.name)}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-faint">{t(lang, "Prototype only — no payment is processed.")}</p>
      <Toast msg={toast} />
    </>
  );
}

export default function BillingClient() {
  return (
    <RequirePermission action="billing.manage">
      <Billing />
    </RequirePermission>
  );
}
