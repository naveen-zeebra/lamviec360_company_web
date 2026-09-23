import { Avatar } from "../ds";
import Icon from "../ds/Icon";
import Reveal from "../ds/Reveal";
import { useLang, t } from "../../utils/lang";

export default function Testimonials({ lang, items, title, eyebrow }) {
  return (
    <section className="lv-section">
      <Reveal className="lv-section-head">
        {eyebrow && <span className="lv-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </Reveal>
      <div className="lv-quote-grid">
        {items.map((t) => (
          <Reveal key={t.name}>
            <figure className="lv-quote">
              <Icon name="quote" size={22} style={{ color: "var(--blue-300)" }} />
              <blockquote>{(lang === "VN" || lang === "VI" ? t.vi : t.en)}</blockquote>
              <figcaption>
                <Avatar name={t.name} size={40} />
                <div>
                  <strong>{t.name}</strong>
                  <span>{(lang === "VN" || lang === "VI" ? t.roleVi : t.role)}</span>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
