"use client";

import React from "react";

const TOGGLE_ROW = "flex items-center justify-between border-b border-line py-3.5 text-base last:border-0";

export default function Switch({ on, onChange, label, description }) {
  const isChecked = Boolean(on);
  return (
    <div className={TOGGLE_ROW}>
      <div className="flex flex-col pr-4">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {description && <span className="text-xs text-muted mt-0.5">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={label}
        onClick={() => onChange(!isChecked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isChecked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isChecked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

