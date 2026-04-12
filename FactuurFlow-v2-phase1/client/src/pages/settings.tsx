import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/auth";
import { User, Building2, Bell, Shield, Check } from "lucide-react";

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs = [
  { key: "profile",       label: "Profiel",      icon: User },
  { key: "company",       label: "Bedrijf",      icon: Building2 },
  { key: "notifications", label: "Notificaties", icon: Bell },
  { key: "security",      label: "Beveiliging",  icon: Shield },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = `w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl
  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white`;
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

function SectionCard({ title, description, children }: {
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
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

// ── Settings page ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  // Profile state
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // Company state
  const [company, setCompany] = useState({
    name: user?.companyName ?? "",
    address: user?.companyAddress ?? "",
    city: user?.companyCity ?? "",
    zip: user?.companyZip ?? "",
    country: user?.companyCountry ?? "Nederland",
    phone: user?.companyPhone ?? "",
    kvk: user?.companyKvk ?? "",
    btw: user?.companyBtw ?? "",
    iban: user?.companyIban ?? "",
    prefix: user?.invoicePrefix ?? "FF",
    paymentDays: String(user?.defaultPaymentDays ?? 30),
    taxRate: user?.defaultTaxRate ?? "21",
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    email: user?.emailNotifications ?? true,
    overdue: user?.overdueReminders ?? true,
    paymentConfirmed: true,
    weeklyReport: false,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
          <p className="text-gray-500 text-sm mt-0.5">Beheer je profiel en accountinstellingen</p>
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

        {/* Content */}
        <div className="space-y-5">
          {/* ── Profiel ── */}
          {activeTab === "profile" && (
            <>
              <SectionCard title="Persoonlijke gegevens" description="Je naam en e-mailadres">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-700">
                      {name.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <button className="text-sm text-green-600 font-medium hover:underline">
                      Foto uploaden
                    </button>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG max. 2 MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Volledige naam</label>
                    <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>E-mailadres</label>
                    <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Bedrijf ── */}
          {activeTab === "company" && (
            <>
              <SectionCard title="Bedrijfsgegevens" description="Wordt weergegeven op je facturen">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Bedrijfsnaam</label>
                    <input className={inputCls} value={company.name} onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))} placeholder="Mijn Bedrijf BV" />
                  </div>
                  <div>
                    <label className={labelCls}>Adres</label>
                    <input className={inputCls} value={company.address} onChange={(e) => setCompany((c) => ({ ...c, address: e.target.value }))} placeholder="Straatnaam 10" />
                  </div>
                  <div>
                    <label className={labelCls}>Postcode & Stad</label>
                    <input className={inputCls} value={company.city} onChange={(e) => setCompany((c) => ({ ...c, city: e.target.value }))} placeholder="1234 AB Amsterdam" />
                  </div>
                  <div>
                    <label className={labelCls}>KvK-nummer</label>
                    <input className={inputCls} value={company.kvk} onChange={(e) => setCompany((c) => ({ ...c, kvk: e.target.value }))} placeholder="12345678" />
                  </div>
                  <div>
                    <label className={labelCls}>BTW-nummer</label>
                    <input className={inputCls} value={company.btw} onChange={(e) => setCompany((c) => ({ ...c, btw: e.target.value }))} placeholder="NL123456789B01" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>IBAN rekeningnummer</label>
                    <input className={inputCls} value={company.iban} onChange={(e) => setCompany((c) => ({ ...c, iban: e.target.value }))} placeholder="NL91 ABNA 0417 1643 00" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Factuurinstellingen" description="Standaardwaarden voor nieuwe facturen">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Factuurprefix</label>
                    <input className={inputCls} value={company.prefix} onChange={(e) => setCompany((c) => ({ ...c, prefix: e.target.value }))} placeholder="FF" />
                  </div>
                  <div>
                    <label className={labelCls}>Betalingstermijn (dagen)</label>
                    <input className={inputCls} type="number" min={0} value={company.paymentDays} onChange={(e) => setCompany((c) => ({ ...c, paymentDays: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Standaard BTW-tarief</label>
                    <select className={inputCls} value={company.taxRate} onChange={(e) => setCompany((c) => ({ ...c, taxRate: e.target.value }))}>
                      <option value="0">0%</option>
                      <option value="9">9%</option>
                      <option value="21">21%</option>
                    </select>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Notificaties ── */}
          {activeTab === "notifications" && (
            <SectionCard title="E-mailmeldingen" description="Kies welke meldingen je wilt ontvangen">
              <div className="space-y-4">
                {[
                  { key: "email" as const,            label: "E-mailnotificaties",           description: "Ontvang meldingen via e-mail" },
                  { key: "overdue" as const,           label: "Herinneringen te late betaling", description: "Automatisch een herinnering sturen bij achterstallige facturen" },
                  { key: "paymentConfirmed" as const,  label: "Betalingsbevestiging",         description: "Melding wanneer een factuur als betaald wordt gemarkeerd" },
                  { key: "weeklyReport" as const,      label: "Wekelijks rapport",             description: "Ontvang elke maandag een overzicht van je financiën" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                    </div>
                    <Toggle
                      checked={notifications[key]}
                      onChange={(v) => setNotifications((n) => ({ ...n, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── Beveiliging ── */}
          {activeTab === "security" && (
            <SectionCard title="Wachtwoord wijzigen">
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className={labelCls}>Huidig wachtwoord</label>
                  <input className={inputCls} type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className={labelCls}>Nieuw wachtwoord</label>
                  <input className={inputCls} type="password" placeholder="Minimaal 8 tekens" />
                </div>
                <div>
                  <label className={labelCls}>Nieuw wachtwoord bevestigen</label>
                  <input className={inputCls} type="password" placeholder="••••••••" />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Opslaan */}
          {activeTab !== "security" && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 py-2.5 px-6 text-sm font-medium rounded-xl transition
                  ${saved
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
              >
                {saved && <Check className="w-4 h-4" />}
                {saved ? "Opgeslagen!" : "Opslaan"}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="flex justify-end">
              <button
                className="py-2.5 px-6 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-xl transition"
              >
                Wachtwoord wijzigen
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
