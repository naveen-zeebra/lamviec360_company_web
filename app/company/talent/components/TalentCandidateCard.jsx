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

  const isContactApproved = !!candidate.is_contact_approved || candidate.contact_status === "approved";
  const allowMessaging = candidate.allows_messaging !== false && candidate.allow_unsolicited_messages !== false;

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

  const displayEmail = isContactApproved
    ? candidate.email || candidate.masked_email
    : candidate.email || candidate.masked_email || "••••••@••••";

  const displayPhone = isContactApproved
    ? candidate.phone || candidate.masked_phone
    : candidate.phone || candidate.masked_phone || "••••••••••";

  const expYears = candidate.experience_years !== undefined && candidate.experience_years !== null
    ? Number(candidate.experience_years)
    : 0;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 hover:border-brand/40 hover:shadow-md transition-all flex flex-col justify-between gap-4 font-body group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            src={candidate.avatar_url || ""}
            name={candidate.name || "Candidate"}
            size={46}
            className="shrink-0 border border-line/60 rounded-xl"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-ink truncate m-0 group-hover:text-brand transition-colors">
              {candidate.name}
            </h4>
            <p className="text-xs font-semibold text-brand truncate m-0 mt-0.5">
              {displayTitle}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1">
                <Icon name="briefcase" size={12} className="text-muted/70" />
                <span>
                  {expYears > 0
                    ? `${expYears} ${isVi ? "năm kinh nghiệm" : "yrs exp"}`
                    : isVi ? "Dưới 1 năm" : "< 1 yr exp"}
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="map-pin" size={12} className="text-muted/70" />
                <span className="truncate">{candidate.city || candidate.location || "Vietnam"}</span>
              </span>
              {(candidate.education_level || candidate.education) && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="graduation-cap" size={12} className="text-muted/70" />
                  <span className="truncate">{candidate.education_level || candidate.education}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Desired Salary Badge */}
        {displaySalary ? (
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-muted uppercase block">
              {isVi ? "Mức lương kỳ vọng" : "Desired Salary"}
            </span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
              {displaySalary}
            </span>
          </div>
        ) : null}
      </div>

      {/* Candidate Bio */}
      {candidate.bio && (
        <p className="text-xs text-muted/90 line-clamp-2 m-0 leading-relaxed">
          {candidate.bio}
        </p>
      )}

      {/* Skills Badges */}
      {skillsList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skillsList.slice(0, 6).map((skill, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-sunken border border-line text-ink"
            >
              {skill}
            </span>
          ))}
          {skillsList.length > 6 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sunken text-muted">
              +{skillsList.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Contact Details & Privacy Status */}
      <div className="p-3 rounded-xl bg-sunken/50 border border-line flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="mail" size={13} className="text-muted/70" />
            <span className="font-mono text-[11px]">
              {displayEmail}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="phone" size={13} className="text-muted/70" />
            <span className="font-mono text-[11px]">
              {displayPhone}
            </span>
          </span>
        </div>

        {isContactApproved ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
            <Icon name="check-circle" size={12} />
            <span>{isVi ? "Đã mở khóa liên hệ" : "Contact Unlocked"}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onRequestContact(candidate)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            title={isVi ? "Gửi yêu cầu mở khóa thông tin liên hệ" : "Request candidate permission to view contact info"}
          >
            <Icon name="lock" size={11} />
            <span>{isVi ? "Yêu cầu liên hệ" : "Request Contact Info"}</span>
          </button>
        )}
      </div>

      {/* Card Action Buttons */}
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
          {/* Direct Message Button (Gated by candidate preference) */}
          <button
            type="button"
            onClick={() => onMessage(candidate)}
            disabled={!allowMessaging}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-2xs ${
              allowMessaging
                ? "bg-brand text-white hover:bg-brand-hover cursor-pointer"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
            title={
              allowMessaging
                ? isVi ? "Gửi tin nhắn hoặc lời mời ứng tuyển" : "Send direct message or job invitation"
                : isVi
                ? "Ứng viên đã tắt tính năng nhận tin nhắn chủ động"
                : "Candidate has disabled unsolicited recruiter messages"
            }
          >
            <Icon name="mail" size={13} />
            <span>{isVi ? "Nhắn tin" : "Message"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
