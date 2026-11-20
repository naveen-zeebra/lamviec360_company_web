"use client";

import React, { useState, useEffect } from "react";
import Icon from "../../../../components/ds/Icon";
import { Avatar } from "../../../../components/ds";
import { getTalentCandidateDetailStore } from "../../../../lib/companyStore";

export default function TalentProfileDrawer({
  isOpen,
  onClose,
  candidateSummary,
  onRequestContact,
  onMessage,
  lang = "EN",
  t = (l, s) => s,
}) {
  const isVi = lang === "VI";
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !candidateSummary) {
      setProfileData(null);
      return;
    }

    let active = true;
    setLoading(true);

    getTalentCandidateDetailStore(candidateSummary.id)
      .then((res) => {
        if (!active) return;
        setProfileData(res?.candidate || candidateSummary);
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Failed to load candidate full profile:", err);
        setProfileData(candidateSummary);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, candidateSummary?.id]);

  if (!isOpen || !candidateSummary) return null;

  const cand = profileData || candidateSummary;
  const isContactApproved = !!cand.is_contact_approved || cand.contact_status === "approved";
  const allowMessaging = cand.allows_messaging !== false && cand.allow_unsolicited_messages !== false;
  const displayTitle = cand.headline || cand.title || (isVi ? "Chuyên viên" : "Professional");
  const displayEmail = isContactApproved
    ? cand.email || cand.masked_email
    : cand.email || cand.masked_email || "••••••@••••";
  const displayPhone = isContactApproved
    ? cand.phone || cand.masked_phone
    : cand.phone || cand.masked_phone || "••••••••••";
  const skillsList = Array.isArray(cand.key_skills)
    ? cand.key_skills
    : Array.isArray(cand.skills)
    ? cand.skills
    : [];

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-card border-l border-line shadow-2xl h-full flex flex-col font-body animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-line flex items-start justify-between gap-4 bg-card shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <Avatar
              src={cand.avatar_url || ""}
              name={cand.name || "Candidate"}
              size={56}
              className="rounded-2xl border border-line shadow-2xs shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-ink truncate m-0">
                {cand.name}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-brand truncate m-0 mt-0.5">
                {displayTitle}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <Icon name="briefcase" size={13} className="text-muted/70" />
                  <span>
                    {cand.experience_years
                      ? `${cand.experience_years} ${isVi ? "năm kinh nghiệm" : "years experience"}`
                      : isVi ? "Dưới 1 năm" : "< 1 year"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="map-pin" size={13} className="text-muted/70" />
                  <span>{cand.city || cand.location || "Vietnam"}</span>
                </span>
                {(cand.education_level || cand.education) && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="graduation-cap" size={13} className="text-muted/70" />
                    <span>{cand.education_level || cand.education}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-sunken transition-colors cursor-pointer shrink-0"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Contact Security Bar */}
        <div className="px-5 py-3 bg-sunken/60 border-b border-line flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-4 text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="mail" size={13} className="text-muted/70" />
              <span className="font-mono text-xs font-semibold text-ink">
                {displayEmail}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="phone" size={13} className="text-muted/70" />
              <span className="font-mono text-xs font-semibold text-ink">
                {displayPhone}
              </span>
            </span>
          </div>

          {isContactApproved ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <Icon name="check-circle" size={12} />
              <span>{isVi ? "Đã chia sẻ thông tin" : "Contact Approved"}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onRequestContact(cand)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <Icon name="lock" size={12} />
              <span>{isVi ? "Yêu cầu chia sẻ liên hệ" : "Request Contact Access"}</span>
            </button>
          )}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-muted space-y-2">
              <Icon name="loader" size={24} className="animate-spin text-brand" />
              <p>{isVi ? "Đang tải hồ sơ ứng viên..." : "Loading candidate profile details..."}</p>
            </div>
          ) : (
            <>
              {/* Desired Salary & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-line bg-card">
                  <span className="text-[11px] font-bold text-muted uppercase block">
                    {isVi ? "Mức lương kỳ vọng" : "Desired Salary Range"}
                  </span>
                  <strong className="text-sm font-black text-emerald-700 mt-1 block">
                    {cand.salary_range_display || (isVi ? "Thỏa thuận" : "Negotiable")}
                  </strong>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-card">
                  <span className="text-[11px] font-bold text-muted uppercase block">
                    {isVi ? "Trạng thái tìm việc" : "Job Seeking Status"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>
                      {cand.job_availability === "actively_looking"
                        ? isVi ? "Đang tích cực tìm việc" : "Actively looking"
                        : isVi ? "Mở lòng với cơ hội mới" : "Open to opportunities"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Bio */}
              {cand.bio && (
                <div>
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Icon name="file-text" size={14} className="text-brand" />
                    <span>{isVi ? "Giới thiệu bản thân" : "Professional Summary"}</span>
                  </h4>
                  <div className="p-4 rounded-xl border border-line bg-sunken/30 text-xs text-ink/90 leading-relaxed whitespace-pre-line">
                    {cand.bio}
                  </div>
                </div>
              )}

              {/* Key Skills */}
              {skillsList.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Icon name="tag" size={14} className="text-brand" />
                    <span>{isVi ? "Kỹ năng chuyên môn" : "Technical & Core Skills"}</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sunken border border-line text-ink"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {Array.isArray(cand.experience) && cand.experience.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Icon name="briefcase" size={14} className="text-brand" />
                    <span>{isVi ? "Kinh nghiệm làm việc" : "Work Experience"}</span>
                  </h4>
                  <div className="space-y-3">
                    {cand.experience.map((exp, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-line bg-card shadow-2xs space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <strong className="text-xs font-bold text-ink block">{exp.title}</strong>
                          <span className="text-[11px] font-semibold text-muted shrink-0">
                            {exp.start} – {exp.isCurrent ? (isVi ? "Hiện tại" : "Present") : exp.end}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-brand block">{exp.company}</span>
                        {exp.description && (
                          <p className="text-xs text-muted/90 m-0 leading-relaxed whitespace-pre-line pt-1">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio & Project Showcase */}
              {Array.isArray(cand.portfolio_items) && cand.portfolio_items.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Icon name="folder" size={14} className="text-brand" />
                    <span>{isVi ? "Dự án / Hồ sơ năng lực nổi bật" : "Featured Portfolio Deliverables"}</span>
                  </h4>
                  <div className="space-y-3">
                    {cand.portfolio_items.map((proj, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-line bg-card shadow-2xs space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <strong className="text-xs font-bold text-ink block">{proj.title}</strong>
                          {proj.url && (
                            <a
                              href={proj.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand hover:underline inline-flex items-center gap-1 shrink-0"
                            >
                              <Icon name="external-link" size={12} />
                              <span>{isVi ? "Xem dự án" : "Demo Link"}</span>
                            </a>
                          )}
                        </div>
                        {proj.role && (
                          <span className="text-[11px] font-semibold text-muted block">
                            {isVi ? "Vai trò: " : "Role: "}{proj.role}
                          </span>
                        )}
                        {proj.description && (
                          <p className="text-xs text-muted/90 m-0 leading-relaxed pt-0.5">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {Array.isArray(cand.education) && cand.education.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Icon name="graduation-cap" size={14} className="text-brand" />
                    <span>{isVi ? "Trình độ học vấn" : "Education & Credentials"}</span>
                  </h4>
                  <div className="space-y-2.5">
                    {cand.education.map((edu, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-line bg-card shadow-2xs">
                        <strong className="text-xs font-bold text-ink block">{edu.degree}</strong>
                        <div className="flex items-center justify-between text-xs text-muted mt-1">
                          <span>{edu.institution}</span>
                          {edu.year && <span className="font-semibold">{edu.year}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-line bg-card flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-xl border border-line hover:bg-sunken transition-colors cursor-pointer"
          >
            {isVi ? "Đóng" : "Close"}
          </button>

          <div className="flex items-center gap-2">
            {!isContactApproved && (
              <button
                type="button"
                onClick={() => onRequestContact(cand)}
                className="px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Icon name="lock" size={13} />
                <span>{isVi ? "Yêu cầu thông tin liên hệ" : "Request Contact Details"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onMessage(cand)}
              disabled={!allowMessaging}
              className={`px-4 py-2 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-2xs ${
                allowMessaging
                  ? "bg-brand text-white hover:bg-brand-hover cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              <Icon name="mail" size={14} />
              <span>{isVi ? "Gửi lời mời ứng tuyển" : "Send Job Invitation"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
