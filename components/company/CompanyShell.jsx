"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "../ds/Icon";
import { LANGS, useLang, t } from "../../utils/lang";
import {
  getAuth,
  getCompany,
  getPlan,
  logout,
  unreadNotificationCount,
  can,
  resolveCompanyLogoUrl,
} from "../../lib/companyStore";

const NAV = [
  { href: "/company/overview", icon: "layout-dashboard", labelKey: "Overview", perm: "overview.view" },
  { href: "/company/profile", icon: "building-2", labelKey: "Company Profile", perm: "settings.manage" },
  { href: "/company/jobs", icon: "briefcase", labelKey: "Job Management", perm: "overview.view" },
  { href: "/company/candidates", icon: "users", labelKey: "Candidate Pipeline", perm: "candidates.view" },
  {
    href: "/company/team",
    icon: "user-cog",
    labelKey: "Team Management",
    perm: "team.manage",
    children: [
      { href: "/company/team", labelKey: "Team Members", icon: "users" },
      { href: "/company/roles", labelKey: "Roles & Permissions", icon: "shield" },
    ],
  },
  { href: "/company/billing", icon: "credit-card", labelKey: "Subscription & Billing", perm: "billing.manage" },
  { href: "/company/settings", icon: "settings", labelKey: "Settings", perm: "settings.manage" },
];

const MOBILE_TABS = NAV.slice(0, 4);

const menuItem = "flex w-full items-center rounded-sm px-2.5 py-2 text-left text-sm text-ink hover:bg-brand-subtle hover:text-brand cursor-pointer";

