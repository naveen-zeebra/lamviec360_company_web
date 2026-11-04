"use client";

import React, { useMemo, useState } from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import Input from "../../../../components/ds/Input";
import StatusBadge from "../../../../components/company/StatusBadge";
import { tr } from "../../../../utils/lang";

export default function CandidatesJobsOverview({
  jobs = [],
  allCandidates = [],
  onSelectJob,
  lang = "EN",
  t = (l, k) => k,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [sortBy, setSortBy] = useState("applicants"); // 'applicants' | 'newest' | 'oldest' | 'title'

  // Pre-calculate per-job candidate stats
  const jobMetricsMap = useMemo(() => {
    const map = {};
    jobs.forEach((job) => {
      const cands = allCandidates.filter((c) => String(c.jobId) === String(job.id));
      const total = job.applicantCount !== undefined && job.applicantCount !== null
        ? Math.max(Number(job.applicantCount) || 0, cands.length)
        : cands.length;
      const applied = cands.filter((c) => !c.stage || c.stage.toLowerCase() === "applied").length;
      const inReview = cands.filter((c) =>
        ["screening", "phone screening", "shortlisted", "interview scheduled", "interviewing"].includes((c.stage || "").toLowerCase())
      ).length;
      const hired = cands.filter((c) => (c.stage || "").toLowerCase() === "hired").length;
      map[job.id] = { total, applied, inReview, hired };
    });
    return map;
  }, [jobs, allCandidates]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => {
      if (j.department?.trim()) set.add(j.department.trim());
    });
    return Array.from(set).sort();
  }, [jobs]);

  // Filtered and sorted jobs list
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((j) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const titleMatch = (j.title || "").toLowerCase().includes(q);
          const deptMatch = (j.department || "").toLowerCase().includes(q);
          const locMatch = (j.location || "").toLowerCase().includes(q);
          if (!titleMatch && !deptMatch && !locMatch) return false;
        }
        // Status
        if (statusFilter !== "All") {
          if ((j.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
        }
        // Department
        if (deptFilter !== "All") {
          if ((j.department || "").trim().toLowerCase() !== deptFilter.toLowerCase()) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const metricsA = jobMetricsMap[a.id] || { total: 0 };
        const metricsB = jobMetricsMap[b.id] || { total: 0 };

        if (sortBy === "applicants") {
          return metricsB.total - metricsA.total;
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        return 0;
      });
  }, [jobs, search, statusFilter, deptFilter, sortBy, jobMetricsMap]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDeptFilter("All");
    setSortBy("applicants");
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">
          {tr(lang, "Quản lý Ứng viên theo Vị trí", "Candidate Applications by Job")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {tr(
            lang,
            "Chọn một dòng công việc bên dưới để xem danh sách hồ sơ ứng tuyển của vị trí đó.",
            "Click any job row below to view and manage candidate applications for that specific role."
          )}
        </p>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-3 shadow-2xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="min-w-[220px] flex-1 max-w-md">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr(lang, "Tìm kiếm vị trí, phòng ban...", "Search job title, department...")}
              size="sm"
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-[130px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-semibold text-ink shadow-xs focus:border-brand focus:outline-none cursor-pointer"
            >
              <option value="All">{tr(lang, "Tất cả trạng thái", "All Statuses")}</option>
              <option value="Published">{t(lang, "Published")}</option>
              <option value="Draft">{t(lang, "Draft")}</option>
              <option value="Paused">{t(lang, "Paused")}</option>
              <option value="Closed">{t(lang, "Closed")}</option>
            </select>
          </div>

          {/* Department Filter */}
          {departments.length > 0 && (
            <div className="min-w-[140px]">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-semibold text-ink shadow-xs focus:border-brand focus:outline-none cursor-pointer"
              >
                <option value="All">{tr(lang, "Tất cả phòng ban", "All Departments")}</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="min-w-[150px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-semibold text-ink shadow-xs focus:border-brand focus:outline-none cursor-pointer"
            >
              <option value="applicants">{tr(lang, "Nhiều ứng viên nhất", "Most Applicants")}</option>
              <option value="newest">{tr(lang, "Mới nhất", "Newest First")}</option>
              <option value="oldest">{tr(lang, "Cũ nhất", "Oldest First")}</option>
              <option value="title">{tr(lang, "Tên công việc (A-Z)", "Job Title (A-Z)")}</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-muted pl-2">
          {filteredJobs.length} {filteredJobs.length === 1 ? tr(lang, "vị trí", "job") : tr(lang, "vị trí", "jobs")}
        </div>
      </div>

      {/* ── Row-Based Jobs Listing ── */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-card px-6 py-14 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-muted mb-3">
            <Icon name="briefcase" size={22} />
          </div>
          <h3 className="text-sm font-bold text-ink">
            {jobs.length === 0
              ? tr(lang, "Chưa có tin tuyển dụng nào", "No job postings yet")
              : tr(lang, "Không tìm thấy vị trí phù hợp", "No jobs match your search or filter")}
          </h3>
          <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
            {jobs.length === 0
              ? tr(
                  lang,
                  "Tạo tin tuyển dụng đầu tiên để bắt đầu nhận hồ sơ ứng viên.",
                  "Create your first job posting to start receiving qualified applicant resumes."
                )
              : tr(
                  lang,
                  "Thử điều chỉnh từ khóa tìm kiếm hoặc đặt lại các bộ lọc.",
                  "Try adjusting your search terms or clearing your status/department filters."
                )}
          </p>
          {jobs.length > 0 && (
            <div className="mt-4 flex items-center justify-center">
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                <Icon name="rotate-ccw" size={13} />
                <span>{tr(lang, "Đặt lại bộ lọc", "Reset Filters")}</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs divide-y divide-line">
          {filteredJobs.map((job) => {
            const metrics = jobMetricsMap[job.id] || { total: 0, applied: 0, inReview: 0, hired: 0 };

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-brand/5 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-brand"
                title={tr(lang, "Nhấn để xem ứng viên của vị trí này", "Click to view applications for this job")}
              >
                {/* Left: Job Title & Clean Metadata */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-ink group-hover:text-brand transition-colors">
                      {job.title}
                    </span>
                    {job.aiGenerated && (
                      <span className="inline-flex items-center gap-1 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                        <Icon name="sparkles" size={9} /> AI
                      </span>
                    )}
                  </div>

                  {/* Subtitle Meta */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                    {job.department && <span className="font-semibold text-slate-700">{job.department}</span>}
                    {job.location && (
                      <>
                        <span>•</span>
                        <span>📍 {job.location}</span>
                      </>
                    )}
                    {job.type && (
                      <>
                        <span>•</span>
                        <span>{job.type}</span>
                      </>
                    )}
                    {job.createdAt && (
                      <>
                        <span>•</span>
                        <span>{tr(lang, "Đăng:", "Posted:")} {job.createdAt}</span>
                      </>
                    )}
                    {job.deadline && (
                      <>
                        <span>•</span>
                        <span>{tr(lang, "Hạn:", "Deadline:")} {job.deadline}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Status, Applicant Count & Sleek Chevron */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <StatusBadge kind="job" value={job.status || "Published"} lang={lang} />

                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-black text-brand shadow-2xs">
                    <Icon name="users" size={13} />
                    <span>{metrics.total}</span>
                    <span className="text-[10px] font-bold uppercase">{tr(lang, "hồ sơ", "apps")}</span>
                  </div>

                  <Icon
                    name="chevron-right"
                    size={18}
                    className="text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition-transform ml-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
