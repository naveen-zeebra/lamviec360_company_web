"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Icon from "../../../components/ds/Icon";
import { Button, Input } from "../../../components/ds";
import Check from "../../../components/ds/Check";
import Skeleton from "../../../components/ds/Skeleton";
import { useLang, t } from "../../../utils/lang";
import { getInvitationByToken, activateTeamInvitation } from "../../../lib/api/companyAuth";
import { syncCompanyWithBackend } from "../../../lib/companyStore";

function strength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3);
}

const LABELS = ["Weak", "Fair", "Good", "Strong"];
const COLORS = ["var(--color-danger)", "var(--color-warning)", "var(--color-blue-500)", "var(--color-success)"];

const SUMMARY =
  "flex flex-col gap-3 text-left [&_div]:flex [&_div]:justify-between [&_div]:gap-4 [&_div]:border-b [&_div]:border-line [&_div]:pb-3 [&_div:last-child]:border-0 [&_div:last-child]:pb-0 [&_dt]:m-0 [&_dt]:text-faint [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold [&_dd]:[overflow-wrap:anywhere]";
const ERR = "flex items-start gap-2 rounded-md border border-red-100 bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger-fg";

export default function EmployeeActivationClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    getInvitationByToken(token)
      .then((res) => {
        if (!isMounted) return;
        setInvite(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMsg(err.message || t(lang, "Unable to verify this invitation link."));
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, lang]);

  const activationSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, t(lang, "Name must be at least 2 characters."))
      .required(t(lang, "Please enter your full name.")),
    pw: Yup.string()
      .min(8, t(lang, "Password must be at least 8 characters."))
      .matches(/\d/, t(lang, "Password must include at least one number."))
      .required(t(lang, "Password must be at least 8 characters.")),
    confirm: Yup.string()
      .oneOf([Yup.ref("pw"), null], t(lang, "Passwords do not match."))
      .required(t(lang, "Please confirm your password.")),
    agree: Yup.boolean().oneOf([true], t(lang, "Please accept the terms to continue.")),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      pw: "",
      confirm: "",
      agree: false,
    },
    validationSchema: activationSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      if (!token) {
        setStatus(t(lang, "Missing invitation token."));
        setSubmitting(false);
        return;
      }
      try {
        await activateTeamInvitation({
          invite_token: token,
          name: values.name.trim(),
          password: values.pw,
        });
        await syncCompanyWithBackend(true);
        setDone(true);
        setTimeout(() => {
          router.push("/company/overview");
        }, 1500);
      } catch (err) {
        setStatus(err.message || t(lang, "Failed to activate account. Please try again."));
        setSubmitting(false);
      }
    },
  });

  const s = strength(formik.values.pw);

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-brand-subtle px-6 py-12">
        <div className="flex w-full max-w-[480px] flex-col gap-5 rounded-xl bg-card p-8 text-center shadow-lg">
          {done ? (
            <div className="flex flex-col items-center py-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-success">
                <Icon name="check-circle" size={36} />
              </div>
              <h1 className="mb-2 text-2xl font-extrabold">{t(lang, "Account Activated!")}</h1>
              <p className="text-sm text-muted">
                {t(lang, "Welcome to")} <strong>{invite?.company_name || "the workspace"}</strong>! {t(lang, "Taking you to your dashboard…")}
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-4 py-8">
              <Skeleton height={40} width={200} className="mx-auto" />
              <Skeleton height={20} width={280} className="mx-auto" />
              <div className="mt-4 flex flex-col gap-3">
                <Skeleton height={32} />
                <Skeleton height={32} />
                <Skeleton height={32} />
              </div>
            </div>
          ) : !token ? (
            <div className="flex flex-col gap-4 py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-warning">
                <Icon name="alert-triangle" size={28} />
              </div>
              <h1 className="text-xl font-extrabold">{t(lang, "Missing Invitation Link")}</h1>
              <p className="text-sm leading-relaxed text-muted">
                {t(lang, "No invitation token was found in this URL. Please click the complete activation link from the invitation email you received.")}
              </p>
              <div className="mt-2">
                <Link href="/employer-login">
                  <Button variant="primary" className="w-full justify-center">
                    {t(lang, "Go to Employer Login")}
                  </Button>
                </Link>
              </div>
            </div>
          ) : !invite?.valid ? (
            <div className="flex flex-col gap-4 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
                <Icon name="x-circle" size={30} />
              </div>
              <h1 className="text-xl font-extrabold">{t(lang, "Invitation Unavailable")}</h1>
              <p className={ERR} role="alert">
                <Icon name="alert-circle" size={16} />
                <span>
                  {invite?.message || errorMsg || t(lang, "This invitation link is invalid or has expired.")}
                </span>
              </p>
              {invite?.company_name && (
                <dl className={SUMMARY}>
                  <div>
                    <dt>{t(lang, "Company")}</dt>
                    <dd>{invite.company_name}</dd>
                  </div>
                  {invite.email && (
                    <div>
                      <dt>{t(lang, "Invited Email")}</dt>
                      <dd>{invite.email}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t(lang, "Status")}</dt>
                    <dd className="text-danger-fg">{t(lang, invite.status || "Expired")}</dd>
                  </div>
                </dl>
              )}
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs text-muted">
                  {t(lang, "Please ask your workspace administrator to resend your team invitation.")}
                </p>
                <Link href="/employer-login" className="w-full">
                  <Button variant="secondary" className="w-full justify-center">
                    {t(lang, "Go to Employer Login")}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
                <Icon name="user-check" size={28} />
              </div>
              <div>
                <h1 className="mb-2 text-2xl font-extrabold">{t(lang, "Activate your account")}</h1>
                <p className="text-sm leading-relaxed text-muted">
                  {t(lang, "Set up your password to join")} <strong>{invite.company_name}</strong>. {t(lang, "No separate company registration is needed.")}
                </p>
              </div>

              {invite.message && (
                <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-left text-xs italic text-blue-900">
                  <strong className="not-italic text-blue-950">{t(lang, "Invitation Note")}: </strong>
                  &ldquo;{invite.message}&rdquo;
                </div>
              )}

              <dl className={SUMMARY}>
                <div>
                  <dt>{t(lang, "Company")}</dt>
                  <dd>{invite.company_name}</dd>
                </div>
                <div>
                  <dt>{t(lang, "Invited Email")}</dt>
                  <dd>{invite.email}</dd>
                </div>
                <div>
                  <dt>{t(lang, "Assigned Role")}</dt>
                  <dd className="text-brand font-semibold">{t(lang, invite.role)}</dd>
                </div>
              </dl>

              <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4 text-left">
                <div>
                  <Input
                    id="name"
                    name="name"
                    label={t(lang, "Full Name")}
                    type="text"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && formik.errors.name}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <Input
                    id="pw"
                    name="pw"
                    label={t(lang, "Create Password")}
                    type="password"
                    value={formik.values.pw}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.pw && formik.errors.pw}
                    placeholder="••••••••"
                  />
                  {formik.values.pw && (
                    <div className="mt-2 flex items-center gap-2.5">
                      <div className="flex flex-1 gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all"
                            style={{ background: i <= s ? COLORS[s] : "var(--color-gray-200)" }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: COLORS[s] }}>
                        {t(lang, LABELS[s])}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    id="confirm"
                    name="confirm"
                    label={t(lang, "Confirm Password")}
                    type="password"
                    value={formik.values.confirm}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirm && formik.errors.confirm}
                    placeholder="••••••••"
                  />
                </div>

                <div>
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
                  <p className={ERR} role="alert">
                    <Icon name="alert-circle" size={16} />
                    <span>{formik.status}</span>
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={formik.isSubmitting}
                  className="w-full justify-center"
                >
                  {formik.isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Icon name="loader" size={16} className="animate-spin" />
                      {t(lang, "Activating...")}
                    </span>
                  ) : (
                    t(lang, "Activate & Setup Password")
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
    </>
  );
}
