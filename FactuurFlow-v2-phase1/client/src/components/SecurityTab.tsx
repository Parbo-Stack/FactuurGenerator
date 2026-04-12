import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Shield } from "lucide-react";

interface AuditEntry {
  id: number;
  action: string;
  resource: string | null;
  resourceId: number | null;
  ipAddress: string | null;
  createdAt: string;
}

async function fetchAuditLog(): Promise<AuditEntry[]> {
  const res = await fetch("/api/audit-log", { credentials: "include" });
  if (!res.ok) throw new Error("Ophalen mislukt");
  return res.json();
}

export function SecurityTab() {
  const { t } = useTranslation();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: fetchAuditLog,
    staleTime: 30_000,
  });

  function formatAction(action: string) {
    const key = `auditLog.actions.${action}`;
    const translated = t(key);
    // If key not found, i18next returns the key itself
    return translated === key ? action : translated;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{t("auditLog.title")}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{t("auditLog.subtitle")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{t("auditLog.empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2.5 pr-4 text-xs font-medium text-gray-500">{t("auditLog.cols.action")}</th>
                <th className="text-left pb-2.5 pr-4 text-xs font-medium text-gray-500">{t("auditLog.cols.resource")}</th>
                <th className="text-left pb-2.5 pr-4 text-xs font-medium text-gray-500">{t("auditLog.cols.ip")}</th>
                <th className="text-left pb-2.5 text-xs font-medium text-gray-500">{t("auditLog.cols.date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 pr-4 text-gray-900 font-medium">{formatAction(entry.action)}</td>
                  <td className="py-3 pr-4 text-gray-500">
                    {entry.resource
                      ? `${entry.resource}${entry.resourceId ? ` #${entry.resourceId}` : ""}`
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 text-gray-500 font-mono text-xs">{entry.ipAddress ?? "—"}</td>
                  <td className="py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString("nl-NL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
