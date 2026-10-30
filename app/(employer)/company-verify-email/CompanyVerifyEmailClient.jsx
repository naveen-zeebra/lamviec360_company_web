"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button } from "../../../components/ds";
import OtpInput from "../../../components/ds/OtpInput";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { getCompany, getAuth, verifyCompanyEmail, resendVerificationCode } from "../../../lib/companyStore";

const RESEND_SECONDS = 45;

export default function CompanyVerifyEmailClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams?.get("email") || "";

  const [email, setEmail] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [toast, setToast] = useToast();
  const [devCode, setDevCode] = useState("");

  useEffect(() => {
    let storedEmail = "";
    let storedOtp = "";
    if (typeof window !== "undefined") {
      storedEmail = localStorage.getItem("lv360_company_email") || "";
      storedOtp = localStorage.getItem("lv360_company_dev_otp") || "";
    }
    const target = queryEmail || storedEmail || getAuth().email || getCompany().email || "";
    setEmail(target);
    if (storedOtp) setDevCode(storedOtp);
  }, [queryEmail]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const otpSchema = Yup.object().shape({
    code: Yup.string()
      .length(6, t(lang, "Enter the 6-digit code sent to your email."))
      .required(t(lang, "Enter the 6-digit code sent to your email.")),
  });

  const formik = useFormik({
    initialValues: {
      code: "",
    },
    validationSchema: otpSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        await verifyCompanyEmail(email, values.code.trim());
        setToast(t(lang, "Work email verified successfully!"));
        setTimeout(() => router.push("/company-pending-approval"), 800);
      } catch (error) {
        setStatus(error.message || t(lang, "Invalid verification code. (Hint: Use 123456)"));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const resend = async () => {
    setSeconds(RESEND_SECONDS);
    try {
      const res = await resendVerificationCode(email);
      const code = res?.data?.dev_code || res?.dev_code;
      if (code) {
        setDevCode(code);
        if (typeof window !== "undefined") {
          localStorage.setItem("lv360_company_dev_otp", code);
        }
      }
      setToast(t(lang, "A new verification code has been sent to your email"));
    } catch (e) {
      setToast(t(lang, e.message || "Failed to resend code"));
    }
  };

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main className="lv-simple-auth">
        <div className="lv-simple-card">
          <div className="lv-simple-icon">
            <Icon name="mail-check" size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: 8 }}>
              {t(lang, "Verify your company email")}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>
              {t(lang, "We sent a 6-digit code to")} <strong>{email || t(lang, "your work email")}</strong>.
            </p>
            {devCode && (
              <p style={{ color: "#2563eb", fontSize: 13, background: "#eff6ff", padding: "8px 12px", borderRadius: 6, margin: "12px 0 0", border: "1px dashed #93c5fd", textAlign: "center" }}>
                <Icon name="shield" size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                <span>{t(lang, "Code sent to email.")} {t(lang, "Dev Code:")} <strong>{devCode}</strong></span>
              </p>
            )}
          </div>

          <form onSubmit={formik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <OtpInput
              value={formik.values.code}
              onChange={(v) => {
                formik.setFieldValue("code", v);
                formik.setStatus(null);
              }}
            />

            {formik.touched.code && formik.errors.code && (
              <p className="lv-error" role="alert" style={{ color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                <Icon name="alert-circle" size={14} />
                <span>{formik.errors.code}</span>
              </p>
            )}

            {formik.status && (
              <p className="lv-error" role="alert" style={{ color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="alert-circle" size={16} />
                <span>{formik.status}</span>
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={formik.isSubmitting}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {formik.isSubmitting ? t(lang, "Verifying...") : t(lang, "Verify Email")}
            </Button>
          </form>

          <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
            {seconds > 0 ? (
              <span>{t(lang, "Resend code in")} {seconds}s</span>
            ) : (
              <button
                onClick={resend}
                style={{ background: "none", border: "none", color: "var(--text-brand)", fontWeight: 700, cursor: "pointer", fontSize: "var(--text-sm)" }}
              >
                {t(lang, "Resend code")}
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
      <Toast msg={toast} />
    </>
  );
}
