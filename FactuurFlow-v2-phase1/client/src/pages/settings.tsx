import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchCurrentUser } from "@/lib/auth";
import { CURRENCIES } from "@/lib/currencies";
import { useToast } from "@/hooks/use-toast";
import { User, Building2, Bell, Shield, Check, Loader2, ImageIcon, X, Activity } from "lucide-react";
import { SecurityTab } from "@/components/SecurityTab";

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = `w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white`;
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none
        ${checked ? "bg-green-600" : "bg-gray-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
          ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

// ── useUpdateMe hook ──────────────────────────────────────────────────────────
function useUpdateMe() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? t("common.error"));
      return data.user;
    },
    onSuccess: (user) => {
      qc.setQueryData(["auth-user"], user);
      toast({ title: t("settings.saved"), description: t("settings.savedDesc") });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });
}

// ── Settings page ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
  const updateMe = useUpdateMe();
  const { toast } = useToast();

  const tabs = [
    { key: "profile",       label: t("settings.tabs.profile"),       icon: User },
    { key: "company",       label: t("settings.tabs.company"),       icon: Building2 },
    { key: "notifications", label: t("settings.tabs.notifications"), icon: Bell },
    { key: "security",      label: t("settings.tabs.security"),      icon: Shield },
    { key: "auditLog",      label: t("settings.tabs.auditLog"),      icon: Activity },
  ];

  const [activeTab, setActiveTab] = useState("profile");

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Company
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyZip, setCompanyZip] = useState("");
  const [companyCountry, setCompanyCountry] = useState("Nederland");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyKvk, setCompanyKvk] = useState("");
  const [companyBtw, setCompanyBtw] = useState("");
  const [companyIban, setCompanyIban] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("FF");
  const [defaultPaymentDays, setDefaultPaymentDays] = useState("30");
  const [defaultTaxRate, setDefaultTaxRate] = useState("21");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [overdueReminders, setOverdueReminders] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Sync met user data
  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setCompanyName(user.companyName ?? "");
    setCompanyAddress(user.companyAddress ?? "");
    setCompanyCity(user.companyCity ?? "");
    setCompanyZip(user.companyZip ?? "");
    setCompanyCountry(user.companyCountry ?? "Nederland");
    setCompanyPhone(user.companyPhone ?? "");
    setCompanyKvk(user.companyKvk ?? "");
    setCompanyBtw(user.companyBtw ?? "");
    setCompanyIban(user.companyIban ?? "");
    setLogoUrl(user.logoUrl ?? "");
    setInvoicePrefix(user.invoicePrefix ?? "FF");
    setDefaultPaymentDays(String(user.defaultPaymentDays ?? 30));
    setDefaultTaxRate(user.defaultTaxRate ?? "21");
    setDefaultCurrency(user.defaultCurrency ?? "USD");
    setEmailNotifications(user.emailNotifications ?? true);
    setOverdueReminders(user.overdueReminders ?? true);
  }, [user]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) {
      toast({ title: t("settings.company.logoTooBig"), description: t("settings.company.logoTooBigDesc"), variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setLogoUrl(dataUrl);
      await updateMe.mutateAsync({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleRemoveLogo() {
    setLogoUrl("");
    await updateMe.mutateAsync({ logoUrl: "" });
  }

  async function handleSaveProfile() {
    await updateMe.mutateAsync({ name });
  }

  async function handleSaveCompany() {
    await updateMe.mutateAsync({
      companyName,
      companyAddress,
      companyCity,
      companyZip,
      companyCountry,
      companyPhone,
      companyKvk,
      companyBtw,
      companyIban,
      invoicePrefix,
      defaultPaymentDays: Number(defaultPaymentDays),
      defaultTaxRate,
      defaultCurrency,
    });
  }

  async function handleSaveNotifications() {
    await updateMe.mutateAsync({
      emailNotifications,
      overdueReminders,
    });
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmNewPassword) {
      toast({ title: t("common.error"), description: t("settings.security.mismatch"), variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: t("common.error"), description: t("settings.security.tooShort"), variant: "destructive" });
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: t("common.error"), description: data.message ?? t("settings.security.change"), variant: "destructive" });
    } else {
      toast({ title: t("settings.security.changed") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  }

  const isSaving = updateMe.isPending;

  function SaveButton({ onClick }: { onClick: () => void }) {
    return (
      <div className="flex justify-end">
        <button
          onClick={onClick}
          disabled={isSaving}
          className="flex items-center gap-2 py-2.5 px-6 text-sm font-medium rounded-xl transition
            bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {isSaving ? t("common.saving") : t("common.save")}
        </button>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("settings.subtitle")}</p>
        </div>

        {/* Tab navigatie */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-7 w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                ${activeTab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {/* ── Profiel ── */}
          {activeTab === "profile" && (
            <>
              <SectionCard
                title={t("settings.profile.title")}
                description={t("settings.profile.subtitle")}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-green-700">
                      {name.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{name || "—"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{email}</p>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t("settings.profile.name")}</label>
                  <input
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("settings.profile.namePlaceholder")}
                  />
                </div>
              </SectionCard>
              <SaveButton onClick={handleSaveProfile} />
            </>
          )}

          {/* ── Bedrijf ── */}
          {activeTab === "company" && (
            <>
              <SectionCard
                title={t("settings.company.logoTitle")}
                description={t("settings.company.logoSubtitle")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-16 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer py-2 px-4 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition w-fit">
                      <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                      {logoUrl ? t("settings.company.changeLogo") : t("settings.company.uploadLogo")}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    {logoUrl && (
                      <button
                        onClick={handleRemoveLogo}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition"
                      >
                        <X className="w-3 h-3" />
                        {t("settings.company.removeLogo")}
                      </button>
                    )}
                    <p className="text-xs text-gray-400">{t("settings.company.logoHint")}</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title={t("settings.company.title")}
                description={t("settings.company.subtitle")}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>{t("settings.company.name")}</label>
                    <input className={inputCls} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Mijn Bedrijf BV" />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.company.address")}</label>
                    <input className={inputCls} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Straatnaam 10" />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.company.city")}</label>
                    <input className={inputCls} value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} placeholder="Amsterdam" />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.company.zip")}</label>
                    <input className={inputCls} value={companyZip} onChange={(e) => setCompanyZip(e.target.value)} placeholder="1234 AB" />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.company.phone")}</label>
                    <input className={inputCls} value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="020 123 4567" />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.company.kvk")}</label>
                    <input className={inputCls} value={companyKvk} onChange={(e) => setCompanyKvk(e.target.value)} placeholder="12345678" />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.company.btw")}</label>
                    <input className={inputCls} value={companyBtw} onChange={(e) => setCompanyBtw(e.target.value)} placeholder="NL123456789B01" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>{t("settings.company.iban")}</label>
                    <input className={inputCls} value={companyIban} onChange={(e) => setCompanyIban(e.target.value)} placeholder="NL91 ABNA 0417 1643 00" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title={t("settings.company.invoiceTitle")}
                description={t("settings.company.invoiceSubtitle")}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("settings.company.prefix")}</label>
                    <input className={inputCls} value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="FF" />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.company.paymentDays")}</label>
                    <input className={inputCls} type="number" min={0} value={defaultPaymentDays} onChange={(e) => setDefaultPaymentDays(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.company.taxRate")}</label>
                    <select className={inputCls} value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)}>
                      <option value="0">0%</option>
                      <option value="9">9%</option>
                      <option value="21">21%</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.company.currency")}</label>
                    <select className={inputCls} value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}>
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SaveButton onClick={handleSaveCompany} />
            </>
          )}

          {/* ── Notificaties ── */}
          {activeTab === "notifications" && (
            <>
              <SectionCard
                title={t("settings.notifications.title")}
                description={t("settings.notifications.subtitle")}
              >
                <div className="space-y-4">
                  {[
                    {
                      key: "email" as const,
                      label: t("settings.notifications.email"),
                      description: t("settings.notifications.emailDesc"),
                      value: emailNotifications,
                      onChange: setEmailNotifications,
                    },
                    {
                      key: "overdue" as const,
                      label: t("settings.notifications.overdue"),
                      description: t("settings.notifications.overdueDesc"),
                      value: overdueReminders,
                      onChange: setOverdueReminders,
                    },
                    {
                      key: "paymentConfirmed" as const,
                      label: t("settings.notifications.paymentConfirmed"),
                      description: t("settings.notifications.paymentConfirmedDesc"),
                      value: paymentConfirmed,
                      onChange: setPaymentConfirmed,
                    },
                    {
                      key: "weeklyReport" as const,
                      label: t("settings.notifications.weeklyReport"),
                      description: t("settings.notifications.weeklyReportDesc"),
                      value: weeklyReport,
                      onChange: setWeeklyReport,
                    },
                  ].map(({ key, label, description, value, onChange }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                      </div>
                      <Toggle checked={value} onChange={onChange} />
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SaveButton onClick={handleSaveNotifications} />
            </>
          )}

          {/* ── Beveiliging ── */}
          {activeTab === "security" && (
            <>
              <SectionCard title={t("settings.security.title")}>
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className={labelCls}>{t("settings.security.current")}</label>
                    <input
                      className={inputCls}
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.security.new")}</label>
                    <input
                      className={inputCls}
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("settings.security.newHint")}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t("settings.security.confirm")}</label>
                    <input
                      className={inputCls}
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </SectionCard>
              <div className="flex justify-end">
                <button
                  onClick={handleChangePassword}
                  className="flex items-center gap-2 py-2.5 px-6 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-xl transition"
                >
                  {t("settings.security.change")}
                </button>
              </div>
            </>
          )}

          {/* ── Activiteitenlog ── */}
          {activeTab === "auditLog" && <SecurityTab />}
        </div>
      </div>
    </AppLayout>
  );
}
