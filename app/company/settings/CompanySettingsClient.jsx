"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  getAllConfiguredStages,
  saveConfiguredStages,
  resetPipelineStagesToDefault,
  resolveCompanyLogoUrl,
} from "../../../lib/companyStore";
const TABS = ["Security", "Notifications", "Privacy & Data", "Account"];
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
  const isChecked = Boolean(on);
  return (
    <div className={TOGGLE_ROW}>
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={label}
        onClick={() => onChange(!isChecked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isChecked ? "bg-blue-600" : "bg-gray-300"
          }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isChecked ? "translate-x-5" : "translate-x-0"
            }`}
        />
      </button>
    </div>
  );
}
function Settings() {
  const [lang] = useLang();
  const router = useRouter();
  const [tab, setTab] = useState("Security");
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState(null);
  const [auth, setAuth] = useState(null);
  const [changingPw, setChangingPw] = useState(false);
  const [purgingData, setPurgingData] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [templates, setTemplates] = useState([]);
  const [tplDraft, setTplDraft] = useState({ title: "", body: "" });
  const [editingTpl, setEditingTpl] = useState(null);
  const [stages, setStages] = useState([]);
  const [newStageName, setNewStageName] = useState("");
  const [toast, setToast] = useToast();
  const [logoError, setLogoError] = useState(false);
  const fileInputRef = useRef(null);
  const [newValueDraft, setNewValueDraft] = useState({ title: "", description: "" });
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
  const loadData = () => {
    setCompany(getCompany());
    setLogoError(false);
    setSettings(getSettings());
    setAuth(getAuth());
    setTemplates(listRejectionTemplates());
    setStages(getAllConfiguredStages());
  };
  const handleToggleStage = async (id) => {
    const nextStages = stages.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setStages(nextStages);
    try {
      await saveConfiguredStages(nextStages);
      setToast(t(lang, "Pipeline stages updated"));
    } catch (e) {
      setToast(t(lang, "Failed to update stages"));
    }
  };
  const handleMoveStage = async (idx, dir) => {
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= stages.length) return;
    const nextStages = [...stages];
    const [moved] = nextStages.splice(idx, 1);
    nextStages.splice(targetIdx, 0, moved);
    setStages(nextStages);
    try {
      await saveConfiguredStages(nextStages);
      setToast(t(lang, "Pipeline order updated"));
    } catch (e) {
      setToast(t(lang, "Failed to update order"));
    }
  };
  const handleAddCustomStage = async () => {
    const clean = newStageName.trim();
    if (!clean) return;
    if (stages.some((s) => s.label.toLowerCase() === clean.toLowerCase())) {
      setToast(t(lang, "A stage with this name already exists."));
      return;
    }
    const newStage = {
      id: "custom_" + Date.now(),
      label: clean,
      description: "Custom stage",
      required: false,
      enabled: true,
      custom: true,
    };
    const rejIdx = stages.findIndex((s) => s.id === "rejected");
    const nextStages = rejIdx >= 0 ? [...stages.slice(0, rejIdx), newStage, ...stages.slice(rejIdx)] : [...stages, newStage];
    setStages(nextStages);
    setNewStageName("");
    try {
      await saveConfiguredStages(nextStages);
      setToast(t(lang, "New stage added to pipeline"));
    } catch (e) {
      setToast(t(lang, "Failed to add stage"));
    }
  };
  const handleDeleteCustomStage = async (id) => {
    const nextStages = stages.filter((s) => s.id !== id);
    setStages(nextStages);
    try {
      await saveConfiguredStages(nextStages);
      setToast(t(lang, "Stage removed"));
    } catch (e) {
      setToast(t(lang, "Failed to remove stage"));
    }
  };
  const handleResetStages = async () => {
    if (window.confirm(t(lang, "Reset all pipeline stages to the standard default setup?"))) {
      try {
        const def = await resetPipelineStagesToDefault();
        setStages(def);
        setToast(t(lang, "Pipeline reset to standard stages"));
      } catch (e) {
        setToast(t(lang, "Failed to reset stages"));
      }
    }
  };
  useEffect(() => {
    loadData();
    syncCompanyWithBackend(true).then(loadData).catch(console.warn);
  }, []);
  if (!company || !settings || !auth) return null;
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
        {/* TAB 1: SECURITY */}
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
              <h3 className="mb-1 text-base font-bold">{t(lang, "Data Retention & Compliance")}</h3>
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
    <RequirePermission action="settings.manage">
      <Settings />
    </RequirePermission>
  );
}
