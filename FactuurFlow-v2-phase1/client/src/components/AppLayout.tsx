import { Sidebar } from "./Sidebar";
import { useTranslation } from "react-i18next";

function PrivacyFooter() {
  const { i18n } = useTranslation();
  const isNL = i18n.language === "nl";
  return (
    <footer className="px-8 py-4 border-t border-gray-100 text-xs text-gray-400 flex gap-4">
      <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">
        {isNL ? "Privacybeleid" : "Privacy policy"}
      </a>
      <a href="/disclaimer.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">
        {isNL ? "Disclaimer" : "Disclaimer"}
      </a>
      <span>© {new Date().getFullYear()} FactuurFlow</span>
    </footer>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <PrivacyFooter />
      </main>
    </div>
  );
}
