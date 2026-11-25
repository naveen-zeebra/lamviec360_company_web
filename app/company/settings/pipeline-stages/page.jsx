"use client";

import SettingsSectionShell from "../components/SettingsSectionShell";
import PipelineStagesTab from "../tabs/PipelineStagesTab";

export default function PipelineStagesSettingsPage() {
  return (
    <SettingsSectionShell
      title="Pipeline Stages"
      description="Configure candidate pipeline stages for your organization. Reorder, rename, or add custom stages."
    >
      {({ lang, t, settings, persistSettings, setToast, refreshSettings }) => (
        <PipelineStagesTab
          lang={lang}
          t={t}
          settings={settings}
          persistSettings={persistSettings}
          setToast={setToast}
          onStagesUpdated={refreshSettings}
        />
      )}
    </SettingsSectionShell>
  );
}
