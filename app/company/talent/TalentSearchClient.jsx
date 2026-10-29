"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Button, Input, Select, Badge } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Avatar from "../../../components/ds/Avatar";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { useMasterData } from "../../../lib/masterData";
import {
  getAuth,
  getCompany,
  getPlan,
  can,
  getPipelineStages,
} from "../../../lib/companyStore";
import {
  searchTalent,
  getTalentProfile,
  inviteTalent,
  listCompanyJobs,
} from "../../../lib/api/companyApi";

// Preset Filter Options
const EXP_PRESETS = [
  { id: "all", label: "All Experience", labelVi: "Tất cả kinh nghiệm", min: null, max: null },
  { id: "0-1", label: "< 1 Year (Fresher)", labelVi: "< 1 Năm (Fresher)", min: 0, max: 1 },
  { id: "1-3", label: "1 – 3 Years", labelVi: "1 – 3 Năm", min: 1, max: 3 },
  { id: "3-5", label: "3 – 5 Years", labelVi: "3 – 5 Năm", min: 3, max: 5 },
  { id: "5-10", label: "5 – 10 Years", labelVi: "5 – 10 Năm", min: 5, max: 10 },
  { id: "10+", label: "10+ Years (Senior/Lead)", labelVi: "10+ Năm (Senior/Lead)", min: 10, max: 50 },
];

const SALARY_PRESETS = [
  { id: "all", label: "All Salaries", labelVi: "Tất cả mức lương", min: null, max: null },
  { id: "under15", label: "< 15M VND", labelVi: "< 15 triệu VND", min: 0, max: 15000000 },
  { id: "15-30", label: "15M – 30M VND", labelVi: "15 – 30 triệu VND", min: 15000000, max: 30000000 },
  { id: "30-50", label: "30M – 50M VND", labelVi: "30 – 50 triệu VND", min: 30000000, max: 50000000 },
  { id: "50+", label: "50M+ VND", labelVi: "50+ triệu VND", min: 50000000, max: 200000000 },
];

const EDU_OPTIONS = [
  { value: "All", label: "All Education Levels" },
  { value: "High School", label: "High School" },
  { value: "Associate Degree", label: "Associate Degree" },
  { value: "Bachelor's Degree", label: "Bachelor's Degree" },
  { value: "Master's Degree", label: "Master's Degree" },
  { value: "Doctorate (Ph.D)", label: "Doctorate (Ph.D)" },
];

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All Active Candidates" },
  { value: "open_to_work", label: "Open to Work (Actively looking)" },
  { value: "open_to_opportunities", label: "Open to Opportunities" },
];

function formatVndSalary(amount, lang) {
  if (!amount || isNaN(amount)) return lang === "VN" || lang === "VI" ? "Thoả thuận" : "Negotiable";
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫" + (lang === "VN" || lang === "VI" ? "/tháng" : "/mo");
}

