"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Toast, { useToast } from "../../../components/ds/Toast";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
import * as companyApi from "../../../lib/api/companyApi";
import {
  getCompany,
  saveCompany,
  getSettings,
  saveSettings,
  getAuth,
  logout,
  resetAll,
  listRejectionTemplates,
  addRejectionTemplate,
  updateRejectionTemplate,
  deleteRejectionTemplate,
  syncCompanyWithBackend,
} from "../../../lib/companyStore";

const TABS = ["Company Profile", "Security", "Notifications", "Pipeline", "Privacy & Data", "Account"];
const CONTACT_VISIBILITY = [
  { value: "always", label: "Always visible" },
  { value: "after_shortlist", label: "Only after Shortlisted" },
  { value: "never", label: "Never (masked)" },
];
const RETENTION_MONTHS = ["6", "12", "24", "36"];
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
const SIZES = ["1–10 employees", "11–50 employees", "51–200 employees", "201–500 employees", "500+ employees"];
const CITIES = ["Ho Chi Minh City", "Hanoi", "Da Nang", "Can Tho", "Hai Phong", "Binh Duong", "Dong Nai", "Remote"];

const FORM_GRID = "grid grid-cols-2 gap-4 gap-x-5 max-md:grid-cols-1";
const TEXTAREA =
  "w-full resize-y rounded-md border-[1.5px] border-line px-3.5 py-[11px] font-body text-base text-ink focus:border-line-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100";
const HINT = "flex items-start gap-2 rounded-md bg-brand-subtle px-4 py-3 text-sm leading-relaxed text-muted";
const TOGGLE_ROW = "flex items-center justify-between border-b border-line py-3.5 text-base last:border-0";
const AI_TAG = "inline-flex items-center gap-1 rounded-pill px-2 py-[3px] text-[11px] font-bold tracking-[0.02em]";

