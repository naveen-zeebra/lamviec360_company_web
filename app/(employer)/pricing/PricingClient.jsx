"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Reveal from "../../../components/ds/Reveal";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import PageHead from "../../../components/layout/PageHead";
import { getCompanyToken } from "../../../lib/api/client";

export default function PricingClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(0);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getCompanyToken()));
  }, []);

  const isVi = lang === "VI" || lang === "VN";

  const handlePlanAction = () => {
    if (hasToken) {
      router.push("/company/billing");
    } else {
      router.push("/company-register?plan=Freemium");
    }
  };

  const freemiumPlan = isVi
    ? {
        id: "Freemium",
        name: "Gói Miễn phí (Freemium)",
        tag: "Gói đang kích hoạt cho mọi doanh nghiệp",
        price: "0 ₫",
        desc: "Đăng tin tuyển dụng, quản lý ứng viên theo pipeline và phối hợp tối đa 6 thành viên đội ngũ hoàn toàn miễn phí.",
        features: [
          "Tối đa 999 tin tuyển dụng đang hoạt động",
          "Tối đa 6 thành viên trong đội ngũ tuyển dụng",
          "Quản lý hồ sơ ứng viên theo pipeline & Nhắn tin trực tiếp",
          "Trang hồ sơ doanh nghiệp đã xác thực",
          "Lưu trữ dữ liệu ứng viên 6 tháng",
          "Hỗ trợ chuẩn qua email",
        ],
        cta: hasToken ? "Xem hạn mức của bạn" : "Đăng ký miễn phí ngay",
      }
    : {
        id: "Freemium",
        name: "Freemium Plan",
        tag: "Active Plan for All Employers",
        price: "0 VND",
        desc: "Post jobs, manage applicants across your hiring pipeline, and collaborate with up to 6 team members completely free.",
        features: [
          "Up to 999 active job postings",
          "Up to 6 team member seats per workspace",
          "Candidate pipeline management & 2-way Direct Messages",
          "Verified company profile & public showcase",
          "6-month candidate data retention",
          "Standard email support",
        ],
        cta: hasToken ? "View Your Quota" : "Start Free Now",
      };

  const faqs = isVi
    ? [
        [
          "LàmViệc360 có miễn phí cho người tìm việc không?",
          "Có. Tìm việc, tạo hồ sơ năng lực, nộp đơn ứng tuyển và theo dõi trạng thái hồ sơ luôn hoàn toàn miễn phí đối với ứng viên.",
        ],
        [
          "Doanh nghiệp được sử dụng những quyền lợi nào với gói Freemium?",
          "Mỗi doanh nghiệp được cấp tối đa 999 tin tuyển dụng hoạt động, tối đa 6 thành viên trong không gian làm việc, quy trình pipeline và nhắn tin trực tiếp với ứng viên hoàn toàn miễn phí (0 ₫).",
        ],
        [
          "Doanh nghiệp được xác thực như thế nào?",
          "Sau khi đăng ký tài khoản công ty, thông tin doanh nghiệp (giấy phép kinh doanh, email tên miền) được đội ngũ kiểm duyệt xem xét trước khi cấp huy hiệu 'Đã xác thực'.",
        ],
      ]
    : [
        [
          "Is LàmViệc360 free for job seekers?",
          "Yes. Searching for jobs, creating profiles, applying to openings, and tracking applications are 100% free for job seekers.",
        ],
        [
          "What is included in the Freemium employer plan?",
          "Every registered employer receives up to 999 active job postings, up to 6 workspace team members, full applicant pipeline tools, and Direct Messaging at 0 VND.",
        ],
        [
          "How does company verification work?",
          "After registering, your company information (business license and domain email) is reviewed by our team before granting the 'Verified' badge on your job postings.",
        ],
      ];

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main>
        <PageHead
          lang={lang}
          home="/employers"
          crumb={t(lang, "Pricing")}
          title={isVi ? "Tuyển dụng miễn phí với gói Freemium." : "Simple, Free Employer Pricing."}
          desc={
            isVi
              ? "Luôn miễn phí cho ứng viên. Doanh nghiệp sử dụng gói Freemium (0 ₫) với tối đa 6 thành viên đội ngũ."
              : "Always free for job seekers. Employers receive full access under the Freemium plan with up to 6 team members."
          }
        />

        {/* Single Active Freemium Plan Card */}
        <section className="lv-section" style={{ paddingTop: 48 }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <Reveal>
              <div className="lv-price-card featured" style={{ padding: "36px 32px" }}>
                <span className="lv-price-badge">
                  {isVi ? "Miễn phí 100% · Gói Freemium" : "100% Free · Active Plan"}
                </span>

                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, margin: 0 }}>{freemiumPlan.name}</h2>
                    <p className="lv-price-tag" style={{ marginTop: 4 }}>{freemiumPlan.tag}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--text-primary)" }}>
                      {freemiumPlan.price}
                    </span>
                  </div>
                </div>

                <p className="lv-price-desc" style={{ marginTop: 12 }}>
                  {freemiumPlan.desc}
                </p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  <Badge tone="brand">
                    {isVi ? "999 tin tuyển dụng" : "999 Job Postings"}
                  </Badge>
                  <Badge tone="success">
                    {isVi ? "Tối đa 6 thành viên" : "Max 6 Team Members"}
                  </Badge>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "24px 0 28px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 12,
                  }}
                >
                  {freemiumPlan.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        fontSize: "var(--text-sm)",
                        lineHeight: "var(--leading-relaxed)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          color: "var(--green-600)",
                          display: "inline-flex",
                          marginTop: 2,
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="check" size={16} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="primary"
                  size="lg"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={handlePlanAction}
                >
                  {freemiumPlan.cta}
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="lv-section lv-section-blue">
          <Reveal className="lv-section-head">
            <h2>{t(lang, "Frequently asked questions")}</h2>
          </Reveal>
          <div className="lv-faq">
            {faqs.map((f, i) => (
              <Reveal key={f[0]}>
                <div className="lv-faq-item">
                  <button
                    type="button"
                    className="lv-faq-q"
                    aria-expanded={open === i}
                    onClick={() => setOpen(open === i ? -1 : i)}
                  >
                    <span>{f[0]}</span>
                    <Icon name={open === i ? "minus" : "plus"} size={18} />
                  </button>
                  {open === i && <div className="lv-faq-a">{f[1]}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <Reveal as="section" className="lv-final-cta lv-final-cta-navy">
          <h2>{t(lang, "Ready to start hiring?")}</h2>
          <p>{t(lang, "Register your company, get verified and post your first job.")}</p>
          <div className="lv-final-cta-buttons">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(hasToken ? "/company/jobs/new" : "/company-register")}
            >
              {isVi ? "Bắt đầu tuyển dụng ngay" : "Start Hiring Today"}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              style={{ color: "var(--text-inverse)", border: "1.5px solid rgba(255,255,255,0.5)" }}
              onClick={() => router.push("/employers")}
            >
              {isVi ? "Xem các giải pháp tuyển dụng" : "Explore Solutions"}
            </Button>
          </div>
        </Reveal>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
    </>
  );
}
