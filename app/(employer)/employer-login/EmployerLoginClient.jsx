"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, Input } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import OtpInput from "../../../components/ds/OtpInput";
import { useLang, t } from "../../../utils/lang";
import Toast, { useToast } from "../../../components/ds/Toast";
import NaukriShell from "../../../components/auth/NaukriShell";
import { beginLogin, completeLogin } from "../../../lib/companyStore";

const RESEND_SECONDS = 45;

function maskEmail(email) {
  if (!email || !email.includes("@")) return "your email";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}•••@${domain}`;
}

export default function EmployerLoginClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [stage, setStage] = useState("password");
  const [showPw, setShowPw] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [toast, setToast] = useToast();
  const [sessionToken, setSessionToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  useEffect(() => {
    if (stage !== "otp" || seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [stage, seconds]);

  const bullets = [
    t(lang, "Publish jobs and reach qualified candidates."),
    t(lang, "Manage your whole candidate pipeline in one place."),
    t(lang, "Invite your team with role-based access."),
    t(lang, "Track hiring performance with real data."),
  ];

  const loginSchema = Yup.object().shape({
    email: Yup.string()
      .email(t(lang, "Please enter a valid work email"))
      .required(t(lang, "Enter your work email and password.")),
    password: Yup.string().required(t(lang, "Enter your work email and password.")),
  });

  const handleLoginInputChange = (e) => {
    if (loginFormik.status) loginFormik.setStatus(null);
    loginFormik.handleChange(e);
  };

  const loginFormik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        const res = await beginLogin(values.email.trim(), values.password);
        const data = res?.data || res || {};
        const status = data?.status || res?.status;
        const message = data?.message || res?.message;

        if (status === "PENDING_APPROVAL") {
          router.push("/company-pending-approval");
          return;
        }
        if (status === "REJECTED") {
          setStatus(message || t(lang, "Your company registration was not approved."));
          return;
        }

        const token = data?.session_token || res?.session_token;
        if (!token && !res?.isMock) {
          throw new Error(message || t(lang, "Unable to initiate login. Please try again."));
        }

        setSessionToken(token || "mock_token");
        const masked = data?.masked_email || res?.masked_email;
        if (masked) setMaskedEmail(masked);
        setStage("otp");
        setSeconds(RESEND_SECONDS);
        setToast(t(lang, "We sent a 6-digit code to your email"));
      } catch (error) {
        let errorMsg = error.message;
        if (error.status === 401 || errorMsg?.toLowerCase().includes("invalid email or password") || errorMsg?.toLowerCase().includes("incorrect")) {
          errorMsg = t(lang, "Incorrect work email or password. Please verify your credentials and try again.");
        } else if (error.status === 403 || errorMsg?.toLowerCase().includes("inactive")) {
          errorMsg = error.message || t(lang, "Your company account is inactive. Please contact support.");
        } else if (error.status === 404 || errorMsg?.toLowerCase().includes("not found")) {
          errorMsg = t(lang, "No employer account found with this email. Please check your email or register.");
        } else if (error.status === 429) {
          errorMsg = t(lang, "Too many login attempts. Please wait a few moments and try again.");
        } else if (error.status >= 500) {
          errorMsg = t(lang, "Authentication server error. Please try again shortly.");
        } else if (!error.status && (errorMsg?.includes("fetch") || errorMsg?.includes("NetworkError") || error.name === "TypeError")) {
          errorMsg = t(lang, "Cannot connect to the authentication server. Please check your internet connection.");
        }
        setStatus(errorMsg || t(lang, "Incorrect work email or password."));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const otpSchema = Yup.object().shape({
    code: Yup.string()
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
      try {
        await completeLogin(sessionToken, values.code);
        setToast(t(lang, "Signing you in…"));
        setTimeout(() => router.push("/company/overview"), 600);
      } catch (error) {
        let errorMsg = error.message;
        if (error.status === 400 || errorMsg?.toLowerCase().includes("invalid otp") || errorMsg?.toLowerCase().includes("invalid code")) {
          errorMsg = t(lang, "Invalid 6-digit code. Please enter 123456.");
        } else if (error.status === 404) {
          errorMsg = t(lang, "Session expired or user not found. Please log in again.");
        } else if (error.status >= 500) {
          errorMsg = t(lang, "Authentication server error. Please try again.");
        } else if (!error.status && (errorMsg?.includes("fetch") || errorMsg?.includes("NetworkError") || error.name === "TypeError")) {
          errorMsg = t(lang, "Unable to reach the server. Please check your connection.");
        }
        setStatus(errorMsg || t(lang, "Invalid 6-digit code. (Hint: Use 123456)"));
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <>
      <NaukriShell
        lang={lang}
        setLang={setLang}
        app="employer"
        title={t(lang, "Hire better talent.")}
        bullets={bullets}
        ctaText={t(lang, "Create Company Account")}
        ctaHref="/company-register"
      >
        {stage === "password" ? (
          <>
            <h1>{t(lang, "Employer Login")}</h1>
            <form onSubmit={loginFormik.handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                  {t(lang, "Work Email")}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={loginFormik.values.email}
                  onChange={handleLoginInputChange}
                  onBlur={loginFormik.handleBlur}
                  placeholder="hr@company.com"
                  error={loginFormik.touched.email && loginFormik.errors.email}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                  {t(lang, "Password")}
                </label>
                <div style={{ position: "relative" }}>
                  <Input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={loginFormik.values.password}
                    onChange={handleLoginInputChange}
                    onBlur={loginFormik.handleBlur}
                    placeholder="••••••••"
                    error={loginFormik.touched.password && loginFormik.errors.password}
                  />
                  <div
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 12,
                      fontSize: 13,
                      color: "#4f46e5",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {showPw ? t(lang, "Hide") : t(lang, "Show")}
                  </div>
                </div>
              </div>

              {loginFormik.status && (
                <div
                  className="lv-error-banner"
                  role="alert"
                  aria-live="assertive"
                  style={{
                    marginBottom: 16,
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: 13,
                    lineHeight: "1.4",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <Icon name="alert-circle" size={16} style={{ flexShrink: 0, marginTop: 2, color: "#dc2626" }} />
                  <span style={{ fontWeight: 500 }}>{loginFormik.status}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setToast(t(lang, "A reset link would be emailed to you"));
                  }}
                  style={{ fontSize: 12, color: "#4f46e5", fontWeight: 500 }}
                >
                  {t(lang, "Forgot Password?")}
                </a>
              </div>

              <button
                type="submit"
                disabled={loginFormik.isSubmitting}
                className="lv-reg-submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: 16,
                  fontWeight: 600,
                  background: loginFormik.isSubmitting ? "#93c5fd" : "#3b82f6",
                  cursor: loginFormik.isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {loginFormik.isSubmitting ? t(lang, "Verifying credentials...") : t(lang, "Continue")}
              </button>
            </form>

            <div className="lv-reg-divider" style={{ margin: "24px 0" }}>
              Or
            </div>

            <button
              type="button"
              className="lv-reg-social"
              style={{
                width: "100%",
                padding: "10px",
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                color: "#374151",
              }}
              onClick={() => {
                loginFormik.setValues({
                  email: "lan.tran@abctech.vn",
                  password: "password123",
                });
                loginFormik.setStatus(null);
                setToast(t(lang, "Filled demo employer credentials. Click Continue."));
              }}
            >
              <Icon name="chrome" size={18} style={{ color: "#4285F4" }} />
              {t(lang, "Fill Demo Credentials (ABC Tech)")}
            </button>
          </>
        ) : (
          <>
            <h1>{t(lang, "Two-factor authentication")}</h1>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "8px 0 20px" }}>
              {t(lang, "Enter the 6-digit code sent to")}{" "}
              <strong>{maskedEmail || maskEmail(loginFormik.values.email)}</strong>.{" "}
              {t(lang, "2FA is required for company admins.")}
            </p>
            <form onSubmit={otpFormik.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <OtpInput
                value={otpFormik.values.code}
                onChange={(v) => {
                  otpFormik.setFieldValue("code", v);
                  otpFormik.setStatus(null);
                }}
              />
              {otpFormik.touched.code && otpFormik.errors.code && (
                <p className="lv-error" role="alert" style={{ color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                  <Icon name="alert-circle" size={14} />
                  <span>{otpFormik.errors.code}</span>
                </p>
              )}
              {otpFormik.status && (
                <div
                  className="lv-error-banner"
                  role="alert"
                  aria-live="assertive"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: 13,
                    lineHeight: "1.4",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <Icon name="alert-circle" size={16} style={{ flexShrink: 0, marginTop: 2, color: "#dc2626" }} />
                  <span style={{ fontWeight: 500 }}>{otpFormik.status}</span>
                </div>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={otpFormik.isSubmitting}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {otpFormik.isSubmitting ? t(lang, "Verifying 2FA...") : t(lang, "Verify & sign in")}
              </Button>
            </form>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 13, color: "#6b7280" }}>
              <button
                type="button"
                onClick={() => {
                  setStage("password");
                  otpFormik.resetForm();
                }}
                style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 600, cursor: "pointer" }}
              >
                {t(lang, "Back to password")}
              </button>
              {seconds > 0 ? (
                <span>
                  {t(lang, "Resend code in")} {seconds}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSeconds(RESEND_SECONDS);
                    setToast(t(lang, "A new code has been sent"));
                  }}
                  style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 600, cursor: "pointer" }}
                >
                  {t(lang, "Resend code")}
                </button>
              )}
            </div>
            <p className="lv-auth-note" style={{ marginTop: 16 }}>
              {t(lang, "Prototype only — enter any 6 digits.")}
            </p>
          </>
        )}
      </NaukriShell>
      <Toast msg={toast} />
    </>
  );
}