function Switch({ on, onChange, label }) {
  return (
    <div className={TOGGLE_ROW}>
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 rounded-pill transition-colors ${on ? "bg-brand" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform ${
            on ? "translate-x-[23px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

function Settings() {
  const [lang] = useLang();
  const router = useRouter();
  const [tab, setTab] = useState("Company Profile");
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState(null);
  const [auth, setAuth] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [purgingData, setPurgingData] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [templates, setTemplates] = useState([]);
  const [tplDraft, setTplDraft] = useState({ title: "", body: "" });
  const [editingTpl, setEditingTpl] = useState(null);
  const [toast, setToast] = useToast();

  const loadData = () => {
    setCompany(getCompany());
    setSettings(getSettings());
    setAuth(getAuth());
    setTemplates(listRejectionTemplates());
  };

  useEffect(() => {
    loadData();
    syncCompanyWithBackend(true).then(loadData).catch(console.warn);
  }, []);

  if (!company || !settings || !auth) return null;

  const handleSaveCompany = async () => {
    setSavingProfile(true);
    try {
      await saveCompany(company);
      setToast(t(lang, "Company profile saved successfully!"));
    } catch (e) {
      setToast(t(lang, e.message || "Failed to save profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const persistSettings = async (patch) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    try {
      await saveSettings(patch);
      setToast(t(lang, "Settings saved"));
    } catch (e) {
      setToast(t(lang, "Error saving settings: " + e.message));
    }
  };

  const handleUpdatePassword = async () => {
    if (!pw.current) {
      setToast(t(lang, "Please enter your current password."));
      return;
    }
    if (!pw.next || pw.next.length < 8) {
      setToast(t(lang, "New password must be at least 8 characters."));
      return;
    }
    if (pw.next !== pw.confirm) {
      setToast(t(lang, "New passwords do not match."));
      return;
    }

    setChangingPw(true);
    try {
      await companyApi.changeCompanyPassword({
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      setPw({ current: "", next: "", confirm: "" });
      setToast(t(lang, "Password updated successfully!"));
    } catch (e) {
      setToast(t(lang, e.message || "Failed to change password."));
    } finally {
      setChangingPw(false);
    }
  };

  const saveTemplate = async () => {
    if (!tplDraft.title.trim() || !tplDraft.body.trim()) {
      setToast(t(lang, "Add a title and message."));
      return;
    }
    if (editingTpl) {
      await updateRejectionTemplate(editingTpl, tplDraft);
    } else {
      await addRejectionTemplate(tplDraft);
    }
    setTemplates(listRejectionTemplates());
    setTplDraft({ title: "", body: "" });
    setEditingTpl(null);
    setToast(t(lang, "Template saved successfully!"));
  };

  const removeTemplate = async (id) => {
    await deleteRejectionTemplate(id);
    setTemplates(listRejectionTemplates());
    if (editingTpl === id) {
      setEditingTpl(null);
      setTplDraft({ title: "", body: "" });
    }
    setToast(t(lang, "Template removed"));
  };

  const handlePurgeCandidates = async () => {
    setPurgingData(true);
    try {
      const months = Number(settings.retention?.purgeRejectedMonths || 6);
      const res = await companyApi.purgeCompanyData(months);
      const msg = res?.message || t(lang, "Candidates older than retention limit purged.");
      setToast(msg);
    } catch (e) {
      setToast(t(lang, e.message || "Failed to purge data."));
    } finally {
      setPurgingData(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1.5 text-2xl font-extrabold">{t(lang, "Settings")}</h1>
        <p className="text-sm text-muted">
          {t(lang, "Manage your organization profile, security, notifications, and ATS preferences.")}
        </p>
      </div>

      <div className="mb-7 flex max-w-[760px] gap-1.5 overflow-x-auto rounded-md bg-sunken p-1">
        {TABS.map((tb) => (
          <button
            key={tb}
            className={[
              "flex-1 whitespace-nowrap rounded-sm px-3 py-2 text-sm font-semibold transition-colors",
              tab === tb ? "bg-card text-brand shadow-xs" : "text-muted hover:text-ink",
            ].join(" ")}
            onClick={() => setTab(tb)}
          >
            {t(lang, tb)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-card p-8 shadow-md max-md:p-5">
        {/* TAB 1: COMPANY PROFILE */}
        {tab === "Company Profile" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="h-12 w-12 rounded-md object-contain border border-line bg-white p-1"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand text-lg font-bold text-white">
                    {(company.name || "C").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-ink">{company.name || t(lang, "Employer Organization")}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {company.verified ? (
                      <span className={`${AI_TAG} bg-success-bg text-success-fg`}>
                        <Icon name="badge-check" size={12} /> {t(lang, "Verified Employer")}
                      </span>
                    ) : (
                      <span className={`${AI_TAG} bg-amber-100 text-amber-800`}>
                        <Icon name="clock" size={12} /> {t(lang, "Verification Pending")}
                      </span>
                    )}
                    <span className="text-xs text-faint">Plan: {company.plan || "Freemium"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-faint">
                {t(lang, "1. Basic Company Information")}
              </h3>
              <div className={FORM_GRID}>
                <Input
                  label={t(lang, "Display Name / Brand Name")}
                  value={company.name || ""}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  placeholder="e.g. ABC Technologies Vietnam"
                />
                <Input
                  label={t(lang, "Legal Registered Name")}
                  value={company.legalName || ""}
                  onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
                  placeholder="e.g. Cong ty TNHH ABC Technologies"
                />
                <Input
                  label={t(lang, "Tax Identification Number (Mã số thuế)")}
                  value={company.taxCode || company.regNumber || ""}
                  onChange={(e) =>
                    setCompany({ ...company, taxCode: e.target.value, regNumber: e.target.value })
                  }
                  placeholder="e.g. 0312345678"
                />
                <Input
                  label={t(lang, "Year Founded")}
                  type="number"
                  value={company.foundedYear || ""}
                  onChange={(e) => setCompany({ ...company, foundedYear: e.target.value })}
                  placeholder="e.g. 2018"
                />
                <Select
                  label={t(lang, "Industry")}
                  value={company.industry || "Technology"}
                  onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                  options={INDUSTRIES.map((x) => ({ value: x, label: t(lang, x) }))}
                />
                <Select
                  label={t(lang, "Company Size")}
                  value={company.size || "11–50 employees"}
                  onChange={(e) => setCompany({ ...company, size: e.target.value })}
                  options={SIZES.map((x) => ({ value: x, label: x }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-line pt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-faint">
                {t(lang, "2. Contact & Location")}
              </h3>
              <div className={FORM_GRID}>
                <Input
                  label={t(lang, "Contact Person / HR Lead")}
                  value={company.contactPerson || ""}
                  onChange={(e) => setCompany({ ...company, contactPerson: e.target.value })}
                  placeholder="e.g. Nguyen Van An"
                />
                <Input
                  label={t(lang, "Recruitment / Contact Email")}
                  type="email"
                  value={company.contactEmail || company.email || ""}
                  onChange={(e) => setCompany({ ...company, contactEmail: e.target.value, email: e.target.value })}
                  placeholder="hr@company.com"
                />
                <Input
                  label={t(lang, "Contact Phone / Hotline")}
                  value={company.contactPhone || company.phone || ""}
                  onChange={(e) => setCompany({ ...company, contactPhone: e.target.value, phone: e.target.value })}
                  placeholder="+84 28 1234 5678"
                />
                <Select
                  label={t(lang, "Primary City / Province")}
                  value={company.city || "Ho Chi Minh City"}
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

            <div className="flex flex-col gap-4 border-t border-line pt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-faint">
                {t(lang, "3. Online Presence & Media")}
              </h3>
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
                <Input
                  label={t(lang, "Company Logo Image URL")}
                  value={company.logo || ""}
                  onChange={(e) => setCompany({ ...company, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-line pt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-faint">
                {t(lang, "4. About & Employee Perks")}
              </h3>
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
            </div>

            <div className="pt-2">
              <Button variant="primary" onClick={handleSaveCompany} disabled={savingProfile}>
                {savingProfile ? t(lang, "Saving...") : t(lang, "Save Changes")}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY */}
        {tab === "Security" && (
          <div className="flex flex-col gap-5">
            <p className={`${HINT} mb-2`}>
              <Icon name="shield" size={16} style={{ color: "var(--color-brand)", marginTop: 2 }} />
              <span>
                {t(
                  lang,
                  "Security settings for your employer account. Multi-factor authentication is enforced across all employer portals."
                )}
              </span>
            </p>
            <div className={TOGGLE_ROW}>
              <div>
                <strong className="block text-sm font-bold">{t(lang, "Two-Factor Authentication (OTP)")}</strong>
                <span className="text-xs text-faint">
                  {t(lang, "Verified email code required for employer logins")}
                </span>
              </div>
              <span className={`${AI_TAG} bg-success-bg text-success-fg`}>
                <Icon name="check" size={12} /> {t(lang, "Enforced")}
              </span>
            </div>

            <div className="mt-4 border-t border-line pt-5">
              <h3 className="mb-1.5 text-base font-bold text-ink">{t(lang, "Change Password")}</h3>
              <p className="mb-4 text-sm text-muted">
                {t(lang, "Choose a strong password with at least 8 characters.")}
              </p>
              <div className="max-w-[480px] flex flex-col gap-3">
                <Input
                  label={t(lang, "Current Password")}
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  placeholder="••••••••"
                />
                <Input
                  label={t(lang, "New Password")}
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  placeholder="••••••••"
                />
                <Input
                  label={t(lang, "Confirm New Password")}
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  placeholder="••••••••"
                />
                <div className="mt-2">
                  <Button
                    variant="secondary"
                    onClick={handleUpdatePassword}
                    disabled={changingPw || !pw.current || !pw.next}
                  >
                    {changingPw ? t(lang, "Updating...") : t(lang, "Update Password")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {tab === "Notifications" && (
          <div className="flex flex-col gap-1">
            <h3 className="mb-1 text-base font-bold">{t(lang, "Email & Alert Preferences")}</h3>
            <p className="mb-4 text-sm text-muted">
              {t(lang, "Configure the events that trigger email and dashboard notifications.")}
            </p>
            <Switch
              label={t(lang, "New job applications received")}
              on={settings.notifications.newApplications}
              onChange={(v) =>
                persistSettings({ notifications: { ...settings.notifications, newApplications: v } })
              }
            />
            <Switch
              label={t(lang, "Interview scheduled and candidate confirmations")}
              on={settings.notifications.interviewReminders}
              onChange={(v) =>
                persistSettings({ notifications: { ...settings.notifications, interviewReminders: v } })
              }
            />
            <Switch
              label={t(lang, "Team member activity and role changes")}
              on={settings.notifications.teamActivity}
              onChange={(v) =>
                persistSettings({ notifications: { ...settings.notifications, teamActivity: v } })
              }
            />
            <Switch
              label={t(lang, "Plan quota warnings and subscription renewal")}
              on={settings.notifications.billing}
              onChange={(v) =>
                persistSettings({ notifications: { ...settings.notifications, billing: v } })
              }
            />
            <Switch
              label={t(lang, "Recruiting insights, hiring tips and product updates")}
              on={settings.notifications.marketing}
              onChange={(v) =>
                persistSettings({ notifications: { ...settings.notifications, marketing: v } })
              }
            />
          </div>
        )}

        {/* TAB 4: PIPELINE */}
        {tab === "Pipeline" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-1 text-base font-bold">{t(lang, "Automated Pipeline Rules")}</h3>
              <p className="mb-4 text-sm text-muted">{t(lang, "Configure default behaviors for candidate pipeline.")}</p>
              <div className="flex flex-col">
                <Switch
                  label={t(lang, "Send rejection email automatically upon moving to Rejected")}
                  on={settings.pipeline.autoRejectEmail}
                  onChange={(v) =>
                    persistSettings({ pipeline: { ...settings.pipeline, autoRejectEmail: v } })
                  }
                />
                <Switch
                  label={t(lang, "Delay rejection emails until position is closed")}
                  on={settings.pipeline.delayRejectionEmail}
                  onChange={(v) =>
                    persistSettings({ pipeline: { ...settings.pipeline, delayRejectionEmail: v } })
                  }
                />
              </div>
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="mb-1 text-base font-bold">{t(lang, "Candidate Rejection Templates")}</h3>
              <p className="mb-4 text-sm text-muted">
                {t(lang, "Selectable polite reasons sent to candidates when rejecting an application.")}
              </p>

              <div className="flex flex-col gap-2.5 mb-5">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="rounded-md border border-line p-3.5 bg-sunken/40">
                    <div className="flex items-start justify-between gap-3">
                      <strong className="text-sm font-bold text-ink">{tpl.title}</strong>
                      <div className="flex flex-shrink-0 gap-2">
                        <button
                          className="text-xs font-semibold text-brand hover:underline"
                          onClick={() => {
                            setEditingTpl(tpl.id);
                            setTplDraft({ title: tpl.title, body: tpl.body });
                          }}
                        >
                          {t(lang, "Edit")}
                        </button>
                        <button
                          className="text-xs font-semibold text-danger-fg hover:underline"
                          onClick={() => removeTemplate(tpl.id)}
                        >
                          {t(lang, "Delete")}
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted leading-relaxed">{tpl.body}</p>
                  </div>
                ))}
                {templates.length === 0 && <p className="text-sm text-faint">{t(lang, "No templates configured.")}</p>}
              </div>

              <div className="rounded-md bg-sunken p-4 border border-line">
                <strong className="text-sm font-bold">
                  {editingTpl ? t(lang, "Edit Template") : t(lang, "Create New Template")}
                </strong>
                <div className="mt-3 flex flex-col gap-3">
                  <Input
                    label={t(lang, "Template Title")}
                    value={tplDraft.title}
                    onChange={(e) => setTplDraft({ ...tplDraft, title: e.target.value })}
                    placeholder={t(lang, "e.g. Skillset Mismatch, Position Filled, Experience Level")}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      {t(lang, "Candidate Notification Message")}
                    </label>
                    <textarea
                      className={`${TEXTAREA} min-h-[90px]`}
                      value={tplDraft.body}
                      onChange={(e) => setTplDraft({ ...tplDraft, body: e.target.value })}
                      placeholder={t(
                        lang,
                        "Thank you for taking the time to interview with us. At this time we have decided..."
                      )}
                    />
                  </div>
                  <div className="flex gap-2.5">
                    <Button variant="primary" size="sm" onClick={saveTemplate}>
                      {editingTpl ? t(lang, "Save Template") : t(lang, "Add Template")}
                    </Button>
                    {editingTpl && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingTpl(null);
                          setTplDraft({ title: "", body: "" });
                        }}
                      >
                        {t(lang, "Cancel")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PRIVACY & DATA */}
        {tab === "Privacy & Data" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-1 text-base font-bold">{t(lang, "Candidate Contact Masking")}</h3>
              <p className="mb-4 text-sm text-muted">
                {t(lang, "Control when recruiters can view candidate direct contact numbers and emails.")}
              </p>
              <div className="max-w-[360px]">
                <Select
                  label={t(lang, "Show candidate contact details")}
                  value={settings.privacy.contactVisibility}
                  onChange={(e) =>
                    persistSettings({ privacy: { ...settings.privacy, contactVisibility: e.target.value } })
                  }
                  options={CONTACT_VISIBILITY.map((o) => ({ value: o.value, label: t(lang, o.label) }))}
                />
              </div>
              <div className="mt-3 flex flex-col">
                <Switch
                  label={t(lang, "Always mask candidate email address in applicant lists")}
                  on={settings.privacy.maskEmail}
                  onChange={(v) => persistSettings({ privacy: { ...settings.privacy, maskEmail: v } })}
                />
                <Switch
                  label={t(lang, "Always mask candidate phone number in applicant lists")}
                  on={settings.privacy.maskPhone}
                  onChange={(v) => persistSettings({ privacy: { ...settings.privacy, maskPhone: v } })}
                />
              </div>
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="mb-1 text-base font-bold">{t(lang, "Data Retention & Compliance (BR-012)")}</h3>
              <p className="mb-4 text-sm text-muted">
                {t(lang, "Configure the retention period for rejected applications to satisfy GDPR & data privacy.")}
              </p>
              <div className="max-w-[360px]">
                <Select
                  label={t(lang, "Retain rejected candidate records for")}
                  value={String(settings.retention.candidateDataMonths)}
                  onChange={(e) =>
                    persistSettings({
                      retention: { ...settings.retention, candidateDataMonths: Number(e.target.value) },
                    })
                  }
                  options={RETENTION_MONTHS.map((m) => ({ value: m, label: `${m} ${t(lang, "months")}` }))}
                />
              </div>
              <div className="mt-3">
                <Switch
                  label={t(lang, "Automatically purge rejected records older than retention period")}
                  on={settings.retention.autoPurge}
                  onChange={(v) => persistSettings({ retention: { ...settings.retention, autoPurge: v } })}
                />
              </div>

              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-4 max-md:flex-col">
                  <div>
                    <strong className="block text-sm font-bold text-amber-900">
                      {t(lang, "Manual Data Purge")}
                    </strong>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      {t(
                        lang,
                        "Permanently purge all rejected applications for this company older than the selected retention period."
                      )}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handlePurgeCandidates}
                    disabled={purgingData}
                  >
                    {purgingData ? t(lang, "Purging...") : t(lang, "Purge Old Records Now")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ACCOUNT */}
        {tab === "Account" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-1 text-base font-bold">{t(lang, "Employer Session & Account Details")}</h3>
              <p className="mb-4 text-sm text-muted">{t(lang, "Current tenant session details.")}</p>
              <div className="rounded-md border border-line bg-sunken p-4 max-w-[500px]">
                <div className="flex flex-col gap-2 text-sm">
                  <div>
                    <span className="text-muted">User Account: </span>
                    <strong className="text-ink">{auth.name} ({auth.email})</strong>
                  </div>
                  <div>
                    <span className="text-muted">Assigned Role: </span>
                    <strong className="text-ink">{auth.role}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Company ID: </span>
                    <strong className="text-ink">{auth.companyId || company.id || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Organization Name: </span>
                    <strong className="text-ink">{company.name}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="mb-1 text-base font-bold text-ink">{t(lang, "Sign Out")}</h3>
              <p className="mb-3 text-sm text-muted">
                {t(lang, "End your current session on this device. Scoped tenant data in cache is cleared.")}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  router.push("/employer-login");
                }}
              >
                {t(lang, "Sign Out of Workspace")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </>
  );
}

export default function CompanySettingsPage() {
  return (
    <RequirePermission perm="settings.manage">
      <Settings />
    </RequirePermission>
  );
}
