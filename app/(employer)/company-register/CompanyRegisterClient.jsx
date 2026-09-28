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
import { COMPANIES, COUNTRY_CODES } from "../../../lib/data";
import { setRegisteredAuth } from "../../../lib/companyStore";
import * as companyAuth from "../../../lib/api/companyAuth";

export default function CompanyRegisterClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [countryCode, setCountryCode] = useState("+84");
  const [toast, setToast] = useToast();

  const registerSchema = Yup.object().shape({
    co: Yup.string().trim().required(t(lang, "Company name is required")),
    taxId: Yup.string().trim().required(t(lang, "Tax ID / Business code is required")),
    name: Yup.string().trim().required(t(lang, "Contact person name is required")),
    email: Yup.string()
      .trim()
      .email(t(lang, "Please enter a valid work email"))
      .required(t(lang, "Work email is required")),
    phone: Yup.string()
      .trim()
      .required(t(lang, "Phone number is required"))
      .matches(/^[0-9\s\-()+]{7,15}$/, t(lang, "Please enter a valid phone number")),
    ind: Yup.string().required(t(lang, "Please select an industry")),
    size: Yup.string().required(t(lang, "Please select company size")),
    pw: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters"))
      .required(t(lang, "Password is required")),
    confirmPw: Yup.string()
      .oneOf([Yup.ref("pw"), null], t(lang, "Passwords do not match"))
      .required(t(lang, "Please confirm your password")),
    agree: Yup.boolean().oneOf([true], t(lang, "Please accept the terms to continue")),
  });

  const formik = useFormik({
    initialValues: {
      co: "",
      taxId: "",
      name: "",
      email: "",
      phone: "",
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
        const fullPhone = values.phone ? `${countryCode} ${values.phone.trim()}` : "";
        const regRes = await companyAuth.registerCompany({
          company_name: values.co.trim(),
          tax_id: values.taxId.trim(),
          reg_number: values.taxId.trim(),
          contact_name: values.name.trim(),
          email: values.email.trim(),
          password: values.pw,
          phone: fullPhone,
          industry: values.ind || "Technology",
          size: values.size || "11-50",
        });
        const registeredUser = regRes?.data?.user || {
          email: values.email.trim(),
          full_name: values.name.trim(),
        };
        setRegisteredAuth(registeredUser, {
          name: values.co.trim(),
          taxId: values.taxId.trim(),
          tax_code: values.taxId.trim(),
          email: values.email.trim(),
          phone: fullPhone,
          industry: values.ind || "Technology",
          size: values.size || "11-50",
        });
        setToast(t(lang, "Sending a verification code…"));
        setTimeout(() => router.push(`/company-verify-email?email=${encodeURIComponent(values.email.trim())}`), 700);
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
      <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-[660px] bg-white rounded-2xl border border-gray-200/90 shadow-md p-6 sm:p-9 box-border">
          {/* 1. Navigate to Back Option */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/employer-login");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-xs cursor-pointer"
              title={t(lang, "Navigate to back")}
            >
              <Icon name="arrow-left" size={14} />
              <span>{t(lang, "Back")}</span>
            </button>
          </div>

          <div className="text-center mb-7">
            <img src="/logo-cropped.png" alt="LàmViệc360" className="h-8 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
              {t(lang, "Create company account")}
            </h1>
            <p className="text-sm text-gray-500">
              {t(lang, "Sign up to post jobs and manage candidates.")}
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} noValidate>
            {/* Row 1: Company name & Tax ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="min-w-0">
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
              <div className="min-w-0">
                <Input
                  id="taxId"
                  name="taxId"
                  label={t(lang, "Tax ID / Business code")}
                  type="text"
                  value={formik.values.taxId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="0101234567"
                  error={formik.touched.taxId && formik.errors.taxId}
                />
              </div>
            </div>

            {/* Row 2: Contact name & Work email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="min-w-0">
                <Input
                  id="name"
                  name="name"
                  label={t(lang, "Contact person name")}
                  type="text"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={t(lang, "Nguyen Van A")}
                  error={formik.touched.name && formik.errors.name}
                />
              </div>
              <div className="min-w-0">
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
            </div>

            {/* Row 3: Phone (Country Code package) */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-ink block mb-1.5" htmlFor="phone">
                {t(lang, "Phone number")}
              </label>
              <div className="flex gap-2 items-start">
                <div className="relative w-[130px] shrink-0">
                  <select
                    id="country-code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label={t(lang, "Country code")}
                    className="w-full appearance-none rounded-md border-[1.5px] border-line bg-card py-[11px] pl-2.5 pr-7 text-xs font-bold text-ink focus:border-line-brand focus:outline-none shadow-xs h-[48px] cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={`${c.iso}-${c.code}`} value={c.code}>
                        {c.flag} {c.code} ({c.iso})
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Icon name="chevron-down" size={13} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="901 234 567"
                    error={formik.touched.phone && formik.errors.phone}
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Industry & Company size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="min-w-0">
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
              <div className="min-w-0">
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

            {/* Row 5: Password & Confirm password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="min-w-0">
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
              <div className="min-w-0">
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

            {/* Agreement checkbox */}
            <div className="mb-5">
              <Check
                label={t(lang, "I agree to the Terms of Service and Privacy Policy")}
                checked={formik.values.agree}
                onChange={() => formik.setFieldValue("agree", !formik.values.agree)}
              />
              {formik.touched.agree && formik.errors.agree && (
                <p className="text-red-600 text-xs mt-1">
                  {formik.errors.agree}
                </p>
              )}
            </div>

            {/* Error status banner */}
            {formik.status && (
              <p className="lv-error mb-4 text-red-600 text-sm flex gap-1.5 items-center bg-red-50 p-3 rounded-lg border border-red-200" role="alert">
                <Icon name="alert-circle" size={16} />
                <span>{formik.status}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {formik.isSubmitting ? t(lang, "Creating company account...") : t(lang, "Create Company Account")}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600 text-center">
            {t(lang, "Company already registered?")}{" "}
            <Link href="/employer-login" className="font-semibold text-blue-600 hover:underline">
              {t(lang, "Log in")}
            </Link>
          </p>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
      <Toast msg={toast} />
    </>
  );
}
