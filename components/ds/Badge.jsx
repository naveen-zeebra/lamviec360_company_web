const TONES = {
  neutral: "bg-gray-100 text-muted",
  brand: "bg-brand-subtle text-brand",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  error: "bg-danger-bg text-danger-fg",
};

export default function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-[3px]",
        "font-body text-xs font-semibold tracking-[0.02em]",
        TONES[tone] || TONES.neutral,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
