"use client";
import { useState } from "react";

export default function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  icon,
  iconRight,
  onIconRightClick,
  size = "md",
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 font-body">
      {label && <label className="text-sm font-semibold text-ink">{label}</label>}
      <div
        className={[
          "flex items-center gap-2 rounded-md border-[1.5px] bg-card transition-shadow",
          size === "sm" ? "px-3 py-2" : "px-3.5 py-[11px]",
          error ? "border-danger" : focused ? "border-line-brand ring-[3px] ring-blue-100" : "border-line",
        ].join(" ")}
      >
        {icon && <img src={icon} alt="" className="h-4 w-4 opacity-60" />}
        <input
          type={type}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
            rest.onBlur?.(e);
          }}
          className="flex-1 border-none bg-transparent font-body text-base text-ink outline-none"
          {...rest}
        />
        {iconRight && (
          <span className="flex cursor-pointer items-center" onClick={onIconRightClick}>
            {iconRight}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
