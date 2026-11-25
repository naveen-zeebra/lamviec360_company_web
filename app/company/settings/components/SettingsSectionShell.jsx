"use client";

import { useEffect, useState } from "react";
import Toast, { useToast } from "../../../../components/ds/Toast";
import RequirePermission from "../../../../components/company/RequirePermission";
import { useLang, t } from "../../../../utils/lang";
import {
  getCompany,
  getSettings,
  saveSettings,
  getAuth,
  syncCompanyWithBackend,
} from "../../../../lib/companyStore";

export default function SettingsSectionShell({ title, description, children }) {
  const [lang] = useLang();
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState(null);
  const [auth, setAuth] = useState(null);
  const [toast, setToast] = useToast();

  const loadData = () => {
    setCompany(getCompany());
    setSettings(getSettings());
    setAuth(getAuth());
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

  const refreshSettings = () => {
    setSettings(getSettings());
  };

  return (
    <RequirePermission action="settings.manage">
      {!company || !settings || !auth ? null : (
        <>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              {t(lang, "Settings")}
            </p>
            <h1 className="mb-1.5 text-2xl font-extrabold text-ink">{t(lang, title)}</h1>
            {description && (
              <p className="text-sm text-muted">{t(lang, description)}</p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-card p-8 shadow-md max-md:p-5">
            {children({
              lang,
              t,
              company,
              settings,
              auth,
              persistSettings,
              refreshSettings,
              setToast,
            })}
          </div>

          <Toast message={toast} onClose={() => setToast(null)} />
        </>
      )}
    </RequirePermission>
  );
}
