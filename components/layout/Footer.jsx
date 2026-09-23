import Link from "next/link";
import Icon from "../ds/Icon";
import { LANGS, useLang, t } from "../../utils/lang";

export default function Footer({ lang, setLang, app = "seeker" }) {
  const emp = app === "employer";
  const cols = emp
    ? [
        {
          t: ["Giải pháp", "Solutions"],
          links: [
            [["Đăng tin tuyển dụng", "Job Posting"], "/solutions#posting"],
            [["Tìm kiếm ứng viên", "Candidate Search"], "/solutions#search"],
            [["Quản lý ứng tuyển", "Applicant Tracking"], "/solutions#tracking"],
            [["Quản lý phỏng vấn", "Interview Management"], "/solutions#interviews"],
            [["Phân tích tuyển dụng", "Hiring Analytics"], "/solutions#analytics"],
          ],
        },
        {
          t: ["Doanh nghiệp", "Company"],
          links: [
            [["Bảng giá", "Pricing"], "/pricing"],
            [["Tài nguyên", "Resources"], "/employer-resources"],
            [["Đăng nhập Doanh nghiệp", "Employer Login"], "/employer-login"],
            [["Đăng ký doanh nghiệp", "Company Registration"], "/company-register"],
          ],
        },
        {
          t: ["Người tìm việc", "Job Seekers"],
          links: [
            [["Trang Người tìm việc", "Job Seeker Home"], "/"],
            [["Tìm việc làm", "Find Jobs"], "/jobs"],
            [["Công ty", "Companies"], "/companies"],
            [["Cẩm nang nghề nghiệp", "Career Resources"], "/resources"],
          ],
        },
        {
          t: ["Pháp lý", "Legal"],
          links: [
            [["Chính sách bảo mật", "Privacy Policy"], "/employers#privacy"],
            [["Điều khoản dịch vụ", "Terms of Service"], "/employers#terms"],
            [["Bảo vệ dữ liệu", "Data Protection"], "/employers#data"],
            [["Minh bạch về AI", "AI Transparency"], "/employers#ai"],
          ],
        },
      ]
    : [
        {
          t: ["Người tìm việc", "Job Seekers"],
          links: [
            [["Tìm việc làm", "Find Jobs"], "/jobs"],
            [["Công ty", "Companies"], "/companies"],
            [["Cẩm nang nghề nghiệp", "Career Resources"], "/resources"],
            [["Hồ sơ của tôi", "My Profile"], "/settings"],
            [["Đơn ứng tuyển của tôi", "My Applications"], "/applications"],
          ],
        },
        {
          t: ["Tài khoản", "Account"],
          links: [
            [["Đăng nhập", "Login"], "/login"],
            [["Tạo tài khoản", "Create Account"], "/register"],
            [["Việc đã lưu", "Saved Jobs"], "/saved-jobs"],
            [["Chuẩn bị phỏng vấn", "Interview Preparation"], "/resources"],
          ],
        },
        {
          t: ["Nhà tuyển dụng", "Employers"],
          links: [
            [["Trang Nhà tuyển dụng", "Employer Home"], "/employers"],
            [["Giải pháp", "Solutions"], "/solutions"],
            [["Bảng giá", "Pricing"], "/pricing"],
            [["Đăng nhập Doanh nghiệp", "Employer Login"], "/employer-login"],
          ],
        },
        {
          t: ["Pháp lý", "Legal"],
          links: [
            [["Chính sách bảo mật", "Privacy Policy"], "/#privacy"],
            [["Điều khoản dịch vụ", "Terms of Service"], "/#terms"],
            [["Chính sách Cookie", "Cookie Policy"], "/#cookies"],
            [["Minh bạch về AI", "AI Transparency"], "/#ai"],
          ],
        },
      ];

  const isVi = lang === "VN" || lang === "VI";

  return (
    <footer className="bg-gray-900 px-6 pb-8 pt-16 text-white/65">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8 max-lg:grid-cols-3 max-md:grid-cols-1">
        <div>
          <img src="/logo-cropped.png" alt="LàmViệc360" className="block h-[26px] w-auto rounded-sm bg-card px-2 py-1" />
          <p className="mt-3 text-sm text-white/50">{t(lang, "Connecting Talent with Opportunity.")}</p>
          <Link href={emp ? "/" : "/employers"} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 no-underline hover:no-underline">
            {emp ? t(lang, "Looking for a job?") : t(lang, "Are you hiring?")} <Icon name="arrow-right" size={14} />
          </Link>
        </div>
        {cols.map((c) => (
          <div key={c.t[1]}>
            <h4 className="mb-4 text-sm font-semibold text-white">{isVi ? c.t[0] : c.t[1]}</h4>
            {c.links.map(([lbl, href]) => (
              <Link key={lbl[1]} href={href} className="mb-2.5 block text-sm text-white/60 no-underline hover:text-white hover:no-underline">
                {isVi ? lbl[0] : lbl[1]}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-[1200px] flex-wrap gap-5 border-t border-white/10 pt-6 text-sm">
        {LANGS.map((l) => (
          <a
            key={l.code}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setLang && setLang(l.code);
            }}
            className={`no-underline hover:text-white ${lang === l.code ? "font-bold text-white" : "font-normal text-white/60"}`}
          >
            {l.label}
          </a>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-[1200px] text-xs text-white/40">{t(lang, "© LàmViệc360. All rights reserved.")}</div>
    </footer>
  );
}
