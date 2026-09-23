"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import StatusBadge from "../../../components/company/StatusBadge";
import { useLang, t } from "../../../utils/lang";
import {
  getAuth,
  getDashboard,
  listJobs,
  listCandidates,
  listNotifications,
  PIPELINE_STAGES,
  can,
  syncCompanyWithBackend,
} from "../../../lib/companyStore";

const sectionHead = "mb-4 flex items-center justify-between";
const sectionH2 = "text-lg font-bold";
const viewLink = "flex items-center gap-1 text-sm font-semibold no-underline";
const stat = "flex flex-col gap-1 rounded-md bg-sunken p-4";
const statLabel = "text-xs text-faint";
const statValue = "text-2xl leading-[1.1] font-bold";

export default function OverviewClient() {
  const [lang] = useLang();
  const [data, setData] = useState(null);

  useEffect(() => {
    const refresh = () => {
      setData({
        auth: getAuth(),
        dash: getDashboard(),
        jobs: listJobs(),
        candidates: listCandidates(),
        notifications: listNotifications(),
      });
    };
    refresh();
    syncCompanyWithBackend().then(refresh).catch(console.warn);
    if (typeof window !== "undefined") {
      window.addEventListener("lv360-store", refresh);
      return () => window.removeEventListener("lv360-store", refresh);
    }
  }, []);

  if (!data) {
    return (
      <>
        <div className="mb-6 grid grid-cols-3 gap-3 max-lg:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={stat}>
              <Skeleton width={70} height={12} />
              <Skeleton width={44} height={26} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
        <Skeleton height={200} />
      </>
    );
  }

  const { auth, dash, jobs, candidates, notifications } = data;
  const role = auth.role;
  const remaining = dash.quota.remaining === Infinity ? "∞" : dash.quota.remaining;
  const byStage = PIPELINE_STAGES.map((s) => ({ stage: s, count: candidates.filter((c) => c.stage === s).length }));
  const recentJobs = jobs.filter((j) => j.status !== "Closed").slice(0, 4);

  return (
    <>
      <div className="mb-7">
        <h1 className="mb-1.5 text-2xl font-extrabold">
          {t(lang, "Welcome back")}
          {auth.name ? `, ${auth.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-base text-muted">{t(lang, "Here's what's happening with your hiring.")}</p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3 max-lg:grid-cols-2">
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Active Jobs")}</span>
          <strong className={statValue}>{dash.activeJobs}</strong>
        </div>
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Free Postings Left")}</span>
          <strong className={statValue}>{remaining}</strong>
        </div>
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Applications")}</span>
          <strong className={statValue}>{dash.applications}</strong>
        </div>
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Interviews This Week")}</span>
          <strong className={statValue}>{dash.interviewsThisWeek}</strong>
        </div>
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Positions Filled (MTD)")}</span>
          <strong className={statValue}>{dash.filledMtd}</strong>
        </div>
        <div className={stat}>
          <span className={statLabel}>{t(lang, "Plan")}</span>
          <strong className="text-lg font-bold">{t(lang, dash.plan.name)}</strong>
        </div>
      </div>

      {dash.quota.limit !== Infinity && dash.quota.remaining <= 1 && (
        <div className="mb-8 flex flex-wrap items-center gap-5 rounded-lg border border-line bg-card p-5">
          <Icon name="alert-triangle" size={20} style={{ color: "var(--color-warning-fg)" }} />
          <div className="min-w-[200px] flex-1">
            <strong>{t(lang, "You're close to your free posting limit")}</strong>
            <p className="text-sm text-muted">
              {t(lang, "Used")} {dash.quota.used} / {dash.quota.limit}. {t(lang, "Upgrade to keep posting jobs.")}
            </p>
          </div>
          {can(role, "billing.manage") && (
            <Link href="/company/billing">
              <Button variant="primary" size="sm">
                {t(lang, "View Plans")}
              </Button>
            </Link>
          )}
        </div>
      )}

      <section className="mb-8">
        <div className={sectionHead}>
          <h2 className={sectionH2}>{t(lang, "Quick Actions")}</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
          {can(role, "jobs.manage") && (
            <Link href="/company/jobs/new" className="flex flex-col gap-2 rounded-lg border border-line bg-card p-[18px] text-sm font-semibold text-ink no-underline shadow-xs hover:border-line-brand hover:text-brand [&_span]:text-brand">
              <Icon name="plus-circle" size={20} />
              <span>{t(lang, "Post New Job")}</span>
            </Link>
          )}
          <Link href="/company/candidates" className="flex flex-col gap-2 rounded-lg border border-line bg-card p-[18px] text-sm font-semibold text-ink no-underline shadow-xs hover:border-line-brand hover:text-brand">
            <Icon name="users" size={20} />
            <span>{t(lang, "View Applications")}</span>
          </Link>
          {can(role, "team.manage") && (
            <Link href="/company/team" className="flex flex-col gap-2 rounded-lg border border-line bg-card p-[18px] text-sm font-semibold text-ink no-underline shadow-xs hover:border-line-brand hover:text-brand">
              <Icon name="user-plus" size={20} />
              <span>{t(lang, "Manage Team")}</span>
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1">
        <section className="mb-8">
          <div className={sectionHead}>
            <h2 className={sectionH2}>{t(lang, "Recent Jobs")}</h2>
            <Link href="/company/jobs" className={viewLink}>
              {t(lang, "View all")} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          {recentJobs.length ? (
            <div className="flex flex-col gap-2.5">
              {recentJobs.map((j) => {
                const count = candidates.filter((c) => c.jobId === j.id).length;
                return (
                  <Link key={j.id} href={`/company/jobs/${j.id}`} className="flex items-center gap-3 rounded-md border border-line p-2.5 text-inherit no-underline">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
                      <Icon name="briefcase" size={16} style={{ color: "#fff" }} />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <strong className="text-[13px]">{j.title}</strong>
                      <span className="text-xs text-faint">
                        {j.department} · {count} {t(lang, "applicants")}
                      </span>
                    </div>
                    <StatusBadge kind="job" value={j.status} lang={lang} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted">
              <h3 className="text-lg">{t(lang, "No jobs yet")}</h3>
            </div>
          )}
        </section>

        <section className="mb-8">
          <div className={sectionHead}>
            <h2 className={sectionH2}>{t(lang, "Pipeline Snapshot")}</h2>
            <Link href="/company/candidates" className={viewLink}>
              {t(lang, "Open pipeline")} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {byStage.map((s) => (
              <div key={s.stage} className="flex items-center text-sm">
                <span className="w-[130px] text-muted">{t(lang, s.stage)}</span>
                <div className="mx-3 h-2 flex-1 overflow-hidden rounded-pill bg-sunken">
                  <i className="block h-full rounded-pill bg-brand" style={{ width: `${Math.min(100, s.count * 14)}%` }} />
                </div>
                <strong className="w-7 text-right">{s.count}</strong>
              </div>
            ))}
          </div>

          <div className={`${sectionHead} mt-7`}>
            <h2 className={sectionH2}>{t(lang, "Notifications")}</h2>
            <Link href="/company/notifications" className={viewLink}>
              {t(lang, "View all")} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          <div className="flex flex-col">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="flex items-start gap-2.5 border-b border-line py-2.5 last:border-0">
                {!n.read && <span className="mt-[5px] h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" aria-label={t(lang, "Unread")} />}
                <div>
                  <strong className="block text-[13px]">{n.title}</strong>
                  <p className="mt-0.5 text-xs text-faint">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
