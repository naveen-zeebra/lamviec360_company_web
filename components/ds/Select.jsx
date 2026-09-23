export default function Select({
  label,
  options = [],
  value,
  onChange,
  onBlur,
  placeholder = "Chọn...",
  error,
  ...rest
}) {
  return (
    <div className="flex flex-col gap-1.5 font-body">
      {label && <label className="text-sm font-semibold text-ink">{label}</label>}
      <select
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        className={[
          "rounded-md border-[1.5px] bg-card px-3.5 py-[11px] font-body text-base",
          "focus:border-line-brand focus:outline-none focus:ring-[3px] focus:ring-blue-100",
          error ? "border-danger" : "border-line",
          value ? "text-ink" : "text-faint",
        ].join(" ")}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((o, i) => (
          <option key={i} value={o.value !== undefined ? o.value : o}>
            {o.label !== undefined ? o.label : o}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
