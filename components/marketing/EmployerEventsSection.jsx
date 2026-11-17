"use client";

import { useState, useEffect } from "react";
import { fetchActiveCompanyEvents, trackCompanyEventClick } from "../../lib/api/eventsApi";
import Icon from "../ds/Icon";
import CompanyEventDetailsModal from "./CompanyEventDetailsModal";

// Seed / fallback events matching the wireframe design
const DEFAULT_EMPLOYER_EVENTS = [
  {
    id: 901,
    day: "12",
    month: "Nov",
    category: "Seminar",
    category_vi: "Hội thảo",
    title: "Career guidance seminar 2026",
    title_vi: "Hội thảo định hướng nghề nghiệp 2026",
    organizer: "Câu lạc bộ Nhân sự Sông Hồng",
    location: "Hanoi",
    description:
      "Hội thảo định hướng nghề nghiệp và chiến lược phát triển sự nghiệp cùng chuyên gia nhân sự hàng đầu.",
    description_en:
      "Career guidance seminar and career development strategies with leading HR experts.",
    cta_url: "https://example.com/events/career-guidance-seminar-2026",
    open_in_new_tab: true,
  },
  {
    id: 902,
    day: "18",
    month: "Nov",
    category: "Webinar",
    category_vi: "Webinar",
    title: "Preparing for interviews in English",
    title_vi: "Chuẩn bị phỏng vấn bằng tiếng Anh",
    organizer: "Mạng lưới Nghề nghiệp Cửu Long",
    location: "Online",
    description:
      "Hội thảo trực tuyến hướng dẫn cách trả lời phỏng vấn chuyên nghiệp bằng tiếng Anh.",
    description_en:
      "Online webinar on effective strategies and answering techniques for English job interviews.",
    cta_url: "https://example.com/events/interview-in-english",
    open_in_new_tab: true,
  },
  {
    id: 903,
    day: "22",
    month: "Nov",
    category: "Exhibition",
    category_vi: "Triển lãm",
    title: "Da Nang job fair",
    title_vi: "Ngày hội việc làm Đà Nẵng",
    organizer: "Hiệp hội Doanh nghiệp Miền Trung",
    location: "Da Nang",
    description:
      "Ngày hội việc làm quy tụ các doanh nghiệp công nghệ, dịch vụ và sản xuất tại Miền Trung.",
    description_en:
      "Regional job fair bringing together top employers across technology, services, and manufacturing.",
    cta_url: "https://example.com/events/da-nang-job-fair",
    open_in_new_tab: true,
  },
  {
    id: 904,
    day: "27",
    month: "Nov",
    category: "Seminar",
    category_vi: "Hội thảo",
    title: "Hiring Gen Z: what to know",
    title_vi: "Tuyển dụng Gen Z: những điều cần biết",
    organizer: "Diễn đàn Nhân sự Gia Định",
    location: "Ho Chi Minh City",
    description:
      "Chia sẻ kinh nghiệm thu hút, tuyển dụng và gắn kết thế hệ nhân sự trẻ Gen Z tại doanh nghiệp.",
    description_en:
      "Insightful seminar on recruiting, onboarding, and engaging the Gen Z workforce.",
    cta_url: "https://example.com/events/hiring-gen-z",
    open_in_new_tab: true,
  },
];

