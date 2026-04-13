import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CookieBanner } from "@/components/CookieBanner";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import InvoicesPage from "@/pages/invoices";
import NewInvoicePage from "@/pages/new-invoice";
import InvoiceDetailPage from "@/pages/invoice-detail";
import ClientsPage from "@/pages/clients";
import SettingsPage from "@/pages/settings";
import ExpensesPage from "@/pages/expenses";
import NewExpensePage from "@/pages/new-expense";
import AccountingPage from "@/pages/accounting";
import { fetchCurrentUser } from "@/lib/auth";

// ── Auth guard ────────────────────────────────────────────────────────────────
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return <Component />;
}

// ── Root redirect ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/login"); }, [navigate]);
  return null;
}

// ── Named wrappers — voorkomt hooks-violation in anonieme arrow-functions ─────
const ProtectedDashboard    = () => <ProtectedRoute component={DashboardPage} />;
const ProtectedInvoices     = () => <ProtectedRoute component={InvoicesPage} />;
const ProtectedNewInvoice   = () => <ProtectedRoute component={NewInvoicePage} />;
const ProtectedInvoiceDetail = () => <ProtectedRoute component={InvoiceDetailPage} />;
const ProtectedClients      = () => <ProtectedRoute component={ClientsPage} />;
const ProtectedSettings     = () => <ProtectedRoute component={SettingsPage} />;
const ProtectedExpenses     = () => <ProtectedRoute component={ExpensesPage} />;
const ProtectedNewExpense   = () => <ProtectedRoute component={NewExpensePage} />;
const ProtectedAccounting   = () => <ProtectedRoute component={AccountingPage} />;

// ── Router ────────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      <Route path="/login"         component={LoginPage} />
      <Route path="/register"      component={RegisterPage} />
      <Route path="/dashboard"     component={ProtectedDashboard} />
      <Route path="/invoices/new"  component={ProtectedNewInvoice} />
      <Route path="/invoices/:id"  component={ProtectedInvoiceDetail} />
      <Route path="/invoices"      component={ProtectedInvoices} />
      <Route path="/expenses/new"  component={ProtectedNewExpense} />
      <Route path="/expenses"      component={ProtectedExpenses} />
      <Route path="/accounting"    component={ProtectedAccounting} />
      <Route path="/clients"       component={ProtectedClients} />
      <Route path="/settings"      component={ProtectedSettings} />
      <Route path="/"              component={RootRedirect} />
      <Route                       component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Router />
          <CookieBanner />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
