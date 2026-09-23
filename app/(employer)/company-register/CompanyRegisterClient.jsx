"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Input, Select } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Toast, { useToast } from "../../../components/ds/Toast";
import Check from "../../../components/ds/Check";
import { COMPANIES } from "../../../lib/data";
import { saveCompany } from "../../../lib/companyStore";
import * as companyAuth from "../../../lib/api/companyAuth";

export default function CompanyRegisterClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [toast, setToast] = useToast();

  const registerSchema = Yup.object().shape({
    co: Yup.string().trim().required(t(lang, "Company name is required")),
    name: Yup.string().trim().required(t(lang, "Contact name is required")),
    email: Yup.string()
      .email(t(lang, "Please enter a valid work email"))
      .required(t(lang, "Work email is required")),
    pw: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters"))
      .required(t(lang, "Password is required")),
    confirmPw: Yup.string()
      .oneOf([Yup.ref("pw"), null], t(lang, "Passwords do not match"))
      .required(t(lang, "Please confirm your password")),
    ind: Yup.string().required(t(lang, "Please select an industry")),
    size: Yup.string().required(t(lang, "Please select company size")),
    agree: Yup.boolean().oneOf([true], t(lang, "Please accept the terms to continue")),
  });

  const formik = useFormik({
    initialValues: {
      co: "",
      name: "",
      email: "",
      pw: "",
      confirmPw: "",
      ind: "",
      size: "",
      agree: false,
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        await companyAuth.registerCompany({
          company_name: values.co.trim(),
          contact_name: values.name.trim(),
          email: values.email.trim(),
          password: values.pw,
          industry: values.ind || "Technology",
          size: values.size || "11-50",
        });
        saveCompany({
          name: values.co.trim(),
          email: values.email.trim(),
          industry: values.ind || "Technology",
          size: values.size || "11-50",
        });
        setToast(t(lang, "Sending a verification code…"));
        setTimeout(() => router.push("/company-verify-email"), 700);
      } catch (error) {
        setStatus(error.message || t(lang, "An account with this work email already exists."));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const industryOptions = [...new Set(COMPANIES.map((c) => (lang === "VN" || lang === "VI" ? c.industryVi : c.industry)))].map((i) => ({ value: i, label: i }));
  const sizeOptions = ["1–10", "11–50", "51–200", "201–500", "500+"].map((s) => ({ value: s, label: s + " " + t(lang, "employees") }));

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main className="lv-reg-wrap">
        <div className="lv-reg-container" style={{ gridTemplateColumns: "1fr", maxWidth: 600, margin: "0 auto" }}>
          {/* Form Panel */}
          <div className="lv-reg-right" style={{ padding: "48px" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <img src="/logo-cropped.png" alt="LàmViệc360" style={{ height: 32, marginBottom: 16 }} />
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
                {t(lang, "Create company account")}
              </h2>
              <p style={{ color: "#6b7280", fontSize: 14 }}>
                {t(lang, "Sign up to post jobs and manage candidates.")}
              </p>
            </div>

            <form onSubmit={formik.handleSubmit}>
              <div className="lv-reg-row" style={{ marginBottom: 16 }}>
                <div>
                  <Input
                    id="co"
                    name="co"
                    label={t(lang, "Company name")}
                    type="text"
                    value={formik.values.co}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="ABC Technologies"
                    error={formik.touched.co && formik.errors.co}
                  />
                </div>
                <div>
                  <Input
                    id="name"
                    name="name"
                    label={t(lang, "Contact name")}
                    type="text"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder={t(lang, "Nguyen Van A")}
                    error={formik.touched.name && formik.errors.name}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Input
                  id="email"
                  name="email"
                  label={t(lang, "Work email")}
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="hr@company.com"
                  error={formik.touched.email && formik.errors.email}
                />
              </div>

              <div className="lv-reg-row" style={{ marginBottom: 16 }}>
                <div>
                  <Input
                    id="pw"
                    name="pw"
                    label={t(lang, "Password")}
                    type={showPw ? "text" : "password"}
                    value={formik.values.pw}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    error={formik.touched.pw && formik.errors.pw}
                    iconRight={<Icon name={showPw ? "eye-off" : "eye"} size={18} style={{ color: "#9ca3af" }} />}
                    onIconRightClick={() => setShowPw(!showPw)}
                  />
                </div>
                <div>
                  <Input
                    id="confirmPw"
                    name="confirmPw"
                    label={t(lang, "Confirm password")}
                    type={showConfirmPw ? "text" : "password"}
                    value={formik.values.confirmPw}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    error={formik.touched.confirmPw && formik.errors.confirmPw}
                    iconRight={<Icon name={showConfirmPw ? "eye-off" : "eye"} size={18} style={{ color: "#9ca3af" }} />}
                    onIconRightClick={() => setShowConfirmPw(!showConfirmPw)}
                  />
                </div>
              </div>

              <div className="lv-reg-row" style={{ marginBottom: 16 }}>
                <div>
                  <Select
                    id="ind"
                    name="ind"
                    label={t(lang, "Industry")}
                    placeholder={t(lang, "Select an industry")}
                    value={formik.values.ind}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    options={industryOptions}
                    error={formik.touched.ind && formik.errors.ind}
                  />
                </div>
                <div>
                  <Select
                    id="size"
                    name="size"
                    label={t(lang, "Company size")}
                    placeholder={t(lang, "Select a size")}
                    value={formik.values.size}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    options={sizeOptions}
                    error={formik.touched.size && formik.errors.size}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Check
                  label={t(lang, "I agree to the Terms of Service and Privacy Policy")}
                  checked={formik.values.agree}
                  onChange={() => formik.setFieldValue("agree", !formik.values.agree)}
                />
                {formik.touched.agree && formik.errors.agree && (
                  <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                    {formik.errors.agree}
                  </p>
                )}
              </div>

              {formik.status && (
                <p className="lv-error" role="alert" style={{ marginBottom: 16, color: "#dc2626", fontSize: 14, display: "flex", gap: 6, alignItems: "center" }}>
                  <Icon name="alert-circle" size={16} />
                  <span>{formik.status}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="lv-reg-submit"
                style={{ opacity: formik.isSubmitting ? 0.7 : 1, cursor: formik.isSubmitting ? "not-allowed" : "pointer", width: "100%" }}
              >
                {formik.isSubmitting ? t(lang, "Creating company account...") : t(lang, "Create Company Account")}
              </button>
            </form>

            <p style={{ marginTop: 24, fontSize: 14, color: "#4b5563", textAlign: "center" }}>
              {t(lang, "Company already registered?")}{" "}
              <Link href="/employer-login" style={{ fontWeight: 600, color: "#111827" }}>
                {t(lang, "Log in")}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
      <Toast msg={toast} />
    </>
  );
}