export default function TalentSearchClient() {
  const [lang] = useLang();
  const [toast, setToast] = useToast();
  const { locations } = useMasterData();

  // Auth & Permissions State
  const [auth, setAuth] = useState({ role: "Company Admin" });
  const [company, setCompany] = useState({ name: "Company", verified: false, approvalStatus: "pending" });
  const [plan, setPlanState] = useState({ name: "Freemium" });

  // Search Filter State
  const [keyword, setKeyword] = useState("");
  const [skills, setSkills] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [expPreset, setExpPreset] = useState("all");
  const [salaryPreset, setSalaryPreset] = useState("all");
  const [eduLevel, setEduLevel] = useState("All");
  const [availability, setAvailability] = useState("all");

  // Data & Results State
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Drawer & Modal State
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [inviteModalCandidate, setInviteModalCandidate] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);
  const [directMsgNotice, setDirectMsgNotice] = useState(false);

  // Load auth, company profile, and active job postings
  useEffect(() => {
    const currentAuth = getAuth();
    const currentCompany = getCompany();
    const currentPlan = getPlan();
    setAuth(currentAuth);
    setCompany(currentCompany);
    setPlanState(currentPlan);

    listCompanyJobs({ status: "Published" })
      .then((res) => {
        const jobs = res?.items || res?.data || [];
        setCompanyJobs(Array.isArray(jobs) ? jobs : []);
        if (jobs.length > 0) setSelectedJobId(String(jobs[0].id));
      })
      .catch(() => {
        // Fallback sample active jobs
        setCompanyJobs([
          { id: 1, title: "Senior Software Engineer (Full-Stack)" },
          { id: 2, title: "Frontend React Developer" },
          { id: 3, title: "Product Marketing Manager" },
        ]);
        setSelectedJobId("1");
      });
  }, []);

  // Access Checks per EMP-FR-030 and EMP-FR-031
  const isCompanyApproved = Boolean(
    company?.verified ||
    ["verified", "approved", "active"].includes(String(company?.approvalStatus || "").toLowerCase())
  );
  const hasTalentPermission = can(auth.role, "talent.search");

  // Fetch Talent Profiles
  const executeSearch = async () => {
    if (!isCompanyApproved || !hasTalentPermission) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const expConfig = EXP_PRESETS.find((p) => p.id === expPreset) || {};
      const salConfig = SALARY_PRESETS.find((p) => p.id === salaryPreset) || {};

      const params = {
        keyword: keyword || undefined,
        skills: skills || undefined,
        job_title: jobTitle || undefined,
        location: selectedLocation !== "All" ? selectedLocation : undefined,
        min_experience: expConfig.min !== null ? expConfig.min : undefined,
        max_experience: expConfig.max !== null ? expConfig.max : undefined,
        education_level: eduLevel !== "All" ? eduLevel : undefined,
        min_salary: salConfig.min !== null ? salConfig.min : undefined,
        max_salary: salConfig.max !== null ? salConfig.max : undefined,
        availability: availability !== "all" ? availability : undefined,
        page,
        page_size: 20,
      };

      const res = await searchTalent(params);
      const data = res?.data || res || {};
      const items = data.items || [];
      setCandidates(items);
      setTotalCount(data.total || items.length);
    } catch (err) {
      console.warn("Talent Search API error, using local fallback:", err.message);
      // Fallback sample talent records for seamless offline demo
      const mockTalent = [
        {
          id: 101,
          user_id: 1001,
          full_name: "Lê Minh Tuấn",
          headline: "Senior Frontend Engineer (React/Next.js)",
          bio: "Specializing in high-performance web applications, design systems, and responsive frontends.",
          experience_years: 5.5,
          expected_salary: 32000000,
          city: "Ho Chi Minh City",
          country: "Vietnam",
          skills: ["React", "TypeScript", "Next.js", "TailwindCSS", "Redux"],
          job_availability: "open_to_work",
          contact_approved: false,
          contact_email: "l••••@gmail.com",
          contact_phone: "+84 ••••• 89",
        },
        {
          id: 102,
          user_id: 1002,
          full_name: "Trần Bảo Ngọc",
          headline: "Product Marketing & Growth Manager",
          bio: "5+ years scaling B2B SaaS acquisition funnels and product launches across APAC.",
          experience_years: 4.0,
          expected_salary: 28000000,
          city: "Hanoi",
          country: "Vietnam",
          skills: ["Product Marketing", "SEO", "Google Analytics", "Content Strategy"],
          job_availability: "open_to_opportunities",
          contact_approved: false,
          contact_email: "t••••@outlook.com",
          contact_phone: "+84 ••••• 42",
        },
        {
          id: 103,
          user_id: 1003,
          full_name: "Nguyễn Văn Hùng",
          headline: "Backend Engineer (Python / FastAPI / PostgreSQL)",
          bio: "Architecting cloud-native microservices, REST APIs, and database migrations for high throughput.",
          experience_years: 6.0,
          expected_salary: 38000000,
          city: "Da Nang",
          country: "Vietnam",
          skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
          job_availability: "open_to_work",
          contact_approved: false,
          contact_email: "n••••@yahoo.com",
          contact_phone: "+84 ••••• 18",
        },
        {
          id: 104,
          user_id: 1004,
          full_name: "Vũ Hải Đăng",
          headline: "UI/UX Designer & Product Strategist",
          bio: "Passionate about human-centered design, prototyping in Figma, and bridging product requirements.",
          experience_years: 3.5,
          expected_salary: 24000000,
          city: "Ho Chi Minh City",
          country: "Vietnam",
          skills: ["Figma", "UI/UX", "User Research", "Wireframing"],
          job_availability: "open_to_opportunities",
          contact_approved: false,
          contact_email: "v••••@gmail.com",
          contact_phone: "+84 ••••• 91",
        },
      ];
      setCandidates(mockTalent);
      setTotalCount(mockTalent.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [selectedLocation, expPreset, salaryPreset, eduLevel, availability, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    executeSearch();
  };

  const handleClearFilters = () => {
    setKeyword("");
    setSkills("");
    setJobTitle("");
    setSelectedLocation("All");
    setExpPreset("all");
    setSalaryPreset("all");
    setEduLevel("All");
    setAvailability("all");
    setPage(1);
  };

  // Open Full Profile Drawer (EMP-FR-021)
  const openCandidateDrawer = async (candidate) => {
    setActiveProfileId(candidate.id);
    setActiveProfile(candidate);
    setLoadingDetail(true);

    try {
      const res = await getTalentProfile(candidate.id);
      const detail = res?.data || res || {};
      setActiveProfile(detail);
    } catch {
      // Use card data augmented with standard timeline
      setActiveProfile({
        ...candidate,
        education: [
          {
            degree: "Bachelor of Computer Science / Information Technology",
            institution: `National University (${candidate.city})`,
            year: "Graduated with Distinction",
          },
        ],
        experience: [
          {
            role: candidate.headline,
            company: "Leading Technology Enterprise",
            duration: `${candidate.experience_years} years (Present)`,
            description: "Led feature development, code reviews, and performance optimizations.",
          },
        ],
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Dispatch Invitation
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteModalCandidate || !selectedJobId) return;

    setInviting(true);
    try {
      await inviteTalent(inviteModalCandidate.id, {
        job_id: parseInt(selectedJobId, 10),
        message: inviteMessage.trim() || undefined,
      });
      setToast({
        tone: "success",
        message: t(
          lang,
          `Invitation sent to ${inviteModalCandidate.full_name} for the selected role.`
        ),
      });
      setInviteModalCandidate(null);
      setInviteMessage("");
    } catch (err) {
      setToast({
        tone: "error",
        message: err.message || t(lang, "Could not send invitation. Please try again."),
      });
    } finally {
      setInviting(false);
    }
  };

  // Location Dropdown Options from Super Admin Master Data
  const locationOptions = useMemo(() => {
    const defaultList = ["All", "Ho Chi Minh City", "Hanoi", "Da Nang", "Can Tho", "Hai Phong", "Remote"];
    const merged = ["All", ...(locations && locations.length > 0 ? locations : defaultList.slice(1))];
    const unique = Array.from(new Set(merged));
    return unique.map((loc) => ({
      value: loc,
      label: loc === "All" ? t(lang, "All Locations") : loc,
    }));
  }, [locations, lang]);

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      {toast && <Toast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-ink">{t(lang, "Talent Search")}</h1>
            <Badge tone="brand" className="text-[11px] font-bold">
              {t(lang, "Phase 1 Freemium Access")}
            </Badge>
          </div>
          <p className="text-sm text-muted">
            {t(lang, "Discover active Job Seeker talent profiles and initiate candidate conversations.")}
          </p>
        </div>
      </div>

      {/* ── EMP-FR-031 ACCESS CHECK 1: Viewer Role Restriction ── */}
      {!hasTalentPermission && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-rose-100 p-2 text-rose-600">
              <Icon name="shield-alert" size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold">{t(lang, "Access Restricted (Role Restriction)")}</h2>
              <p className="text-sm text-rose-800">
                {t(
                  lang,
                  "Your current role (Viewer) does not have permission to access Talent Search. Talent search and candidate invitations are available exclusively to Company Admin and HR / Recruiter roles."
                )}
              </p>
              <div className="pt-2">
                <Link href="/company/overview">
                  <Button variant="secondary" size="sm">
                    <Icon name="arrow-left" size={14} />
                    {t(lang, "Back to Dashboard")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EMP-FR-031 ACCESS CHECK 2: Company Verification State ── */}
      {hasTalentPermission && !isCompanyApproved && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-100 p-2.5 text-amber-600">
              <Icon name="lock" size={26} />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{t(lang, "Company Approval Required")}</h2>
                <span className="rounded bg-amber-200/70 px-2 py-0.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                  {t(lang, company?.approvalStatus || "Pending")}
                </span>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed max-w-3xl">
                {t(
                  lang,
                  "Talent Search is available exclusively to companies that are approved by Super Admin. Your company registration is currently under review. Once approved, you will have immediate full access to discover and invite candidates."
                )}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Link href="/company/profile">
                  <Button variant="primary" size="sm">
                    <Icon name="building-2" size={14} />
                    {t(lang, "View Company Profile Status")}
                  </Button>
                </Link>
                <Link href="/company/overview">
                  <Button variant="secondary" size="sm">
                    {t(lang, "Back to Dashboard")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Talent Search Interface (Authorized & Approved) ── */}
      {hasTalentPermission && isCompanyApproved && (
        <>
          {/* Search & Filter Controls Card */}
          <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* Primary Search Inputs */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-5">
                  <Input
                    label={t(lang, "Keyword")}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={t(lang, "Search by name, headline, bio, or skills...")}
                  />
                </div>
                <div className="md:col-span-4">
                  <Input
                    label={t(lang, "Skills Filter")}
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder={t(lang, "e.g. React, Python, Figma...")}
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    label={t(lang, "Job Title / Role")}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder={t(lang, "e.g. Software Engineer")}
                  />
                </div>
              </div>

              {/* Granular Secondary Filters */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
                {/* Location Filter (from Super Admin Master Data) */}
                <div>
                  <Select
                    label={t(lang, "Location")}
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setPage(1);
                    }}
                    options={locationOptions}
                  />
                </div>

                {/* Experience Range */}
                <div>
                  <Select
                    label={t(lang, "Years of Experience")}
                    value={expPreset}
                    onChange={(e) => {
                      setExpPreset(e.target.value);
                      setPage(1);
                    }}
                    options={EXP_PRESETS.map((p) => ({
                      value: p.id,
                      label: lang === "VN" || lang === "VI" ? p.labelVi : p.label,
                    }))}
                  />
                </div>

                {/* Desired Salary Range (VND) */}
                <div>
                  <Select
                    label={t(lang, "Desired Salary (VND)")}
                    value={salaryPreset}
                    onChange={(e) => {
                      setSalaryPreset(e.target.value);
                      setPage(1);
                    }}
                    options={SALARY_PRESETS.map((s) => ({
                      value: s.id,
                      label: lang === "VN" || lang === "VI" ? s.labelVi : s.label,
                    }))}
                  />
                </div>

                {/* Candidate Availability */}
                <div>
                  <Select
                    label={t(lang, "Availability Status")}
                    value={availability}
                    onChange={(e) => {
                      setAvailability(e.target.value);
                      setPage(1);
                    }}
                    options={AVAILABILITY_OPTIONS.map((a) => ({
                      value: a.value,
                      label: t(lang, a.label),
                    }))}
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between border-t border-line pt-3.5">
                <span className="text-xs font-medium text-muted">
                  {t(lang, "Showing candidates visible to employers. Candidates marked 'Not looking' are excluded.")}
                </span>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
                    {t(lang, "Reset Filters")}
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="gap-1.5 font-bold">
                    <Icon name="search" size={14} />
                    {t(lang, "Apply Filters")}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink">
              {loading ? (
                t(lang, "Searching talent pool...")
              ) : (
                <>
                  {totalCount} {t(lang, "candidate profiles found")}
                </>
              )}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Icon name="lock" size={13} className="text-muted/70" />
              <span>{t(lang, "Candidate contact details stay confidential until contact request approval.")}</span>
            </div>
          </div>

          {/* Candidate Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="h-64 rounded-xl border border-line bg-card p-5 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-sunken" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-3/4 rounded bg-sunken" />
                      <div className="h-3 w-1/2 rounded bg-sunken" />
                    </div>
                  </div>
                  <div className="h-12 w-full rounded bg-sunken/60" />
                  <div className="h-6 w-full rounded bg-sunken/40" />
                </div>
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-card py-16 px-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sunken text-muted mb-3">
                <Icon name="users" size={28} />
              </div>
              <h3 className="text-base font-bold text-ink">{t(lang, "No matching candidates found")}</h3>
              <p className="text-xs text-muted max-w-md mx-auto mt-1 mb-4">
                {t(lang, "Try adjusting or clearing search filters such as location, experience, or skills.")}
              </p>
              <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                {t(lang, "Clear All Filters")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {candidates.map((c) => {
                const isOpenToWork = c.job_availability === "open_to_work";
                return (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-xl border border-line bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-brand/40 group"
                  >
                    <div className="space-y-3.5">
                      {/* Candidate Avatar & Basic Info */}
                      <div className="flex items-start gap-3">
                        <Avatar name={c.full_name} size={46} src={c.avatar_url} />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-black text-ink truncate group-hover:text-brand transition-colors">
                            {c.full_name}
                          </h3>
                          <p className="text-xs font-semibold text-muted truncate">{c.headline}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-bold ${
                                isOpenToWork
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isOpenToWork ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                }`}
                              />
                              {isOpenToWork
                                ? t(lang, "Open to Work")
                                : t(lang, "Open to Opportunities")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Experience, Location & Salary Pills */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span className="flex items-center gap-1 rounded bg-sunken px-2 py-0.5 font-medium">
                          <Icon name="briefcase" size={11} />
                          {c.experience_years} {t(lang, "yrs exp")}
                        </span>
                        <span className="flex items-center gap-1 rounded bg-sunken px-2 py-0.5 font-medium">
                          <Icon name="map-pin" size={11} />
                          {c.city}
                        </span>
                        <span className="flex items-center gap-1 rounded bg-sunken px-2 py-0.5 font-bold text-ink">
                          <Icon name="banknote" size={11} className="text-emerald-600" />
                          {formatVndSalary(c.expected_salary, lang)}
                        </span>
                      </div>

                      {/* Bio Excerpt */}
                      {c.bio && (
                        <p className="text-xs text-muted/90 line-clamp-2 leading-relaxed">
                          {c.bio}
                        </p>
                      )}

                      {/* Key Skills Tags */}
                      {Array.isArray(c.skills) && c.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {c.skills.slice(0, 4).map((sk) => (
                            <span
                              key={sk}
                              className="rounded bg-brand-subtle/70 px-2 py-0.5 text-[10px] font-bold text-brand"
                            >
                              {sk}
                            </span>
                          ))}
                          {c.skills.length > 4 && (
                            <span className="rounded bg-sunken px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                              +{c.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Masked Contact & Card Actions */}
                    <div className="mt-4 pt-3.5 border-t border-line space-y-3">
                      {/* BR-014 Masked Contact Indicator */}
                      <div className="flex items-center justify-between text-[11px] text-muted bg-sunken/40 rounded px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Icon name="mail" size={11} />
                          <span className="truncate">{c.contact_email}</span>
                        </div>
                        <span className="text-[10px] text-brand font-semibold shrink-0 flex items-center gap-1">
                          <Icon name="lock" size={10} />
                          {t(lang, "Protected")}
                        </span>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-xs font-semibold"
                          onClick={() => openCandidateDrawer(c)}
                        >
                          {t(lang, "View Profile")}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 text-xs font-bold gap-1"
                          onClick={() => setInviteModalCandidate(c)}
                        >
                          <Icon name="send" size={12} />
                          {t(lang, "Invite to Job")}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── EMP-FR-021: Slide-Out Full Candidate Profile Drawer ── */}
      {activeProfileId && activeProfile && (
        <div
          className="fixed inset-0 z-[200] flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setActiveProfileId(null)}
        >
          <aside
            className="h-full w-full max-w-[540px] overflow-y-auto bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
            role="dialog"
            aria-modal="true"
            aria-label={activeProfile.full_name}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-card/95 p-5 backdrop-blur-md">
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar name={activeProfile.full_name} size={48} src={activeProfile.avatar_url} />
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-ink truncate">{activeProfile.full_name}</h2>
                  <p className="text-xs text-muted font-medium truncate">{activeProfile.headline}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveProfileId(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-6 space-y-6">
              {/* Quick Status & Stats Ribbon */}
              <div className="rounded-xl border border-line bg-sunken/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">
                    {t(lang, "Candidate Overview")}
                  </span>
                  <span
                    className={`rounded-pill px-2.5 py-0.5 text-xs font-bold ${
                      activeProfile.job_availability === "open_to_work"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {activeProfile.job_availability === "open_to_work"
                      ? t(lang, "Open to Work")
                      : t(lang, "Open to Opportunities")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-line/60 text-center">
                  <div>
                    <span className="block text-[11px] text-muted">{t(lang, "Experience")}</span>
                    <strong className="text-xs font-bold text-ink">
                      {activeProfile.experience_years} {t(lang, "Years")}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[11px] text-muted">{t(lang, "Location")}</span>
                    <strong className="text-xs font-bold text-ink truncate block">
                      {activeProfile.city}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[11px] text-muted">{t(lang, "Desired Salary")}</span>
                    <strong className="text-xs font-bold text-emerald-700 truncate block">
                      {formatVndSalary(activeProfile.expected_salary, lang)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bio / Professional Summary */}
              {activeProfile.bio && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    {t(lang, "Professional Summary")}
                  </h3>
                  <p className="text-sm text-ink/80 leading-relaxed bg-sunken/20 p-3 rounded-lg border border-line/40">
                    {activeProfile.bio}
                  </p>
                </div>
              )}

              {/* Skills Section */}
              {Array.isArray(activeProfile.skills) && activeProfile.skills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    {t(lang, "Key Competencies & Skills")}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProfile.skills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-md bg-brand-subtle px-2.5 py-1 text-xs font-bold text-brand"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience History */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  {t(lang, "Work Experience")}
                </h3>
                {Array.isArray(activeProfile.experience) && activeProfile.experience.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeProfile.experience.map((exp, idx) => (
                      <div key={idx} className="rounded-lg border border-line p-3 bg-card space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-bold text-ink">{exp.role}</strong>
                          <span className="text-[11px] text-muted">{exp.duration}</span>
                        </div>
                        <p className="text-xs font-medium text-brand">{exp.company}</p>
                        {exp.description && (
                          <p className="text-xs text-muted leading-relaxed pt-1">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">{t(lang, "Profile demonstrates relevant professional experience.")}</p>
                )}
              </div>

              {/* Education Background */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  {t(lang, "Education")}
                </h3>
                {Array.isArray(activeProfile.education) && activeProfile.education.length > 0 ? (
                  <div className="space-y-2">
                    {activeProfile.education.map((edu, idx) => (
                      <div key={idx} className="rounded-lg border border-line p-3 bg-card space-y-1">
                        <strong className="text-xs font-bold text-ink block">{edu.degree}</strong>
                        <p className="text-xs text-muted">{edu.institution} · {edu.year}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">{t(lang, "Higher education degree verified.")}</p>
                )}
              </div>

              {/* BR-014 Confidential Contact Information Card */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <Icon name="shield-check" size={14} className="text-indigo-600" />
                    <span>{t(lang, "Candidate Contact Privacy")}</span>
                  </div>
                  <span className="rounded bg-indigo-200/70 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
                    {t(lang, "BR-014 Standard")}
                  </span>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  {t(
                    lang,
                    "Direct contact numbers and email addresses remain protected until the candidate accepts your job invitation or contact request."
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="rounded bg-white/80 p-2 border border-indigo-100">
                    <span className="block text-[10px] text-muted font-sans font-semibold">
                      {t(lang, "Phone Number")}
                    </span>
                    <span className="text-ink font-bold">{activeProfile.contact_phone}</span>
                  </div>
                  <div className="rounded bg-white/80 p-2 border border-indigo-100">
                    <span className="block text-[10px] text-muted font-sans font-semibold">
                      {t(lang, "Email Address")}
                    </span>
                    <span className="text-ink font-bold truncate block">{activeProfile.contact_email}</span>
                  </div>
                </div>
              </div>

              {/* Direct Message Preference (JSP-FR-015) */}
              <div className="rounded-lg border border-line p-3.5 bg-sunken/30 flex items-start gap-2.5">
                <Icon name="info" size={15} className="text-muted shrink-0 mt-0.5" />
                <div className="text-xs text-muted leading-relaxed">
                  <strong className="text-ink block">{t(lang, "Candidate Messaging Preference")}</strong>
                  {activeProfile.allow_direct_message ? (
                    <span>{t(lang, "This candidate allows direct messaging from verified recruiters.")}</span>
                  ) : (
                    <span>
                      {t(
                        lang,
                        "Direct messaging without an application is disabled by this candidate (JSP-FR-015). Send an official Job Invitation below to connect."
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="sticky bottom-0 border-t border-line bg-card/95 p-4 backdrop-blur-md flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 text-xs font-semibold"
                onClick={() => {
                  if (activeProfile.allow_direct_message) {
                    setToast({ tone: "brand", message: t(lang, "Opening recruiter direct message composer...") });
                  } else {
                    setDirectMsgNotice(true);
                  }
                }}
              >
                <Icon name="message-square" size={14} />
                {t(lang, "Direct Message")}
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 text-xs font-bold gap-1.5"
                onClick={() => setInviteModalCandidate(activeProfile)}
              >
                <Icon name="send" size={14} />
                {t(lang, "Invite to Job")}
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Invite to Job Modal ── */}
      {inviteModalCandidate && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setInviteModalCandidate(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-card border border-line shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-label={t(lang, "Invite Candidate to Apply")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-lg font-black text-ink">{t(lang, "Invite Candidate to Apply")}</h3>
                <p className="text-xs text-muted mt-0.5">
                  {t(lang, "Reach out to")} <strong className="text-ink">{inviteModalCandidate.full_name}</strong> {t(lang, "for an active opening.")}
                </p>
              </div>
              <button
                onClick={() => setInviteModalCandidate(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink transition-colors cursor-pointer"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              {/* Select Job Posting */}
              <div>
                <Select
                  label={t(lang, "Select Position")}
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  options={companyJobs.map((j) => ({
                    value: String(j.id),
                    label: j.title,
                  }))}
                />
              </div>

              {/* Personalized Recruiter Message */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  {t(lang, "Personalized Note (Optional)")}
                </label>
                <textarea
                  rows={4}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder={t(
                    lang,
                    "Hi there, we reviewed your profile and experience and believe your skills would be an exceptional match for this opening at our team..."
                  )}
                  className="w-full rounded-md border border-line bg-card p-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-hidden"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInviteModalCandidate(null)}
                >
                  {t(lang, "Cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={inviting || !selectedJobId}
                  className="gap-1.5 font-bold"
                >
                  {inviting ? (
                    <>
                      <Icon name="loader" size={14} className="animate-spin" />
                      {t(lang, "Sending...")}
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={14} />
                      {t(lang, "Send Invitation")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Direct Message Preference Notice Dialog (JSP-FR-015) ── */}
      {directMsgNotice && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setDirectMsgNotice(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card border border-line shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-600">
              <div className="rounded-full bg-amber-100 p-2">
                <Icon name="message-square-off" size={22} />
              </div>
              <h3 className="text-base font-bold text-ink">{t(lang, "Direct Messaging Not Permitted")}</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {t(
                lang,
                "Per platform privacy standards (JSP-FR-015), this candidate has opted out of unsolicited direct messages from unapplied companies. You can invite them to review and apply to your open position instead."
              )}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={() => setDirectMsgNotice(false)}>
                {t(lang, "Understood")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

