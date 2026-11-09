"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchActiveCompanyBanners, trackCompanyBannerClick } from "../../lib/api/bannerApi";
import Icon from "../ds/Icon";

export default function EmployerDashboardBanner({ lang = "VN" }) {
  const isVi = lang === "VN" || lang === "VI";
  const [banners, setBanners] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const data = await fetchActiveCompanyBanners("EMPLOYER_DASHBOARD");
      if (mounted && Array.isArray(data) && data.length > 0) {
        setBanners(data);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleBanners = banners.filter((b) => !dismissedIds.includes(b.id));
  if (visibleBanners.length === 0) {
    return null;
  }

  const banner = visibleBanners[0];

  const headline = isVi
    ? banner.headline || banner.title
    : banner.headline_en || banner.headline || banner.title;

  const description = isVi
    ? banner.description
    : banner.description_en || banner.description;

  const ctaLabel = isVi
    ? banner.cta_label || "Xem chi tiết"
    : banner.cta_label_en || banner.cta_label || "View Details";

  const handleDismiss = () => {
    setDismissedIds((prev) => [...prev, banner.id]);
  };

  const handleCtaClick = () => {
    trackCompanyBannerClick(banner.id);
  };

  const bgStyle = banner.bg_gradient
    ? { background: banner.bg_gradient }
    : {
        background:
          "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #2563eb 100%)",
      };

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-sm text-white mb-6 p-5 sm:p-6 transition-all"
      style={bgStyle}
    >
      {/* Background radial glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Dismiss banner"
      >
        <Icon name="x" size={16} />
      </button>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-xs">
              <Icon name="sparkles" size={13} className="text-amber-300" />
            </span>
            {banner.badge_text && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                {banner.badge_text}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {headline}
          </h3>

          {description && (
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
              {description}
            </p>
          )}
        </div>

        {banner.cta_url && (
          <div className="shrink-0 pt-2 sm:pt-0">
            {banner.open_in_new_tab ? (
              <a
                href={banner.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCtaClick}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition-all hover:scale-[1.02]"
              >
                <span>{ctaLabel}</span>
                <Icon name="external-link" size={13} className="text-slate-600" />
              </a>
            ) : (
              <Link
                href={banner.cta_url}
                onClick={handleCtaClick}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition-all hover:scale-[1.02]"
              >
                <span>{ctaLabel}</span>
                <Icon name="arrow-right" size={13} className="text-slate-600" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

