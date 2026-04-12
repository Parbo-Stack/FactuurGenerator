import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import InvoicesPage from "@/pages/invoices";
import NewInvoicePage from "@/pages/new-invoice";
import ClientsPage from "@/pages/clients";
import SettingsPage from "@/pages/settings";
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return <Component />;
}

// ── Router ────────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      {/* Publieke routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      {/* Beveiligde routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/invoices/new">
        {() => <ProtectedRoute component={NewInvoicePage} />}
      </Route>
      <Route path="/invoices">
        {() => <ProtectedRoute component={InvoicesPage} />}
      </Route>
      <Route path="/clients">
        {() => <ProtectedRoute component={ClientsPage} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} />}
      </Route>

      {/* Root → redirect naar login */}
      <Route path="/">
        {() => {
          const [, navigate] = useLocation();
          navigate("/login");
          return null;
        }}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
