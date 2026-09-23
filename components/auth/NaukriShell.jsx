import Link from "next/link";
import Icon from "../ds/Icon";
import Header from "../layout/Header";
import Footer from "../layout/Footer";

export default function NaukriShell({ lang, setLang, app, title, bullets, ctaText, ctaHref, children }) {
  return (
    <>
      <Header lang={lang} setLang={setLang} app={app} />
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#f8f9fa] px-6 py-[60px]">
        <div className="flex w-full max-w-[950px] items-center max-md:flex-col">
          {/* Left panel */}
          <div className="flex min-h-[450px] flex-1 flex-col rounded-l-xl bg-white p-12 shadow-[0_4px_6px_rgba(0,0,0,0.02)] max-md:hidden">
            <h2 className="mb-6 text-2xl font-bold text-ink">{title}</h2>
            <ul className="m-0 mb-8 flex list-none flex-col gap-4 p-0">
              {bullets.map((p, i) => (
                <li key={i} className="flex items-center gap-3 text-[15px] text-gray-700">
                  <Icon name="check" size={20} style={{ color: "#10b981" }} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <Link
              href={ctaHref}
              className="inline-flex w-fit items-center justify-center rounded-lg border border-line bg-white px-6 py-2.5 font-semibold text-[#4f46e5] no-underline"
            >
              {ctaText}
            </Link>
            <div className="flex-1" />
            <div className="text-center opacity-80">
              <img src="/logo-cropped.png" alt="Logo" className="h-[60px] object-contain opacity-10" />
            </div>
          </div>

          {/* Right form panel */}
          <div className="z-10 w-[420px] rounded-xl bg-white p-10 shadow-[0_10px_25px_rgba(0,0,0,0.1)] max-md:-ml-0 max-md:w-full md:-ml-6">
            {children}
          </div>
        </div>
      </main>
      <Footer lang={lang} setLang={setLang} app={app} />
    </>
  );
}
