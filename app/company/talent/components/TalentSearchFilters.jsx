"use client";

import React, { useState } from "react";
import Icon from "../../../../components/ds/Icon";

const CITIES = [
  { id: "", labelEn: "All Locations", labelVi: "Tất cả địa điểm" },
  { id: "Ho Chi Minh City", labelEn: "Ho Chi Minh City", labelVi: "Hồ Chí Minh" },
  { id: "Hanoi", labelEn: "Hanoi", labelVi: "Hà Nội" },
  { id: "Da Nang", labelEn: "Da Nang", labelVi: "Đà Nẵng" },
  { id: "Can Tho", labelEn: "Can Tho", labelVi: "Cần Thơ" },
  { id: "Hai Phong", labelEn: "Hai Phong", labelVi: "Hải Phòng" },
  { id: "Binh Duong", labelEn: "Binh Duong", labelVi: "Bình Dương" },
];

const EXP_OPTIONS = [
  { id: "", labelEn: "Any Experience", labelVi: "Tất cả kinh nghiệm", min: "", max: "" },
  { id: "0-1", labelEn: "Under 1 year", labelVi: "Dưới 1 năm", min: "0", max: "1" },
  { id: "1-3", labelEn: "1 – 3 years", labelVi: "1 – 3 năm", min: "1", max: "3" },
  { id: "3-5", labelEn: "3 – 5 years", labelVi: "3 – 5 năm", min: "3", max: "5" },
  { id: "5-8", labelEn: "5 – 8 years", labelVi: "5 – 8 năm", min: "5", max: "8" },
  { id: "8+", labelEn: "8+ years", labelVi: "Trên 8 năm", min: "8", max: "" },
];

const EDU_OPTIONS = [
  { id: "", labelEn: "Any Education", labelVi: "Tất cả trình độ" },
  { id: "Bachelor's Degree", labelEn: "Bachelor's Degree", labelVi: "Cử nhân" },
  { id: "Master's Degree", labelEn: "Master's Degree", labelVi: "Thạc sĩ" },
  { id: "Engineer's Degree", labelEn: "Engineer's Degree", labelVi: "Kỹ sư" },
  { id: "Associate's Degree", labelEn: "Associate's Degree", labelVi: "Cao đẳng" },
];

export default function TalentSearchFilters({
  filters,
  onChange,
  onReset,
  lang = "EN",
  t = (l, s) => s,
}) {
  const isVi = lang === "VI";
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExpChange = (expId) => {
    const opt = EXP_OPTIONS.find((o) => o.id === expId) || EXP_OPTIONS[0];
    onChange({
      ...filters,
      expRange: expId,
      min_experience: opt.min,
      max_experience: opt.max,
    });
  };

  return (
    <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-xs space-y-4 font-body">
      {/* Primary Search Bar Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Keyword Search */}
        <div className="md:col-span-5 relative">
          <Icon
            name="search"
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/70"
          />
          <input
            type="text"
            value={filters.q || ""}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            placeholder={
              isVi
                ? "Tìm theo từ khóa, kỹ năng, chức danh hoặc tên ứng viên..."
                : "Search by keyword, skill, headline or candidate name..."
            }
            className="w-full text-xs rounded-xl border border-line bg-card pl-10 pr-3.5 py-2.5 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
          />
          {filters.q && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, q: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5"
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        {/* Job Title */}
        <div className="md:col-span-4 relative">
          <Icon
            name="briefcase"
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/70"
          />
          <input
            type="text"
            value={filters.title || ""}
            onChange={(e) => onChange({ ...filters, title: e.target.value })}
            placeholder={isVi ? "Chức danh (VD: Frontend, DevOps...)" : "Job title (e.g. Frontend, DevOps...)"}
            className="w-full text-xs rounded-xl border border-line bg-card pl-10 pr-3 py-2.5 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* Location Dropdown */}
        <div className="md:col-span-3">
          <select
            value={filters.city || ""}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className="w-full text-xs rounded-xl border border-line bg-card px-3 py-2.5 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {isVi ? c.labelVi : c.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filter Row (Skills, Exp, Education, Salary) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-line/60">
        {/* Skills input */}
        <div>
          <label className="text-[11px] font-bold text-muted uppercase block mb-1">
            {isVi ? "Kỹ năng chuyên môn" : "Skills"}
          </label>
          <input
            type="text"
            value={filters.skills || ""}
            onChange={(e) => onChange({ ...filters, skills: e.target.value })}
            placeholder={isVi ? "VD: React, Node, AWS..." : "e.g. React, Node, AWS..."}
            className="w-full text-xs rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* Experience Dropdown */}
        <div>
          <label className="text-[11px] font-bold text-muted uppercase block mb-1">
            {isVi ? "Số năm kinh nghiệm" : "Experience Level"}
          </label>
          <select
            value={filters.expRange || ""}
            onChange={(e) => handleExpChange(e.target.value)}
            className="w-full text-xs rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer"
          >
            {EXP_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {isVi ? o.labelVi : o.labelEn}
              </option>
            ))}
          </select>
        </div>

        {/* Education Level */}
        <div>
          <label className="text-[11px] font-bold text-muted uppercase block mb-1">
            {isVi ? "Trình độ học vấn" : "Education"}
          </label>
          <select
            value={filters.education_level || ""}
            onChange={(e) => onChange({ ...filters, education_level: e.target.value })}
            className="w-full text-xs rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer"
          >
            {EDU_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {isVi ? o.labelVi : o.labelEn}
              </option>
            ))}
          </select>
        </div>

        {/* Desired Salary Filter */}
        <div>
          <label className="text-[11px] font-bold text-muted uppercase block mb-1">
            {isVi ? "Lương tối thiểu (VND)" : "Min Desired Salary (VND)"}
          </label>
          <select
            value={filters.min_salary || ""}
            onChange={(e) => onChange({ ...filters, min_salary: e.target.value })}
            className="w-full text-xs rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer"
          >
            <option value="">{isVi ? "Tất cả mức lương" : "Any Salary"}</option>
            <option value="15000000">15,000,000+ VND</option>
            <option value="25000000">25,000,000+ VND</option>
            <option value="35000000">35,000,000+ VND</option>
            <option value="50000000">50,000,000+ VND</option>
          </select>
        </div>
      </div>

      {/* Filter Reset & Active Tags */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted">
          {isVi
            ? "Chỉ hiển thị các ứng viên đang bật chế độ công khai và tìm việc (Loại bỏ trạng thái \"Not Looking\")."
            : "Displaying public, active talent only (Job seekers marked \"Not looking\" are automatically hidden)."}
        </span>

        {(filters.q || filters.title || filters.city || filters.skills || filters.expRange || filters.education_level || filters.min_salary) && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <Icon name="rotate-ccw" size={12} />
            <span>{isVi ? "Đặt lại bộ lọc" : "Reset Filters"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
