"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button, Input } from "../../../components/ds";
import OtpInput from "../../../components/ds/OtpInput";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  completePasswordReset,
} from "../../../lib/companyStore";

const RESEND_SECONDS = 45;

function maskEmail(email) {
  if (!email || !email.includes("@")) return "your email";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}•••@${domain}`;
}

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

export default function ForgotPasswordClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams?.get("email") || "";

  // Step 1 = Enter Email, Step 2 = Verify OTP, Step 3 = Set Password, Step 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [toast, setToast] = useToast();

  // Step 2 Countdown Timer
  useEffect(() => {
    if (step !== 2 || seconds <= 0) return;
    const timerId = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timerId);
  }, [step, seconds]);

  // ── Step 1 Formik (Email) ──────────────────────────────────────────────────
  const emailSchema = Yup.object().shape({
    email: Yup.string()
      .trim()
      .email(t(lang, "Please enter a valid work email"))
      .required(t(lang, "Work email is required")),
  });

  const emailFormik = useFormik({
    initialValues: {
      email: initialEmail,
    },
    enableReinitialize: true,
    validationSchema: emailSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      const cleanEmail = values.email.trim();
      try {
        await requestPasswordReset(cleanEmail);
        setEmail(cleanEmail);
        setStep(2);
        setSeconds(RESEND_SECONDS);
        setToast(t(lang, "Verification code sent to your email"));
      } catch (err) {
        setStatus(err.message || t(lang, "Failed to send reset code. Please try again."));
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ── Step 2 Formik (OTP Verification) ───────────────────────────────────────
  const otpSchema = Yup.object().shape({
    code: Yup.string()
      .trim()
      .length(6, t(lang, "Enter the 6-digit code sent to your email."))
      .required(t(lang, "Enter the 6-digit code sent to your email.")),
  });

  const otpFormik = useFormik({
    initialValues: {
      code: "",
    },
    validationSchema: otpSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      const cleanCode = values.code.trim();
      try {
        const res = await verifyPasswordResetOtp({ email, code: cleanCode });
        const token = res?.data?.reset_token || res?.reset_token;
        setResetToken(token || cleanCode);
        setStep(3);
        setToast(t(lang, "Verification code confirmed"));
      } catch (err) {
        setStatus(
          err.message ||
            t(lang, "Invalid or expired verification code.")
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Handle Resend OTP
  const handleResendOtp = async () => {
    setSeconds(RESEND_SECONDS);
    otpFormik.setStatus(null);
    try {
      await requestPasswordReset(email);
      setToast(t(lang, "A new verification code has been sent"));
    } catch (err) {
      setToast(err.message || t(lang, "Failed to resend code"));
    }
  };

  // ── Step 3 Formik (Set New Password) ───────────────────────────────────────
  const passwordSchema = Yup.object().shape({
    pw: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters"))
      .required(t(lang, "Password is required")),
    confirm: Yup.string()
      .oneOf([Yup.ref("pw"), null], t(lang, "Passwords do not match"))
      .required(t(lang, "Please confirm your password")),
  });

  const passwordFormik = useFormik({
    initialValues: {
      pw: "",
      confirm: "",
    },
    validationSchema: passwordSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        await completePasswordReset({
          token: resetToken,
          email,
          code: otpCode || otpFormik.values.code,
          newPassword: values.pw,
        });
        setStep(4);
        setToast(t(lang, "Password updated successfully"));
        setTimeout(() => router.push("/employer-login"), 1800);
      } catch (err) {
        setStatus(
          err.message ||
            t(lang, "Failed to update password. Please request a new code.")
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const strength = calculateStrength(passwordFormik.values.pw);

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main className="lv-simple-auth">
        <div className="lv-simple-card">
          {/* ── STEP 1: Enter Email ── */}
          {step === 1 && (
            <>
              <div className="lv-simple-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <Icon name="key" size={26} />
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
                  {t(lang, "Forgot your password?")}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "1.6" }}>
                  {t(
                    lang,
                    "Enter your company work email and we'll send you a 6-digit verification code to reset your password."
                  )}
                </p>
              </div>

              <form onSubmit={emailFormik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <Input
                    id="email"
                    name="email"
                    label={t(lang, "Work email")}
                    type="email"
                    autoComplete="email"
                    value={emailFormik.values.email}
                    onChange={(e) => {
                      if (emailFormik.status) emailFormik.setStatus(null);
                      emailFormik.handleChange(e);
                    }}
                    onBlur={emailFormik.handleBlur}
                    error={emailFormik.touched.email && emailFormik.errors.email}
                    placeholder="hr@company.com"
                  />
                </div>

                {emailFormik.status && (
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
                    <span>{emailFormik.status}</span>
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={emailFormik.isSubmitting}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {emailFormik.isSubmitting ? t(lang, "Sending code...") : t(lang, "Send Verification Code")}
                </Button>
              </form>

              <div style={{ textAlign: "center", fontSize: "var(--text-sm)", marginTop: 14 }}>
                <Link
                  href="/employer-login"
                  style={{
                    color: "var(--blue-600)",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Icon name="arrow-left" size={14} />
                  <span>{t(lang, "Back to Employer Login")}</span>
                </Link>
              </div>
            </>
          )}

          {/* ── STEP 2: Verify 6-Digit OTP ── */}
          {step === 2 && (
            <>
              <div className="lv-simple-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <Icon name="mail" size={26} />
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
                  {t(lang, "Enter verification code")}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "1.6" }}>
                  {t(lang, "We sent a 6-digit code to")}{" "}
                  <strong style={{ color: "var(--text-primary)" }}>{maskEmail(email)}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    otpFormik.resetForm();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--blue-600)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {t(lang, "Wrong email? Change email")}
                </button>
              </div>

              <form onSubmit={otpFormik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <OtpInput
                    value={otpFormik.values.code}
                    onChange={(val) => {
                      otpFormik.setFieldValue("code", val);
                      setOtpCode(val);
                      if (otpFormik.status) otpFormik.setStatus(null);
                    }}
                  />
                  {otpFormik.touched.code && otpFormik.errors.code && (
                    <p
                      className="lv-error"
                      style={{
                        color: "#dc2626",
                        fontSize: 12,
                        marginTop: 8,
                        textAlign: "center",
                      }}
                    >
                      {otpFormik.errors.code}
                    </p>
                  )}
                </div>

                {otpFormik.status && (
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
                    <span>{otpFormik.status}</span>
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={otpFormik.isSubmitting || otpFormik.values.code.length !== 6}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {otpFormik.isSubmitting ? t(lang, "Verifying code...") : t(lang, "Verify Code")}
                </Button>

                <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
                  {seconds > 0 ? (
                    <span>
                      {t(lang, "Resend code in")}{" "}
                      <strong style={{ color: "var(--text-primary)" }}>{seconds}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--blue-600)",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      {t(lang, "Didn't receive the email? Try again")}
                    </button>
                  )}
                </div>
              </form>

              <div style={{ textAlign: "center", fontSize: "var(--text-sm)", marginTop: 10 }}>
                <Link
                  href="/employer-login"
                  style={{ color: "var(--text-secondary)", fontWeight: 500 }}
                >
                  {t(lang, "Cancel and return to login")}
                </Link>
              </div>
            </>
          )}

          {/* ── STEP 3: Set New Password ── */}
          {step === 3 && (
            <>
              <div className="lv-simple-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
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
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", lineHeight: "1.6" }}>
                  {t(lang, "Create a strong new password for your employer account.")}
                </p>
              </div>

              <form
                onSubmit={passwordFormik.handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <Input
                    id="pw"
                    name="pw"
                    label={t(lang, "New password")}
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={passwordFormik.values.pw}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.pw && passwordFormik.errors.pw}
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
                  {passwordFormik.values.pw && (
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
                      <span style={{ color: STRENGTH_COLORS[strength], fontWeight: 600 }}>
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
                    value={passwordFormik.values.confirm}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.confirm && passwordFormik.errors.confirm}
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

                {passwordFormik.status && (
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
                    <span>{passwordFormik.status}</span>
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={passwordFormik.isSubmitting}
                  style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                >
                  {passwordFormik.isSubmitting
                    ? t(lang, "Updating password...")
                    : t(lang, "Update Password")}
                </Button>
              </form>
            </>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
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
          )}
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
      <Toast msg={toast} />
    </>
  );
}
