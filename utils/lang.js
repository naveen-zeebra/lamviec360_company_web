"use client";
import { useEffect, useState } from "react";
import enDict from "../locales/en.json";
import vnDict from "../locales/vn.json";
import { AppStorage, STORAGE_CONFIG } from "../lib/storage/index";

export function useLang() {
  const [lang, setLangState] = useState("EN");
  useEffect(() => {
    try {
      const saved = AppStorage.get(STORAGE_CONFIG.keys.APP_LANGUAGE);
      if (saved) setLangState(saved);
    } catch (e) {}
  }, []);

  const setLang = (l) => {
    setLangState(l);
    try {
      AppStorage.set(STORAGE_CONFIG.keys.APP_LANGUAGE, l);
    } catch (e) {}
  };

  return [lang, setLang];
}

export function t(lang, key) {
  if (lang === "VN" || lang === "VI") {
    return vnDict[key] || enDict[key] || key;
  }
  return enDict[key] || key;
}

// Keeping this for old `tr` usages that were dynamic
export function tr(lang, vi, en) {
  return lang === "VN" || lang === "VI" ? vi : en;
}

export const SEEKER_NAV = [
  { href: "/", labelKey: "Home" },
  { href: "/jobs", labelKey: "Find Jobs" },
  { href: "/companies", labelKey: "Companies" },
  { href: "/resources", labelKey: "Career Resources" },
];

export const EMPLOYER_NAV = [
  { href: "/employers", labelKey: "Home" },
  { href: "/solutions", labelKey: "Solutions" },
  { href: "/pricing", labelKey: "Pricing" },
  { href: "/employer-resources", labelKey: "Resources" },
];

export const LANGS = [
  { code: "EN", label: "English" },
  { code: "VN", label: "Tiếng Việt" },
];
