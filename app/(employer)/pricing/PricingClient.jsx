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
  const [annual, setAnnual] = useState(false);
  const [open, setOpen] = useState(0);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getCompanyToken()));
  }, []);

  const isVi = lang === "VI" || lang === "VN";

  const handlePlanAction = (planId) => {
    if (hasToken) {
      router.push("/company/billing");
    } else {
      router.push("/company-register");
    }
  };

  const plans = isVi
    ? [
        {
          id: "Freemium",
          n: "Miễn phí",
          t: "Bắt đầu miễn phí",
          d: "Dành cho doanh nghiệp mới bắt đầu tuyển dụng hoặc tuyển dụng thời vụ.",
          priceMonthly: "0 ₫",
          priceAnnual: "0 ₫",
          unit: "",
          features: [
            "Tối đa 3 tin tuyển dụng hoạt động",
            "Quản lý hồ sơ ứng viên theo pipeline",
            "1 tài khoản thành viên",
            "Trang hồ sơ doanh nghiệp chuẩn",
            "Hỗ trợ qua email",
          ],
          c: "Bắt đầu miễn phí",
          v: "secondary",
          f: false,
        },
        {
          id: "Professional",
          n: "Chuyên nghiệp",
          t: "Phát triển tuyển dụng",
          d: "Dành cho các doanh nghiệp và đội ngũ tuyển dụng đang mở rộng quy mô.",
          priceMonthly: "2.900.000 ₫",
          priceAnnual: "2.320.000 ₫",
          unit: "/ tháng",
          features: [
            "Tối đa 25 tin tuyển dụng hoạt động",
            "Sàng lọc & chấm điểm ứng viên bằng AI",
            "Soạn mô tả công việc tự động bằng AI",
            "Không giới hạn thành viên đội ngũ",
            "Huy hiệu doanh nghiệp đã xác thực",
            "Hỗ trợ kỹ thuật ưu tiên",
          ],
          c: "Chọn gói Chuyên nghiệp",
          v: "primary",
          f: true,
        },
        {
          id: "Enterprise",
          n: "Doanh nghiệp",
          t: "Mở rộng quy mô tuyển dụng",
          d: "Dành cho tập đoàn và tổ chức có yêu cầu tuyển dụng cao cấp, số lượng lớn.",
          priceMonthly: "Liên hệ",
          priceAnnual: "Liên hệ",
          unit: "",
          features: [
            "Không giới hạn số lượng tin tuyển dụng",
            "Toàn bộ tính năng AI & phân tích chuyên sâu",
            "Tích hợp SSO & bảo mật doanh nghiệp",
            "Xuất dữ liệu & báo cáo tuyển dụng nâng cao",
            "Quản lý tài khoản riêng biệt & hỗ trợ 24/7",
          ],
          c: "Liên hệ Kinh doanh",
          v: "secondary",
          f: false,
        },
      ]
    : [
        {
          id: "Freemium",
          n: "Freemium",
          t: "Start for free",
          d: "For startups and small businesses getting started with occasional hiring.",
          priceMonthly: "0 VND",
          priceAnnual: "0 VND",
          unit: "",
          features: [
            "Up to 3 active job postings",
            "Basic candidate pipeline management",
            "1 team member seat",
            "Standard verified company profile",
            "Standard email support",
          ],
          c: "Start Free",
          v: "secondary",
          f: false,
        },
        {
          id: "Professional",
          n: "Professional",
          t: "Grow your hiring",
          d: "For growing companies and active talent acquisition teams.",
          priceMonthly: "2,900,000 VND",
          priceAnnual: "2,320,000 VND",
          unit: "/ mo",
          features: [
            "Up to 25 active job postings",
            "AI candidate screening & fit scoring",
            "AI job description assistant",
            "Unlimited team members & roles",
            "Verified Employer badge",
            "Priority customer support",
          ],
          c: "Choose Professional",
          v: "primary",
          f: true,
        },
        {
          id: "Enterprise",
          n: "Enterprise",
          t: "Scale your recruitment",
          d: "For organizations with advanced recruitment requirements and high volume.",
          priceMonthly: "Custom",
          priceAnnual: "Custom",
          unit: "",
          features: [
            "Unlimited active job postings",
            "Full AI suite & recruitment analytics",
            "SSO authentication & enterprise security",
            "Custom data exports & audit logs",
            "Dedicated account manager & 24/7 SLA",
          ],
          c: "Contact Sales",
          v: "secondary",
          f: false,
        },
      ];

  const rows = isVi
    ? [
        ["Tin tuyển dụng đồng thời", "3", "25", "Không giới hạn"],
        ["Quản lý ứng viên theo Pipeline", 1, 1, 1],
        ["Thành viên đội ngũ", "1", "Không giới hạn", "Không giới hạn"],
        ["Soạn thảo JD bằng AI", 0, 1, 1],
        ["Sàng lọc CV & chấm điểm bằng AI", 0, 1, 1],
        ["Phân quyền theo vai trò (Admin/HR/Viewer)", 0, 1, 1],
        ["Trang doanh nghiệp đã xác thực", 1, 1, 1],
        ["Báo cáo phân tích tuyển dụng", 0, 1, 1],
        ["Đăng nhập SSO & bảo mật doanh nghiệp", 0, 0, 1],
        ["Hỗ trợ khách hàng", "Email", "Ưu tiên", "Quản lý riêng 24/7"],
      ]
    : [
        ["Active job postings", "3", "25", "Unlimited"],
        ["Candidate pipeline management", 1, 1, 1],
        ["Team members & seats", "1", "Unlimited", "Unlimited"],
        ["AI job description generator", 0, 1, 1],
        ["AI candidate screening & fit scoring", 0, 1, 1],
        ["Role-based access (Admin/HR/Viewer)", 0, 1, 1],
        ["Verified company page badge", 1, 1, 1],
        ["Recruitment analytics & exports", 0, 1, 1],
        ["SSO & Enterprise security", 0, 0, 1],
        ["Customer support", "Email", "Priority", "Dedicated 24/7"],
      ];

  const faqs = isVi
    ? [
        [
          "LàmViệc360 có miễn phí cho người tìm việc không?",
          "Có. Tìm việc, tạo hồ sơ năng lực, nộp đơn ứng tuyển và theo dõi trạng thái hồ sơ luôn hoàn toàn miễn phí đối với ứng viên.",
        ],
        [
          "Doanh nghiệp được xác thực như thế nào?",
          "Sau khi đăng ký tài khoản công ty, thông tin doanh nghiệp (giấy phép kinh doanh, email tên miền) được đội ngũ kiểm duyệt xem xét trước khi cấp huy hiệu 'Đã xác thực'.",
        ],
        [
          "Tôi có thể nâng cấp hoặc huỷ gói bất kỳ lúc nào không?",
          "Hoàn toàn có thể. Doanh nghiệp có thể nâng cấp gói dịch vụ bất kỳ lúc nào để nhận thêm hạn mức đăng tin và tính năng AI ngay lập tức trong trang Quản lý thanh toán.",
        ],
        [
          "AI có tự ra quyết định tuyển dụng thay con người không?",
          "Không. Các công cụ AI của LàmViệc360 đóng vai trò hỗ trợ gợi ý soạn thảo và phân tích độ tương đồng từ khóa, mọi quyết định mời phỏng vấn hoặc tuyển dụng đều do đội ngũ nhân sự trực tiếp đưa ra.",
        ],
        [
          "Giá trên đã bao gồm VAT chưa và hình thức thanh toán là gì?",
          "Đơn vị tính trên nền tảng là VND. Chúng tôi hỗ trợ thanh toán qua chuyển khoản ngân hàng, thẻ doanh nghiệp và xuất hóa đơn điện tử đầy đủ theo quy định.",
        ],
      ]
    : [
        [
          "Is LàmViệc360 free for job seekers?",
          "Yes. Searching for jobs, creating profiles, applying to openings, and tracking applications are 100% free for job seekers.",
        ],
        [
          "How does company verification work?",
          "After registering, your company information (business license and domain email) is verified by our team before granting the 'Verified' badge on your job postings.",
        ],
        [
          "Can I upgrade or change my plan at any time?",
          "Yes. You can upgrade your plan or adjust job posting limits at any time from your Subscription & Billing management console.",
        ],
        [
          "Does AI make automated hiring decisions?",
          "No. Our AI assists with drafting descriptions and scoring qualification match rates, but every hiring and interview decision is made by your human team.",
        ],
        [
          "What payment methods are supported?",
          "All platform prices are denominated in VND. We support bank wire transfers, corporate cards, and issue legal VAT e-invoices.",
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
          title={t(lang, "Choose the plan that fits your hiring needs.")}
          desc={t(lang, "Always free for job seekers. Employer plans are priced in VND.")}
        />

        {/* Pricing Grid Section */}
        <section className="lv-section" style={{ paddingTop: 56 }}>
          <div className="lv-billing-toggle" style={{ marginBottom: "var(--space-10)", marginTop: 0 }}>
            <span className={!annual ? "active" : ""}>{t(lang, "Monthly")}</span>
            <button
              className={`lv-switch ${annual ? "on" : ""}`}
              role="switch"
              aria-checked={annual}
              aria-label={t(lang, "Billing period")}
              onClick={() => setAnnual((v) => !v)}
            >
              <span />
            </button>
            <span className={annual ? "active" : ""}>
              {t(lang, "Annual ")}
              <Badge tone="success">{isVi ? "Tiết kiệm 20%" : "Save 20%"}</Badge>
            </span>
          </div>

          <div className="lv-pricing-grid">
            {plans.map((p) => {
              const priceDisplay = annual ? p.priceAnnual : p.priceMonthly;
              return (
                <Reveal key={p.id}>
                  <div className={`lv-price-card ${p.f ? "featured" : ""}`}>
                    {p.f && <span className="lv-price-badge">{t(lang, "Most popular")}</span>}
                    <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>{p.n}</h3>
                    <p className="lv-price-tag">{p.t}</p>

                    <div className="lv-price-amount" style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>
                        {priceDisplay}
                      </span>
                      {p.unit && (
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {p.unit}
                        </span>
                      )}
                    </div>

                    {annual && p.id === "Professional" && (
                      <span className="lv-price-note" style={{ color: "var(--green-700)", fontWeight: 600 }}>
                        {isVi ? "Thanh toán theo năm (27.840.000 ₫/năm)" : "Billed annually (27,840,000 VND/yr)"}
                      </span>
                    )}

                    <p className="lv-price-desc" style={{ marginTop: 8 }}>
                      {p.d}
                    </p>

                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: "16px 0 24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {p.features.map((f) => (
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

                    <div style={{ marginTop: "auto" }}>
                      <Button
                        variant={p.v}
                        size="md"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={() => handlePlanAction(p.id)}
                      >
                        {hasToken ? (isVi ? `Chọn gói ${p.n}` : `Choose ${p.n}`) : p.c}
                      </Button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="lv-section" style={{ paddingTop: 0 }}>
          <Reveal className="lv-section-head" style={{ marginBottom: "var(--space-8)" }}>
            <h2>{t(lang, "Compare plans")}</h2>
          </Reveal>
          <Reveal>
            <div style={{ overflowX: "auto" }}>
              <table className="lv-compare">
                <thead>
                  <tr>
                    <th style={{ width: "38%" }}>{t(lang, "Feature")}</th>
                    {plans.map((p) => (
                      <th key={p.id} style={{ width: "20.6%" }}>
                        {p.n}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r[0]}>
                      <td style={{ fontWeight: 600 }}>{r[0]}</td>
                      {r.slice(1).map((v, i) => (
                        <td key={i}>
                          {v === 1 ? (
                            <span aria-hidden="true" style={{ display: "inline-flex", justifyContent: "center" }}>
                              <Icon name="check" size={18} />
                            </span>
                          ) : v === 0 ? (
                            <span style={{ color: "var(--text-tertiary)" }}>—</span>
                          ) : (
                            <span style={{ fontWeight: 500 }}>{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
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
