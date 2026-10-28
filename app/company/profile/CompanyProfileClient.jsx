"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button, Input, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { SEEKER_URL } from "../../../config";
import {
  getCompany,
  saveCompany,
  syncCompanyWithBackend,
  resolveCompanyLogoUrl,
} from "../../../lib/companyStore";

const INDUSTRIES = [
  "Technology",
  "Software & IT",
  "Retail & Commerce",
  "Media & Creative",
  "Transport & Logistics",
  "Manufacturing",
  "Finance & Banking",
  "Healthcare & Pharma",
  "Education & Training",
  "Other",
];
const SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "500+ employees",
];
const CITIES = [
  "Ho Chi Minh City",
  "Hanoi",
  "Da Nang",
  "Can Tho",
  "Hai Phong",
  "Binh Duong",
  "Dong Nai",
  "Remote",
];

const FORM_GRID = "grid grid-cols-2 gap-4 gap-x-5 max-md:grid-cols-1";
const TEXTAREA =
  "w-full resize-y rounded-md border-[1.5px] border-line px-3.5 py-[11px] font-body text-base text-ink focus:border-line-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100";
const TOGGLE_ROW =
  "flex items-center justify-between border-b border-line py-3.5 text-base last:border-0";
const AI_TAG =
  "inline-flex items-center gap-1 rounded-pill px-2 py-[3px] text-[11px] font-bold tracking-[0.02em]";

