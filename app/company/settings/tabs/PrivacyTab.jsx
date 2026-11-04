"use client";

import React, { useState } from "react";
import Button from "../../../../components/ds/Button";
import Select from "../../../../components/ds/Select";
import Switch from "../components/Switch";
import * as companyApi from "../../../../lib/api/companyApi";

const CONTACT_VISIBILITY = [
  { value: "always", label: "Always visible" },
  { value: "after_shortlist", label: "Only after Shortlisted" },
  { value: "never", label: "Never (masked)" },
];

const RETENTION_MONTHS = ["6", "12", "24", "36"];

export default function PrivacyTab({
  lang,
  t,
  settings,
  persistSettings,
  setToast,
}) {
  const [purgingData, setPurgingData] = useState(false);
  const privacy = settings?.privacy || {};
  const retention = settings?.retention || {};

  const handlePurgeCandidates = async () => {
    setPurgingData(true);
    try {
      const months = Number(retention?.purgeRejectedMonths || 6);
      const res = await companyApi.purgeCompanyData(months);
      const msg = res?.message || t(lang, "Candidates older than retention limit purged.");
      setToast(msg);
    } catch (e) {
      setToast(t(lang, e.message || "Failed to purge data."));
    } finally {
      setPurgingData(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-ink">
          {t(lang, "Candidate Contact Masking")}
        </h3>
        <p className="mb-4 text-sm text-muted">
          {t(
            lang,
            "Control when recruiters can view candidate direct contact numbers and emails."
          )}
        </p>
        <div className="max-w-[360px]">
          <Select
            label={t(lang, "Show candidate contact details")}
            value={privacy.contactVisibility || "always"}
            onChange={(e) =>
              persistSettings({
                privacy: { ...privacy, contactVisibility: e.target.value },
              })
            }
            options={CONTACT_VISIBILITY.map((o) => ({
              value: o.value,
              label: t(lang, o.label),
            }))}
          />
        </div>
        <div className="mt-3 flex flex-col">
          <Switch
            label={t(lang, "Always mask candidate email address in applicant lists")}
            description={t(lang, "Hides raw email address until candidate is reviewed")}
            on={privacy.maskEmail}
            onChange={(v) =>
              persistSettings({ privacy: { ...privacy, maskEmail: v } })
            }
          />
          <Switch
            label={t(lang, "Always mask candidate phone number in applicant lists")}
            description={t(lang, "Protects phone number privacy in public list views")}
            on={privacy.maskPhone}
            onChange={(v) =>
              persistSettings({ privacy: { ...privacy, maskPhone: v } })
            }
          />
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <h3 className="mb-1 text-base font-bold text-ink">
          {t(lang, "Data Retention & Compliance")}
        </h3>
        <p className="mb-4 text-sm text-muted">
          {t(
            lang,
            "Configure the retention period for rejected applications to satisfy GDPR & data privacy."
          )}
        </p>
        <div className="max-w-[360px]">
          <Select
            label={t(lang, "Retain rejected candidate records for")}
            value={String(retention.candidateDataMonths || 6)}
            onChange={(e) =>
              persistSettings({
                retention: {
                  ...retention,
                  candidateDataMonths: Number(e.target.value),
                },
              })
            }
            options={RETENTION_MONTHS.map((m) => ({
              value: m,
              label: `${m} ${t(lang, "months")}`,
            }))}
          />
        </div>
        <div className="mt-3">
          <Switch
            label={t(
              lang,
              "Automatically purge rejected records older than retention period"
            )}
            on={retention.autoPurge}
            onChange={(v) =>
              persistSettings({ retention: { ...retention, autoPurge: v } })
            }
          />
        </div>
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-4 max-md:flex-col">
            <div>
              <strong className="block text-sm font-bold text-amber-900">
                {t(lang, "Manual Data Purge")}
              </strong>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {t(
                  lang,
                  "Permanently purge all rejected applications for this company older than the selected retention period."
                )}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handlePurgeCandidates}
              disabled={purgingData}
            >
              {purgingData ? t(lang, "Purging...") : t(lang, "Purge Old Records Now")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

