"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Input, Select, PhoneInput } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Toast, { useToast } from "../../../components/ds/Toast";
import Check from "../../../components/ds/Check";
import { COMPANIES } from "../../../lib/data";
import { setRegisteredAuth } from "../../../lib/companyStore";
import * as companyAuth from "../../../lib/api/companyAuth";

export default function CompanyRegisterClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [toast, setToast] = useToast();
  const fileInputRef = useRef(null);

  // ── Step 1 Validation Schema: Company Profile ───────────────────────────────
  const step1Schema = Yup.object().shape({
    co: Yup.string().trim().required(t(lang, "Company name is required")),
    taxId: Yup.string().trim().required(t(lang, "Tax ID / Business code is required")),
    ind: Yup.string().required(t(lang, "Please select an industry")),
    size: Yup.string().required(t(lang, "Please select company size")),
    website: Yup.string()
      .trim()
      .test("is-valid-url", t(lang, "Please enter a valid website URL"), (val) => {
        if (!val) return true;
        return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(val);
      }),
    description: Yup.string().trim(),
    logo: Yup.string(),
  });

  // ── Step 2 Validation Schema: Company Admin Details ────────────────────────
  const step2Schema = Yup.object().shape({
    name: Yup.string().trim().required(t(lang, "Contact person name is required")),
    email: Yup.string()
      .trim()
      .email(t(lang, "Please enter a valid work email"))
      .required(t(lang, "Work email is required")),
    phone: Yup.string()
      .trim()
      .required(t(lang, "Phone number is required"))
      .test("is-valid-phone", t(lang, "Please enter a valid phone number"), (val) => {
        if (!val) return false;
        const digits = String(val).replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15;
      }),
    pw: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters"))
      .required(t(lang, "Password is required")),
    confirmPw: Yup.string()
      .oneOf([Yup.ref("pw"), null], t(lang, "Passwords do not match"))
      .required(t(lang, "Please confirm your password")),
    agree: Yup.boolean().oneOf([true], t(lang, "Please accept the terms to continue")),
  });

  const fullRegisterSchema = step1Schema.concat(step2Schema);

  const formik = useFormik({
    initialValues: {
      co: "",
      taxId: "",
      ind: "",
      size: "",
      website: "",
      logo: "",
      description: "",
      name: "",
      email: "",
      phone: "",
      pw: "",
      confirmPw: "",
      agree: false,
    },
    validationSchema: step === 1 ? step1Schema : fullRegisterSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        const fullPhone = values.phone ? values.phone.trim() : "";
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
          website: values.website?.trim() || "",
          logo: values.logo || "",
          description: values.description?.trim() || "",
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
          website: values.website?.trim() || "",
          logo: values.logo || "",
          description: values.description?.trim() || "",
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

  // Handle company logo file selection (converts to base64 data URL)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast(t(lang, "Logo size must be under 2MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      formik.setFieldValue("logo", uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    formik.setFieldValue("logo", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Step 1 -> Step 2 transition
  const handleNextStep = async () => {
    formik.setFieldTouched("co", true, false);
    formik.setFieldTouched("taxId", true, false);
    formik.setFieldTouched("ind", true, false);
    formik.setFieldTouched("size", true, false);
    if (formik.values.website) {
      formik.setFieldTouched("website", true, false);
    }

    try {
      await step1Schema.validate(
        {
          co: formik.values.co,
          taxId: formik.values.taxId,
          ind: formik.values.ind,
          size: formik.values.size,
          website: formik.values.website,
          description: formik.values.description,
          logo: formik.values.logo,
        },
        { abortEarly: false }
      );
      setStep(2);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      if (err.inner) {
        const step1Errors = {};
        err.inner.forEach((validationError) => {
          step1Errors[validationError.path] = validationError.message;
        });
        formik.setErrors((prev) => ({ ...prev, ...step1Errors }));
      }
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const industryOptions = [...new Set(COMPANIES.map((c) => (lang === "VN" || lang === "VI" ? c.industryVi : c.industry)))].map((i) => ({ value: i, label: i }));
  const sizeOptions = ["1–10", "11–50", "51–200", "201–500", "500+"].map((s) => ({ value: s, label: s + " " + t(lang, "employees") }));

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-[680px] bg-white rounded-2xl border border-gray-200/90 shadow-md p-6 sm:p-9 box-border">
          {/* Top Back Option */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => {
                if (step === 2) {
                  handlePrevStep();
                } else if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/employer-login");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-xs cursor-pointer"
              title={step === 2 ? t(lang, "Previous step") : t(lang, "Back")}
            >
              <Icon name="arrow-left" size={14} />
              <span>{step === 2 ? t(lang, "Previous step") : t(lang, "Back")}</span>
            </button>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <img src="/logo-cropped.png" alt="LàmViệc360" className="h-8 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
              {t(lang, "Create company account")}
            </h1>
            <p className="text-sm text-gray-500">
              {step === 1
                ? t(lang, "Step 1 of 2: Fill in your company profile.")
                : t(lang, "Step 2 of 2: Set up your company administrator account.")}
            </p>
          </div>

          {/* ── Stepper Header ────────────────────────────────────────── */}
          <div className="mb-7">
            <div className="flex items-center justify-between relative">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-2.5 text-left transition-all ${step === 1 ? "opacity-100" : "opacity-85 hover:opacity-100 cursor-pointer"
                  }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1
                      ? "bg-blue-600 text-white shadow-xs ring-4 ring-blue-50"
                      : "bg-emerald-600 text-white shadow-xs"
                    }`}
                >
                  {step > 1 ? <Icon name="check" size={16} /> : "1"}
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {t(lang, "Step 1")}
                  </p>
                  <p
                    className={`text-xs sm:text-sm font-bold transition-colors ${step === 1 ? "text-gray-900" : "text-emerald-700"
                      }`}
                  >
                    {t(lang, "Company Details")}
                  </p>
                </div>
              </button>

              {/* Connecting progress track */}
              <div className="flex-1 mx-3 sm:mx-6 h-1 bg-gray-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full bg-blue-600 transition-all duration-300 rounded-full ${step === 2 ? "w-full" : "w-0"
                    }`}
                />
              </div>

              {/* Step 2 Pill */}
              <div
                className={`flex items-center gap-2.5 text-left transition-all ${step === 2 ? "opacity-100" : "opacity-60"
                  }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2
                      ? "bg-blue-600 text-white shadow-xs ring-4 ring-blue-50"
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                    }`}
                >
                  2
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {t(lang, "Step 2")}
                  </p>
                  <p
                    className={`text-xs sm:text-sm font-bold ${step === 2 ? "text-gray-900" : "text-gray-500"
                      }`}
                  >
                    {t(lang, "Company Admin Details")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} noValidate autoComplete="off">
            {/* Trap decoy inputs: absorbs aggressive browser credential autofill */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                opacity: 0,
                height: 0,
                width: 0,
                zIndex: -1,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <input type="text" name="fake_username_trap" tabIndex={-1} autoComplete="off" />
              <input type="password" name="fake_password_trap" tabIndex={-1} autoComplete="new-password" />
            </div>

            {/* ══════════════════════════════════════════════════════════
                STEP 1: COMPANY DETAILS
               ══════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Logo Uploader & Preview */}
                <div className="p-3.5 rounded-xl border border-gray-200/80 bg-slate-50/70">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    {t(lang, "Company Logo")} <span className="text-gray-400 font-normal">({t(lang, "Optional")})</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {formik.values.logo ? (
                        <img
                          src={formik.values.logo}
                          alt="Logo preview"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Icon name="building-2" size={22} />
                          <span className="text-[10px] mt-0.5 font-medium">{t(lang, "Logo")}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 shadow-2xs cursor-pointer transition-all">
                          <Icon name="upload" size={13} />
                          <span>{formik.values.logo ? t(lang, "Change logo") : t(lang, "Upload logo")}</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {formik.values.logo && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          >
                            <Icon name="trash-2" size={13} />
                            <span>{t(lang, "Remove")}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {t(lang, "PNG, JPG, SVG or WEBP up to 2MB")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Row 1: Company name & Tax ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <Input
                      id="co"
                      name="co"
                      label={t(lang, "Company name")}
                      type="text"
                      autoComplete="off"
                      value={formik.values.co}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="" //{{t(lang, "Company name")}}
                      error={formik.touched.co && formik.errors.co}
                    />
                  </div>
                  <div className="min-w-0">
                    <Input
                      id="taxId"
                      name="taxId"
                      label={t(lang, "Tax ID / Business code")}
                      type="text"
                      autoComplete="off"
                      value={formik.values.taxId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t(lang, "Tax ID / Business code")}
                      error={formik.touched.taxId && formik.errors.taxId}
                    />
                  </div>
                </div>

                {/* Row 2: Website URL */}
                <div className="min-w-0">
                  <Input
                    id="website"
                    name="website"
                    label={`${t(lang, "Website URL")} (${t(lang, "Optional")})`}
                    type="url"
                    autoComplete="off"
                    value={formik.values.website}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="https://company.vn"
                    error={formik.touched.website && formik.errors.website}
                  />
                </div>

                {/* Row 3: Industry & Company size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Row 4: Company Description */}
                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t(lang, "Company description")} <span className="text-gray-400 font-normal">({t(lang, "Optional")})</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder={t(lang, "Brief description of your company, products, and culture...")}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all resize-y min-h-[75px]"
                  />
                </div>

                {/* Step 1 Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
                  >
                    <span>{t(lang, "Next: Admin details")}</span>
                    <Icon name="arrow-right" size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                STEP 2: COMPANY ADMIN DETAILS
               ══════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Step 1 Company Summary Card */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {formik.values.logo ? (
                      <img
                        src={formik.values.logo}
                        alt="Logo"
                        className="w-9 h-9 rounded-lg object-contain bg-white border border-blue-200/60 p-0.5 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                        {(formik.values.co || "C").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate text-xs sm:text-sm">
                        {formik.values.co}
                      </p>
                      <p className="text-gray-500 text-[11px] truncate">
                        {t(lang, "Tax ID")}: <span className="font-mono font-medium text-gray-700">{formik.values.taxId}</span>
                        {formik.values.ind ? ` · ${formik.values.ind}` : ""}
                        {formik.values.size ? ` · ${formik.values.size}` : ""}
                        {formik.values.website ? ` · ${formik.values.website}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="shrink-0 text-blue-600 hover:text-blue-700 font-bold text-xs ml-3 inline-flex items-center gap-1 hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-md border border-blue-200 shadow-2xs"
                  >
                    <Icon name="pencil" size={12} />
                    <span>{t(lang, "Edit")}</span>
                  </button>
                </div>

                {/* Row 1: Contact name & Work email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <Input
                      id="name"
                      name="name"
                      label={t(lang, "Contact person name")}
                      type="text"
                      autoComplete="off"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t(lang, "Enter company admin name")}
                      error={formik.touched.name && formik.errors.name}
                    />
                  </div>
                  <div className="min-w-0">
                    <Input
                      id="email"
                      name="email"
                      label={t(lang, "Work email")}
                      type="email"
                      autoComplete="off"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t(lang, "Enter company admin email")}
                      error={formik.touched.email && formik.errors.email}
                    />
                  </div>
                </div>

                {/* Row 2: Phone (International Country Phone Input) */}
                <div>
                  <PhoneInput
                    id="phone"
                    name="phone"
                    label={t(lang, "Phone number")}
                    defaultCountry="vn"
                    preferredCountries={["vn", "us", "sg", "jp", "kr", "gb", "au"]}
                    autoComplete="off"
                    value={formik.values.phone}
                    onChange={(phone) => formik.setFieldValue("phone", phone)}
                    onBlur={() => formik.setFieldTouched("phone", true)}
                    error={formik.touched.phone && formik.errors.phone}
                    placeholder="090 123 4567"
                  />
                </div>

                {/* Row 3: Password & Confirm password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <Input
                      id="pw"
                      name="pw"
                      label={t(lang, "Password")}
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
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
                      autoComplete="new-password"
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
                <div className="pt-1">
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
                  <p className="lv-error text-red-600 text-sm flex gap-1.5 items-center bg-red-50 p-3 rounded-lg border border-red-200" role="alert">
                    <Icon name="alert-circle" size={16} />
                    <span>{formik.status}</span>
                  </p>
                )}

                {/* Action buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={formik.isSubmitting}
                    className="w-1/3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <Icon name="arrow-left" size={15} />
                    <span>{t(lang, "Back")}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={formik.isSubmitting}
                    className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-colors cursor-pointer disabled:opacity-60 shadow-xs inline-flex items-center justify-center gap-2"
                  >
                    {formik.isSubmitting ? (
                      <span>{t(lang, "Creating company account...")}</span>
                    ) : (
                      <>
                        <span>{t(lang, "Create Company Account")}</span>
                        <Icon name="check" size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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
