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
  setRole,
  logout,
  unreadNotificationCount,
  ROLES,
  can,
} from "../../lib/companyStore";

const NAV = [
  { href: "/company/overview", icon: "layout-dashboard", labelKey: "Overview", perm: "overview.view" },
  { href: "/company/jobs", icon: "briefcase", labelKey: "Job Management", perm: "overview.view" },
  { href: "/company/candidates", icon: "users", labelKey: "Candidate Pipeline", perm: "candidates.view" },
  { href: "/company/team", icon: "user-cog", labelKey: "Team Management", perm: "team.manage" },
  { href: "/company/billing", icon: "credit-card", labelKey: "Subscription & Billing", perm: "billing.manage" },
  { href: "/company/settings", icon: "settings", labelKey: "Settings", perm: "settings.manage" },
];

const MOBILE_TABS = NAV.slice(0, 4);

const navItem = "flex items-center gap-[11px] rounded-sm px-[11px] py-2.5 text-sm font-medium no-underline";
const navItemIdle = "text-white/70 hover:bg-white/10 hover:text-white hover:no-underline";
const navItemActive = "bg-brand text-white";
const menuItem = "flex w-full items-center rounded-sm px-2.5 py-2 text-left text-sm text-ink hover:bg-brand-subtle hover:text-brand";

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
  const [company, setCompany] = useState({ name: "Company", verified: false });
  const [plan, setPlanState] = useState({ name: "Freemium" });
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setAuth(getAuth());
    setCompany(getCompany());
    setPlanState(getPlan());
    setUnread(unreadNotificationCount());
    setMenuOpen(false);
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const refresh = () => setUnread(unreadNotificationCount());
    window.addEventListener("lv360-store", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("lv360-store", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const role = auth.role;
  const visibleNav = NAV.filter((n) => can(role, n.perm));

  const changeRole = (r) => {
    setRole(r);
    setAuth({ ...auth, role: r });
    setMenuOpen(false);
    if (!can(r, "team.manage") && (pathname.startsWith("/company/team") || pathname.startsWith("/company/billing") || pathname.startsWith("/company/settings"))) {
      router.push("/company/overview");
    } else {
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-page">
      <aside className="fixed inset-y-0 left-0 z-[90] flex w-[244px] flex-col overflow-y-auto bg-inverse p-[14px] pt-5 text-white max-[900px]:-translate-x-full">
        <Link href="/company/overview" className="mx-1.5 mb-[18px] mt-1 block no-underline" aria-label={t(lang, "LàmViệc360 — Workspace")}>
          <img src="/logo-cropped.png" alt="LàmViệc360" className="h-6 w-auto brightness-0 invert" />
        </Link>
        <div className="mb-4 flex items-center gap-2.5 rounded-md bg-white/10 p-2.5">
          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-sm bg-blue-500 text-xs font-bold text-white">
            {initialsOf(company.name)}
          </div>
          <div className="min-w-0">
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
        </div>
        <nav className="flex flex-1 flex-col gap-0.5" aria-label={t(lang, "Workspace navigation")}>
          {visibleNav.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} prefetch={true} className={`${navItem} ${active ? navItemActive : navItemIdle}`} aria-current={active ? "page" : undefined}>
                <Icon name={n.icon} size={18} />
                <span>{t(lang, n.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-2 border-t border-white/10 pt-2">
          <Link href="/employers" prefetch={true} className={`${navItem} ${navItemIdle}`}>
            <Icon name="arrow-left" size={18} />
            <span>{t(lang, "Public site")}</span>
          </Link>
        </div>
      </aside>

      <div className="ml-[244px] flex min-w-0 flex-1 flex-col max-[900px]:ml-0">
        <header className="sticky top-0 z-[80] flex items-center gap-3.5 border-b border-line bg-white/95 px-6 py-3 backdrop-blur-[6px] backdrop-saturate-[180%]">
          <button className="hidden cursor-pointer text-ink max-[900px]:inline-flex" aria-label={t(lang, "Open menu")} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((v) => !v)}>
            <Icon name={mobileNavOpen ? "x" : "menu"} size={22} />
          </button>
          <span className="flex-1 text-sm font-bold text-muted max-[900px]:hidden">{t(lang, "Company Workspace")}</span>
          <div className="flex items-center gap-2.5">
            <button
              className="flex items-center gap-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:border-line-brand hover:text-brand"
              onClick={() => setLang(lang === "EN" ? "VN" : "EN")}
              aria-label={t(lang, "Choose language")}
            >
              <Icon name="globe" size={14} /> {lang}
            </button>
            <Link
              href="/company/notifications"
              prefetch={true}
              className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-md text-ink hover:bg-brand-subtle hover:text-brand"
              aria-label={t(lang, "Notifications") + (unread ? `, ${unread} unread` : "")}
            >
              <Icon name="bell" size={20} />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-pill bg-danger px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <div className="relative">
              <button className="cursor-pointer border-none bg-transparent p-0" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-[13px] font-bold text-white">{initialsOf(auth.name)}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[240px] rounded-md border border-line bg-card p-1.5 shadow-md" role="menu">
                  <div className="border-b border-line px-2.5 py-2">
                    <strong className="block text-[13px]">{auth.name}</strong>
                    <span className="text-xs text-faint">{auth.email}</span>
                  </div>
                  <div className="px-2.5 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-faint">{t(lang, "View workspace as")}</span>
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          role="menuitemradio"
                          aria-checked={role === r}
                          onClick={() => changeRole(r)}
                          className={`flex items-center gap-2 rounded-sm px-1 py-1 text-left text-sm hover:bg-brand-subtle hover:text-brand ${role === r ? "font-bold" : "font-normal"}`}
                        >
                          <Icon name={role === r ? "check-circle" : "circle"} size={13} /> {t(lang, r)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="my-1.5 h-px bg-line" />
                  {can(role, "settings.manage") && (
                    <button role="menuitem" className={menuItem} onClick={() => router.push("/company/settings")}>
                      <Icon name="settings" size={14} style={{ marginRight: 8 }} /> {t(lang, "Settings")}
                    </button>
                  )}
                  <button
                    role="menuitem"
                    className={menuItem}
                    onClick={() => {
                      logout();
                      router.push("/employer-login");
                    }}
                  >
                    <Icon name="log-out" size={14} style={{ marginRight: 8 }} /> {t(lang, "Logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {mobileNavOpen && (
          <div className="flex flex-col gap-0.5 border-b border-line bg-card px-5 pb-4 pt-3 min-[901px]:hidden">
            {visibleNav.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  prefetch={true}
                  className={`flex items-center gap-2.5 px-1.5 py-2.5 text-base no-underline ${active ? "font-bold text-brand" : "text-ink"}`}
                >
                  <Icon name={n.icon} size={18} /> {t(lang, n.labelKey)}
                </Link>
              );
            })}
            <div className="my-1.5 h-px bg-line" />
            <div className="flex gap-2 py-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  className={`rounded-pill border border-line bg-card px-4 py-1.5 text-sm text-muted ${lang === l.code ? "font-bold" : "font-normal"}`}
                  onClick={() => setLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 pb-20 pt-8 max-[900px]:pb-24 max-md:px-4 max-md:pt-5">{children}</main>
      </div>

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
              className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold no-underline ${active ? "text-brand" : "text-faint"}`}
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
