import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser, logout } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  FileText,
  Users,
  PlusCircle,
  Settings,
  LogOut,
  ChevronRight,
  Languages,
  Receipt,
} from "lucide-react";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const nav = [
    { label: t("nav.dashboard"), icon: LayoutDashboard, href: "/dashboard" },
    { label: t("nav.invoices"),  icon: FileText,         href: "/invoices" },
    { label: t("nav.expenses"),  icon: Receipt,          href: "/expenses" },
    { label: t("nav.clients"),   icon: Users,            href: "/clients" },
    { label: t("nav.settings"),  icon: Settings,         href: "/settings" },
  ];

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function toggleLanguage() {
    const next = i18n.language === "nl" ? "en" : "nl";
    i18n.changeLanguage(next);
    localStorage.setItem("factuurflow_lang", next);
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-100 flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg leading-none">FactuurFlow</span>
        </div>
      </div>

      {/* Nieuwe factuur knop */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate("/invoices/new")}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700
                     text-white text-sm font-medium py-2.5 px-4 rounded-xl transition"
        >
          <PlusCircle className="w-4 h-4" />
          {t("nav.newInvoice")}
        </button>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {nav.map(({ label, icon: Icon, href }) => {
          const active = location === href || (href !== "/dashboard" && location.startsWith(href));
          return (
            <button
              key={href}
              onClick={() => navigate(href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${active ? "text-green-600" : "text-gray-400"}`}
                strokeWidth={active ? 2.5 : 2}
              />
              {label}
              {active && <ChevronRight className="ml-auto w-3.5 h-3.5 text-green-500" />}
            </button>
          );
        })}
      </nav>

      {/* Taalwissel */}
      <div className="px-4 pb-2">
        <button
          onClick={toggleLanguage}
          title={i18n.language === "nl" ? "Switch to English" : "Schakel naar Nederlands"}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                     text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
        >
          <Languages className="w-3.5 h-3.5 text-gray-400" />
          <span>{i18n.language === "nl" ? "🇳🇱 Nederlands" : "🇬🇧 English"}</span>
          <span className="ml-auto text-gray-300">→ {i18n.language === "nl" ? "EN" : "NL"}</span>
        </button>
      </div>

      {/* Gebruiker */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name ?? "…"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email ?? ""}</p>
          </div>
          <button
            onClick={handleLogout}
            title={t("nav.logout")}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
