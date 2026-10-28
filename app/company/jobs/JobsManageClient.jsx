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
  deleteJob,
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
  const [viewingJob, setViewingJob] = useState(null);
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
    try {
      await fn(id);
      setMenuFor(null);
      refresh();
      setToast(msg);
    } catch (err) {
      setToast(t(lang, err?.message || "Operation failed"));
    }
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
        <div className="overflow-visible rounded-lg border border-line bg-card shadow-xs">
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
                      <button
                        type="button"
                        onClick={() => setViewingJob(j)}
                        className="text-left font-semibold text-ink hover:text-brand hover:underline"
                      >
                        {j.title}
                      </button>
                      {j.aiGenerated && (
                        <span className={aiTag}>
                          <Icon name="sparkles" size={10} /> {t(lang, "AI JD")}
                        </span>
                      )}
                    </td>
                    <td className={td}>{j.department || "—"}</td>
                    <td className={td}>{count}</td>
                    <td className={td}>{j.deadline || "—"}</td>
                    <td className={td}>
                      <StatusBadge kind="job" value={j.status} lang={lang} />
                    </td>
                    <td className={`${td} relative text-right`}>
                      <button className={iconBtn} aria-label={t(lang, "Actions")} onClick={() => setMenuFor(menuFor === j.id ? null : j.id)}>
                        <Icon name="more-vertical" size={16} />
                      </button>
                      {menuFor === j.id && (
                        <div className="absolute right-0 top-full z-50 min-w-[170px] rounded-md border border-line bg-card p-1.5 shadow-md" role="menu">
                          <button
                            role="menuitem"
                            className={menuBtn}
                            onClick={() => {
                              setViewingJob(j);
                              setMenuFor(null);
                            }}
                          >
                            <Icon name="eye" size={13} style={{ marginRight: 8 }} /> {t(lang, "View Details")}
                          </button>
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
                          {editable && (
                            <button
                              role="menuitem"
                              className={`${menuBtn} text-danger-fg hover:text-danger-fg`}
                              onClick={() => {
                                if (window.confirm(t(lang, "Are you sure you want to delete this job posting?"))) {
                                  act(j.id, deleteJob, "Job deleted successfully");
                                }
                              }}
                            >
                              <Icon name="trash" size={13} style={{ marginRight: 8 }} /> {t(lang, "Delete Job")}
                            </button>
                          )}
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

      {viewingJob && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(21,23,27,0.5)] p-4"
          onClick={() => setViewingJob(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-[700px] overflow-y-auto rounded-xl bg-card p-6 shadow-xl border border-line"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="text-xl font-bold text-ink">{viewingJob.title}</h2>
                  <StatusBadge kind="job" value={viewingJob.status} lang={lang} />
                  {viewingJob.aiGenerated && (
                    <span className={aiTag}>
                      <Icon name="sparkles" size={10} /> {t(lang, "AI JD")}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  {viewingJob.department && (
                    <span className="flex items-center gap-1">
                      <Icon name="briefcase" size={12} /> {viewingJob.department}
                    </span>
                  )}
                  {viewingJob.location && (
                    <span className="flex items-center gap-1">
                      <Icon name="map-pin" size={12} /> {viewingJob.location}
                    </span>
                  )}
                  {viewingJob.type && (
                    <span className="flex items-center gap-1">
                      <Icon name="clock" size={12} /> {viewingJob.type}
                    </span>
                  )}
                  {(viewingJob.experience !== undefined && viewingJob.experience !== null && viewingJob.experience !== "") && (
                    <span className="flex items-center gap-1">
                      <Icon name="award" size={12} />
                      {String(viewingJob.experience).trim() === "0"
                        ? "Fresher"
                        : /^\d+$/.test(String(viewingJob.experience))
                        ? `${viewingJob.experience} yrs`
                        : viewingJob.experience}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="rounded p-1 text-muted hover:bg-sunken hover:text-ink"
                onClick={() => setViewingJob(null)}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* EMP-FR-014: Social Sharing Links for Job Detail */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-sunken/40 p-3">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Icon name="share-2" size={14} className="text-brand" /> {t(lang, "Share this job")}:
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("http://localhost:3001/job-detail/" + (viewingJob.title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + viewingJob.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-card px-2.5 py-1 text-xs font-semibold text-[#0a66c2] hover:bg-blue-50 no-underline transition-colors"
                >
                  <Icon name="linkedin" size={13} /> LinkedIn
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("http://localhost:3001/job-detail/" + (viewingJob.title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + viewingJob.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-card px-2.5 py-1 text-xs font-semibold text-[#1877f2] hover:bg-blue-50 no-underline transition-colors"
                >
                  <Icon name="facebook" size={13} /> Facebook
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const u = "http://localhost:3001/job-detail/" + (viewingJob.title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + viewingJob.id;
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(u);
                      setToast(t(lang, "Public job link copied to clipboard!"));
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink hover:bg-sunken cursor-pointer transition-colors"
                >
                  <Icon name="copy" size={13} /> {t(lang, "Copy Link")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-sunken/60 p-3 mb-5 text-xs">
              <div>
                <div className="text-muted font-medium mb-0.5">{t(lang, "Salary")}</div>
                <div className="font-semibold text-ink">{viewingJob.salary || "Negotiable"}</div>
              </div>
              <div>
                <div className="text-muted font-medium mb-0.5">{t(lang, "Positions")}</div>
                <div className="font-semibold text-ink">{viewingJob.positions || 1}</div>
              </div>
              <div>
                <div className="text-muted font-medium mb-0.5">{t(lang, "Application Deadline")}</div>
                <div className="font-semibold text-ink">{viewingJob.deadline || "—"}</div>
              </div>
              <div>
                <div className="text-muted font-medium mb-0.5">{t(lang, "Applicants")}</div>
                <div className="font-semibold text-ink">
                  {candidates.filter((c) => c.jobId === viewingJob.id).length}
                </div>
              </div>
            </div>

            {viewingJob.skills && viewingJob.skills.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  {t(lang, "Required Skills")}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingJob.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {viewingJob.documents && viewingJob.documents.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  {t(lang, "Required Documents")}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingJob.documents.map((d, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-line bg-card px-2.5 py-1 text-xs text-muted"
                    >
                      📄 {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {viewingJob.description && (
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  {t(lang, "Job Description")}
                </h4>
                <div className="rounded-lg border border-line bg-sunken/30 p-3.5 text-xs sm:text-sm text-ink whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {viewingJob.description}
                </div>
              </div>
            )}

            {viewingJob.requirements && (
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  {t(lang, "Requirements")}
                </h4>
                <div className="rounded-lg border border-line bg-sunken/30 p-3.5 text-xs sm:text-sm text-ink whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {viewingJob.requirements}
                </div>
              </div>
            )}

            {viewingJob.benefits && (
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  {t(lang, "Benefits")}
                </h4>
                <div className="rounded-lg border border-line bg-sunken/30 p-3.5 text-xs sm:text-sm text-ink whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {viewingJob.benefits}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div>
                {editable && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger-fg hover:underline"
                    onClick={() => {
                      if (window.confirm(t(lang, "Are you sure you want to delete this job posting?"))) {
                        act(viewingJob.id, deleteJob, "Job deleted successfully");
                        setViewingJob(null);
                      }
                    }}
                  >
                    <Icon name="trash" size={13} /> {t(lang, "Delete Job")}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewingJob(null)}>
                  {t(lang, "Close")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/company/candidates?job=${viewingJob.id}`)}
                >
                  <Icon name="users" size={13} /> {t(lang, "View Applicants")}
                </Button>
                {editable && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/company/jobs/${viewingJob.id}`)}
                  >
                    <Icon name="pencil" size={13} /> {t(lang, "Edit Job")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast} />
    </>
  );
}
