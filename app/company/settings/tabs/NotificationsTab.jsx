"use client";

import React from "react";
import Switch from "../components/Switch";
import Select from "../../../../components/ds/Select";

export default function NotificationsTab({
  lang = "EN",
  t = (l, k) => k,
  settings,
  persistSettings,
  setToast,
}) {
  const notifs = settings?.notifications || {};
  const currentNotifLang = notifs.language || "vi";

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Employee / Recruiter Language Settings */}
      <div>
        <h3 className="mb-1 text-base font-bold text-ink">
          {t(lang, "Communication & Notification Language")}
        </h3>
        <p className="mb-3 text-xs text-muted">
          {t(
            lang,
            "Choose your preferred language for automated recruitment alerts, candidate updates, and system notifications."
          )}
        </p>

        <div className="max-w-[360px]">
          <Select
            label={t(lang, "Preferred Notification Language")}
            value={currentNotifLang}
            onChange={(e) => {
              const chosen = e.target.value;
              if (!chosen) return;
              persistSettings({
                notifications: {
                  ...notifs,
                  language: chosen,
                },
              });
              setToast?.(t(lang, "Notification language preference updated"));
            }}
            options={[
              { value: "vi", label: "Tiếng Việt (Vietnamese) — Mặc định" },
              { value: "en", label: "English" },
            ]}
          />
        </div>
      </div>

      {/* 2. Notification Subscriptions */}
      <div className="border-t border-line pt-5 flex flex-col gap-1">
        <h3 className="mb-1 text-base font-bold text-ink">{t(lang, "Email & Alert Preferences")}</h3>
        <p className="mb-4 text-sm text-muted">
          {t(lang, "Configure the events that trigger email and dashboard notifications.")}
        </p>

        <Switch
          label={t(lang, "New job applications received")}
          description={t(lang, "Receive an email whenever a job seeker applies for your open roles")}
          on={notifs.newApplications}
          onChange={(v) =>
            persistSettings({ notifications: { ...notifs, newApplications: v } })
          }
        />
        <Switch
          label={t(lang, "Interview scheduled and candidate confirmations")}
          description={t(lang, "Instant alerts when candidates confirm or request reschedule")}
          on={notifs.interviewReminders}
          onChange={(v) =>
            persistSettings({ notifications: { ...notifs, interviewReminders: v } })
          }
        />
        <Switch
          label={t(lang, "Team member activity and role changes")}
          description={t(lang, "Updates regarding collaborator access and stage reviews")}
          on={notifs.teamActivity}
          onChange={(v) =>
            persistSettings({ notifications: { ...notifs, teamActivity: v } })
          }
        />
        <Switch
          label={t(lang, "Plan quota warnings and subscription renewal")}
          description={t(lang, "Alerts when approaching active job post limits or renewal deadlines")}
          on={notifs.billing}
          onChange={(v) =>
            persistSettings({ notifications: { ...notifs, billing: v } })
          }
        />
        <Switch
          label={t(lang, "Recruiting insights, hiring tips and product updates")}
          description={t(lang, "Periodic updates on platform features and labor market analytics")}
          on={notifs.marketing}
          onChange={(v) =>
            persistSettings({ notifications: { ...notifs, marketing: v } })
          }
        />
      </div>
    </div>
  );
}
