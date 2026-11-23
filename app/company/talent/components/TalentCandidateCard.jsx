"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import { Avatar } from "../../../../components/ds";

export default function TalentCandidateCard({
  candidate,
  onViewProfile,
  onRequestContact,
  onMessage,
  lang = "EN",
  t = (l, s) => s,
}) {
  const isVi = lang === "VI";

  const displayTitle = candidate.headline || candidate.title || (isVi ? "Chuyên viên" : "Professional");
  const skillsList = Array.isArray(candidate.key_skills)
    ? candidate.key_skills
    : Array.isArray(candidate.skills)
    ? candidate.skills
    : [];

  const displaySalary =
    candidate.salary_range_display ||
    (candidate.expected_salary
      ? `${Number(candidate.expected_salary).toLocaleString("vi-VN")} VND`
      : null);

  // Directly display candidate email and phone without masking dots
  const displayEmail = candidate.email || candidate.unmasked_email || (isVi ? "Chưa cung cấp email" : "Email not provided");
  const displayPhone = candidate.phone || candidate.unmasked_phone || (isVi ? "Chưa cung cấp SĐT" : "Phone not provided");

  const expYears = candidate.experience_years !== undefined && candidate.experience_years !== null
    ? Number(candidate.experience_years)
    : 0;

  const displayLocation = [candidate.city, candidate.country]
    .filter(Boolean)
    .filter((val, idx, arr) => arr.indexOf(val) === idx)
    .join(", ") || "Vietnam";

  return (
    <div className="rounded-2xl border border-line bg-card p-5 hover:border-brand/40 hover:shadow-md transition-all flex flex-col justify-between gap-4 font-body group">
      {/* 1. Header: Avatar, Name, Headline, Desired Salary */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            src={candidate.avatar_url || ""}
            name={candidate.name || "Candidate"}
            size={50}
            className="shrink-0 border border-line/60 rounded-xl shadow-2xs"
          />
          <div className="min-w-0">
            <h4 className="text-base font-bold text-ink truncate m-0 group-hover:text-brand transition-colors">
              {candidate.name}
            </h4>
            <p className="text-xs font-semibold text-brand truncate m-0 mt-0.5">
              {displayTitle}
            </p>
            {/* Meta Tags: Experience, Location, Education */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1 font-medium">
                <Icon name="briefcase" size={12} className="text-muted/70" />
                <span>
                  {expYears > 0
                    ? `${expYears} ${isVi ? "năm kinh nghiệm" : "yrs exp"}`
                    : isVi ? "Dưới 1 năm" : "< 1 yr exp"}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Icon name="map-pin" size={12} className="text-muted/70" />
                <span className="truncate">{displayLocation}</span>
              </span>
              {(candidate.education_level || candidate.education) && (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Icon name="graduation-cap" size={12} className="text-muted/70" />
                  <span className="truncate">{candidate.education_level || candidate.education}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Desired Salary & Status Badge */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {displaySalary && (
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted uppercase block">
                {isVi ? "Mức lương kỳ vọng" : "Desired Salary"}
              </span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                {displaySalary}
              </span>
            </div>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-200 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {candidate.job_availability === "actively_looking"
                ? isVi ? "Đang tìm việc" : "Actively looking"
                : isVi ? "Mở cơ hội mới" : "Open to work"}
            </span>
          </span>
        </div>
      </div>

      {/* 2. Candidate Bio / Professional Summary */}
      {candidate.bio && (
        <div className="rounded-xl border border-line/70 bg-sunken/40 p-3 text-xs leading-relaxed">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 flex items-center gap-1">
            <Icon name="file-text" size={11} className="text-brand" />
            <span>{isVi ? "Giới thiệu bản thân" : "Professional Summary"}</span>
          </div>
          <p className="text-xs text-ink/90 m-0 leading-relaxed font-sans whitespace-pre-line">
            {candidate.bio}
          </p>
        </div>
      )}

      {/* 3. All Key Competencies & Technical Skills */}
      {skillsList.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
            {isVi ? "Kỹ năng chuyên môn" : "Skills & Competencies"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {skillsList.map((skill, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-sunken border border-line text-ink hover:border-brand/40 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Social & Portfolio Links (if available) */}
      {(candidate.linkedin_url || candidate.github_url || candidate.portfolio_url) && (
        <div className="flex items-center gap-2 pt-0.5">
          {candidate.linkedin_url && (
            <a
              href={candidate.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md transition-colors"
            >
              <Icon name="globe" size={11} />
              <span>LinkedIn</span>
            </a>
          )}
          {candidate.github_url && (
            <a
              href={candidate.github_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:underline bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md transition-colors"
            >
              <Icon name="code" size={11} />
              <span>GitHub</span>
            </a>
          )}
          {candidate.portfolio_url && (
            <a
              href={candidate.portfolio_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:underline bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md transition-colors"
            >
              <Icon name="external-link" size={11} />
              <span>Portfolio</span>
            </a>
          )}
        </div>
      )}

      {/* 5. Contact Information: Email & Phone directly visible */}
      <div className="p-3 rounded-xl bg-sunken/60 border border-line flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-ink">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="mail" size={13} className="text-brand shrink-0" />
            <a
              href={`mailto:${displayEmail}`}
              className="font-mono text-xs font-semibold text-ink hover:text-brand hover:underline transition-colors"
              title={isVi ? "Gửi email cho ứng viên" : "Send email to candidate"}
            >
              {displayEmail}
            </a>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="phone" size={13} className="text-emerald-600 shrink-0" />
            <a
              href={`tel:${displayPhone}`}
              className="font-mono text-xs font-semibold text-ink hover:text-brand hover:underline transition-colors"
              title={isVi ? "Gọi điện cho ứng viên" : "Call candidate"}
            >
              {displayPhone}
            </a>
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
          <Icon name="check-circle" size={11} />
          <span>{isVi ? "Liên hệ trực tiếp" : "Direct Contact"}</span>
        </span>
      </div>

      {/* 6. Card Action Buttons: View Profile & Disabled Message Button */}
      <div className="flex items-center justify-between pt-2 border-t border-line/60 gap-2">
        <button
          type="button"
          onClick={() => onViewProfile(candidate)}
          className="px-3.5 py-1.5 text-xs font-bold text-ink hover:text-brand bg-card hover:bg-sunken border border-line rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Icon name="user" size={13} />
          <span>{isVi ? "Xem hồ sơ đầy đủ" : "View Full Profile"}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Direct Message Button (Always Shown, but Click Functionality Disabled) */}
          <button
            type="button"
            disabled={true}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75 shadow-2xs select-none"
            title={isVi ? "Tính năng nhắn tin đang phát triển (Tạm tắt)" : "Direct messaging is currently disabled"}
          >
            <Icon name="mail" size={13} />
            <span>{isVi ? "Nhắn tin" : "Message"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
