"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Reveal from "../../../components/ds/Reveal";
import { useLang, t } from "../../../utils/lang";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import PageHead from "../../../components/layout/PageHead";

const RES = [
  { cat: ["Tuyển dụng", "Hiring"], t: ["Viết tin tuyển dụng thu hút đúng ứng viên", "Writing a job post that attracts the right people"], d: ["Cấu trúc mô tả công việc rõ ràng giúp giảm số hồ sơ không phù hợp.", "A clear job description structure that reduces unsuitable applications."], r: ["7 phút đọc", "7 min read"] },
  { cat: ["Phỏng vấn", "Interviews"], t: ["Xây dựng bộ câu hỏi phỏng vấn thống nhất", "Building a consistent interview scorecard"], d: ["Cách đánh giá ứng viên theo cùng một tiêu chí để so sánh công bằng.", "How to evaluate candidates against the same criteria for fair comparison."], r: ["6 phút đọc", "6 min read"] },
  { cat: ["Quy trình", "Process"], t: ["Giảm thời gian tuyển dụng mà không hạ chuẩn", "Reducing time-to-hire without lowering the bar"], d: ["Những điểm nghẽn thường gặp trong pipeline và cách xử lý.", "Common pipeline bottlenecks and how to address them."], r: ["8 phút đọc", "8 min read"] },
  { cat: ["Thương hiệu", "Employer brand"], t: ["Hồ sơ doanh nghiệp khiến ứng viên muốn ứng tuyển", "A company profile candidates want to apply to"], d: ["Những thông tin ứng viên thực sự tìm kiếm trước khi nộp hồ sơ.", "What candidates actually look for before they apply."], r: ["5 phút đọc", "5 min read"] },
  { cat: ["Đội ngũ", "Team"], t: ["Phối hợp tuyển dụng giữa nhân sự và quản lý", "Coordinating hiring between HR and managers"], d: ["Phân chia vai trò và quyền truy cập để quy trình chạy trôi chảy.", "Splitting roles and access so the process keeps moving."], r: ["6 phút đọc", "6 min read"] },
  { cat: ["AI", "AI"], t: ["Dùng AI trong tuyển dụng một cách có trách nhiệm", "Using AI in recruitment responsibly"], d: ["AI hỗ trợ ở đâu, và tại sao con người vẫn phải quyết định.", "Where AI helps, and why people must still decide."], r: ["9 phút đọc", "9 min read"] },
];

export default function EmployerResourcesClient() {
  const [lang, setLang] = useLang();
  const router = useRouter();
  const [cat, setCat] = useState("");
  const cats = [...new Set(RES.map((r) => (lang === "VN" || lang === "VI" ? r.cat[0] : r.cat[1])))];
  const list = RES.filter((r) => !cat || (lang === "VN" || lang === "VI" ? r.cat[0] : r.cat[1]) === cat);

  return (
    <>
      <Header lang={lang} setLang={setLang} app="employer" />
      <main>
        <PageHead
          lang={lang}
          home="/employers"
          crumb={t(lang, "Resources")}
          title={t(lang, "Practical guides for hiring teams.")}
          desc={t(lang, "Short reads on postings, interviews, process and responsible hiring.")}
        />
        <section className="lv-section" style={{ paddingTop: "var(--space-12)" }}>
          <div className="lv-filter-row" style={{ justifyContent: "flex-start" }}>
            <button className={`lv-filter-chip ${!cat ? "active" : ""}`} onClick={() => setCat("")}>
              {t(lang, "All")}
            </button>
            {cats.map((c) => (
              <button key={c} className={`lv-filter-chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="lv-res-grid">
            {list.map((r) => (
              <Reveal key={r.t[1]}>
                <article className="lv-res-card">
                  <span className="lv-res-cat">{(lang === "VN" || lang === "VI" ? r.cat[0] : r.cat[1])}</span>
                  <h3>{(lang === "VN" || lang === "VI" ? r.t[0] : r.t[1])}</h3>
                  <p>{(lang === "VN" || lang === "VI" ? r.d[0] : r.d[1])}</p>
                  <div className="lv-res-foot">
                    <span>{(lang === "VN" || lang === "VI" ? r.r[0] : r.r[1])}</span>
                    <a href="#" className="lv-job-view" onClick={(e) => e.preventDefault()}>
                      {t(lang, "Read ")}
                      <Icon name="arrow-right" size={14} />
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="lv-section lv-section-blue">
          <Reveal className="lv-section-head">
            <h2>{t(lang, "Need help with your workspace?")}</h2>
            <p>{t(lang, "The Help Center covers postings, candidates, team access and billing.")}</p>
          </Reveal>
          <div className="lv-sol-grid">
            {[
              ["file-plus", "Tin tuyển dụng", "Job postings"],
              ["users", "Ứng viên & pipeline", "Candidates & pipeline"],
              ["users-round", "Đội ngũ & quyền truy cập", "Team & access"],
              ["credit-card", "Gói & thanh toán", "Plans & billing"],
              ["shield-check", "Xác thực doanh nghiệp", "Company verification"],
              ["bar-chart-3", "Báo cáo", "Reporting"],
            ].map((x) => (
              <Reveal key={x[2]}>
                <div className="lv-sol-card">
                  <div className="lv-sol-icon">
                    <Icon name={x[0]} size={20} />
                  </div>
                  <h3>{(lang === "VN" || lang === "VI" ? x[1] : x[2])}</h3>
                  <a href="#" className="lv-job-view" onClick={(e) => e.preventDefault()}>
                    {t(lang, "Browse articles ")}
                    <Icon name="arrow-right" size={14} />
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        <Reveal as="section" className="lv-final-cta lv-final-cta-navy">
          <h2>{t(lang, "Start hiring with LàmViệc360")}</h2>
          <p>{t(lang, "Register your company, get verified and publish your first job.")}</p>
          <div className="lv-final-cta-buttons">
            <Button variant="primary" size="lg" onClick={() => router.push("/company-register")}>
              {t(lang, "Get Started")}
            </Button>
            <Button variant="ghost" size="lg" style={{ color: "var(--text-inverse)", border: "1.5px solid rgba(255,255,255,0.5)" }} onClick={() => router.push("/solutions")}>
              {t(lang, "Explore Solutions")}
            </Button>
          </div>
        </Reveal>
      </main>
      <Footer lang={lang} setLang={setLang} app="employer" />
    </>
  );
}
