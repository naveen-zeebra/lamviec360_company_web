"use client";

import { useEffect, useState } from "react";
import Toast, { useToast } from "../../../components/ds/Toast";
import RequirePermission from "../../../components/company/RequirePermission";
import { useLang, t } from "../../../utils/lang";
import {
  getCompany,
  getSettings,
  saveSettings,
  getAuth,
  listRejectionTemplates,
  syncCompanyWithBackend,
} from "../../../lib/companyStore";

import SecurityTab from "./tabs/SecurityTab";
import NotificationsTab from "./tabs/NotificationsTab";
import CommsTemplatesTab from "./tabs/CommsTemplatesTab";
import PrivacyTab from "./tabs/PrivacyTab";
import AccountTab from "./tabs/AccountTab";

const TABS = [
  "Security",
  "Notifications",
  "Candidate Comms & Templates",
  "Privacy & Data",
  "Account",
];

function Settings() {
  const [lang] = useLang();
  const [tab, setTab] = useState("Security");
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState(null);
  const [auth, setAuth] = useState(null);
  const [templates, setTemplates] = useState([]);
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

  if (!company || !settings || !auth) return null;

  return (
    <>
      <div className="mb-6">
        <h1 className="mb-1.5 text-2xl font-extrabold text-ink">{t(lang, "Settings")}</h1>
        <p className="text-sm text-muted">
          {t(
            lang,
            "Manage your organization profile, security, notifications, and ATS preferences."
          )}
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
        {tab === "Security" && (
          <SecurityTab lang={lang} t={t} setToast={setToast} />
        )}

        {tab === "Notifications" && (
          <NotificationsTab
            lang={lang}
            t={t}
            settings={settings}
            persistSettings={persistSettings}
            setToast={setToast}
          />
        )}

        {tab === "Candidate Comms & Templates" && (
          <CommsTemplatesTab
            lang={lang}
            t={t}
            settings={settings}
            persistSettings={persistSettings}
          />
        )}

        {tab === "Privacy & Data" && (
          <PrivacyTab
            lang={lang}
            t={t}
            settings={settings}
            persistSettings={persistSettings}
            setToast={setToast}
          />
        )}

        {tab === "Account" && (
          <AccountTab
            lang={lang}
            t={t}
            auth={auth}
            company={company}
          />
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
