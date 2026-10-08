"use client";
import { useState } from "react";
import { PhoneInput as ReactIntlPhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

export default function PhoneInput({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  id = "phone",
  name = "phone",
  placeholder = "090 123 4567",
  defaultCountry = "vn",
  preferredCountries = ["vn", "us", "sg", "jp", "kr", "gb", "au"],
  disabled = false,
  className = "",
  size = "md",
  style,
  ...rest
}) {
  const [focused, setFocused] = useState(false);

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : null;

  return (
    <div className={`flex flex-col gap-1.5 font-body ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs sm:text-sm font-semibold text-ink select-none">
          {label}
        </label>
      )}

      <div
        style={{
          "--react-international-phone-border-color": "transparent",
          "--react-international-phone-background-color": "transparent",
          "--react-international-phone-height": size === "sm" ? "38px" : "44px",
          "--react-international-phone-dropdown-item-background-color": "#ffffff",
          ...style,
        }}
        className={[
          "group relative flex items-center w-full min-w-0 rounded-md border-[1.5px] bg-card transition-shadow",
          size === "sm" ? "min-h-[38px]" : "min-h-[44px]",
          hasError
            ? "border-danger ring-[3px] ring-red-100"
            : focused
            ? "border-line-brand ring-[3px] ring-blue-100"
            : "border-line hover:border-line-strong",
          disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : "",
        ].join(" ")}
      >
        <ReactIntlPhoneInput
          defaultCountry={defaultCountry}
          preferredCountries={preferredCountries}
          value={value ?? ""}
          onChange={(phone, meta) => {
            if (typeof onChange === "function") {
              onChange(phone, meta);
            }
          }}
          disabled={disabled}
          className="!w-full !flex !items-center !border-none !bg-transparent min-w-0"
          inputClassName={[
            "!flex-1 !w-full !min-w-0 !border-none !bg-transparent !font-body !text-ink !outline-none !shadow-none",
            size === "sm" ? "!h-[38px] !text-sm !px-2.5" : "!h-[44px] !text-base !px-3",
          ].join(" ")}
          countrySelectorStyleProps={{
            buttonClassName: [
              "!border-none !border-r !border-solid !border-line !bg-transparent hover:!bg-slate-100/70",
              "!rounded-l-md !cursor-pointer !transition-colors !flex !items-center !justify-center shrink-0",
              size === "sm" ? "!h-[38px] !px-2.5" : "!h-[44px] !px-3",
            ].join(" "),
            dropdownStyleProps: {
              className:
                "!z-50 !bg-white !shadow-xl !border !border-line !rounded-lg !max-h-60 !w-72 !py-1 !font-body !text-sm !overflow-y-auto",
              listItemClassName:
                "hover:!bg-slate-50 !text-ink !text-sm !py-2 !px-3 !transition-colors !cursor-pointer !flex !items-center",
            },
          }}
          inputProps={{
            id,
            name,
            placeholder,
            onFocus: (e) => {
              setFocused(true);
              onFocus?.(e);
            },
            onBlur: (e) => {
              setFocused(false);
              onBlur?.(e);
            },
            ...rest,
          }}
        />
      </div>

      {errorMessage && <span className="text-xs text-danger">{errorMessage}</span>}
    </div>
  );
}
