import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");
  const tc = await getTranslations("common");

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-6xl mx-auto">
        {/* Brand */}
        <div className="col-span-1">
          <div className="text-lg font-black tracking-tighter text-on-surface mb-6">
            {tc("appName")}
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {tc("tagline")}
          </p>
        </div>

        {/* Platform links */}
        <div>
          <h6 className="font-black text-on-surface mb-6 uppercase tracking-widest text-[10px]">
            {t("platformTitle")}
          </h6>
          <ul className="space-y-4 text-xs text-on-surface-variant">
            <li>
              <a className="hover:text-accent-cyan transition-colors" href="#">
                {t("documentation")}
              </a>
            </li>
            <li>
              <a className="hover:text-accent-cyan transition-colors" href="#">
                {t("apiAccess")}
              </a>
            </li>
            <li>
              <a className="hover:text-accent-cyan transition-colors" href="#">
                {t("talentVerification")}
              </a>
            </li>
          </ul>
        </div>

        {/* Company links */}
        <div>
          <h6 className="font-black text-on-surface mb-6 uppercase tracking-widest text-[10px]">
            {t("companyTitle")}
          </h6>
          <ul className="space-y-4 text-xs text-on-surface-variant">
            <li>
              <a className="hover:text-accent-cyan transition-colors" href="#">
                {t("aboutProtocol")}
              </a>
            </li>
            <li>
              <a className="hover:text-accent-cyan transition-colors" href="#">
                {t("networkStatus")}
              </a>
            </li>
            <li>
              <a className="hover:text-accent-cyan transition-colors" href="#">
                {t("terms")}
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h6 className="font-black text-on-surface mb-6 uppercase tracking-widest text-[10px]">
            {t("stayUpdated")}
          </h6>
          <div className="flex gap-2 mb-6">
            <input
              className="bg-surface-container border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-secondary outline-none w-full"
              placeholder={t("emailPlaceholder")}
              type="email"
            />
            <button className="p-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
          <div className="flex gap-4 text-on-surface-variant">
            <a className="hover:text-accent-cyan transition-colors" href="#">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
            </a>
            <a className="hover:text-accent-cyan transition-colors" href="#">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto px-8 py-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
        <p>
          &copy; {new Date().getFullYear()} {tc("appName")}. {t("copyright")}
        </p>
        <div className="flex gap-8">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            {t("nodesOperational")}
          </span>
        </div>
      </div>
    </footer>
  );
}
