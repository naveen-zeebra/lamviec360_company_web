"use client";

import SettingsSectionShell from "../components/SettingsSectionShell";
import CommsTemplatesTab from "../tabs/CommsTemplatesTab";

export default function CommsTemplatesSettingsPage() {
  return (
    <SettingsSectionShell
      title="Candidate Comms & Templates"
      description="Configure candidate rejection rules, automated delivery delays, and email communication templates."
    >
      {({ lang, t, settings, persistSettings }) => (
        <CommsTemplatesTab
          lang={lang}
          t={t}
          settings={settings}
          persistSettings={persistSettings}
        />
      )}
    </SettingsSectionShell>
  );
}
