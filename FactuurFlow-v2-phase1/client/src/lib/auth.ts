import { queryClient } from "./queryClient";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  companyName?: string | null;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyZip?: string | null;
  companyCountry?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyKvk?: string | null;
  companyBtw?: string | null;
  companyIban?: string | null;
  logoUrl?: string | null;
  invoicePrefix?: string | null;
  defaultPaymentDays?: number | null;
  defaultTaxRate?: string | null;
  defaultCurrency?: string | null;
  emailNotifications?: boolean | null;
  overdueReminders?: boolean | null;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Fout bij ophalen gebruiker");
  const data = await res.json();
  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Inloggen mislukt");
  queryClient.invalidateQueries({ queryKey: ["auth-user"] });
  return data.user;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Registratie mislukt");
  queryClient.invalidateQueries({ queryKey: ["auth-user"] });
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  queryClient.clear();
}
