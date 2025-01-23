import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import InvoiceGenerator from "@/pages/invoice-generator";
import ExpensesPage from "@/pages/expenses";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import { ThemeProvider } from "@/components/ThemeProvider";
import Layout from "@/components/Layout";
import HotjarTracking from "@/components/HotjarTracking";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={InvoiceGenerator} />
        <Route path="/expenses" component={ExpensesPage} />
        <Route path="/sitemap.xml" component={() => {
          window.location.href = "/sitemap.xml";
          return null;
        }} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
          <HotjarTracking />
        </QueryClientProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}

export default App;