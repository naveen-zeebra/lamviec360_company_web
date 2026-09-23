export default function Stepper({ steps, current }) {
  return (
    <ol className="m-0 flex list-none gap-2 p-0 max-sm:flex-col max-sm:gap-3">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li
            key={label}
            className={[
              "flex flex-1 flex-col gap-2 border-t-[3px] pt-3",
              "max-sm:flex-row max-sm:items-center max-sm:border-t-0 max-sm:border-l-[3px] max-sm:pt-0 max-sm:pl-3",
              done || active ? "border-brand" : "border-line",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex h-[26px] w-[26px] items-center justify-center rounded-full font-mono text-xs font-bold",
                done ? "bg-green-600 text-on-brand" : active ? "bg-brand text-on-brand" : "bg-sunken text-faint",
              ].join(" ")}
            >
              {done ? "✓" : `0${n}`}
            </span>
            <span className={`text-sm font-semibold ${done || active ? "text-ink" : "text-faint"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
