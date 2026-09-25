"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "../ds/Icon";
import { LANGS, useLang, t } from "../../utils/lang";
import { getAuth, getCompany, logout } from "../../lib/companyStore";
import { SEEKER_URL } from "../../lib/api/client";

/* ─── Underline hover style matching seeker navbar ───────────────────── */
const NAV_LINK_BASE =
  "relative px-1 py-0.5 text-sm font-semibold text-gray-700 transition-colors duration-150 " +
  "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:rounded-full " +
  "after:bg-blue-500 after:transition-all after:duration-200 " +
  "hover:text-blue-600 hover:after:w-full";
const NAV_LINK_ACTIVE =
  "relative px-1 py-0.5 text-sm font-semibold text-blue-600 " +
  "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-blue-500";

export default function Header({ lang: propLang, setLang: propSetLang, app = "employer" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hookLang, hookSetLang] = useLang();
  const lang = propLang || hookLang || "EN";
  const setLang = propSetLang || hookSetLang;

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [auth, setAuth] = useState({ loggedIn: false });
  const [company, setCompany] = useState(null);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState({ solutions: false, resources: false });

  const dropdownTimeoutRef = useRef(null);

  const handleMouseEnter = (key) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(key);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 160);
  };

  const toggleDropdown = (key) =>
    setActiveDropdown((curr) => (curr === key ? null : key));

  const closeAll = () => {
    setActiveDropdown(null);
    setMobileOpen(false);
  };

  const refreshData = () => {
    setAuth(getAuth());
    setCompany(getCompany());
  };

  useEffect(() => {
    setMounted(true);
    refreshData();

    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("lv360-store", refreshData);
    document.addEventListener("visibilitychange", refreshData);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("lv360-store", refreshData);
      document.removeEventListener("visibilitychange", refreshData);
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    closeAll();
  }, [pathname]);

  const isVi = lang === "VN" || lang === "VI";

  const companyName = company?.name || auth?.company_name || auth?.name || "Company";
  const initials = companyName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "CP";

  const handleLogout = () => {
    logout();
    setAuth({ loggedIn: false });
    closeAll();
    router.push("/employer-login");
  };

  /* ── helper: dropdown menu wrapper ─────────────────────────────── */
  const DropMenu = ({ menuKey, className = "left-0 min-w-[280px]", children }) =>
    activeDropdown === menuKey ? (
      <div
        className={`absolute top-full z-50 mt-2 rounded-2xl border border-gray-200/80 bg-white p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.10)] animate-in fade-in slide-in-from-top-2 duration-150 ${className}`}
        role="menu"
      >
        {children}
      </div>
    ) : null;

  /* ── helper: a single dropdown link ────────────────────────────── */
  const DropLink = ({ href, icon, children, description }) => (
    <Link
      href={href}
      onClick={closeAll}
      className="group flex items-start gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
    >
      {icon && (
        <span className="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-blue-600">
          <Icon name={icon} size={16} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <span className="block font-semibold text-gray-800 transition-colors group-hover:text-blue-600">
          {children}
        </span>
        {description && (
          <p className="mt-0.5 line-clamp-1 text-xs font-normal text-gray-400">
            {description}
          </p>
        )}
      </div>
    </Link>
  );

  /* ─────────────────────────────────────────────────────────────── */
  /* Language picker matching job seeker Header                     */
  /* ─────────────────────────────────────────────────────────────── */
  const LangPicker = () => (
    <div
      className="relative"
      onMouseEnter={() => handleMouseEnter("lang")}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => toggleDropdown("lang")}
        aria-expanded={activeDropdown === "lang"}
        aria-label={isVi ? "Chọn ngôn ngữ" : "Switch Language"}
        className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
      >
        <Icon name="globe" size={13} />
        <span>{lang}</span>
        <Icon name="chevron-down" size={11} />
      </button>
      {activeDropdown === "lang" && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[140px] rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.09)]"
          role="listbox"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code);
                closeAll();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-colors ${
                lang === l.code
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{l.label}</span>
              {lang === l.code && <Icon name="check" size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <header
      className={`sticky top-0 z-[100] w-full border-b transition-all duration-200 ${
        scrolled
          ? "border-gray-200/90 bg-white/95 backdrop-blur-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          : "border-gray-200/70 bg-white/90 backdrop-blur-[6px] shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
      }`}
    >
      <div className="mx-auto flex h-[66px] max-w-[1280px] items-center justify-between px-4 sm:px-6">

        {/* ── LEFT: Logo + Public Nav ──────────────────────────── */}
        <div className="flex items-center gap-7">
          {/* Logo & Employer Brand Badge */}
          <Link
            href="/employers"
            className="flex shrink-0 items-center gap-2.5 no-underline"
            aria-label="LàmViệc360 — For Employers"
          >
            <img
              src="/logo-cropped.png"
              alt="LàmViệc360"
              className="block h-[26px] w-auto transition-transform hover:scale-[1.03]"
            />
            <span className="hidden rounded-md border border-blue-200/80 bg-blue-50/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 sm:inline-block">
              {isVi ? "Doanh Nghiệp" : "Employer"}
            </span>
          </Link>

          {/* Desktop Public Navigation */}
          <nav
            className="hidden items-center gap-5 md:flex"
            aria-label={t(lang, "Main navigation")}
          >
            {/* Home */}
            <Link
              href="/employers"
              className={pathname === "/employers" || pathname === "/" ? NAV_LINK_ACTIVE : NAV_LINK_BASE}
            >
              {isVi ? "Trang chủ" : "Home"}
            </Link>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("solutions")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => toggleDropdown("solutions")}
                className={`flex items-center gap-1 ${
                  activeDropdown === "solutions" ? "text-blue-600" : NAV_LINK_BASE
                }`}
                aria-expanded={activeDropdown === "solutions"}
              >
                <span>{isVi ? "Giải pháp" : "Solutions"}</span>
                <Icon
                  name="chevron-down"
                  size={12}
                  style={{
                    transform: activeDropdown === "solutions" ? "rotate(180deg)" : "none",
                    transition: "transform 0.18s ease",
                  }}
                />
              </button>

              <DropMenu menuKey="solutions" className="left-0 w-[300px]">
                <DropLink
                  href="/employers#solutions"
                  icon="file-plus"
                  description={isVi ? "Đăng tin thông minh có hỗ trợ AI" : "Publish postings with AI assist"}
                >
                  {isVi ? "Đăng tin tuyển dụng" : "Job Posting"}
                </DropLink>
                <DropLink
                  href="/employers#discovery"
                  icon="search"
                  description={isVi ? "Tìm kiếm ứng viên theo kỹ năng" : "Filter talent by skills & seniority"}
                >
                  {isVi ? "Tìm kiếm ứng viên" : "Candidate Discovery"}
                </DropLink>
                <DropLink
                  href="/employers#pipeline"
                  icon="list-checks"
                  description={isVi ? "Quy trình ATS theo từng giai đoạn" : "Multi-stage pipeline tracking"}
                >
                  {isVi ? "Hệ thống ATS" : "Applicant Tracking"}
                </DropLink>
                <DropLink
                  href="/employers#benefits"
                  icon="bar-chart-3"
                  description={isVi ? "Báo cáo tuyển dụng & tối ưu" : "Time-to-hire & conversion reports"}
                >
                  {isVi ? "Báo cáo & Phân tích" : "Hiring Analytics"}
                </DropLink>
              </DropMenu>
            </div>

            {/* Pricing */}
            <Link
              href="/employers#pricing"
              className={pathname === "/pricing" ? NAV_LINK_ACTIVE : NAV_LINK_BASE}
            >
              {isVi ? "Bảng giá" : "Pricing"}
            </Link>

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("resources")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => toggleDropdown("resources")}
                className={`flex items-center gap-1 ${
                  activeDropdown === "resources" ? "text-blue-600" : NAV_LINK_BASE
                }`}
                aria-expanded={activeDropdown === "resources"}
              >
                <span>{isVi ? "Tài nguyên" : "Resources"}</span>
                <Icon
                  name="chevron-down"
                  size={12}
                  style={{
                    transform: activeDropdown === "resources" ? "rotate(180deg)" : "none",
                    transition: "transform 0.18s ease",
                  }}
                />
              </button>

              <DropMenu menuKey="resources" className="left-0 w-[280px]">
                <DropLink
                  href="/employer-resources"
                  icon="book-open"
                  description={isVi ? "Cẩm nang tuyển dụng & biểu mẫu" : "Best practices & templates"}
                >
                  {isVi ? "Cẩm nang tuyển dụng" : "Employer Guides"}
                </DropLink>
                <DropLink
                  href="/employer-resources#templates"
                  icon="file-text"
                  description={isVi ? "Mẫu mô tả công việc chuẩn" : "Job description templates"}
                >
                  {isVi ? "Mẫu mô tả công việc" : "JD Templates"}
                </DropLink>
                <DropLink
                  href="/employer-resources#faq"
                  icon="help-circle"
                  description={isVi ? "Giải đáp thắc mắc thường gặp" : "Frequently asked questions"}
                >
                  {isVi ? "Hỏi đáp & Trợ giúp" : "FAQ & Support"}
                </DropLink>
              </DropMenu>
            </div>
          </nav>
        </div>

        {/* ── RIGHT: For Job Seekers + Language + Auth controls ── */}
        <div className="flex items-center gap-3">

          {/* For Job Seekers — pill button pointing to Seeker Portal */}
          <a
            href={SEEKER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 lg:inline-flex"
            title={isVi ? "Chuyển sang cổng Ứng viên / Tìm việc" : "Switch to Job Seeker Portal"}
          >
            <span>{isVi ? "Dành cho Người tìm việc" : "For Job Seekers"}</span>
            <Icon name="external-link" size={12} style={{ color: "#2563eb" }} />
          </a>

          {/* Language picker */}
          <div className="hidden sm:block">
            <LangPicker />
          </div>

          <div className="hidden h-5 w-px bg-gray-200 sm:block" />

          {/* Auth controls */}
          {mounted && auth?.loggedIn ? (
            <div className="flex items-center gap-2.5">
              {/* Go to Sidebar Workspace */}
              <Link
                href="/company/overview"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-600 bg-blue-50/70 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-600 hover:text-white"
              >
                <span>{isVi ? "Vào không gian làm việc" : "Go to Workspace"}</span>
                <Icon name="arrow-right" size={13} />
              </Link>

              {/* User / Company pill */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("profile")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown("profile")}
                  aria-expanded={activeDropdown === "profile"}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pr-2.5 transition hover:border-blue-400 hover:shadow-sm"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-bold text-white">
                    {initials}
                  </span>
                  <span className="hidden max-w-[110px] truncate text-xs font-semibold text-gray-800 sm:inline-block">
                    {companyName}
                  </span>
                  <Icon
                    name="chevron-down"
                    size={12}
                    style={{
                      transform: activeDropdown === "profile" ? "rotate(180deg)" : "none",
                      transition: "transform 0.18s ease",
                      color: "#64748b",
                    }}
                  />
                </button>

                {/* Profile menu */}
                {activeDropdown === "profile" && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-[240px] rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_20px_48px_rgba(0,0,0,0.13)] animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                  >
                    <div className="border-b border-gray-100 pb-2">
                      <div className="truncate text-sm font-bold text-gray-900">{companyName}</div>
                      <div className="truncate text-xs text-gray-500">{auth?.email}</div>
                    </div>

                    <div className="mt-2 flex flex-col gap-1">
                      <Link
                        href="/company/overview"
                        onClick={closeAll}
                        className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Icon name="layout-dashboard" size={14} />
                        <span>{isVi ? "Bảng tin tuyển dụng" : "Workspace Overview"}</span>
                      </Link>
                      <Link
                        href="/company/settings"
                        onClick={closeAll}
                        className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Icon name="settings" size={14} />
                        <span>{isVi ? "Cài đặt doanh nghiệp" : "Company Settings"}</span>
                      </Link>
                    </div>

                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Icon name="log-out" size={14} />
                        <span>{isVi ? "Đăng xuất" : "Sign Out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged‑out CTA Buttons */
            <div className="flex items-center gap-2.5">
              <Link
                href="/employer-login"
                className="hidden whitespace-nowrap rounded-full border border-blue-600 px-4 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50/80 sm:inline-block"
              >
                {isVi ? "Đăng nhập" : "Login"}
              </Link>
              <Link
                href="/company-register"
                className="whitespace-nowrap rounded-full bg-[#f05537] px-4 py-1.5 text-sm font-bold text-white shadow-[0_2px_8px_rgba(240,85,55,0.26)] transition hover:bg-[#d94428] hover:shadow-[0_4px_14px_rgba(240,85,55,0.36)]"
              >
                {isVi ? "Đăng tuyển ngay" : "Start Hiring"}
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Toggle Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Icon name={mobileOpen ? "x" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="max-h-[calc(100vh-66px)] overflow-y-auto border-t border-gray-200 bg-white px-5 pb-8 pt-4 shadow-xl md:hidden animate-in fade-in duration-150">

          {/* If Logged In, Go To Workspace Action */}
          {mounted && auth?.loggedIn && (
            <div className="mb-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/70 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-gray-900">{companyName}</div>
                  <div className="truncate text-xs text-gray-500">{auth?.email}</div>
                </div>
              </div>
              <Link
                href="/company/overview"
                onClick={closeAll}
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-center text-sm font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <span>{isVi ? "Vào không gian làm việc" : "Go to Workspace"}</span>
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          )}

          {/* Switch to Job Seeker Portal banner */}
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/80 p-3">
            <div className="text-xs font-semibold text-blue-900">
              {isVi ? "Bạn đang tìm việc làm?" : "Looking for your next career move?"}
            </div>
            <a
              href={SEEKER_URL}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{isVi ? "Vào cổng Người tìm việc" : "Go to Job Seeker Portal"}</span>
              <Icon name="external-link" size={13} />
            </a>
          </div>

          {/* Public Navigation Accordions */}
          <div className="flex flex-col border-b border-gray-100 pb-3">
            {/* Home */}
            <Link
              href="/employers"
              onClick={closeAll}
              className="py-2.5 text-base font-bold text-gray-800 hover:text-blue-600"
            >
              {isVi ? "Trang chủ" : "Home"}
            </Link>

            {/* Solutions accordion */}
            <div className="border-t border-gray-100 py-2.5">
              <button
                type="button"
                className="flex w-full items-center justify-between py-1.5 text-base font-bold text-gray-800"
                onClick={() =>
                  setMobileAccordion((s) => ({ ...s, solutions: !s.solutions }))
                }
              >
                <span>{isVi ? "Giải pháp tuyển dụng" : "Solutions"}</span>
                <Icon
                  name="chevron-down"
                  size={16}
                  style={{
                    transform: mobileAccordion.solutions ? "rotate(180deg)" : "none",
                    transition: "transform 0.18s ease",
                  }}
                />
              </button>
              {mobileAccordion.solutions && (
                <div className="flex flex-col gap-1 pl-3 pt-2 text-sm text-gray-600">
                  {[
                    ["/employers#solutions", isVi ? "Đăng tin tuyển dụng" : "Job Posting"],
                    ["/employers#discovery", isVi ? "Tìm kiếm ứng viên" : "Candidate Discovery"],
                    ["/employers#pipeline", isVi ? "Quản lý tuyển dụng (ATS)" : "Applicant Tracking (ATS)"],
                    ["/employers#benefits", isVi ? "Báo cáo tuyển dụng" : "Hiring Analytics"],
                  ].map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={closeAll}
                      className="rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-blue-600"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing */}
            <Link
              href="/employers#pricing"
              onClick={closeAll}
              className="border-t border-gray-100 py-2.5 text-base font-bold text-gray-800 hover:text-blue-600"
            >
              {isVi ? "Bảng giá" : "Pricing"}
            </Link>

            {/* Resources accordion */}
            <div className="border-t border-gray-100 py-2.5">
              <button
                type="button"
                className="flex w-full items-center justify-between py-1.5 text-base font-bold text-gray-800"
                onClick={() =>
                  setMobileAccordion((s) => ({ ...s, resources: !s.resources }))
                }
              >
                <span>{isVi ? "Tài nguyên" : "Resources"}</span>
                <Icon
                  name="chevron-down"
                  size={16}
                  style={{
                    transform: mobileAccordion.resources ? "rotate(180deg)" : "none",
                    transition: "transform 0.18s ease",
                  }}
                />
              </button>
              {mobileAccordion.resources && (
                <div className="flex flex-col gap-1 pl-3 pt-2 text-sm text-gray-600">
                  {[
                    ["/employer-resources", isVi ? "Cẩm nang tuyển dụng" : "Employer Guides"],
                    ["/employer-resources#templates", isVi ? "Mẫu mô tả công việc" : "JD Templates"],
                    ["/employer-resources#faq", isVi ? "Hỏi đáp & Trợ giúp" : "FAQ & Support"],
                  ].map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={closeAll}
                      className="rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-blue-600"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Language Switcher */}
          <div className="mt-4 flex items-center justify-between py-2 text-xs font-semibold text-gray-600">
            <span className="flex items-center gap-1.5">
              <Icon name="globe" size={13} />
              {isVi ? "Ngôn ngữ" : "Language"}
            </span>
            <div className="flex gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    lang === l.code
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auth Actions */}
          <div className="mt-5 flex flex-col gap-2.5">
            {mounted && auth?.loggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-center text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                {isVi ? "Đăng xuất" : "Sign Out"}
              </button>
            ) : (
              <>
                <Link
                  href="/company-register"
                  onClick={closeAll}
                  className="w-full rounded-xl bg-[#f05537] py-2.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#d94428]"
                >
                  {isVi ? "Đăng ký tuyển dụng miễn phí" : "Start Hiring For Free"}
                </Link>
                <Link
                  href="/employer-login"
                  onClick={closeAll}
                  className="w-full rounded-xl border border-blue-600 py-2.5 text-center text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                >
                  {isVi ? "Đăng nhập Nhà tuyển dụng" : "Employer Login"}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
