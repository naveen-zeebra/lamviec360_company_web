"use client";

import Icon from "../ds/Icon";
import { trackCompanyBannerClick } from "../../lib/api/bannerApi";

export default function CompanyEventDetailsModal({ event, isOpen, onClose, lang = "VN" }) {
  if (!isOpen || !event) return null;

  const isVi = lang === "VN" || lang === "VI";

  const headline = event.headline || event.title || event.headline_en || "";
  const description = event.description || event.description_en || "";
  const ctaLabel =
    event.cta_label ||
    event.cta_label_en ||
    (isVi ? "Đăng ký vé Doanh nghiệp ↗" : "Register on Official Site ↗");

  const eventDateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString(isVi ? "vi-VN" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handleRegisterClick = () => {
    trackCompanyBannerClick(event.id);
    if (event.cta_url) {
      if (event.open_in_new_tab !== false) {
        window.open(event.cta_url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = event.cta_url;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header background with event styling */}
        <div
          className="relative p-6 text-white overflow-hidden"
          style={{
            background:
              event.bg_gradient ||
              "linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>

          <div className="space-y-2 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              {event.badge_text && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-xs border border-white/20">
                  <Icon name="sparkles" size={12} className="text-amber-300" />
                  {event.badge_text}
                </span>
              )}
              <span className="text-xs bg-black/20 rounded-full px-2.5 py-0.5 text-white/90">
                {event.category || "Hiring Event"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight drop-shadow-xs">
              {headline}
            </h2>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Key event facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs sm:text-sm">
            {eventDateStr && (
              <div className="flex items-start gap-2.5 text-slate-700">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                  <Icon name="calendar" size={16} />
                </span>
                <div>
                  <div className="font-semibold text-slate-900">
                    {isVi ? "Thời gian" : "Date & Time"}
                  </div>
                  <div className="text-slate-600 text-xs mt-0.5">{eventDateStr}</div>
                </div>
              </div>
            )}

            {event.location_or_platform && (
              <div className="flex items-start gap-2.5 text-slate-700">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                  <Icon name="map-pin" size={16} />
                </span>
                <div>
                  <div className="font-semibold text-slate-900">
                    {isVi ? "Địa điểm / Nền tảng" : "Location / Platform"}
                  </div>
                  <div className="text-slate-600 text-xs mt-0.5">
                    {event.location_or_platform}
                  </div>
                </div>
              </div>
            )}

            {event.organizer && (
              <div className="flex items-start gap-2.5 text-slate-700 sm:col-span-2 border-t border-slate-200/60 pt-2.5">
                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                  <Icon name="users" size={16} />
                </span>
                <div>
                  <div className="font-semibold text-slate-900">
                    {isVi ? "Đơn vị tổ chức & Đối tác" : "Host & Partners"}
                  </div>
                  <div className="text-slate-600 text-xs mt-0.5">{event.organizer}</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isVi ? "Thông tin chi tiết sự kiện" : "Event Overview"}
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Third party notice */}
          {event.cta_url &&
            (event.cta_url.startsWith("http://") || event.cta_url.startsWith("https://")) && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs border border-emerald-100">
                <Icon name="info" size={16} className="shrink-0" />
                <span>
                  {isVi
                    ? "Sự kiện được tiếp nhận đăng ký trên cổng chính thức của đơn vị tổ chức. Bấm nút bên dưới để chuyển hướng sang trang đăng ký."
                    : "Registration for this event is handled on the partner's official portal. Click below to continue."}
                </span>
              </div>
            )}
        </div>

        {/* Modal footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            {isVi ? "Đóng" : "Close"}
          </button>

          <button
            type="button"
            onClick={handleRegisterClick}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{ctaLabel}</span>
            <Icon name="external-link" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
