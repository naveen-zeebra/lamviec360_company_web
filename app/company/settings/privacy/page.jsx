"use client";

import SettingsSectionShell from "../components/SettingsSectionShell";
import PrivacyTab from "../tabs/PrivacyTab";

export default function PrivacySettingsPage() {
  return (
    <SettingsSectionShell
      title="Privacy & Data"
      description="Control candidate contact visibility, masking rules, and data retention policies."
    >
      {({ lang, t, settings, persistSettings, setToast }) => (
        <PrivacyTab
          lang={lang}
          t={t}
          settings={settings}
          persistSettings={persistSettings}
          setToast={setToast}
        />
      )}
    </SettingsSectionShell>
  );
}
