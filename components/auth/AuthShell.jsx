import Header from "../layout/Header";

export default function AuthShell({ lang, setLang, app, children, side, reverse = false }) {
  return (
    <>
      <Header lang={lang} setLang={setLang} app={app} />
      <main className="grid min-h-[calc(100vh-72px)] grid-cols-2 max-lg:grid-cols-1">
        <div className={`flex items-center justify-center px-6 py-16 ${reverse ? "lg:order-2" : ""}`}>
          <div className="flex w-full max-w-[400px] flex-col gap-[18px]">{children}</div>
        </div>
        <aside className={`flex flex-col justify-center gap-5 bg-inverse px-12 py-16 text-white max-lg:hidden ${reverse ? "lg:order-1" : ""}`}>{side}</aside>
      </main>
    </>
  );
}
