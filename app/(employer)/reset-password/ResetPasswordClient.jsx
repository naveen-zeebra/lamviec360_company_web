"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button, Input } from "../../../components/ds";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import { completePasswordReset } from "../../../lib/companyStore";

function calculateStrength(pw) {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3);
}

const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

export default function ResetPasswordClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlToken =
    searchParams?.get("token") || searchParams?.get("code") || "";
  const urlEmail = searchParams?.get("email") || "";

  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [toast, setToast] = useToast();

  const resetSchema = Yup.object().shape({
    email: Yup.string()
      .trim()
      .email(t(lang, "Please enter a valid work email"))
      .required(t(lang, "Work email is required")),
    token: Yup.string()
      .trim()
      .required(t(lang, "Verification code or reset token is required")),
    pw: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters"))
      .required(t(lang, "Password is required")),
    confirm: Yup.string()
      .oneOf([Yup.ref("pw"), null], t(lang, "Passwords do not match"))
      .required(t(lang, "Please confirm your password")),
  });

  const formik = useFormik({
    initialValues: {
      email: urlEmail,
      token: urlToken,
      pw: "",
      confirm: "",
    },
    enableReinitialize: false,
    validationSchema: resetSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        await completePasswordReset({
          token: values.token.trim(),
          email: values.email.trim(),
          code: values.token.trim(),
          newPassword: values.pw,
        });
        setDone(true);
        setToast(t(lang, "Password updated successfully"));
        setTimeout(() => router.push("/employer-login"), 1600);
      } catch (err) {
        setStatus(
          err.message ||
            t(lang, "Invalid or expired reset token/code. Please request a new link.")
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (urlToken && !formik.values.token) {
      formik.setFieldValue("token", urlToken);
    }
    if (urlEmail && !formik.values.email) {
      formik.setFieldValue("email", urlEmail);
    }
  }, [urlToken, urlEmail]);

  const strength = calculateStrength(formik.values.pw);

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main className="lv-simple-auth">
        <div className="lv-simple-card">
          {done ? (
            <>
              <div
                className="lv-simple-icon"
                style={{ background: "#ecfdf5", color: "#10b981" }}
              >
                <Icon name="check" size={28} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "var(--text-2xl)",
                    fontWeight: 800,
                    marginBottom: 8,
                    color: "var(--text-primary)",
                  }}
                >
                  {t(lang, "Password updated")}
                </h1>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-sm)",
                    lineHeight: "1.6",
                  }}
                >
                  {t(
                    lang,
                    "Your company password has been reset successfully. Redirecting you to employer login..."
                  )}
                </p>
              </div>

              <div style={{ marginTop: 12 }}>
                <Link href="/employer-login">
                  <Button
                    variant="primary"
                    size="lg"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {t(lang, "Go to Employer Login")}
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div
                className="lv-simple-icon"
                style={{ background: "#eff6ff", color: "#2563eb" }}
              >
                <Icon name="lock" size={26} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "var(--text-2xl)",
                    fontWeight: 800,
                    marginBottom: 8,
                    color: "var(--text-primary)",
                  }}
                >
                  {t(lang, "Set a new password")}
                </h1>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-sm)",
                    lineHeight: "1.6",
                  }}
                >
                  {t(
                    lang,
                    "Enter your work email, reset token or code, and choose your new password."
                  )}
                </p>
              </div>

              <form
                onSubmit={formik.handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <Input
                    id="email"
                    name="email"
                    label={t(lang, "Work email")}
                    type="email"
                    autoComplete="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && formik.errors.email}
                    placeholder="hr@company.com"
                  />
                </div>

                <div>
                  <Input
                    id="token"
                    name="token"
                    label={t(lang, "Reset token or 6-digit code")}
                    type="text"
                    value={formik.values.token}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.token && formik.errors.token}
                    placeholder={t(lang, "Paste token or enter OTP code")}
                  />
                </div>

                <div>
                  <Input
                    id="pw"
                    name="pw"
                    label={t(lang, "New password")}
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={formik.values.pw}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.pw && formik.errors.pw}
                    placeholder="••••••••"
                    iconRight={
                      <Icon
                        name={showPw ? "eye-off" : "eye"}
                        size={18}
                        style={{ color: "#9ca3af" }}
                      />
                    }
                    onIconRightClick={() => setShowPw(!showPw)}
                  />
                  {formik.values.pw && (
                    <div className="lv-pw-strength" style={{ marginTop: 8 }}>
                      <div className="lv-pw-strength-bars">
                        {[0, 1, 2, 3].map((idx) => (
                          <span
                            key={idx}
                            style={{
                              background:
                                idx <= strength
                                  ? STRENGTH_COLORS[strength]
                                  : "var(--gray-200)",
                            }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          color: STRENGTH_COLORS[strength],
                          fontWeight: 600,
                        }}
                      >
                        {t(lang, STRENGTH_LABELS[strength])}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    id="confirm"
                    name="confirm"
                    label={t(lang, "Confirm password")}
                    type={showConfirmPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={formik.values.confirm}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirm && formik.errors.confirm}
                    placeholder="••••••••"
                    iconRight={
                      <Icon
                        name={showConfirmPw ? "eye-off" : "eye"}
                        size={18}
                        style={{ color: "#9ca3af" }}
                      />
                    }
                    onIconRightClick={() => setShowConfirmPw(!showConfirmPw)}
                  />
                </div>

                {formik.status && (
                  <p
                    className="lv-error"
                    role="alert"
                    style={{
                      color: "#dc2626",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      padding: "8px 12px",
                      borderRadius: 8,
                    }}
                  >
                    <Icon name="alert-circle" size={16} />
                    <span>{formik.status}</span>
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={formik.isSubmitting}
                  style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                >
                  {formik.isSubmitting
                    ? t(lang, "Updating password...")
                    : t(lang, "Update Password")}
                </Button>
              </form>
            </>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              fontSize: "var(--text-sm)",
              marginTop: 14,
            }}
          >
            <Link
              href="/forgot-password"
              style={{ color: "var(--text-secondary)", fontWeight: 500 }}
            >
              {t(lang, "Request new link")}
            </Link>
            <span style={{ color: "var(--gray-300)" }}>•</span>
            <Link
              href="/employer-login"
              style={{ color: "var(--blue-600)", fontWeight: 600 }}
            >
              {t(lang, "Back to Login")}
            </Link>
          </div>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
      <Toast msg={toast} />
    </>
  );
}
