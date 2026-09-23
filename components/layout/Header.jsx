"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ds";
import Icon from "../ds/Icon";
import { SEEKER_NAV, EMPLOYER_NAV, LANGS, useLang, t } from "../../utils/lang";

function LangPicker({ lang, setLang, dark }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className={[
          "flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium",
          dark ? "border-white/30 text-white" : "border-line text-ink hover:border-line-brand hover:text-brand",
        ].join(" ")}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t(lang, "Choose language")}
      >
        <Icon name="globe" size={14} />
        {lang}
        <Icon name="chevron-down" size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] rounded-md border border-line bg-card p-1.5 shadow-md" role="listbox">
          {LANGS.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={lang === l.code}
              className="block w-full rounded-sm px-2.5 py-2 text-left text-sm text-ink hover:bg-brand-subtle hover:text-brand"
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { getAuth } from "../../lib/companyStore";

export default function Header({ lang, setLang, app = "employer" }) {
  const emp = true;
  const nav = EMPLOYER_NAV;
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState({ loggedIn: false });

  useEffect(() => {
    setMounted(true);
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    
    const refresh = () => setAuth(getAuth());
    refresh();
    window.addEventListener("lv360-store", refresh);
    return () => {
      window.removeEventListener("scroll", f);
      window.removeEventListener("lv360-store", refresh);
    };
  }, []);

  const switchHref = "/company/overview";
  const switchLabel = t(lang, "Go to Workspace");
  const loginHref = "/employer-login";
  const registerHref = "/company-register";
  const loginLabel = emp ? t(lang, "Employer Login") : t(lang, "Login");
  const ctaLabel = emp ? t(lang, "Get Started") : t(lang, "Create Account");

  const switchLinkCls = emp
    ? "border-line text-ink hover:border-line-brand hover:bg-brand-subtle hover:text-brand"
    : "border-line-brand text-brand hover:bg-brand-subtle";

  return (
    <header
      className={[
        "sticky top-0 z-[100] border-b backdrop-blur-[6px] backdrop-saturate-[180%] transition-[border-color,box-shadow]",
        "bg-white/90",
        scrolled ? "border-line shadow-sm" : "border-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-[1200px] items-center gap-8 px-6 py-3.5">
        <Link href={emp ? "/employers" : "/"} className="flex items-center gap-3 no-underline" aria-label={t(lang, "LàmViệc360 — Home")}>
          <img src="/logo-cropped.png" alt="LàmViệc360" className="block h-[26px] w-auto" />
        </Link>
        <nav className="flex flex-1 gap-6 max-[1080px]:hidden" aria-label={t(lang, "Main navigation")}>
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={[
                "text-sm font-medium no-underline hover:text-brand hover:no-underline",
                pathname === n.href ? "font-bold text-brand" : "text-ink",
              ].join(" ")}
              aria-current={pathname === n.href ? "page" : undefined}
            >
              {t(lang, n.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <span className="max-[1080px]:hidden">
            <LangPicker lang={lang} setLang={setLang} />
          </span>
          <Link
            href={switchHref}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-sm font-semibold no-underline hover:no-underline max-[1080px]:hidden ${switchLinkCls}`}
          >
            {switchLabel} <Icon name="arrow-right" size={14} />
          </Link>
          <Link href={loginHref} className="whitespace-nowrap px-1.5 py-2 text-sm font-semibold text-ink no-underline hover:text-brand hover:no-underline max-[1080px]:hidden">
            {loginLabel}
          </Link>
          <Button variant="primary" size="md" className="flex-shrink-0 whitespace-nowrap" onClick={() => router.push(registerHref)}>
            {ctaLabel}
          </Button>
          <button className="cursor-pointer text-ink min-[1081px]:hidden" aria-label={t(lang, "Open menu")} aria-expanded={mobileOpen} onClick={() => setMobileOpen((v) => !v)}>
            <Icon name={mobileOpen ? "x" : "menu"} size={24} />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="flex flex-col gap-1 border-t border-line px-6 pb-5 pt-3">
          <Link href={switchHref} className={`mb-2 inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold no-underline ${switchLinkCls}`}>
            {switchLabel} <Icon name="arrow-right" size={14} />
          </Link>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="px-1 py-2.5 text-base text-ink no-underline">
              {t(lang, n.labelKey)}
            </Link>
          ))}
          <div className="my-1.5 h-px bg-line" />
          <Link href={loginHref} className="px-1 py-2.5 text-base text-ink no-underline">
            {loginLabel}
          </Link>
          <div className="flex gap-2 py-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                className={`rounded-pill border border-line bg-card px-4 py-1.5 text-sm text-muted hover:border-line-brand hover:text-brand ${lang === l.code ? "font-bold" : "font-normal"}`}
                onClick={() => setLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Button variant="primary" className="w-full justify-center" onClick={() => router.push(registerHref)}>
            {ctaLabel}
          </Button>
        </div>
      )}
    </header>
  );
}
