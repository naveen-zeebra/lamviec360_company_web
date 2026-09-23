"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Toast, { useToast } from "../../../components/ds/Toast";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
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
  purgeRejectedCandidates,
} from "../../../lib/companyStore";

const TABS = ["Company Profile", "Security", "Notifications", "Pipeline", "Privacy & Data", "Account"];
const CONTACT_VISIBILITY = [
  { value: "always", label: "Always visible" },
  { value: "after_shortlist", label: "Only after Shortlisted" },
  { value: "never", label: "Never (masked)" },
];
const RETENTION_MONTHS = ["6", "12", "24", "36"];
const INDUSTRIES = ["Technology", "Retail & Commerce", "Media & Creative", "Transport & Logistics", "Manufacturing", "Finance & Banking", "Other"];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

const FORM_GRID = "grid grid-cols-2 gap-4 gap-x-5 max-md:grid-cols-1";
const TEXTAREA = "w-full resize-y rounded-md border-[1.5px] border-line px-3.5 py-[11px] font-body text-base text-ink focus:border-line-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100";
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
        <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform ${on ? "translate-x-[23px]" : "translate-x-[3px]"}`} />
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
  const [confirmReset, setConfirmReset] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [templates, setTemplates] = useState([]);
  const [tplDraft, setTplDraft] = useState({ title: "", body: "" });
  const [editingTpl, setEditingTpl] = useState(null);
  const [toast, setToast] = useToast();

  useEffect(() => {
    setCompany(getCompany());
    setSettings(getSettings());
    setAuth(getAuth());
    setTemplates(listRejectionTemplates());
  }, []);

  if (!company || !settings || !auth) return null;

  const persistCompany = (patch) => {
    setCompany((c) => ({ ...c, ...patch }));
    saveCompany(patch);
  };
  const persistSettings = (patch) => {
    setSettings((s) => ({ ...s, ...patch }));
    saveSettings(patch);
    setToast(t(lang, "Saved"));
  };

  const saveTemplate = () => {
    if (!tplDraft.title.trim() || !tplDraft.body.trim()) {
      setToast(t(lang, "Add a title and message."));
      return;
    }
    if (editingTpl) updateRejectionTemplate(editingTpl, tplDraft);
    else addRejectionTemplate(tplDraft);
    setTemplates(listRejectionTemplates());
    setTplDraft({ title: "", body: "" });
    setEditingTpl(null);
    setToast(t(lang, "Template saved"));
  };
  const removeTemplate = (id) => {
    deleteRejectionTemplate(id);
    setTemplates(listRejectionTemplates());
    if (editingTpl === id) {
      setEditingTpl(null);
      setTplDraft({ title: "", body: "" });
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1.5 text-2xl font-extrabold">{t(lang, "Settings")}</h1>
        <p className="text-sm text-muted">{t(lang, "Company profile, security, notifications and account.")}</p>
      </div>

      <div className="mb-7 flex max-w-[720px] gap-1.5 overflow-x-auto rounded-md bg-sunken p-1">
        {TABS.map((tb) => (
          <button
            key={tb}
            className={[
              "flex-1 whitespace-nowrap rounded-sm px-3 py-2 text-sm font-semibold",
              tab === tb ? "bg-card text-brand shadow-xs" : "text-muted",
            ].join(" ")}
            onClick={() => setTab(tb)}
          >
            {t(lang, tb)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-card p-8 shadow-md max-md:p-5">
        {tab === "Company Profile" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              {company.verified ? (
                <span className={`${AI_TAG} bg-success-bg text-success-fg`}>
                  <Icon name="badge-check" size={12} /> {t(lang, "Verified Company")}
                </span>
              ) : (
                <span className={`${AI_TAG} bg-brand-subtle text-brand`}>{t(lang, "Pending verification")}</span>
              )}
            </div>
            <div className={FORM_GRID}>
              <Input label={t(lang, "Company Name")} value={company.name} onChange={(e) => persistCompany({ name: e.target.value })} />
              <Input label={t(lang, "Business Registration Number")} value={company.regNumber} onChange={(e) => persistCompany({ regNumber: e.target.value })} />
              <Select label={t(lang, "Industry")} value={company.industry} onChange={(e) => persistCompany({ industry: e.target.value })} options={INDUSTRIES.map((x) => ({ value: x, label: t(lang, x) }))} />
              <Select label={t(lang, "Company Size")} value={company.size} onChange={(e) => persistCompany({ size: e.target.value })} options={SIZES.map((x) => ({ value: x, label: x }))} />
              <Input label={t(lang, "Website URL")} value={company.website} onChange={(e) => persistCompany({ website: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">{t(lang, "Description")}</label>
              <textarea className={`${TEXTAREA} min-h-[110px]`} value={company.description} onChange={(e) => persistCompany({ description: e.target.value })} />
            </div>
            <div>
              <Button variant="primary" onClick={() => setToast(t(lang, "Company profile saved"))}>
                {t(lang, "Save changes")}
              </Button>
            </div>
          </div>
        )}

        {tab === "Security" && (
          <div className="flex flex-col gap-2">
            <p className={`${HINT} mb-3`}>
              <Icon name="shield" size={16} style={{ color: "var(--color-brand)", marginTop: 2 }} />
              <span>{t(lang, "Two-factor authentication is mandatory for Company Admins and cannot be disabled.")}</span>
            </p>
            <div className={TOGGLE_ROW}>
              <span>{t(lang, "Two-factor authentication (OTP)")}</span>
              <span className={`${AI_TAG} bg-success-bg text-success-fg`}>{t(lang, "Always on")}</span>
            </div>
            <p className="mt-2 text-xs text-faint">
              {t(lang, "Admins are challenged for a 6-digit code at sign-in. This is enforced for all company accounts.")}
            </p>
            <div className="mt-4">
              <h3 className="mb-3 text-base font-bold">{t(lang, "Change Password")}</h3>
              <div className={FORM_GRID}>
                <Input label={t(lang, "Current password")} type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="••••••••" />
                <Input label={t(lang, "New password")} type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="mt-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!pw.current || pw.next.length < 8) {
                      setToast(t(lang, "New password must be at least 8 characters."));
                      return;
                    }
                    setPw({ current: "", next: "" });
                    setToast(t(lang, "Password updated"));
                  }}
                >
                  {t(lang, "Update Password")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === "Notifications" && (
          <div className="flex flex-col">
            <Switch label={t(lang, "New applications")} on={settings.notifications.newApplications} onChange={(v) => persistSettings({ notifications: { ...settings.notifications, newApplications: v } })} />
            <Switch label={t(lang, "Interview reminders")} on={settings.notifications.interviewReminders} onChange={(v) => persistSettings({ notifications: { ...settings.notifications, interviewReminders: v } })} />
            <Switch label={t(lang, "Team activity")} on={settings.notifications.teamActivity} onChange={(v) => persistSettings({ notifications: { ...settings.notifications, teamActivity: v } })} />
            <Switch label={t(lang, "Billing and quota alerts")} on={settings.notifications.billing} onChange={(v) => persistSettings({ notifications: { ...settings.notifications, billing: v } })} />
            <Switch label={t(lang, "Product news")} on={settings.notifications.marketing} onChange={(v) => persistSettings({ notifications: { ...settings.notifications, marketing: v } })} />
          </div>
        )}

        {tab === "Pipeline" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col">
              <Switch label={t(lang, "Send rejection email automatically")} on={settings.pipeline.autoRejectEmail} onChange={(v) => persistSettings({ pipeline: { ...settings.pipeline, autoRejectEmail: v } })} />
              <Switch label={t(lang, "Delay rejection emails until end of hiring")} on={settings.pipeline.delayRejectionEmail} onChange={(v) => persistSettings({ pipeline: { ...settings.pipeline, delayRejectionEmail: v } })} />
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="mb-1 text-base font-bold">{t(lang, "Rejection reason templates")}</h3>
              <p className="mb-4 text-sm text-muted">{t(lang, "Recruiters pick one of these when moving a candidate to Rejected.")}</p>

              <div className="flex flex-col gap-2.5">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="rounded-md border border-line p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <strong className="text-sm">{tpl.title}</strong>
                      <div className="flex flex-shrink-0 gap-1.5">
                        <button className="text-xs font-semibold text-brand" onClick={() => { setEditingTpl(tpl.id); setTplDraft({ title: tpl.title, body: tpl.body }); }}>
                          {t(lang, "Edit")}
                        </button>
                        <button className="text-xs font-semibold text-danger-fg" onClick={() => removeTemplate(tpl.id)}>
                          {t(lang, "Delete")}
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted">{tpl.body}</p>
                  </div>
                ))}
                {templates.length === 0 && <p className="text-sm text-faint">{t(lang, "No templates yet.")}</p>}
              </div>

              <div className="mt-4 rounded-md bg-sunken p-4">
                <strong className="text-sm">{editingTpl ? t(lang, "Edit template") : t(lang, "New template")}</strong>
                <div className="mt-2.5 flex flex-col gap-2.5">
                  <Input label={t(lang, "Title")} value={tplDraft.title} onChange={(e) => setTplDraft({ ...tplDraft, title: e.target.value })} placeholder={t(lang, "e.g. Not enough experience")} />
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">{t(lang, "Message to candidate")}</label>
                    <textarea className={`${TEXTAREA} min-h-[90px]`} value={tplDraft.body} onChange={(e) => setTplDraft({ ...tplDraft, body: e.target.value })} />
                  </div>
                  <div className="flex gap-2.5">
                    <Button variant="primary" size="sm" onClick={saveTemplate}>{editingTpl ? t(lang, "Save template") : t(lang, "Add template")}</Button>
                    {editingTpl && (
                      <Button variant="secondary" size="sm" onClick={() => { setEditingTpl(null); setTplDraft({ title: "", body: "" }); }}>{t(lang, "Cancel")}</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Privacy & Data" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-1 text-base font-bold">{t(lang, "Candidate contact visibility")}</h3>
              <p className="mb-4 text-sm text-muted">{t(lang, "Control when recruiters can see a candidate's email and phone number.")}</p>
              <div className="max-w-[360px]">
                <Select
                  label={t(lang, "Show contact details")}
                  value={settings.privacy.contactVisibility}
                  onChange={(e) => persistSettings({ privacy: { ...settings.privacy, contactVisibility: e.target.value } })}
                  options={CONTACT_VISIBILITY.map((o) => ({ value: o.value, label: t(lang, o.label) }))}
                />
              </div>
              <div className="mt-2">
                <Switch label={t(lang, "Always mask email address")} on={settings.privacy.maskEmail} onChange={(v) => persistSettings({ privacy: { ...settings.privacy, maskEmail: v } })} />
                <Switch label={t(lang, "Always mask phone number")} on={settings.privacy.maskPhone} onChange={(v) => persistSettings({ privacy: { ...settings.privacy, maskPhone: v } })} />
              </div>
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="mb-1 text-base font-bold">{t(lang, "Data retention")}</h3>
              <p className="mb-4 text-sm text-muted">{t(lang, "How long candidate data is kept after a role is closed (BR-012).")}</p>
              <div className="max-w-[360px]">
                <Select
                  label={t(lang, "Keep candidate data for")}
                  value={String(settings.retention.candidateDataMonths)}
                  onChange={(e) => persistSettings({ retention: { ...settings.retention, candidateDataMonths: Number(e.target.value) } })}
                  options={RETENTION_MONTHS.map((m) => ({ value: m, label: `${m} ${t(lang, "months")}` }))}
                />
              </div>
              <div className="mt-2">
                <Switch
                  label={t(lang, "Auto-purge rejected candidates after 6 months")}
                  on={settings.retention.autoPurge}
                  onChange={(v) => persistSettings({ retention: { ...settings.retention, autoPurge: v } })}
                />
              </div>
              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const n = purgeRejectedCandidates(settings.retention.purgeRejectedMonths || 6);
                    setToast(n ? `${n} ${t(lang, "records purged")}` : t(lang, "Nothing to purge"));
                  }}
                >
                  {t(lang, "Run purge now")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === "Account" && (
          <div className="flex flex-col gap-6">
            <div className={FORM_GRID}>
              <Input label={t(lang, "Your name")} value={auth.name} onChange={() => {}} />
              <Input label={t(lang, "Your email")} value={auth.email} onChange={() => {}} />
              <Input label={t(lang, "Your role")} value={t(lang, auth.role)} onChange={() => {}} />
            </div>
            <div className="flex flex-wrap gap-3 border-t border-line pt-5">
              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  router.push("/employer-login");
                }}
              >
                <Icon name="log-out" size={16} /> {t(lang, "Logout")}
              </Button>
              {!confirmReset ? (
                <Button variant="ghost" onClick={() => setConfirmReset(true)}>
                  {t(lang, "Reset demo data")}
                </Button>
              ) : (
                <div className="flex flex-col items-start gap-2.5 rounded-md border border-red-100 bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger-fg" role="alert">
                  <span>{t(lang, "This clears all prototype company data on this device.")}</span>
                  <div className="flex gap-2.5">
                    <Button variant="danger" size="sm" onClick={() => { resetAll(); router.push("/employer-login"); }}>
                      {t(lang, "Confirm reset")}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>
                      {t(lang, "Cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Toast msg={toast} />
    </>
  );
}

export default function CompanySettingsClient() {
  return (
    <RequirePermission action="settings.manage">
      <Settings />
    </RequirePermission>
  );
}
