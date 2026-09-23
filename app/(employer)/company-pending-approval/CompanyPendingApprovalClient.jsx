"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button } from "../../../components/ds";
import { useLang, t } from "../../../utils/lang";
import { getCompany, setApprovalStatus } from "../../../lib/companyStore";

const STEPS = [
  { icon: "mail-check", title: "Email verified", desc: "Your work email is confirmed." },
  { icon: "search-check", title: "Under review", desc: "Our team checks your company details (usually within 1 business day)." },
  { icon: "badge-check", title: "Verified & live", desc: "You get the verified badge and can publish jobs." },
];

export default function CompanyPendingApprovalClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    setCompany(getCompany());
  }, []);

  const approved = company && company.approvalStatus === "approved";

  const simulateApproval = () => {
    setApprovalStatus("approved");
    setCompany(getCompany());
  };

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main className="lv-simple-auth">
        <div className="lv-simple-card" style={{ maxWidth: 520 }}>
          <div className="lv-simple-icon" style={{ color: approved ? "var(--color-success)" : undefined }}>
            <Icon name={approved ? "badge-check" : "clock"} size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: 8 }}>
              {approved ? t(lang, "Your company is verified") : t(lang, "Your company is under review")}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>
              {approved
                ? t(lang, "You're all set. Head to your workspace to post your first job.")
                : t(lang, "Thanks for registering. We review every company before it goes live — this usually takes less than one business day.")}
            </p>
          </div>

          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
            {STEPS.map((s, i) => {
              const state = approved ? "done" : i === 0 ? "done" : i === 1 ? "current" : "pending";
              return (
                <li key={s.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: state === "pending" ? "var(--surface-sunken)" : "var(--surface-brand-subtle)",
                      color: state === "pending" ? "var(--text-tertiary)" : "var(--text-brand)",
                    }}
                  >
                    <Icon name={state === "done" ? "check" : s.icon} size={16} />
                  </span>
                  <div>
                    <strong style={{ display: "block", fontSize: "var(--text-sm)" }}>{t(lang, s.title)}</strong>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{t(lang, s.desc)}</span>
                  </div>
                </li>
              );
            })}
          </ol>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {approved ? (
              <Button variant="primary" size="lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/company/overview")}>
                {t(lang, "Go to workspace")}
              </Button>
            ) : (
              <>
                <Link href="/employer-login">
                  <Button variant="secondary" size="lg" style={{ width: "100%", justifyContent: "center" }}>
                    {t(lang, "Back to sign in")}
                  </Button>
                </Link>
                <button
                  onClick={simulateApproval}
                  style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "var(--text-xs)", cursor: "pointer" }}
                >
                  {t(lang, "Demo: simulate approval")}
                </button>
              </>
            )}
          </div>

          <p className="lv-auth-note">
            {t(lang, "Questions? Email")} <a href="mailto:support@lamviec360.vn">support@lamviec360.vn</a>
          </p>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
    </>
  );
}
