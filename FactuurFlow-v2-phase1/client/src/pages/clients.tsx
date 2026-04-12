import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { useClients, useCreateClient, useDeleteClient } from "@/hooks/useClients";
import type { Client } from "@/lib/api";
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  FileText,
  MoreVertical,
  Building2,
  Loader2,
  Trash2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatEuro(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700",
  "bg-yellow-100 text-yellow-700",
  "bg-red-100 text-red-700",
];

function colorForName(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ── Nieuw klant formulier schema ──────────────────────────────────────────────
const clientSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  kvk: z.string().optional(),
  btw: z.string().optional(),
  notes: z.string().optional(),
});
type ClientForm = z.infer<typeof clientSchema>;

// ── Client card ───────────────────────────────────────────────────────────────
function ClientCard({
  client,
  onDelete,
}: {
  client: Client;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const color = colorForName(client.name);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${color}`}>
            {initials(client.name)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{client.name}</h3>
            {client.kvk && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3" />
                KvK {client.kvk}
              </p>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg w-36 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onDelete(client.id); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("common.delete")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 mb-4">
        {client.email && (
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-green-600 transition truncate"
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            {client.email}
          </a>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            {client.phone}
          </div>
        )}
        {(client.city || client.country) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {[client.city, client.country].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FileText className="w-3.5 h-3.5" />
          Klant sinds {new Date(client.createdAt).toLocaleDateString("nl-NL", { month: "short", year: "numeric" })}
        </div>
        <p className="text-xs text-gray-400">
          {client.city ?? "—"}
        </p>
      </div>
    </div>
  );
}

// ── Nieuw klant modal ─────────────────────────────────────────────────────────
function NewClientModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const createClient = useCreateClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientForm>({ resolver: zodResolver(clientSchema) });

  async function onSubmit(data: ClientForm) {
    await createClient.mutateAsync({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      zip: data.zip || null,
      country: data.country || "Nederland",
      kvk: data.kvk || null,
      btw: data.btw || null,
      notes: data.notes || null,
    });
    onClose();
  }

  const inputCls = `w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-5">{t("clients.form.title")}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("clients.form.name")} *</label>
            <input {...register("name")} className={inputCls} placeholder="Webbureau Janssen" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("clients.form.email")}</label>
              <input {...register("email")} type="email" className={inputCls} placeholder="info@bedrijf.nl" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("clients.form.phone")}</label>
              <input {...register("phone")} className={inputCls} placeholder="020 123 4567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("clients.form.address")}</label>
              <input {...register("address")} className={inputCls} placeholder="Straatnaam 10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("clients.form.city")}</label>
              <input {...register("city")} className={inputCls} placeholder="Amsterdam" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("clients.form.kvk")}</label>
              <input {...register("kvk")} className={inputCls} placeholder="12345678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("clients.form.btw")}</label>
              <input {...register("btw")} className={inputCls} placeholder="NL123456789B01" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={createClient.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium
                         text-white bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-60"
            >
              {createClient.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Clients page ──────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const { t } = useTranslation();
  const { data: clients = [], isLoading } = useClients();
  const deleteClient = useDeleteClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = clients.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("clients.title")}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{clients.length} {t("nav.clients").toLowerCase()}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white
                       text-sm font-medium py-2.5 px-4 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            {t("clients.new")}
          </button>
        </div>

        {/* Zoekbalk */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("clients.search")}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Inhoud */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">
              {clients.length === 0
                ? t("clients.noClients")
                : `${t("common.noResults")}: "${search}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onDelete={(id) => deleteClient.mutate(id)}
              />
            ))}
          </div>
        )}

        {showModal && <NewClientModal onClose={() => setShowModal(false)} />}
      </div>
    </AppLayout>
  );
}
