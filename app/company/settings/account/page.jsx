"use client";

import SettingsSectionShell from "../components/SettingsSectionShell";
import AccountTab from "../tabs/AccountTab";

export default function AccountSettingsPage() {
  return (
    <SettingsSectionShell
      title="Account"
      description="View your workspace account details, role assignment, and organization profile summary."
    >
      {({ lang, t, auth, company }) => (
        <AccountTab lang={lang} t={t} auth={auth} company={company} />
      )}
    </SettingsSectionShell>
  );
}
