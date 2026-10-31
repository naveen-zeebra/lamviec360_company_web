"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "../ds/Icon";
import { Button } from "../ds";
import { useLang, t } from "../../utils/lang";
import { getAuth, can, ROLE_SUMMARY, getRoleDisplayName } from "../../lib/companyStore";

// Page-level RBAC guard — Company doc §11 / §22.
export default function RequirePermission({ action, children }) {
  const [lang] = useLang();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const updateRole = () => {
      const currentRole = getAuth().role;
      setRole(currentRole);
    };
    updateRole();
    window.addEventListener("lv360-store", updateRole);
    return () => window.removeEventListener("lv360-store", updateRole);
  }, []);

  if (role === null) return null;

  if (!can(role, action)) {
    const displayRole = getRoleDisplayName ? getRoleDisplayName(role) : role;
    const summary = ROLE_SUMMARY[role] || ROLE_SUMMARY[displayRole] || "";
    return (
      <div className="mx-auto my-10 max-w-[520px] rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted" role="alert">
        <Icon name="lock" size={28} style={{ color: "var(--color-faint)", margin: "0 auto 12px" }} />
        <h3 className="mb-2 text-lg">{t(lang, "You don't have access to this area")}</h3>
        <p>
          {t(lang, "Your current role is")} <strong>{t(lang, displayRole)}</strong>.{summary ? ` ${t(lang, summary)}` : ""}
        </p>
        <div className="mt-5">
          <Link href="/company/overview">
            <Button variant="secondary">{t(lang, "Back to Overview")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
