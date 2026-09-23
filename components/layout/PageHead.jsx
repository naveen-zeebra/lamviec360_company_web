import Link from "next/link";
import Icon from "../ds/Icon";
import { useLang, t } from "../../utils/lang";

export default function PageHead({ lang, crumb, title, desc, children, home = "/" }) {
  return (
    <section className="border-b border-line bg-brand-subtle px-6 pb-14 pt-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-5 flex items-center gap-2 text-sm text-faint">
          <Link href={home} className="text-muted no-underline">
            {t(lang, "Home")}
          </Link>
          <Icon name="chevron-right" size={14} />
          <span>{crumb}</span>
        </div>
        <h1 className="mb-4 max-w-[820px] text-4xl font-extrabold leading-tight tracking-[-0.01em] max-md:text-3xl">{title}</h1>
        {desc && <p className="max-w-[640px] text-md leading-relaxed text-muted">{desc}</p>}
        {children}
      </div>
    </section>
  );
}