export default function CompanyProfileClient() {
  const [lang] = useLang();
  const [company, setCompany] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const fileInputRef = useRef(null);
  const [newValueDraft, setNewValueDraft] = useState({ title: "", description: "" });
  const [toast, setToast] = useToast();

  const loadData = () => {
    const c = getCompany();
    setCompany(c);
    setLogoError(false);
  };

  useEffect(() => {
    loadData();
    syncCompanyWithBackend(true).then(loadData).catch(console.warn);
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast(t(lang, "Logo size must be under 2MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result;
      if (result) {
        setCompany((prev) => ({ ...prev, logo: result }));
        setLogoError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompany((prev) => ({ ...prev, logo: "" }));
    setLogoError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddCultureValue = () => {
    if (!newValueDraft.title.trim() || !newValueDraft.description.trim()) {
      setToast(t(lang, "Please provide a value title and description."));
      return;
    }
    const current = Array.isArray(company.cultureValues) ? company.cultureValues : [];
    setCompany((prev) => ({
      ...prev,
      cultureValues: [...current, { ...newValueDraft }],
    }));
    setNewValueDraft({ title: "", description: "" });
    setToast(t(lang, "Core value added!"));
  };

  const handleRemoveCultureValue = (index) => {
    const current = Array.isArray(company.cultureValues) ? company.cultureValues : [];
    setCompany((prev) => ({
      ...prev,
      cultureValues: current.filter((_, idx) => idx !== index),
    }));
  };

  // Immediate toggle handler for isPublic with zero glitch
  const handleTogglePublic = async (nextValue) => {
    if (togglingPublic) return;
    setTogglingPublic(true);
    setCompany((prev) => ({ ...prev, isPublic: nextValue }));
    try {
      await saveCompany({ isPublic: nextValue });
      setToast(
        nextValue
          ? t(lang, "Public showcase enabled: Company is discoverable on LàmViệc360")
          : t(lang, "Public showcase disabled: Company is now private & hidden")
      );
    } catch (e) {
      console.warn("Could not sync public status to remote API, persisted locally:", e);
      setToast(
        nextValue
          ? t(lang, "Public showcase enabled")
          : t(lang, "Public showcase disabled")
      );
    } finally {
      setTogglingPublic(false);
    }
  };

  // Profile fields manual save handler
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await saveCompany(company);
      if (updated) {
        setCompany(updated);
        setLogoError(false);
      }
      setToast(t(lang, "Company profile saved successfully!"));
    } catch (e) {
      setToast(t(lang, e.message || "Failed to save profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  if (!company) return null;

  const isPublicEnabled = company.isPublic !== false;

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-ink">{t(lang, "Company Profile")}</h1>
            {company.verified ? (
              <span className={`${AI_TAG} bg-emerald-100 text-emerald-800`}>
                <Icon name="badge-check" size={12} /> {t(lang, "Verified Employer")}
              </span>
            ) : (
              <span className={`${AI_TAG} bg-amber-100 text-amber-800`}>
                <Icon name="clock" size={12} /> {t(lang, "Verification Pending")}
              </span>
            )}
          </div>
          <p className="text-sm text-muted">
            {t(
              lang,
              "Manage your public employer profile, culture values, media assets, and location details."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Easy-to-click Public Showcase Pill */}
          <button
            type="button"
            role="switch"
            aria-checked={isPublicEnabled}
            disabled={togglingPublic}
            onClick={() => handleTogglePublic(!isPublicEnabled)}
            className={`group flex items-center gap-3 rounded-xl border px-3.5 py-1.5 shadow-2xs transition-all select-none cursor-pointer text-left ${isPublicEnabled
              ? "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
              : "border-line bg-card hover:bg-surface"
              } ${togglingPublic ? "opacity-70 cursor-wait" : ""}`}
          >
            <div className="flex flex-col min-w-[120px]">
              <span className="text-xs font-bold text-ink leading-tight">
                {t(lang, "Public Showcase")}
              </span>
              <span className="text-[11px] font-semibold leading-tight flex items-center gap-1.5 mt-0.5">
                {isPublicEnabled ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                    <span className="text-emerald-700">{t(lang, "Live & Discoverable")}</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="text-slate-500">{t(lang, "Private & Hidden")}</span>
                  </>
                )}
              </span>
            </div>

            {/* Smooth Switch Indicator */}
            <div
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isPublicEnabled ? "bg-emerald-600" : "bg-gray-300"
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPublicEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </div>
          </button>

          {/* Always-Mounted Preview Button (Zero Layout Shift Glitch) */}
          <a
            href={isPublicEnabled ? `${SEEKER_URL}/companies/${company.id || encodeURIComponent(company.name || "company")}` : undefined}
            target={isPublicEnabled ? "_blank" : undefined}
            rel={isPublicEnabled ? "noopener noreferrer" : undefined}
            title={isPublicEnabled ? t(lang, "Preview Public Page") : t(lang, "Enable public showcase to preview")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold shadow-2xs transition-all ${isPublicEnabled
              ? "border-line bg-card hover:bg-surface text-ink cursor-pointer"
              : "border-line/60 bg-surface/50 text-faint cursor-not-allowed opacity-50 select-none pointer-events-none"
              }`}
          >
            <span>{t(lang, "Preview Public Page")}</span>
            <Icon name="arrow-up-right" size={13} className={isPublicEnabled ? "text-ink" : "text-faint"} />
          </a>

          {/* Save Changes Button (Position is 100% stationary) */}
          <Button variant="primary" onClick={handleSaveProfile} disabled={savingProfile}>
            <Icon name="check" size={14} style={{ marginRight: 6 }} />
            {savingProfile ? t(lang, "Saving...") : t(lang, "Save Changes")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card p-8 shadow-md max-md:p-5">
        <div className="flex flex-col gap-6">
          {/* Company Brand Summary Banner */}
          <div className="flex items-center justify-between border-b border-line pb-4 max-sm:flex-col max-sm:items-start max-sm:gap-3">
            <div className="flex items-center gap-3">
              {company.logo && !logoError ? (
                <img
                  src={resolveCompanyLogoUrl(company.logo)}
                  alt={company.name || "Company Logo"}
                  className="h-14 w-14 rounded-xl object-contain border border-line bg-white p-1 shadow-2xs"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white shadow-2xs">
                  {(company.name || "C").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-ink">
                  {company.name || t(lang, "Employer Organization")}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-xs text-faint">
                    {t(lang, "Plan")}: <strong>{company.plan || "Freemium"}</strong>
                  </span>
                  <span className="text-xs text-line">•</span>
                  {isPublicEnabled ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      {t(lang, "Public & Discoverable")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      {t(lang, "Private Showcase")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/company/settings"
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
              >
                <Icon name="settings" size={13} />
                <span>{t(lang, "Workspace Settings")}</span>
              </Link>
            </div>
          </div>

          {/* SECTION 1: BASIC INFORMATION */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-faint">
              {t(lang, "1. Basic Organization Information")}
            </h3>
            <div className={FORM_GRID}>
              <Input
                label={t(lang, "Company Name (Brand)")}
                value={company.name || ""}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                placeholder="e.g. VNG Corporation"
              />
              <Select
                label={t(lang, "Primary Industry / Domain")}
                placeholder={t(lang, "Select the industry")}
                value={company.industry || "Technology"}
                onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                options={INDUSTRIES.map((ind) => ({ value: ind, label: ind }))}
              />
              <Select
                label={t(lang, "Company Size")}
                placeholder={t(lang, "Select the size")}
                value={company.size || "51–200 employees"}
                onChange={(e) => setCompany({ ...company, size: e.target.value })}
                options={SIZES.map((sz) => ({ value: sz, label: sz }))}
              />
              <Input
                label={t(lang, "Founded Year")}
                value={company.foundedYear || ""}
                onChange={(e) => setCompany({ ...company, foundedYear: e.target.value })}
                placeholder="e.g. 2018"
              />
              <div className="col-span-2 max-md:col-span-1">
                <Input
                  label={t(lang, "Tax Code / Business Reg Number")}
                  value={company.taxCode || company.regNumber || ""}
                  readOnly
                  disabled
                  iconRight={<Icon name="lock" size={14} className="text-faint" />}
                  className="cursor-not-allowed opacity-80 font-mono"
                  placeholder="0312345678"
                />
                <span className="text-[11px] text-faint mt-1 block">
                  {t(lang, "Official registration code verified by Super Admin (read-only).")}
                </span>
              </div>

            </div>
          </div>

          {/* SECTION 2: CONTACT & LOCATION */}
          <div className="flex flex-col gap-4 border-t border-line pt-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-faint">
              {t(lang, "2. Contact & Location")}
            </h3>
            <div className={FORM_GRID}>
              <Input
                label={t(lang, "Recruitment / Contact Email")}
                type="email"
                value={company.contactEmail || company.email || ""}
                onChange={(e) =>
                  setCompany({ ...company, contactEmail: e.target.value, email: e.target.value })
                }
                placeholder="hr@company.com"
              />
              <Input
                label={t(lang, "Contact Phone / Hotline")}
                value={company.contactPhone || company.phone || ""}
                onChange={(e) =>
                  setCompany({ ...company, contactPhone: e.target.value, phone: e.target.value })
                }
                placeholder="+84 28 1234 5678"
              />
              <Select
                label={t(lang, "Primary City / Province")}
                value={company.city || "Ho Chi Minh City"}
                placeholder={t(lang, "Select the city")}
                onChange={(e) => setCompany({ ...company, city: e.target.value })}
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
              <div className="col-span-2 max-md:col-span-1">
                <Input
                  label={t(lang, "Headquarters Street Address")}
                  value={company.address || ""}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  placeholder="e.g. 123 Nguyen Hue Boulevard, District 1"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: BRANDING MEDIA & ONLINE PRESENCE */}
          <div className="flex flex-col gap-4 border-t border-line pt-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-faint">
              {t(lang, "3. Branding Media & Online Presence")}
            </h3>

            {/* Company Logo Card */}
            <div className="rounded-xl border border-line bg-surface/50 p-4">
              <label className="block text-xs font-semibold text-ink mb-2">
                {t(lang, "Company Logo")}
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white shadow-2xs">
                  {company.logo && !logoError ? (
                    <img
                      src={resolveCompanyLogoUrl(company.logo)}
                      alt={company.name || "Company Logo"}
                      className="h-full w-full object-contain p-1"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-faint">
                      <Icon name="building-2" size={24} />
                      <span className="text-[10px] mt-0.5 font-medium">{t(lang, "Logo")}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-card text-xs font-semibold text-ink hover:bg-surface hover:text-brand shadow-2xs cursor-pointer transition-all">
                      <Icon name="upload" size={13} />
                      <span>{company.logo ? t(lang, "Change logo") : t(lang, "Upload logo")}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {company.logo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger-bg transition-all cursor-pointer"
                      >
                        <Icon name="trash-2" size={13} />
                        <span>{t(lang, "Remove")}</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-faint">
                    {t(lang, "PNG, JPG or WEBP up to 2MB. Square 400x400px.")}
                  </p>
                </div>
              </div>
            </div>

            <div className={FORM_GRID}>
              <Input
                label={t(lang, "Official Website")}
                value={company.website || ""}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                placeholder="https://company.vn"
              />
              <Input
                label={t(lang, "LinkedIn Organization URL")}
                value={company.linkedinUrl || ""}
                onChange={(e) => setCompany({ ...company, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/company/..."
              />
              <Input
                label={t(lang, "Facebook Fanpage URL")}
                value={company.facebookUrl || ""}
                onChange={(e) => setCompany({ ...company, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/..."
              />

            </div>
          </div>

          {/* SECTION 4: ABOUT & CULTURE SHOWCASE */}
          <div className="flex flex-col gap-4 border-t border-line pt-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-faint">
              {t(lang, "4. About & Culture Showcase")}
            </h3>

            <div className={FORM_GRID}>
              <div className="col-span-2 max-md:col-span-1">
                <Input
                  label={t(lang, "Company Tagline / Mission Motto")}
                  value={company.tagline || ""}
                  onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                  placeholder="e.g. Building next-generation digital platforms for Southeast Asia"
                />
              </div>
              <Select
                label={t(lang, "Workplace Model")}
                value={company.workplaceModel || "Hybrid"}
                onChange={(e) => setCompany({ ...company, workplaceModel: e.target.value })}
                options={[
                  { value: "Hybrid", label: "Hybrid (Flexible remote & office options)" },
                  { value: "On-site", label: "On-site (Modern physical office)" },
                  { value: "Remote-first", label: "Remote-first (Work from anywhere in Vietnam)" },
                ]}
              />
              <Input
                label={t(lang, "Standard Working Hours & Schedule")}
                value={company.workingHours || "Monday – Friday (9:00 AM – 6:00 PM)"}
                onChange={(e) => setCompany({ ...company, workingHours: e.target.value })}
                placeholder="e.g. Mon–Fri: 8:30 AM – 5:30 PM (No weekend OT)"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">
                {t(lang, "About the Company (Description)")}
              </label>
              <textarea
                className={`${TEXTAREA} min-h-[110px]`}
                value={company.description || ""}
                onChange={(e) => setCompany({ ...company, description: e.target.value })}
                placeholder={t(
                  lang,
                  "Brief summary of your company culture, core products, and work environment..."
                )}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">
                {t(lang, "Key Employee Perks & Benefits")}
              </label>
              <textarea
                className={`${TEXTAREA} min-h-[85px]`}
                value={company.benefits || ""}
                onChange={(e) => setCompany({ ...company, benefits: e.target.value })}
                placeholder="e.g. 13th month salary, Premium healthcare package, Flexible remote work, Macbook Pro, Annual team retreat"
              />
            </div>

            {/* Core Values / Culture Pillars Manager */}
            <div className="mt-2 rounded-xl border border-line bg-surface/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <strong className="block text-sm font-bold text-ink">
                    {t(lang, "Company Core Values & Culture Pillars")}
                  </strong>
                  <span className="text-xs text-muted">
                    {t(
                      lang,
                      "Showcase 2–4 principles that define your engineering culture and work ethics."
                    )}
                  </span>
                </div>
              </div>

              {/* Values List */}
              <div className="grid grid-cols-2 gap-3 mb-4 max-md:grid-cols-1">
                {(company.cultureValues || []).map((val, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg border border-line bg-card p-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-sm font-bold text-ink">{val.title}</strong>
                      <button
                        type="button"
                        onClick={() => handleRemoveCultureValue(idx)}
                        className="text-muted hover:text-danger p-0.5 cursor-pointer"
                        title="Remove value"
                      >
                        <Icon name="x" size={13} />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{val.description}</p>
                  </div>
                ))}
                {(!company.cultureValues || company.cultureValues.length === 0) && (
                  <div className="col-span-2 text-center py-4 text-xs text-muted border border-dashed border-line rounded-lg">
                    {t(
                      lang,
                      "No custom values configured yet. Standard principles will be shown by default."
                    )}
                  </div>
                )}
              </div>

              {/* Add Value Form */}
              <div className="rounded-lg border border-dashed border-line bg-sunken/40 p-3">
                <div className="text-xs font-bold text-ink mb-2">
                  {t(lang, "Add a Core Value")}
                </div>
                <div className="grid grid-cols-3 gap-2 max-md:grid-cols-1">
                  <Input
                    value={newValueDraft.title}
                    onChange={(e) =>
                      setNewValueDraft({ ...newValueDraft, title: e.target.value })
                    }
                    placeholder={t(lang, "Value Title (e.g. People First)")}
                    className="text-xs"
                  />
                  <Input
                    value={newValueDraft.description}
                    onChange={(e) =>
                      setNewValueDraft({ ...newValueDraft, description: e.target.value })
                    }
                    placeholder={t(
                      lang,
                      "Brief description (e.g. We prioritize continuous learning...)"
                    )}
                    className="text-xs"
                  />
                  <div>
                    <Button variant="secondary" size="sm" onClick={handleAddCultureValue}>
                      <Icon name="plus" size={13} style={{ marginRight: 4 }} />
                      {t(lang, "Add Value")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Toast toast={toast} />
    </>
  );
}

