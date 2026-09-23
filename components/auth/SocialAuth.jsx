import { useLang, t } from "../../utils/lang";

export default function SocialAuth({ lang, providers }) {
  return (
    <div className="flex flex-col gap-2">
      {providers.map((p) => (
        <button
          key={p.label}
          type="button"
          className="group flex min-h-[46px] w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-line bg-card font-body text-sm font-semibold text-ink transition-colors hover:border-line-brand hover:text-brand"
          onClick={(e) => e.preventDefault()}
        >
          <span className="inline-flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-xs bg-sunken text-[11px] font-extrabold tracking-[-0.02em] text-muted group-hover:bg-brand-subtle group-hover:text-brand" aria-hidden="true">
            {p.mark}
          </span>
          {t(lang, "Continue with ")}
          {p.label}
        </button>
      ))}
    </div>
  );
}
