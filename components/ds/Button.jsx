"use client";

const SIZES = {
  sm: "px-3.5 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-base gap-2",
  lg: "px-6 py-3 text-md gap-2",
};

const VARIANTS = {
  primary: "bg-brand text-on-brand border border-transparent hover:bg-brand-hover",
  secondary: "bg-card text-brand border-[1.5px] border-line-brand hover:bg-brand-subtle",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-sunken",
  danger: "bg-danger text-on-brand border border-transparent hover:brightness-95",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  disabled = false,
  children,
  onClick,
  type = "button",
  className = "",
  style,
}) {
  const iconEl = icon ? (
    <img
      src={icon}
      alt=""
      className={`h-4 w-4 ${variant === "primary" || variant === "danger" ? "invert brightness-200" : ""}`}
    />
  ) : null;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={[
        "inline-flex items-center justify-center rounded-md font-semibold font-body",
        "transition-[background,opacity,filter] duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-brand",
        SIZES[size] || SIZES.md,
        VARIANTS[variant] || VARIANTS.primary,
        className,
      ].join(" ")}
    >
      {icon && iconPosition === "left" ? iconEl : null}
      {children}
      {icon && iconPosition === "right" ? iconEl : null}
    </button>
  );
}
