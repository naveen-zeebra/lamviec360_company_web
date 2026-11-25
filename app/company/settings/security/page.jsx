"use client";

import SettingsSectionShell from "../components/SettingsSectionShell";
import SecurityTab from "../tabs/SecurityTab";

export default function SecuritySettingsPage() {
  return (
    <SettingsSectionShell
      title="Security"
      description="Manage two-factor authentication, password policies, and active workspace security."
    >
      {({ lang, t, setToast }) => (
        <SecurityTab lang={lang} t={t} setToast={setToast} />
      )}
    </SettingsSectionShell>
  );
}
