"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Button from "../../../../components/ds/Button";
import { logout } from "../../../../lib/companyStore";

export default function AccountTab({ lang, t, auth, company }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-ink">
          {t(lang, "Employer Session & Account Details")}
        </h3>
        <p className="mb-4 text-sm text-muted">
          {t(lang, "Current tenant session details.")}
        </p>
        <div className="rounded-md border border-line bg-sunken p-4 max-w-[500px]">
          <div className="flex flex-col gap-2 text-sm">
            <div>
              <span className="text-muted">User Account: </span>
              <strong className="text-ink">
                {auth?.name} ({auth?.email})
              </strong>
            </div>
            <div>
              <span className="text-muted">Assigned Role: </span>
              <strong className="text-ink">{auth?.role}</strong>
            </div>
            <div>
              <span className="text-muted">Company ID: </span>
              <strong className="text-ink">
                {auth?.companyId || company?.id || "N/A"}
              </strong>
            </div>
            <div>
              <span className="text-muted">Organization Name: </span>
              <strong className="text-ink">{company?.name}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <h3 className="mb-1 text-base font-bold text-ink">{t(lang, "Sign Out")}</h3>
        <p className="mb-3 text-sm text-muted">
          {t(
            lang,
            "End your current session on this device. Scoped tenant data in cache is cleared."
          )}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            router.push("/employer-login");
          }}
        >
          {t(lang, "Sign Out of Workspace")}
        </Button>
      </div>
    </div>
  );
}