export default function EmployerEventsSection({ lang = "VN" }) {
  const isVi = lang === "VN" || lang === "VI";
  const [events, setEvents] = useState(DEFAULT_EMPLOYER_EVENTS);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadEvents() {
      try {
        setLoading(true);
        let data = await fetchActiveCompanyEvents();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setEvents(data);
        }
      } catch (err) {
        console.warn("Failed to load employer events:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    if (event.id) {
      trackCompanyEventClick(event.id);
    }
    if (event.cta_url) {
      if (event.open_in_new_tab !== false) {
        window.open(event.cta_url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = event.cta_url;
      }
    } else {
      setSelectedEvent(event);
    }
  };

  const parseDate = (event) => {
    if (event.day && event.month) {
      return { day: event.day, month: event.month };
    }
    if (event.event_date) {
      const d = new Date(event.event_date);
      if (!isNaN(d.getTime())) {
        return {
          day: String(d.getDate()),
          month: d.toLocaleString("en-US", { month: "short" }),
        };
      }
    }
    return { day: "12", month: "Nov" };
  };

  const getCategory = (event) => {
    if (isVi && event.category_vi) return event.category_vi;
    if (event.badge_text) return event.badge_text;
    if (event.category) {
      const cat = String(event.category).toLowerCase();
      if (cat === "seminar") return isVi ? "Hội thảo" : "Seminar";
      if (cat === "webinar") return "Webinar";
      if (cat === "exhibition") return isVi ? "Triển lãm" : "Exhibition";
      return event.category;
    }
    return isVi ? "Hội thảo" : "Seminar";
  };

  const getTitle = (event) => {
    if (isVi) {
      return event.title_vi || event.headline || event.title;
    }
    return event.headline_en || event.title || event.title_vi;
  };

  const getSubtitle = (event) => {
    const host = event.organizer || "Diễn đàn Nhân sự";
    const loc = event.location_or_platform || event.location || "";
    return loc ? `${host} · ${loc}` : host;
  };

  // Month & Year for Header
  const sampleDate = events[0]?.event_date ? new Date(events[0].event_date) : null;
  const monthName = sampleDate
    ? sampleDate.toLocaleString("en-US", { month: "long" })
    : "November";
  const monthNum = sampleDate ? sampleDate.getMonth() + 1 : 11;
  const yearNum = sampleDate ? sampleDate.getFullYear() : 2026;

  const headerTitle = isVi
    ? `Sự kiện tháng ${monthNum} năm ${yearNum}`
    : `Events in ${monthName} ${yearNum}`;

  return (
    <>
      <section className="py-10 sm:py-14 bg-page border-y border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Main Card with Brand Accent Top Bar */}
          <div className="bg-card rounded-xl border border-line shadow-sm border-t-[3px] border-t-brand p-6 sm:p-10 md:p-12 transition-all">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-line">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight">
                  {headerTitle}
                </h2>
                <span className="text-xs font-body font-normal text-faint border border-line rounded px-1.5 py-0.5 tracking-wide">
                  Demo data
                </span>
              </div>
              <p className="text-xs sm:text-sm font-body text-muted sm:text-right">
                {isVi
                  ? "Hội thảo, webinar và triển lãm việc làm dành cho người tìm việc và nhà tuyển dụng"
                  : "Seminars, webinars and exhibitions for job seekers and employers"}
              </p>
            </div>

            {/* Event Rows */}
            <div className="divide-y divide-line">
              {events.map((event, idx) => {
                const { day, month } = parseDate(event);
                const category = getCategory(event);
                const title = getTitle(event);
                const subtitle = getSubtitle(event);

                return (
                  <div
                    key={event.id || idx}
                    className="py-5 sm:py-6 flex items-start sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Date & Info */}
                    <div className="flex items-start sm:items-center gap-5 sm:gap-8 min-w-0 flex-1">
                      {/* Date Block: Big Display Number + Month */}
                      <div className="flex items-baseline gap-1.5 w-16 sm:w-20 shrink-0">
                        <span className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-none">
                          {day}
                        </span>
                        <span className="font-body text-xs font-semibold text-muted self-baseline uppercase tracking-wide">
                          {month}
                        </span>
                      </div>

                      {/* Content Block */}
                      <div className="min-w-0 flex-1">
                        {/* Category Box Tag */}
                        <div className="mb-1">
                          <span className="inline-block text-xs font-body font-medium text-muted border border-line-strong rounded px-2 py-0.5 bg-card">
                            {category}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          onClick={(e) => handleEventClick(e, event)}
                          className="text-base sm:text-lg font-display font-bold text-ink group-hover:text-brand transition-colors cursor-pointer leading-snug line-clamp-2"
                        >
                          {title}
                        </h3>

                        {/* Subtitle: Organizer · Location */}
                        <p className="text-xs sm:text-sm font-body text-faint mt-1 line-clamp-1">
                          {subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Right: View details Link */}
                    <div className="shrink-0 sm:text-right">
                      <a
                        href={event.cta_url || "#"}
                        onClick={(e) => handleEventClick(e, event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-body font-semibold text-link hover:text-brand-hover transition-colors whitespace-nowrap cursor-pointer group/link"
                      >
                        <span>{isVi ? "Xem chi tiết" : "View details"}</span>
                        <Icon
                          name="external-link"
                          size={13}
                          className="shrink-0 text-muted group-hover/link:text-brand-hover"
                        />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Note */}
            <div className="pt-4 mt-1 border-t border-line">
              <p className="text-xs font-body text-faint">
                {isVi
                  ? "Thông tin chi tiết sự kiện được đăng tải trên trang của đơn vị tổ chức và mở trong tab mới."
                  : "Event details are on the organizer's own page and open in a new tab."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fallback Details Modal */}
      <CompanyEventDetailsModal
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        lang={lang}
      />
    </>
  );
}
