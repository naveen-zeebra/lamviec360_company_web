"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import Toast, { useToast } from "../../../components/ds/Toast";
import StatusBadge from "../../../components/company/StatusBadge";
import { useLang, t } from "../../../utils/lang";
import {
  getAuth,
  listJobs,
  listCandidates,
  setJobStatus,
  duplicateJob,
  getQuota,
  JOB_STATUSES,
  can,
  syncCompanyWithBackend,
} from "../../../lib/companyStore";

const pageHead = "mb-6 flex flex-wrap items-start justify-between gap-4";
const th = "whitespace-nowrap border-b border-line bg-sunken px-4 py-3 text-left font-bold text-muted";
const td = "border-b border-line px-4 py-3 align-middle";
const iconBtn = "inline-flex rounded-sm border border-transparent p-1.5 text-muted hover:bg-sunken hover:text-ink";
const menuBtn = "flex w-full items-center rounded-sm px-2.5 py-2 text-left text-sm text-ink hover:bg-brand-subtle hover:text-brand";
const aiTag = "ml-2 inline-flex items-center gap-1 rounded-pill bg-brand-subtle px-2 py-[3px] text-[11px] font-bold tracking-[0.02em] text-brand";

export default function JobsManageClient() {
  const [lang] = useLang();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [quota, setQuota] = useState(null);
  const [role, setRole] = useState("Viewer");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [menuFor, setMenuFor] = useState(null);
  const [toast, setToast] = useToast();

  const refresh = () => {
    setJobs(listJobs());
    setCandidates(listCandidates());
    setQuota(getQuota());
  };

  useEffect(() => {
    setRole(getAuth().role);
    refresh();
    setReady(true);
    syncCompanyWithBackend().then(refresh).catch(console.warn);
    if (typeof window !== "undefined") {
      window.addEventListener("lv360-store", refresh);
      return () => window.removeEventListener("lv360-store", refresh);
    }
  }, []);

  const editable = can(role, "jobs.manage");

  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (!q || j.title.toLowerCase().includes(q.toLowerCase()) || (j.department || "").toLowerCase().includes(q.toLowerCase())) &&
          (!status || j.status === status)
      ),
    [jobs, q, status]
  );

  const act = async (id, fn, msg) => {
    await fn(id);
    setMenuFor(null);
    refresh();
    setToast(msg);
  };

  if (!ready) {
    return (
      <>
        <Skeleton width={220} height={30} style={{ marginBottom: 24 }} />
        <Skeleton height={280} />
      </>
    );
  }

  return (
    <>
      <div className={pageHead}>
        <div>
          <h1 className="mb-1.5 text-2xl font-extrabold">{t(lang, "Job Management")}</h1>
          <p className="text-sm text-muted">
            {quota.limit === Infinity
              ? t(lang, "Unlimited job postings on your plan.")
              : `${t(lang, "Posting quota")}: ${quota.used} / ${quota.limit} ${t(lang, "used")} · ${quota.remaining} ${t(lang, "remaining")}`}
          </p>
        </div>
        {editable && (
          <Button variant="primary" onClick={() => router.push("/company/jobs/new")}>
            <Icon name="plus" size={16} /> {t(lang, "Post New Job")}
          </Button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="min-w-[200px] flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "Search job title or department")} size="sm" />
        </div>
        <div className="min-w-[160px]">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder={t(lang, "All statuses")} options={JOB_STATUSES.map((s) => ({ value: s, label: t(lang, s) }))} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted">
          <h3 className="text-lg">{t(lang, "No jobs match your filters")}</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-card shadow-xs">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>{t(lang, "Job Title")}</th>
                <th className={th}>{t(lang, "Department")}</th>
                <th className={th}>{t(lang, "Applicants")}</th>
                <th className={th}>{t(lang, "Deadline")}</th>
                <th className={th}>{t(lang, "Status")}</th>
                <th className={th} aria-label={t(lang, "Actions")} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => {
                const count = candidates.filter((c) => c.jobId === j.id).length;
                return (
                  <tr key={j.id}>
                    <td className={td}>
                      <Link href={`/company/jobs/${j.id}`} className="font-semibold">
                        {j.title}
                      </Link>
                      {j.aiGenerated && (
                        <span className={aiTag}>
                          <Icon name="sparkles" size={10} /> {t(lang, "AI JD")}
                        </span>
                      )}
                    </td>
                    <td className={td}>{j.department}</td>
                    <td className={td}>{count}</td>
                    <td className={td}>{j.deadline}</td>
                    <td className={td}>
                      <StatusBadge kind="job" value={j.status} lang={lang} />
                    </td>
                    <td className={`${td} relative text-right`}>
                      <button className={iconBtn} aria-label={t(lang, "Actions")} onClick={() => setMenuFor(menuFor === j.id ? null : j.id)}>
                        <Icon name="more-vertical" size={16} />
                      </button>
                      {menuFor === j.id && (
                        <div className="absolute right-0 top-full z-50 min-w-[170px] rounded-md border border-line bg-card p-1.5 shadow-md" role="menu">
                          {editable && (
                            <button role="menuitem" className={menuBtn} onClick={() => router.push(`/company/jobs/${j.id}`)}>
                              <Icon name="pencil" size={13} style={{ marginRight: 8 }} /> {t(lang, "Edit")}
                            </button>
                          )}
                          {editable && j.status === "Draft" && (
                            <button role="menuitem" className={menuBtn} onClick={() => act(j.id, (id) => setJobStatus(id, "Published"), "Job published")}>
                              <Icon name="globe" size={13} style={{ marginRight: 8 }} /> {t(lang, "Publish")}
                            </button>
                          )}
                          {editable && j.status === "Published" && (
                            <button role="menuitem" className={menuBtn} onClick={() => act(j.id, (id) => setJobStatus(id, "Paused"), "Job paused")}>
                              <Icon name="pause" size={13} style={{ marginRight: 8 }} /> {t(lang, "Pause")}
                            </button>
                          )}
                          {editable && j.status === "Paused" && (
                            <button role="menuitem" className={menuBtn} onClick={() => act(j.id, (id) => setJobStatus(id, "Published"), "Job resumed")}>
                              <Icon name="play" size={13} style={{ marginRight: 8 }} /> {t(lang, "Resume job")}
                            </button>
                          )}
                          {editable && j.status !== "Closed" && (
                            <button role="menuitem" className={menuBtn} onClick={() => act(j.id, (id) => setJobStatus(id, "Closed"), "Job closed")}>
                              <Icon name="archive" size={13} style={{ marginRight: 8 }} /> {t(lang, "Close")}
                            </button>
                          )}
                          {editable && (
                            <button role="menuitem" className={menuBtn} onClick={() => act(j.id, duplicateJob, "Job duplicated as draft")}>
                              <Icon name="copy" size={13} style={{ marginRight: 8 }} /> {t(lang, "Duplicate")}
                            </button>
                          )}
                          <button role="menuitem" className={menuBtn} onClick={() => router.push(`/company/candidates?job=${j.id}`)}>
                            <Icon name="users" size={13} style={{ marginRight: 8 }} /> {t(lang, "View Applicants")}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Toast msg={toast} />
    </>
  );
}