function initialsOf(name) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function CompanyShell({ children }) {
  const [lang, setLang] = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState({ name: "", email: "", role: "Company Admin" });
  const [company, setCompany] = useState({ name: "Company", verified: false, logo: "" });
  const [plan, setPlanState] = useState({ name: "Freemium" });
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  // Sidebar Open & Close States:
  // 1. sidebarCollapsed: Desktop icon-only (72px) vs expanded (244px)
  // 2. mobileNavOpen: Mobile/tablet slide-out drawer (open / closed)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsedFlyout, setCollapsedFlyout] = useState(null);
  const isTeamActive = pathname.startsWith("/company/team") || pathname.startsWith("/company/roles");
  const [teamExpanded, setTeamExpanded] = useState(isTeamActive);

  useEffect(() => {
    if (isTeamActive) {
      setTeamExpanded(true);
    }
  }, [pathname, isTeamActive]);

  // Initialize and persist desktop sidebar collapsed preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lv360_company_sidebar_collapsed");
        if (saved === "true") setSidebarCollapsed(true);
      } catch (_) {}
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsedFlyout(null);
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("lv360_company_sidebar_collapsed", String(next));
        } catch (_) {}
      }
      return next;
    });
  };

  useEffect(() => {
    setAuth(getAuth());
    setCompany(getCompany());
    setPlanState(getPlan());
    setUnread(unreadNotificationCount());
    setLogoFailed(false);
    setMenuOpen(false);
    setMobileNavOpen(false);
    setCollapsedFlyout(null);
  }, [pathname]);

  useEffect(() => {
    const refresh = () => {
      setAuth(getAuth());
      setCompany(getCompany());
      setPlanState(getPlan());
      setUnread(unreadNotificationCount());
      setLogoFailed(false);
    };
    window.addEventListener("lv360-store", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("lv360-store", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const role = auth.role;
  const resolvedLogo = resolveCompanyLogoUrl(company?.logo);
  const showLogo = Boolean(resolvedLogo && !logoFailed);
  const visibleNav = NAV.filter((n) => can(role, n.perm));

  return (
    <div className="flex min-h-screen bg-page">
      {/* Mobile Backdrop Overlay (Active when mobile sidebar is open) */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-[115] bg-black/60 backdrop-blur-xs min-[901px]:hidden transition-opacity duration-300"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Primary Sidebar (Supports Desktop Collapse/Expand + Mobile Slide-Out Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-[120] flex flex-col overflow-y-auto overflow-x-hidden bg-inverse text-white transition-all duration-300 ease-in-out ${
          // Desktop sizing
          sidebarCollapsed ? "min-[901px]:w-[72px] min-[901px]:p-2.5 min-[901px]:pt-5" : "min-[901px]:w-[244px] min-[901px]:p-[14px] min-[901px]:pt-5"
        } ${
          // Mobile sizing & slide-out drawer
          mobileNavOpen
            ? "max-[900px]:w-[260px] max-[900px]:translate-x-0 max-[900px]:p-4 max-[900px]:shadow-2xl"
            : "max-[900px]:w-[260px] max-[900px]:-translate-x-full"
        }`}
      >
        {/* Sidebar Header: Logo & Toggle Control */}
        <div
          className={`mb-4 flex items-center ${
            sidebarCollapsed
              ? "min-[901px]:justify-center justify-between gap-2"
              : "justify-between gap-2"
          }`}
        >
          <Link
            href="/company/overview"
            className="flex items-center gap-2 overflow-hidden no-underline"
            aria-label={t(lang, "LàmViệc360 — Workspace")}
          >
            {sidebarCollapsed ? (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-white font-black text-sm tracking-tighter shadow-xs hover:opacity-90 transition-opacity"
                title={t(lang, "LàmViệc360 — Workspace")}
              >
                360
              </div>
            ) : (
              <img
                src="/logo-cropped.png"
                alt="LàmViệc360"
                className="h-6 w-auto max-w-[140px] brightness-0 invert"
              />
            )}
          </Link>

          {/* Desktop Collapse Toggle Button (Shown ONLY when sidebar is expanded to avoid crowding 72px collapsed mode) */}
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden min-[901px]:flex h-7 w-7 items-center justify-center rounded-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title={t(lang, "Collapse sidebar")}
              aria-label={t(lang, "Collapse sidebar")}
            >
              <Icon name="chevron-left" size={16} />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="flex min-[901px]:hidden h-8 w-8 items-center justify-center rounded-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label={t(lang, "Close sidebar")}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Company Info Box */}
        <div
          className={`mb-4 flex items-center rounded-md bg-white/10 transition-all ${
            sidebarCollapsed
              ? "min-[901px]:justify-center min-[901px]:p-2"
              : "gap-2.5 p-2.5"
          }`}
          title={company.name}
        >
          {showLogo ? (
            <div className="relative flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 shadow-2xs">
              <img
                src={resolvedLogo}
                alt={company.name || "Company Logo"}
                className="h-full w-full object-contain"
                onError={() => setLogoFailed(true)}
              />
            </div>
          ) : (
            <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-sm bg-blue-500 text-xs font-bold text-white">
              {initialsOf(company.name)}
            </div>
          )}
          {(!sidebarCollapsed || mobileNavOpen) && (
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-[13px]" title={company.name}>
                {company.name}
              </strong>
              <span className="flex items-center gap-[3px] text-[11px] text-white/60">
                {company.verified && (
                  <>
                    <Icon name="badge-check" size={12} /> {t(lang, "Verified")} ·{" "}
                  </>
                )}
                {t(lang, plan.name)}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col gap-1" aria-label={t(lang, "Workspace navigation")}>
          {visibleNav.map((n) => {
            const hasChildren = Array.isArray(n.children) && n.children.length > 0;
            const isChildActive = hasChildren && (pathname === "/company/team" || pathname === "/company/roles");
            const active = pathname === n.href || pathname.startsWith(n.href + "/") || isChildActive;
            const navActiveStyle = "bg-brand text-white";
            const navIdleStyle = "text-white/70 hover:bg-white/10 hover:text-white hover:no-underline";

            if (hasChildren) {
              return (
                <div key={n.href} className="relative flex flex-col">
                  <button
                    type="button"
                    title={sidebarCollapsed ? t(lang, n.labelKey) : undefined}
                    onClick={(e) => {
                      if (sidebarCollapsed && !mobileNavOpen) {
                        if (collapsedFlyout?.item?.href === n.href) {
                          setCollapsedFlyout(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setCollapsedFlyout({ item: n, top: Math.max(16, rect.top) });
                        }
                      } else {
                        setTeamExpanded((prev) => !prev);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (sidebarCollapsed && !mobileNavOpen) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setCollapsedFlyout({ item: n, top: Math.max(16, rect.top) });
                      }
                    }}
                    className={`flex items-center justify-between rounded-sm text-sm font-medium transition-colors cursor-pointer w-full text-left ${
                      sidebarCollapsed
                        ? "min-[901px]:justify-center min-[901px]:p-2.5 max-[900px]:gap-[11px] max-[900px]:px-[11px] max-[900px]:py-2.5"
                        : "gap-[11px] px-[11px] py-2.5"
                    } ${active ? navActiveStyle : navIdleStyle}`}
                    aria-expanded={sidebarCollapsed ? Boolean(collapsedFlyout) : teamExpanded}
                  >
                    <div className="flex items-center gap-[11px] min-w-0">
                      <Icon name={n.icon} size={18} />
                      {(!sidebarCollapsed || mobileNavOpen) && (
                        <span className="truncate">{t(lang, n.labelKey)}</span>
                      )}
                    </div>
                    {(!sidebarCollapsed || mobileNavOpen) && (
                      <Icon
                        name={teamExpanded ? "chevron-down" : "chevron-right"}
                        size={14}
                        className="opacity-70 transition-transform shrink-0"
                      />
                    )}
                  </button>

                  {/* Submenu for Expanded Sidebar & Mobile Drawer */}
                  {teamExpanded && (!sidebarCollapsed || mobileNavOpen) && (
                    <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-white/20 pl-2">
                      {n.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            prefetch={true}
                            onClick={() => setMobileNavOpen(false)}
                            className={`flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium transition-colors no-underline ${
                              childActive
                                ? "bg-white/25 text-white font-bold"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <Icon name={child.icon} size={14} />
                            <span>{t(lang, child.labelKey)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={n.href}
                href={n.href}
                prefetch={true}
                title={sidebarCollapsed ? t(lang, n.labelKey) : undefined}
                onMouseEnter={() => {
                  if (sidebarCollapsed) setCollapsedFlyout(null);
                }}
                className={`flex items-center rounded-sm text-sm font-medium transition-colors no-underline ${
                  sidebarCollapsed
                    ? "min-[901px]:justify-center min-[901px]:p-2.5 max-[900px]:gap-[11px] max-[900px]:px-[11px] max-[900px]:py-2.5"
                    : "gap-[11px] px-[11px] py-2.5"
                } ${active ? navActiveStyle : navIdleStyle}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setMobileNavOpen(false);
                  setCollapsedFlyout(null);
                }}
              >
                <Icon name={n.icon} size={18} />
                {(!sidebarCollapsed || mobileNavOpen) && (
                  <span className="truncate">{t(lang, n.labelKey)}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Public Site Link */}
        <div className="mt-2 border-t border-white/10 pt-2">
          <Link
            href="/employers"
            prefetch={true}
            title={sidebarCollapsed ? t(lang, "Public site") : undefined}
            className={`flex items-center rounded-sm text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors no-underline ${
              sidebarCollapsed
                ? "min-[901px]:justify-center min-[901px]:p-2.5 max-[900px]:gap-[11px] max-[900px]:px-[11px] max-[900px]:py-2.5"
                : "gap-[11px] px-[11px] py-2.5"
            }`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Icon name="arrow-left" size={18} />
            {(!sidebarCollapsed || mobileNavOpen) && <span>{t(lang, "Public site")}</span>}
          </Link>
        </div>
      </aside>

      {/* Floating Popover Submenu for Desktop Collapsed Mode (Outside <aside> to avoid overflow clipping) */}
      {sidebarCollapsed && !mobileNavOpen && collapsedFlyout && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-[190]"
            onClick={() => setCollapsedFlyout(null)}
            aria-hidden="true"
          />
          <div
            style={{ top: `${collapsedFlyout.top}px`, left: "76px" }}
            className="fixed z-[200] min-w-[210px] rounded-lg border border-slate-700/80 bg-[#0c192c] p-1.5 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150"
            role="menu"
            onMouseLeave={() => setCollapsedFlyout(null)}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                {t(lang, collapsedFlyout.item.labelKey)}
              </span>
              <button
                type="button"
                onClick={() => setCollapsedFlyout(null)}
                className="h-5 w-5 flex items-center justify-center rounded text-white/40 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
                aria-label="Close"
              >
                <Icon name="x" size={13} />
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {collapsedFlyout.item.children.map((child) => {
                const childActive = pathname === child.href;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    prefetch={true}
                    onClick={() => setCollapsedFlyout(null)}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors no-underline ${
                      childActive
                        ? "bg-brand text-white font-semibold shadow-xs"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon name={child.icon} size={15} />
                    <span>{t(lang, child.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Main Content Area (Dynamically adjusts margin on desktop) */}
      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "min-[901px]:ml-[72px]" : "min-[901px]:ml-[244px]"
        } max-[900px]:ml-0`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-[80] flex items-center gap-3 border-b border-line bg-white/95 px-6 py-3 backdrop-blur-[6px] backdrop-saturate-[180%]">
          {/* Mobile Hamburger Drawer Button */}
          <button
            type="button"
            className="hidden cursor-pointer rounded-md p-1.5 text-ink hover:bg-sunken max-[900px]:inline-flex"
            aria-label={t(lang, "Toggle sidebar")}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <Icon name={mobileNavOpen ? "x" : "menu"} size={22} />
          </button>

          {/* Desktop Sidebar Collapse / Expand Header Button */}
          <button
            type="button"
            className="hidden min-[901px]:inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-muted hover:bg-sunken hover:text-ink transition-colors"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? t(lang, "Expand sidebar") : t(lang, "Collapse sidebar")}
            aria-label={sidebarCollapsed ? t(lang, "Expand sidebar") : t(lang, "Collapse sidebar")}
          >
            <Icon name={sidebarCollapsed ? "panel-left-open" : "panel-left-close"} size={20} />
          </button>

          {/* Title Area */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-ink max-[900px]:hidden">
              {t(lang, "Company Workspace")}
            </span>
            <span className="text-sm font-bold text-ink min-[901px]:hidden">
              {company.name || t(lang, "Company Workspace")}
            </span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <button
              type="button"
              className="flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-line-brand hover:text-brand cursor-pointer transition-colors"
              onClick={() => setLang(lang === "EN" ? "VN" : "EN")}
              aria-label={t(lang, "Choose language")}
            >
              <Icon name="globe" size={14} /> {lang}
            </button>

            {/* Notifications Bell */}
            <Link
              href="/company/notifications"
              prefetch={true}
              className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-md text-ink hover:bg-brand-subtle hover:text-brand transition-colors"
              aria-label={t(lang, "Notifications") + (unread ? `, ${unread} unread` : "")}
            >
              <Icon name="bell" size={20} />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-pill bg-danger px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            {/* User Profile Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-0 flex items-center"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {showLogo ? (
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-white p-0.5 shadow-2xs hover:ring-2 hover:ring-blue-300 transition-all">
                    <img
                      src={resolvedLogo}
                      alt={company.name || auth.name}
                      className="h-full w-full rounded-full object-contain"
                      onError={() => setLogoFailed(true)}
                    />
                  </span>
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-[13px] font-bold text-white shadow-2xs hover:ring-2 hover:ring-blue-300 transition-all">
                    {initialsOf(auth.name)}
                  </span>
                )}
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[240px] rounded-md border border-line bg-card p-1.5 shadow-md animate-in fade-in zoom-in-95 duration-100"
                    role="menu"
                  >
                  <div className="border-b border-line px-2.5 py-2 flex items-center gap-2.5">
                    {showLogo ? (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-white p-0.5 shadow-2xs">
                        <img
                          src={resolvedLogo}
                          alt={company.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
                        {initialsOf(auth.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <strong className="block text-[13px] text-ink truncate">{auth.name}</strong>
                      <span className="text-xs text-faint truncate block">{auth.email}</span>
                      {company.name && (
                        <span className="text-[11px] text-muted truncate block">{company.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="border-b border-line px-2.5 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-faint">
                      {t(lang, "Role")}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-sm bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        <Icon name="shield" size={12} />
                        {t(lang, role || "Company Admin")}
                      </span>
                    </div>
                  </div>
                  <div className="my-1.5 h-px bg-line" />
                  {can(role, "settings.manage") && (
                    <button
                      type="button"
                      role="menuitem"
                      className={menuItem}
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/company/profile");
                      }}
                    >
                      <Icon name="building-2" size={14} style={{ marginRight: 8 }} /> {t(lang, "Company Profile")}
                    </button>
                  )}
                  {can(role, "settings.manage") && (
                    <button
                      type="button"
                      role="menuitem"
                      className={menuItem}
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/company/settings");
                      }}
                    >
                      <Icon name="settings" size={14} style={{ marginRight: 8 }} /> {t(lang, "Settings")}
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className={`${menuItem} text-danger hover:bg-danger-bg hover:text-danger-fg`}
                    onClick={() => {
                      logout();
                      router.push("/employer-login");
                    }}
                  >
                    <Icon name="log-out" size={14} style={{ marginRight: 8 }} /> {t(lang, "Logout")}
                  </button>
                </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-20 pt-8 max-[900px]:pb-24 max-md:px-4 max-md:pt-5">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Quick thumb navigation on phones) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-[100] hidden border-t border-line bg-card px-1 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-2px_8px_rgba(21,23,27,0.06)] max-[900px]:flex"
        aria-label={t(lang, "Primary")}
      >
        {MOBILE_TABS.filter((n) => can(role, n.perm)).map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold no-underline transition-colors ${
                active ? "text-brand" : "text-faint hover:text-ink"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon name={tab.icon} size={20} />
              <span>{t(lang, tab.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
