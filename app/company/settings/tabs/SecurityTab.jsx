"use client";

import React, { useState } from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";
import Input from "../../../../components/ds/Input";
import * as companyApi from "../../../../lib/api/companyApi";

const HINT = "flex items-start gap-2 rounded-md bg-brand-subtle px-4 py-3 text-sm leading-relaxed text-muted";
const TOGGLE_ROW = "flex items-center justify-between border-b border-line py-3.5 text-base last:border-0";
const AI_TAG = "inline-flex items-center gap-1 rounded-pill px-2 py-[3px] text-[11px] font-bold tracking-[0.02em]";

export default function SecurityTab({ lang, t, setToast }) {
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  const handleUpdatePassword = async () => {
    if (!pw.current) {
      setToast(t(lang, "Please enter your current password."));
      return;
    }
    if (!pw.next || pw.next.length < 8) {
      setToast(t(lang, "New password must be at least 8 characters."));
      return;
    }
    if (pw.next !== pw.confirm) {
      setToast(t(lang, "New passwords do not match."));
      return;
    }
    setChangingPw(true);
    try {
      await companyApi.changeCompanyPassword({
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      setPw({ current: "", next: "", confirm: "" });
      setToast(t(lang, "Password updated successfully!"));
    } catch (e) {
      setToast(t(lang, e.message || "Failed to change password."));
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className={`${HINT} mb-2`}>
        <Icon name="shield" size={16} style={{ color: "var(--color-brand)", marginTop: 2 }} />
        <span>
          {t(
            lang,
            "Security settings for your employer account. Multi-factor authentication is enforced across all employer portals."
          )}
        </span>
      </p>

      <div className={TOGGLE_ROW}>
        <div>
          <strong className="block text-sm font-bold text-ink">
            {t(lang, "Two-Factor Authentication (OTP)")}
          </strong>
          <span className="text-xs text-muted">
            {t(lang, "Verified email code required for employer logins")}
          </span>
        </div>
        <span className={`${AI_TAG} bg-success-bg text-success-fg`}>
          <Icon name="check" size={12} /> {t(lang, "Enforced")}
        </span>
      </div>

      <div className="mt-4 border-t border-line pt-5">
        <h3 className="mb-1.5 text-base font-bold text-ink">{t(lang, "Change Password")}</h3>
        <p className="mb-4 text-sm text-muted">
          {t(lang, "Choose a strong password with at least 8 characters.")}
        </p>
        <div className="max-w-[480px] flex flex-col gap-3">
          <Input
            label={t(lang, "Current Password")}
            type="password"
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
            placeholder="••••••••"
          />
          <Input
            label={t(lang, "New Password")}
            type="password"
            value={pw.next}
            onChange={(e) => setPw({ ...pw, next: e.target.value })}
            placeholder="••••••••"
          />
          <Input
            label={t(lang, "Confirm New Password")}
            type="password"
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            placeholder="••••••••"
          />
          <div className="mt-2">
            <Button
              variant="secondary"
              onClick={handleUpdatePassword}
              disabled={changingPw || !pw.current || !pw.next}
            >
              {changingPw ? t(lang, "Updating...") : t(lang, "Update Password")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

