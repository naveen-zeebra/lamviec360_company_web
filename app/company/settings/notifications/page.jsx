"use client";

import SettingsSectionShell from "../components/SettingsSectionShell";
import NotificationsTab from "../tabs/NotificationsTab";

export default function NotificationsSettingsPage() {
  return (
    <SettingsSectionShell
      title="Notifications"
      description="Configure email and workspace notification preferences for applications and interviews."
    >
      {({ lang, t, settings, persistSettings, setToast }) => (
        <NotificationsTab
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
